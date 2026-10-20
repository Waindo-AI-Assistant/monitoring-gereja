"""Import the supplied Bab XII excerpt, preserving source wording and page references.
Requires pdfplumber and pypdf. Run with the source PDF path as the only argument.
Chapter boundaries are editorially checked against the printed headings.
"""
import json
import hashlib
import re
import shutil
import sys
from pathlib import Path
import pdfplumber
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]).resolve()
CONTENT = ROOT / "content/history"
ASSETS = ROOT / "public/history/benih-yang-tumbuh"
CONTENT.mkdir(parents=True, exist_ok=True)
ASSETS.mkdir(parents=True, exist_ok=True)

DEFINITIONS = [
 ("kongres-i-1960", 1960, "Kongres I", "Sindanglaya, Cipanas", "Kongres pertama", "Kongres pertama dan penetapan nama Gereja Gerakan Pentakosta, lambang, serta susunan pengurus pusat."),
 ("kongres-ii-1964", 1964, "Kongres II", "Langowan, Sulawesi Utara", "Kongres II GGP tahun 1964", "Pembentukan Dewan Rohani, kepengurusan 1964–1968, dan perjalanan awal organisasi pemuda GGP."),
 ("sidang-raya-iii-1968", 1968, "Sidang Raya III", "Kauditan, Sulawesi Utara", "Kongres III GGP tahun 1968", "Peralihan istilah Kongres menjadi Sidang Raya dan pembagian tugas pelayanan Majelis Pusat."),
 ("sidang-raya-iv-1972", 1972, "Sidang Raya IV", "Sukabumi, Jawa Barat", "Sidang Raya IV/1972", "Persidangan di Wisma Oikoumene, kepengurusan 1972–1976, dan penetapan Bapa Rohani GGP."),
 ("sidang-raya-v-1976", 1976, "Sidang Raya V", "Bongkudai Baru, Sulawesi Utara", "Sidang Raya V/1976 GGP", "Catatan penulis tentang persidangan di Bongkudai Baru dan susunan Majelis Pusat periode 1976–1980."),
 ("sidang-pelengkap-1978", 1978, "Sidang Pelengkap Pusat", "Mega Mendung, Jawa Barat", "Sidang Pelengkap Pusat tahun 1978", "Penataan personalia Majelis Pusat serta persiapan menuju Sidang Raya VI pada tahun 1980."),
 ("sidang-raya-vi-1980", 1980, "Sidang Raya VI", "Cipayung, Jawa Barat", "Sidang Raya VI/1980 di Cipayung", "Regenerasi kepemimpinan, pembaruan tata persidangan, dan program pelayanan Majelis Pusat 1980–1984."),
 ("sidang-raya-vii-1984", 1984, "Sidang Raya VII", "Karanglo, Malang", "Sidang Raya VII tahun 1984 di Karanglo,", "Pertumbuhan pelayanan, hubungan dengan gereja mitra, serta dokumentasi kehidupan Pdt. Henk Thiessen."),
 ("sidang-raya-viii-1988", 1988, "Sidang Raya VIII", "Pineleng, Sulawesi Utara", "Sidang Raya VIII tahun 1988", "Persidangan di Pineleng, susunan Majelis Pusat 1988–1992, dan pengaturan masa jabatan ketua."),
 ("sidang-raya-ix-1992", 1992, "Sidang Raya IX", "Caringin, Bogor", "Sidang Raya IX tahun 1992", "Sidang Raya di Wisma Kinasih, kehadiran Menteri Agama, dan kepengurusan masa bakti 1992–1996."),
 ("sidang-raya-x-1996", 1996, "Sidang Raya X", "Lembang, Bandung", "Sidang Raya X tahun 1996", "Persidangan di Grand Hotel Lembang serta perubahan masa bakti dan kepengurusan 1996–2001."),
 ("sidang-raya-xi-2001", 2001, "Sidang Raya XI", "Batu, Malang", "Sidang Raya XI tahun 2001", "Penetapan visi Gereja Idaman Kristus, kepengurusan 2001–2006, dan catatan perjalanan organisasi dalam periode ini."),
 ("sidang-raya-xii-2006", 2006, "Sidang Raya XII", "Kampus STTP Mooat", "Sidang Raya XII tahun 2006", "Susunan Majelis Pusat, departemen pelayanan, serta keputusan persidangan di kampus STTP Mooat."),
 ("sidang-raya-xiii-2010", 2010, "Sidang Raya XIII", "Jakarta", "Sidang Raya XIII tahun 2010", "Persidangan di Jemaat Ecclesia Christi dan susunan personalia Majelis Pusat masa bakti 2010–2015."),
 ("sidang-raya-xiv-2015", 2015, "Sidang Raya XIV", "Bandung, Jawa Barat", "Sidang Raya XIV tahun 2015", "Kepengurusan 2015–2021, keputusan persidangan, dan penundaan Sidang Raya berikutnya pada masa pandemi."),
 ("sidang-raya-xv-2021", 2021, "Sidang Raya XV", "Manado, Sulawesi Utara", "Sidang Raya XV GGP/2021", "Persidangan hybrid pada Oktober 2021 dan susunan MP, DP, serta BPP masa bakti 2021–2026."),
]

