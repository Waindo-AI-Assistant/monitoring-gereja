const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const history = require("../content/history/benih-yang-tumbuh.json");

test("history preserves the reviewed sequence and unique permanent article links", () => {
  assert.equal(history.chapters.length, 16);
  assert.equal(new Set(history.chapters.map((chapter) => chapter.slug)).size, 16);
  assert.deepEqual(history.chapters.map((chapter) => chapter.year), [1960, 1964, 1968, 1972, 1976, 1978, 1980, 1984, 1988, 1992, 1996, 2001, 2006, 2010, 2015, 2021]);
  for (const [index, chapter] of history.chapters.entries()) {
    assert.equal(chapter.number, index + 1);
    assert.match(chapter.slug, /^[a-z0-9-]+$/);
    assert.ok(chapter.blocks.length > 0);
    assert.ok(chapter.readingMinutes >= 1);
  }
});

test("all printed source pages are represented and PDF page references resolve", () => {
  const pages = new Set();
  assert.equal(history.chapters.find((chapter) => chapter.year === 1980).lastPage, 151);
  for (const chapter of history.chapters) {
    for (const block of chapter.blocks) {
      assert.equal(block.pdfPage, block.bookPage - history.firstPage + 1);
      assert.ok(block.pdfPage >= 1 && block.pdfPage <= history.sourcePageCount);
      assert.ok(block.bookPage >= chapter.firstPage && block.bookPage <= chapter.lastPage);
      assert.equal(block.text.includes("\ufffd"), false);
      const end = block.endBookPage ?? block.bookPage;
      assert.ok(end <= chapter.lastPage && end >= block.bookPage);
      if (block.endPdfPage) assert.equal(block.endPdfPage, end - history.firstPage + 1);
      for (let page = block.bookPage; page <= end; page++) pages.add(page);
    }
    assert.equal(chapter.pdfPage, chapter.firstPage - history.firstPage + 1);
  }
  assert.deepEqual([...pages].sort((a, b) => a - b), Array.from({ length: 51 }, (_, index) => 137 + index));
});

test("every documentary photo exists and the downloadable source is unchanged", () => {
  const root = path.resolve(__dirname, "../public");
  const figures = history.chapters.flatMap((chapter) => chapter.blocks.filter((block) => block.kind === "figure"));
  assert.equal(figures.length, history.photoCount);
  for (const figure of figures) {
    assert.ok(figure.src.startsWith("/history/benih-yang-tumbuh/"));
    const image = path.resolve(root, `.${figure.src}`);
    assert.ok(image.startsWith(root + path.sep));
    assert.ok(fs.statSync(image).size > 0);
    assert.ok(figure.width > 0 && figure.height > 0);
  }
  const source = fs.readFileSync(path.resolve(root, `.${history.sourceUrl}`));
  assert.equal(source.subarray(0, 5).toString(), "%PDF-");
  assert.equal(crypto.createHash("sha256").update(source).digest("hex"), history.sourceSha256);
});

test("opening and closing accounts retain source names, dates, and historical terms", () => {
  const first = history.chapters[0].blocks.map((block) => block.text).join(" ");
  const last = history.chapters.at(-1).blocks.map((block) => block.text).join(" ");
  assert.match(first, /05-08 April 1960/);
  assert.match(first, /Pdt\. MPT Kandou/);
  assert.match(last, /22-23 Oktober 2021/);
  assert.match(last, /hybrid/);
  assert.match(last, /2021-2026/);
  assert.match(last, /Dicky Suwarta/);
});
