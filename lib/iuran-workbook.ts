import ExcelJS from "exceljs";
import { IURAN_KINDS, amountString, sumAmounts, validateIuran, accountKey, type IuranInput } from "@/lib/iuran";

export type IuranSheet = { name: string; year: number | null; rows: IuranInput[]; warnings: string[]; errors: string[]; total: string };

function scalar(value: ExcelJS.CellValue): string | number | Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !(value instanceof Date)) {
    if ("result" in value) return scalar(value.result as ExcelJS.CellValue);
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("text" in value) return String(value.text);
    return null;
  }
  return typeof value === "boolean" ? String(value) : value;
}
function text(value: ExcelJS.CellValue): string {
  const raw = scalar(value);
  return raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw ?? "").trim();
}

export async function readIuranWorkbook(buffer: ArrayBuffer): Promise<IuranSheet[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  if (workbook.worksheets.length > 60) throw new Error("Maksimal 60 lembar per file.");
  return workbook.worksheets.map((sheet) => {
    const warnings: string[] = [], errors: string[] = [], rows: IuranInput[] = [];
    let header = 0, start = 0;
    for (let r = 1; r <= Math.min(sheet.rowCount, 8); r++) {
      for (let c = 1; c <= 8; c++) if (/^(januari|jan)$/i.test(text(sheet.getCell(r, c).value))) { header = r; start = c; }
    }
    const title = Array.from({ length: Math.min(header || 3, 8) }, (_, i) => Array.from({ length: 5 }, (_, j) => text(sheet.getCell(i + 1, j + 1).value)).join(" ")).join(" ");
    const yearMatch = title.match(/TAHUN\s*(20\d{2})/i);
    const year = yearMatch ? Number(yearMatch[1]) : null;
    const result = { name: sheet.name, year, rows, warnings, errors, total: "0.00" };
    if (!header || start < 4) { warnings.push("Tidak ditemukan tabel iuran bulanan. Lembar ini dilewati."); return result; }
    if (sheet.rowCount > 10000) { errors.push("Lembar melebihi 10.000 baris."); return result; }
    if (!year) warnings.push("Tahun tidak tercantum pada judul. Periksa sebelum impor.");
    const mada = sheet.name.trim().replace(/^MADA\s+/i, "");
    let mawil = "", churchName = "";
    const keys = new Set<string>();
    for (let r = header + 1; r <= sheet.rowCount; r++) {
      const label = text(sheet.getCell(r, start - 1).value).toLowerCase();
      const name = text(sheet.getCell(r, start - 2).value);
      const left = text(sheet.getCell(r, start - 3).value);
      const heading = [left, name].find((v) => /^(mawil|wilayah)\b/i.test(v));
      if (heading && !/^jumlah\s*$/i.test(label)) { mawil = heading; churchName = ""; continue; }
      if (!/^jumlah\s*$/i.test(label)) continue;
      if (/^(jumlah|total|rekap)\b/i.test(name)) continue;
      if (/^penanggung\s*jawab$/i.test(name)) {
        const pastorName = text(sheet.getCell(r + 1, start - 2).value);
        rows.filter((row) => row.churchName === churchName && row.mawil === mawil).forEach((row) => { row.pastorName = pastorName; });
        if (Array.from({ length: 12 }, (_, m) => scalar(sheet.getCell(r, start + m).value)).some((v) => v !== null && v !== "" && v !== 0)) errors.push(`Baris ${r}: nominal pada baris Penanggung jawab perlu ditentukan jenis iurannya.`);
        continue;
      }
      if (/^GGP\s*$/i.test(name)) {
        churchName = "";
        if (Array.from({ length: 12 }, (_, m) => scalar(sheet.getCell(r, start + m).value) ?? scalar(sheet.getCell(r + 1, start + m).value)).some((v) => v !== null && v !== "")) errors.push(`Baris ${r}: nama jemaat belum lengkap, tetapi ada catatan bulanan.`);
        else warnings.push(`Baris ${r}: baris kosong dengan nama GGP dilewati.`);
        continue;
      }
      const pastoral = /perpuluhan\s+gembala/i.test(name);
      if (!pastoral) {
        if (!name || /^(jumlah|total|rekap)\b/i.test(left)) continue;
        churchName = name;
      }
      if (!churchName) { errors.push(`Baris ${r}: jemaat untuk perpuluhan tidak ditemukan.`); continue; }
      const kind = pastoral ? (/50\s*%/.test(name) ? IURAN_KINDS[2] : /5\s*%/.test(name) ? IURAN_KINDS[1] : IURAN_KINDS[3]) : IURAN_KINDS[0];
      const months = [];
      for (let m = 0; m < 12; m++) {
        const cell = sheet.getCell(r, start + m);
        if (cell.type === ExcelJS.ValueType.Formula && cell.result === undefined) errors.push(`${cell.address}: rumus belum memiliki hasil. Hitung ulang dan simpan file di Excel sebelum impor.`);
        if (cell.type === ExcelJS.ValueType.Error || (cell.result && typeof cell.result === "object" && "error" in cell.result)) errors.push(`${cell.address}: sel nominal mengandung kesalahan Excel.`);
        let raw = scalar(cell.value);
        if (raw instanceof Date) {
          // Excel date formatting can be applied accidentally to a numeric amount.
          raw = Math.round((raw.getTime() / 86400000 + 25569 - (workbook.properties.date1904 ? 1462 : 0)) * 100) / 100;
          warnings.push(`${sheet.getCell(r, start + m).address}: format tanggal pada kolom nominal; nilai numerik Excel ${raw} dipertahankan.`);
        }
        const receiptNote = text(sheet.getCell(r + 1, start + m).value);
        let amount: string | null = null;
        try { amount = amountString(raw); } catch { errors.push(`${sheet.getCell(r, start + m).address}: nominal tidak valid (${String(raw)}).`); }
        if (amount !== null || receiptNote) months.push({ month: m + 1, amount, receiptNote });
      }
      try {
        const row = validateIuran({ year: year || 2026, mada, mawil, churchName, pastorName: pastoral ? text(sheet.getCell(r + 1, start - 2).value) : "", kind, months });
        const key = accountKey(row);
        if (keys.has(key)) { errors.push(`Baris ${r}: jemaat dan jenis iuran duplikat (${churchName}).`); continue; }
        keys.add(key);
        rows.push(row);
        const cachedTotal = scalar(sheet.getCell(r, start + 12).value);
        if (typeof cachedTotal === "number" && amountString(cachedTotal) !== sumAmounts(months.map((m) => m.amount))) warnings.push(`Baris ${r}: total Excel berbeda dari jumlah 12 bulan; sistem memakai jumlah bulanan.`);
      } catch (error) { errors.push(`Baris ${r}: ${error instanceof Error ? error.message : "Data tidak valid"}`); }
    }
    if (!rows.length) warnings.push("Tidak ada data jemaat yang dapat diimpor.");
    result.total = sumAmounts(rows.flatMap((row) => row.months.map((m) => m.amount)));
    return result;
  });
}
