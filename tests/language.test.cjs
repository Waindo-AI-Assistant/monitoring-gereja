const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const crypto = require("node:crypto");
const original = require("../content/history/benih-yang-tumbuh.json");
const english = require("../content/history/benih-yang-tumbuh.en.json");
const positions = require("../public/data/pengurus.json");

function load(file) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })((name) => {
    if (name.startsWith("@/") && name.endsWith(".json")) return JSON.parse(fs.readFileSync(name.slice(2), "utf8"));
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const { localizeHistory } = load("lib/history-language.ts");
const { localizeLeadership, leadershipText } = load("lib/leadership-language.ts");

test("English translations cover every chapter and source block and match the source revision", () => {
  assert.equal(english.sourceSha256, original.sourceSha256);
  assert.equal(english.sourceTextSha256, crypto.createHash("sha256").update(fs.readFileSync("content/history/benih-yang-tumbuh.json", "utf8").replace(/\r\n/g, "\n")).digest("hex"));
  assert.deepEqual(Object.keys(english.chapters), original.chapters.map(c => c.slug));
  for (const chapter of original.chapters) {
    const translated = english.chapters[chapter.slug];
    assert.equal(translated.blocks.length, chapter.blocks.length);
    for (const text of [translated.title, translated.location, translated.summary, ...translated.blocks]) assert.ok(text.trim().length > 0 && !text.includes("\ufffd"));
    const localized = localizeHistory(chapter, true);
    assert.equal(localizeHistory(chapter, false), chapter);
    assert.equal(localized.slug, chapter.slug);
    assert.equal(localized.year, chapter.year);
    for (let index = 0; index < chapter.blocks.length; index++) {
      const { text: ignored, ...reference } = localized.blocks[index];
      const { text: originalText, ...expected } = chapter.blocks[index];
      assert.deepEqual(reference, expected);
      assert.equal(chapter.blocks[index].text, originalText);
    }
  }
});

test("leadership titles, categories, divisions, and descriptions have English companions", () => {
  for (const item of positions) {
    const translated = localizeLeadership(item, true);
    assert.equal(localizeLeadership(item, false), item);
    assert.ok(translated.jabatan);
    assert.notEqual(translated.kategori, item.kategori);
    assert.notEqual(translated.subBidang, item.subBidang);
    assert.notEqual(translated.keterangan, item.keterangan);
    assert.equal(translated.id, item.id);
    assert.equal(translated.nama.replace(/(?:Chairperson|Deputy Chairperson|Deputy Secretary|Secretary|Members)\s*:/g, "ROLE:"), item.nama.replace(/(?:Ketua|Wakil Ketua|Wkl\. Sekretaris|Sekretaris|Anggota)\s*:/g, "ROLE:"));
  }
  assert.equal(leadershipText("SIDANG RAYA", true), "General Assembly");
});

test("client-managed custom content stays intact instead of receiving an unrelated translation", () => {
  const custom = { ...positions[0], jabatan: "Jabatan baru", jabatanEn: "New position", subBidang: "Bidang baru", keterangan: "Deskripsi baru", nama: "Test Name" };
  const result = localizeLeadership(custom, true);
  assert.equal(result.jabatan, "New position");
  assert.equal(result.subBidang, custom.subBidang);
  assert.equal(result.keterangan, custom.keterangan);
  assert.equal(result.nama, custom.nama);
});