def clean(text):
 return re.sub(r"\s+", " ", text).strip()

def append_text(block, text):
 # Rejoin print line wrapping, including hyphenated words; do not change names.
 if block["text"].endswith("-") and text[:1].islower():
  block["text"] = block["text"][:-1] + text
 else:
  block["text"] += " " + text

reader = PdfReader(SOURCE)
chapters = []
current = None
photos = 0
source_lines = 0
with pdfplumber.open(SOURCE) as pdf:
 if len(pdf.pages) != 51:
  raise ValueError("This importer expects the reviewed 51-page Bab XII excerpt.")
 for page_index, page in enumerate(pdf.pages):
  page_number = page_index + 137
  lines = [line for line in page.extract_text_lines() if line["top"] >= 65 and line["bottom"] < 652]
  if page_index == 0:
   lines = [line for line in lines if line["top"] >= 380]
  embedded = {image.indirect_reference.idnum: image for image in reader.pages[page_index].images}
  images = [image for image in page.images if image["x0"] >= 45 and image["x1"] <= 452 and image["top"] >= 65 and image["bottom"] <= 650 and image["width"] >= 80 and image["height"] >= 65]
  events = [(line["top"], "text", line) for line in lines] + [(image["top"], "image", image) for image in images]
  events.sort(key=lambda event: (event[0], event[2]["x0"]))
  base_x = min((line["x0"] for line in lines if line["bottom"] - line["top"] < 15), default=57)
  previous_line = None
  for _, kind, item in events:
   ref = {"bookPage": page_number, "pdfPage": page_index + 1}
   if kind == "image":
    if current is None: continue
    embedded_image = embedded[item["stream"].objid]
    filename = f"page-{page_number}-{photos+1:02d}{Path(embedded_image.name).suffix}"
    (ASSETS / filename).write_bytes(embedded_image.data)
    width, height = embedded_image.image.size
    current["blocks"].append({"kind":"figure", "src":f"/history/benih-yang-tumbuh/{filename}", "width":width, "height":height, "text":f"Dokumentasi dalam Benih yang Tumbuh, halaman {page_number}.", **ref})
    photos += 1
    previous_line = None
    continue
   text = clean(item["text"])
   definition = next((entry for entry in DEFINITIONS if text.startswith(entry[4]) and item["bottom"] - item["top"] > 14.5), None)
   # Repeated caption on page 152 is not a new chapter.
   if definition and (not current or current["slug"] != definition[0]):
    if any(chapter["slug"] == definition[0] for chapter in chapters): definition = None
   if definition and (not current or current["slug"] != definition[0]):
    slug, year, title, location, _, summary = definition
    current = {"slug":slug, "year":year, "title":title, "location":location, "summary":summary, "blocks":[]}
    chapters.append(current)
    previous_line = None
    continue
   if current is None: continue
   if current["year"] == 1984 and text == "Malang-Jawa Timur": continue
   source_lines += 1
   line_height = item["bottom"] - item["top"]
   bullet = bool(re.match(r"^(?:[•]|\(?\d+[.)](?:\d+\.)?|[a-e]\.)\s*", text))
   is_roster = bool(re.match(r"^(?:Pdt\.?|Pdm\.?|Pdp\.?|Pb\.?|Sdr\.?|Sdri\.?|Ny\.?|Ibu\.?|Bpk\.?|Drs\.?|Kol\.)\s", text)) and len(text) < 90 and item["x1"] < 410
   colon_roster = ':' in text and len(text.split(':')[0]) < 50 and bool(re.search(r"Ketua|Sekretaris|Bendahara|Komisi|Penghubung|Penasihat|Anggota|Misi|Pelayanan|Kepala|Multimedia|Digitalisasi|Kemitraan|Penganggaran|Kominfo|Diakonia|Pendidikan|Perintisan|Pembinaan|Penelitian|Pengembangan|Dewan|Badan", text.split(':')[0]))
   heading = line_height > 14.5 or (text.isupper() and len(text) > 15)
   # Keep the short biographical notes and roster lines as individual paragraphs.
   new_paragraph = previous_line is None or item['top'] - previous_line['bottom'] > 11
   if previous_line and current['blocks']:
    previous_text = current['blocks'][-1].get('text', '')
    if re.search(r'[.!?]$', previous_text) and previous_line['x1'] < 380 and text[:1].isupper():
     new_paragraph = True
   last = current['blocks'][-1] if current['blocks'] else None
   if last and last['kind'] == 'entry' and ':' in last['text'] and re.match(r'^(?:Pemilihan|Perlu|Untuk|Pada|Ketiga|Dalam|Melalui|Sejak|Catatan|Akhirnya|Selanjutnya|Beberapa|Sebagai|Menyadari|Menghadapi|Setelah)\b', text):
    new_paragraph = True
   is_caption = last and last['kind'] in ['figure','caption'] and line_height < 10
   if is_caption:
    if last['kind'] == 'caption': append_text(last, text)
    else: current['blocks'].append({"kind":"caption", "text":text, **ref})
   elif text == 'dan Anggota-anggota':
    current['blocks'].append({"kind":"entry", "text":text, **ref})
   elif heading:
    current['blocks'].append({"kind":"heading", "text":text, **ref})
   elif bullet or is_roster or colon_roster:
    current['blocks'].append({"kind":"entry", "text":text, **ref})
   elif last and last['kind'] in ['paragraph','entry'] and not new_paragraph:
    append_text(last, text)
   else:
    current['blocks'].append({"kind":"paragraph", "text":text, **ref})
   previous_line = item

