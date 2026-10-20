const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { NextRequest } = require("next/server");
const crypto = require("node:crypto");

process.env.AUTH_SECRET = "test-secret-for-auth-tests-only-0123456789";

// Load TypeScript with explicit dependencies, without touching the real DB or data files.
function load(file, mocks = {}) {
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === "@/lib/prisma") throw new Error("Tests must explicitly mock Prisma.");
    if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`, mocks);
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports,__dirname){${source}\n})`, { filename })(localRequire, module, module.exports, path.dirname(filename));
  return module.exports;
}

const roles = load("lib/roles.ts");
const session = load("lib/session.ts");
const permissions = load("lib/permissions.ts");
const defaultStore = { getRolePermissions: async (role) => permissions.defaultPermissions(role) };
const account = (role = "biasa") => ({ id: "digital-id", name: "Digital GPP", username: "digitalgpp", role, createdAt: "", passwordHash: "private", salt: "private" });
const request = (token, url = "/dashboard", method = "GET", body) => new NextRequest(`http://localhost${url}`, {
  method,
  headers: token ? { cookie: `admin_session=${token}` } : {},
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const tokenFor = (role = "biasa") => session.createSessionToken(account(role));

test("all four roles can have sessions; only superadmin administers access settings", () => {
  assert.equal(roles.ROLES.length, 4);
  for (const role of roles.ROLES) {
    assert.equal(session.verifySessionToken(tokenFor(role)).role, role);
    assert.equal(roles.isSuperadmin(role), role === "superadmin");
  }
  assert.equal(roles.normalizeRole("admin"), "biasa");
  assert.equal(roles.isSuperadmin("admin"), false);
});

test("forged, expired, missing-expiry, and unsupported-role sessions are rejected", () => {
  assert.equal(session.verifySessionToken(`${tokenFor()}tampered`), null);
  const payload = { ...account(), sub: "digital-id" };
  assert.equal(session.verifySessionToken(session.jwt.sign(payload, -1)), null);
  assert.equal(session.verifySessionToken(session.jwt.sign(payload, 0)), null);
  assert.equal(session.verifySessionToken(session.jwt.sign(payload, Infinity)), null);
  assert.equal(session.verifySessionToken(session.jwt.sign({ ...payload, role: "owner" })), null);
});

test("missing or short AUTH_SECRET refuses to sign or verify instead of using a default key", () => {
  const original = process.env.AUTH_SECRET;
  try {
    for (const value of [undefined, "too-short"]) {
      if (value === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = value;
      assert.throws(() => tokenFor(), /AUTH_SECRET/);
      assert.throws(() => session.verifySessionToken("a.b.c"), /AUTH_SECRET/);
    }
  } finally { process.env.AUTH_SECRET = original; }
});

test("passwords use the strong hash format and legacy hashes still verify but need rehash", () => {
  const { hash, salt } = session.hashPassword("correct-horse");
  assert.match(hash, /^pbkdf2_sha512\$210000\$[0-9a-f]{128}$/);
  assert.equal(session.verifyPassword("correct-horse", hash, salt), true);
  assert.equal(session.verifyPassword("wrong", hash, salt), false);
  assert.equal(session.needsRehash(hash), false);
  const legacy = crypto.pbkdf2Sync("old-password", "legacy-salt", 1000, 64, "sha512").toString("hex");
  assert.equal(session.verifyPassword("old-password", legacy, "legacy-salt"), true);
  assert.equal(session.verifyPassword("wrong", legacy, "legacy-salt"), false);
  assert.equal(session.needsRehash(legacy), true);
});

test("proxy redirects unauthenticated dashboard requests and leaves login reachable", () => {
  const { proxy } = load("proxy.ts");
  for (const token of [undefined, "invalid", session.jwt.sign({ ...account(), sub: "digital-id" }, -1)]) {
    const response = proxy(request(token, "/dashboard?view=map"));
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location")).pathname, "/admin");
    assert.equal(new URL(response.headers.get("location")).searchParams.get("next"), "/dashboard?view=map");
  }
  for (const role of roles.ROLES) {
    assert.equal(proxy(request(tokenFor(role))).headers.get("x-middleware-next"), "1");
    // Do not redirect revoked dashboard sessions back into a login/dashboard loop.
    assert.equal(proxy(request(tokenFor(role), "/admin")).headers.get("x-middleware-next"), "1");
  }
});

test("API authorization uses current role and denies deleted users", async () => {
  let users = [account("superadmin")];
  const auth = { ...session, getUsers: async () => users };
  const { requireSuperadmin, getRequestUser } = load("lib/authorization.ts", { "@/lib/auth": auth, "@/lib/permission-store": defaultStore });
  const req = request(tokenFor("superadmin"));
  assert.equal((await requireSuperadmin(req)).error, null);
  for (const role of ["biasa", "kepengurusan", "harian_pusat"]) {
    users = [account(role)];
    assert.equal((await requireSuperadmin(req)).error.status, 403);
  }
  const safeUser = await getRequestUser(req);
  assert.equal("passwordHash" in safeUser, false);
  assert.equal("salt" in safeUser, false);
  users = [];
  assert.equal((await requireSuperadmin(req)).error.status, 401);
});

test("all management endpoints reject unauthenticated and non-superadmin calls before reading data", async () => {
  const files = ["app/api/admin/users/route.ts", "app/api/admin/churches/route.ts", "app/api/admin/pengurus/route.ts", "app/api/upload/route.ts", "app/api/poi/update/route.ts", "app/api/admin/permissions/route.ts"];
  for (const file of files) {
    for (const role of [null, "biasa", "kepengurusan", "harian_pusat"]) {
      const auth = { ...session, getUsers: async () => role ? [account(role)] : [] };
      const guard = load("lib/authorization.ts", { "@/lib/auth": auth, "@/lib/permission-store": defaultStore });
      const route = load(file, { "@/lib/authorization": guard, "@/lib/auth": auth, "@/lib/prisma": { prisma: {} }, "@/lib/permission-store": defaultStore });
      for (const [method, handler] of Object.entries(route)) {
        const response = await handler(request(role ? tokenFor(role) : undefined, "/api/test", method));
        assert.equal(response.status, role ? 403 : 401, `${file} ${method} ${role}`);
      }
    }
  }
});

test("user management rejects unsupported roles and preserves the last superadmin", async () => {
  const admin = account("superadmin");
  const auth = { ...session, getUsers: async () => [admin], saveUsers: async () => assert.fail("unexpected write") };
  const guard = load("lib/authorization.ts", { "@/lib/auth": auth, "@/lib/permission-store": defaultStore });
  const route = load("app/api/admin/users/route.ts", { "@/lib/authorization": guard, "@/lib/auth": auth, "@/lib/prisma": { prisma: {} }, "@/lib/permission-store": defaultStore });
  const response = await route.POST(request(tokenFor("superadmin"), "/api/admin/users", "POST", { name: "New", username: "new-user", password: "valid-password", role: "admin" }));
  assert.equal(response.status, 400);
  const demote = await route.PUT(request(tokenFor("superadmin"), "/api/admin/users", "PUT", { id: admin.id, role: "biasa" }));
  assert.equal(demote.status, 400);
});

test("database returning no users never resurrects fallback accounts", async () => {
  const auth = load("lib/auth.ts", { "@/lib/prisma": { prisma: { user: { findMany: async () => [] } } } });
  assert.deepEqual(await auth.getUsers(), []);
});

test("repeat seeding keeps digitalgpp dashboard-only and preserves changed passwords", async () => {
  const users = new Map();
  const prisma = {
    user: {
      findUnique: async ({ where }) => users.get(where.username),
      create: async ({ data }) => users.set(data.username, { ...data }),
      updateMany: async () => {},
      upsert: async ({ where, update, create }) => users.set(where.username, users.has(where.username) ? { ...users.get(where.username), ...update } : { ...create }),
    },
    church: { count: async () => 1 },
  };
  async function seed() {
    let complete;
    const finished = new Promise((resolve) => { complete = resolve; });
    prisma.$disconnect = async () => complete();
    const script = fs.readFileSync(path.resolve("prisma/seed.js"), "utf8");
    const mocks = { "@prisma/client": { PrismaClient: function () { return prisma; } } };
    vm.runInThisContext(`(function(require,console,__dirname){${script}\n})`)((name) => mocks[name] || require(name), { log() {}, error: assert.fail }, path.resolve("prisma"));
    await finished;
  }
  await seed();
  const digital = users.get("digitalgpp");
  assert.equal(digital.role, "biasa");
  assert.equal(session.verifyPassword("digitalggp", digital.passwordHash, digital.salt), true);
  assert.equal(users.get("superadmin").role, "superadmin");
  digital.passwordHash = "changed-password";
  digital.role = "superadmin";
  await seed();
  assert.equal(users.get("digitalgpp").role, "biasa");
  assert.equal(users.get("digitalgpp").passwordHash, "changed-password");
});

test("permission matrices reject unknown grants, missing keys, non-booleans, and write without view", () => {
  assert.equal(permissions.validateMatrix(permissions.defaultMatrix()), true);
  for (const mutate of [
    (matrix) => { matrix.biasa["unknown.view"] = true; },
    (matrix) => { delete matrix.biasa["dashboard.view"]; },
    (matrix) => { matrix.biasa["dashboard.view"] = "true"; },
    (matrix) => { matrix.biasa["churches.update"] = true; },
    (matrix) => { matrix.superadmin["dashboard.view"] = false; },
    (matrix) => { matrix.owner = matrix.superadmin; },
  ]) {
    const matrix = permissions.defaultMatrix();
    mutate(matrix);
    assert.equal(permissions.validateMatrix(matrix), false);
  }
  const corrupt = permissions.readStoredPermissions({ "churches.update": true, "users.view": "true" });
  assert.equal(corrupt["churches.update"], false);
  assert.equal(corrupt["users.view"], false);
});

test("saving the matrix persists every editable role in one transaction and reloads it", async () => {
  const rows = new Map();
  let transactions = 0;
  const prisma = {
    rolePermission: {
      findUnique: async ({ where }) => rows.get(where.role),
      findMany: async () => [...rows.values()],
      upsert: (operation) => operation,
    },
    $transaction: async (operations) => {
      transactions++;
      assert.equal(operations.length, 3);
      for (const { where, create, update } of operations) {
        assert.notEqual(where.role, "superadmin");
        rows.set(where.role, rows.has(where.role) ? { ...rows.get(where.role), ...update } : create);
      }
    },
  };
  const store = load("lib/permission-store.ts", { "@/lib/prisma": { prisma } });
  const matrix = permissions.defaultMatrix();
  matrix.kepengurusan["pengurus.view"] = true;
  matrix.kepengurusan["pengurus.update"] = true;
  await store.savePermissionMatrix(matrix);
  assert.equal(transactions, 1);
  assert.deepEqual(await store.getPermissionMatrix(), matrix);
  const reloaded = load("lib/permission-store.ts", { "@/lib/prisma": { prisma } });
  assert.equal((await reloaded.getRolePermissions("kepengurusan"))["pengurus.update"], true);
});

test("grants and revocations take effect for existing sessions; DB failure never grants access", async () => {
  const auth = { ...session, getUsers: async () => [account("biasa")] };
  let current = permissions.defaultPermissions("biasa");
  const store = { getRolePermissions: async () => current };
  const guard = load("lib/authorization.ts", { "@/lib/auth": auth, "@/lib/permission-store": store });
  const req = request(tokenFor());
  assert.equal((await guard.requirePermission(req, "churches.update")).error.status, 403);
  current = { ...current, "churches.view": true, "churches.update": true };
  assert.equal((await guard.requirePermission(req, "churches.update")).error, null);
  assert.equal((await guard.requirePermission(req, "churches.delete")).error.status, 403);
  current = { ...current, "churches.view": false };
  assert.equal((await guard.requirePermission(req, "churches.update")).error.status, 403);
  store.getRolePermissions = async () => { throw new Error("database unavailable"); };
  const log = console.error;
  console.error = () => {};
  try { assert.equal((await guard.requirePermission(req, "churches.update")).error.status, 503); }
  finally { console.error = log; }
});

test("permissions API validates requests and never reports failed saves as success", async () => {
  let saved = permissions.defaultMatrix();
  let fail = false;
  const auth = { ...session, getUsers: async () => [account("superadmin")] };
  const store = {
    getPermissionMatrix: async () => saved,
    savePermissionMatrix: async (matrix) => { if (fail) throw new Error("DB error"); saved = matrix; },
  };
  const guard = load("lib/authorization.ts", { "@/lib/auth": auth, "@/lib/permission-store": defaultStore });
  const route = load("app/api/admin/permissions/route.ts", { "@/lib/authorization": guard, "@/lib/permission-store": store });
  const matrix = permissions.defaultMatrix();
  matrix.harian_pusat["churches.view"] = true;
  const response = await route.PUT(request(tokenFor("superadmin"), "/api/admin/permissions", "PUT", { permissions: matrix }));
  assert.equal(response.status, 200);
  const read = await route.GET(request(tokenFor("superadmin")));
  assert.deepEqual((await read.json()).permissions, matrix);
  const invalid = await route.PUT(request(tokenFor("superadmin"), "/api/admin/permissions", "PUT", { permissions: {} }));
  assert.equal(invalid.status, 400);
  fail = true;
  const log = console.error;
  console.error = () => {};
  try {
    const failed = await route.PUT(request(tokenFor("superadmin"), "/api/admin/permissions", "PUT", { permissions: matrix }));
    assert.equal(failed.status, 503);
    assert.equal((await failed.json()).success, undefined);
  } finally { console.error = log; }
});

test("delegated user management cannot promote roles or modify superadmin accounts", async () => {
  const actor = account("kepengurusan");
  const admin = { ...account("superadmin"), id: "admin-id", username: "superadmin" };
  const auth = { ...session, getUsers: async () => [actor, admin], saveUsers: async () => assert.fail("unexpected write") };
  const grant = { ...permissions.defaultPermissions("kepengurusan"), "users.view": true, "users.create": true, "users.update": true, "users.delete": true };
  const guard = load("lib/authorization.ts", { "@/lib/auth": auth, "@/lib/permission-store": { getRolePermissions: async () => grant } });
  const route = load("app/api/admin/users/route.ts", { "@/lib/authorization": guard, "@/lib/auth": auth, "@/lib/prisma": { prisma: {} } });
  const token = tokenFor("kepengurusan");
  const create = await route.POST(request(token, "/api/admin/users", "POST", { name: "New", username: "new-user", password: "valid-password", role: "superadmin" }));
  assert.equal(create.status, 403);
  const promote = await route.PUT(request(token, "/api/admin/users", "PUT", { id: actor.id, role: "superadmin" }));
  assert.equal(promote.status, 403);
  const editAdmin = await route.PUT(request(token, "/api/admin/users", "PUT", { id: admin.id, password: "new-password" }));
  assert.equal(editAdmin.status, 403);
  const deleteAdmin = await route.DELETE(request(token, `/api/admin/users?id=${admin.id}`, "DELETE"));
  assert.equal(deleteAdmin.status, 403);
});

test("no-access roles have a landing page without redirect loops", () => {
  const empty = permissions.defaultPermissions();
  assert.equal(permissions.landingPath(empty), "/access-denied");
  assert.equal(permissions.landingPath(permissions.defaultPermissions("biasa")), "/dashboard");
  assert.equal(permissions.landingPath({ ...empty, "pengurus.view": true }), "/admin");
});
