const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const ExcelJS = require("exceljs");
const { NextRequest, NextResponse } = require("next/server");

function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })((name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === "@/lib/prisma") throw new Error("Real database access is prohibited in unit tests.");
    return name.startsWith("@/") ? load(`${name.slice(2)}.ts`, mocks) : require(name);
  }, module, module.exports);
  return module.exports;
}
const logic = load("lib/iuran.ts");
const { readIuranWorkbook } = load("lib/iuran-workbook.ts");
const permissions = load("lib/permissions.ts");
const valid = () => ({ year: 2026, mada: "MADA A", mawil: "MAWIL 1", churchName: "GGP Test", pastorName: "", kind: "Iuran wajib 5%", months: [{ month: 1, amount: "0", receiptNote: "BCA 05/02/2026" }, { month: 2, amount: null, receiptNote: "" }] });

test("financial amounts preserve zeros and missing values and sum exact decimal cents", () => {
  assert.equal(logic.amountString(null), null);
  assert.equal(logic.amountString(0), "0.00");
  assert.equal(logic.sumAmounts(["0.10", "0.20", null]), "0.30");
  assert.equal(logic.sumAmounts(["999999999999.99", "0.01"]), "1000000000000.00");
  assert.deepEqual(logic.validateIuran(valid()).months, [{ month: 1, amount: "0.00", receiptNote: "BCA 05/02/2026" }]);
  for (const value of [-1, 1.234, "1,000", "1.234", "NaN", true, "1000000000000", "=SUM(A1)"]) assert.throws(() => logic.amountString(value));
});

test("monthly input rejects duplicate months, invalid years and unsupported kinds", () => {
  for (const change of [{ year: null }, { year: 2026.5 }, { kind: "unknown" }, { churchName: "" }, { months: [{ month: 13, amount: "1" }] }, { months: [{ month: 1, amount: "1" }, { month: 1, amount: "2" }] }, { months: [{ month: 1, amount: "-1" }] }]) assert.throws(() => logic.validateIuran({ ...valid(), ...change }));
});

async function fixture(offset = 0, mutate = () => {}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("MADA TEST");
  const c = (row, col, value) => { sheet.getCell(row, col + offset).value = value; };
  c(1, 1, "PENERIMAAN IURAN WAJIB TAHUN 2026"); c(2, 2, "JEMAAT");
  logic.MONTHS.forEach((month, i) => c(2, i + 4, month));
  c(3, 1, "MAWIL 1"); c(4, 1, 1); c(4, 2, "GGP Test"); c(4, 3, "Jumlah"); c(5, 3, "Tgl Terima");
  c(4, 4, 0); c(4, 5, 0.1); c(5, 5, "BRI 01/03/2026");
  c(6, 2, "50% Perpuluhan Gembala"); c(6, 3, "Jumlah"); c(7, 2, "Pdt. Test"); c(7, 3, "Tgl Terima"); c(6, 4, 123.45);
  mutate(sheet, c);
  return workbook.xlsx.writeBuffer();
}
test("both workbook column layouts preserve church, pastor, MADA/MAWIL and receipt notes", async () => {
  for (const offset of [0, 1]) {
    const [sheet] = await readIuranWorkbook(await fixture(offset));
    assert.equal(sheet.rows.length, 2);
    assert.equal(sheet.errors.length, 0);
    assert.equal(sheet.year, 2026);
    assert.equal(sheet.total, "123.55");
    assert.equal(sheet.rows[1].churchName, "GGP Test");
    assert.equal(sheet.rows[1].pastorName, "Pdt. Test");
    assert.equal(sheet.rows[1].kind, "50% Perpuluhan Gembala");
    assert.equal(sheet.rows[0].mada, "TEST");
    assert.equal(sheet.rows[0].mawil, "MAWIL 1");
    assert.equal(sheet.rows[0].months[0].amount, "0.00");
    assert.equal(sheet.rows[0].months[1].receiptNote, "BRI 01/03/2026");
    assert.equal(sheet.rows[0].months.length, 2);
  }
});
test("parser flags bad amounts, missing formula results, duplicate accounts and differing totals", async () => {
  const [sheet] = await readIuranWorkbook(await fixture(0, (_, c) => {
    c(4, 6, -100); c(4, 7, { formula: "1+1" }); c(4, 16, 999);
    c(8, 2, "GGP Test"); c(8, 3, "Jumlah");
  }));
  assert.equal(sheet.errors.length, 3);
  assert.ok(sheet.errors.some((error) => error.includes("rumus")));
  assert.ok(sheet.errors.some((error) => error.includes("duplikat")));
  assert.ok(sheet.warnings.some((warning) => warning.includes("total Excel berbeda")));
});
test("parser handles placeholder churches and numeric zero with accidental date format", async () => {
  const [sheet] = await readIuranWorkbook(await fixture(0, (s, c) => {
    s.getCell("D4").numFmt = "dd/mm/yyyy";
    c(8, 2, "GGP"); c(8, 3, "Jumlah");
  }));
  assert.equal(sheet.errors.length, 0);
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[0].months[0].amount, "0.00");
  assert.ok(sheet.warnings.some((warning) => warning.includes("format tanggal")));
  assert.ok(sheet.warnings.some((warning) => warning.includes("dilewati")));
});
test("treasurer gains new iuran permissions on old stored matrices, explicit revocations are preserved", () => {
  const old = Object.fromEntries(permissions.PERMISSION_KEYS.filter((key) => !key.startsWith("iuran.")).map((key) => [key, key === "dashboard.view"]));
  assert.equal(permissions.readStoredPermissions(old, "bendahara")["iuran.update"], true);
  assert.equal(permissions.readStoredPermissions({ ...old, "iuran.view": false }, "bendahara")["iuran.update"], false);
  assert.equal(permissions.readStoredPermissions(old, "biasa")["iuran.view"], false);
  assert.equal(permissions.readStoredPermissions({}, "bendahara")["dashboard.view"], false);
  assert.equal(permissions.readStoredPermissions({}, "bendahara")["iuran.view"], false);
});
test("every iuran endpoint rejects unauthorized calls before accessing records or parsing uploads", async () => {
  for (const status of [401, 403]) {
    const guard = { requirePermission: async () => ({ user: null, error: NextResponse.json({ error: "denied" }, { status }) }) };
    const store = new Proxy({}, { get() { throw new Error("Unauthorized storage access"); } });
    for (const file of ["app/api/admin/iuran/route.ts", "app/api/admin/iuran/import/route.ts"]) {
      const route = load(file, { "@/lib/authorization": guard, "@/lib/iuran-store": store });
      for (const method of ["GET", "POST", "PUT", "DELETE"].filter((method) => route[method])) {
        const response = await route[method](new NextRequest("http://localhost/api/admin/iuran", { method }));
        assert.equal(response.status, status);
      }
    }
  }
});
test("API applies operation permissions and rejects bad data before writing", async () => {
  const checked = [];
  const guard = { requirePermission: async (_, key) => { checked.push(key); return { user: { id: "treasurer" }, error: null }; } };
  const route = load("app/api/admin/iuran/route.ts", { "@/lib/authorization": guard, "@/lib/iuran-store": { createIuran: async () => assert.fail("unexpected save") } });
  for (const method of ["POST", "PUT", "DELETE"]) {
    const response = await route[method](new NextRequest("http://localhost/api/admin/iuran", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...valid(), months: [{ month: 0, amount: "10" }] }) }));
    assert.equal(response.status, 400);
  }
  assert.deepEqual(checked, ["iuran.create", "iuran.update", "iuran.delete"]);
});