if [chapter['slug'] for chapter in chapters] != [entry[0] for entry in DEFINITIONS]:
 raise ValueError('Chapter boundaries did not match reviewed source order: ' + str([chapter['slug'] for chapter in chapters]))
# Rejoin prose broken by a printed page boundary or by a roster-like name mid-sentence.
for chapter in chapters:
 merged = []
 for block in chapter['blocks']:
  previous = merged[-1] if merged else None
  if previous and previous['kind'] in ['paragraph', 'entry'] and block['kind'] in ['paragraph', 'entry']:
   numbered = bool(re.match(r'^(?:[•]|\(?\d+[.)]|[a-e]\.)\s*', block['text']))
   unfinished = not re.search(r'[.!?:]$', previous['text']) or bool(re.search(r'(?:Pdt|Pdm|Pdp|Sdr|Bpk)\.$', previous['text']))
   crosses_page = block['bookPage'] > previous.get('endBookPage', previous['bookPage'])
   prose_continuation = previous['kind'] == 'paragraph' and block['kind'] == 'entry'
   if unfinished and not numbered and (crosses_page or prose_continuation):
    append_text(previous, block['text'])
    previous['endBookPage'] = block.get('endBookPage', block['bookPage'])
    previous['endPdfPage'] = block.get('endPdfPage', block['pdfPage'])
    continue
  merged.append(block)
 chapter['blocks'] = merged

for index, chapter in enumerate(chapters):
 chapter['number'] = index + 1
 pages = [page for block in chapter['blocks'] for page in [block['bookPage'], block.get('endBookPage', block['bookPage'])]]
 chapter['firstPage'], chapter['lastPage'] = min(pages), max(pages)
 chapter['pdfPage'] = min(block['pdfPage'] for block in chapter['blocks'])
 chapter['readingMinutes'] = max(1, round(sum(len(block['text'].split()) for block in chapter['blocks']) / 180))
 if any('\ufffd' in block['text'] for block in chapter['blocks']):
  raise ValueError('Unresolved extraction characters detected.')

shutil.copyfile(SOURCE, ASSETS / 'bab-xii-sumber.pdf')
collection = {"id":"benih-yang-tumbuh-bab-xii", "title":"Perjalanan Organisasi GGP dari Sidang Raya ke Sidang Raya", "bookTitle":"Benih yang Tumbuh", "sourceChapter":"Bab XII", "sourceUrl":"/history/benih-yang-tumbuh/bab-xii-sumber.pdf", "sourceSha256":hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "sourcePageCount":51, "photoCount":photos, "firstPage":137, "lastPage":187, "chapters":chapters}
(CONTENT / 'benih-yang-tumbuh.json').write_text(json.dumps(collection, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({"chapters":len(chapters), "photos":photos, "sourceLines":source_lines, "articles":[{"year":c['year'],"blocks":len(c['blocks']),"pages":[c['firstPage'],c['lastPage']]} for c in chapters]},indent=2))
