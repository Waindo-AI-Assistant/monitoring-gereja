export const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const IURAN_KINDS = ["Iuran wajib 5%", "5% Perpuluhan Gembala", "50% Perpuluhan Gembala", "Perpuluhan Gembala"] as const;
export type IuranMonthInput = { month: number; amount: string | null; receiptNote: string };
export type IuranInput = { year: number; mada: string; mawil: string; churchName: string; pastorName: string; kind: string; months: IuranMonthInput[] };
export type IuranRecord = IuranInput & { id: string; updatedAt: string; source: string };

export function parseYear(value: unknown): number {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error("Tahun harus antara 1900 dan 2200.");
  return year;
}

export function amountString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw new Error("Nominal memiliki lebih dari dua angka desimal.");
  const text = typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : String(value).trim();
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(text)) throw new Error("Nominal harus angka positif atau nol, maksimal 12 digit dan 2 desimal (gunakan titik).");
  const [whole, fraction = ""] = text.split(".");
  return `${BigInt(whole)}.${fraction.padEnd(2, "0")}`;
}

export function sumAmounts(values: (string | null)[]): string {
  const cents = values.reduce((total, value) => {
    if (value === null) return total;
    if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Nominal tidak valid.");
    const [whole, fraction = ""] = value.split(".");
    return total + BigInt(whole + fraction.padEnd(2, "0"));
  }, BigInt(0));
  return `${cents / BigInt(100)}.${String(cents % BigInt(100)).padStart(2, "0")}`;
}

function field(value: unknown, label: string, required = false): string {
  if (value !== undefined && typeof value !== "string") throw new Error(`${label} tidak valid.`);
  const text = (value as string | undefined || "").trim().replace(/\s+/g, " ");
  if ((required && !text) || text.length > 250) throw new Error(`${label} wajib diisi, maksimal 250 karakter.`);
  return text;
}

export function validateIuran(value: unknown): IuranInput {
  if (!value || typeof value !== "object") throw new Error("Data iuran tidak valid.");
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.months) || data.months.length > 12) throw new Error("Data bulanan tidak valid.");
  const seen = new Set<number>();
  const months = data.months.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("Data bulan tidak valid.");
    const { month, amount, receiptNote } = entry;
    if (!Number.isInteger(month) || month < 1 || month > 12 || seen.has(month)) throw new Error("Bulan tidak valid atau duplikat.");
    seen.add(month);
    return { month, amount: amountString(amount), receiptNote: field(receiptNote, "Tanggal / referensi penerimaan") };
  }).filter((entry) => entry.amount !== null || entry.receiptNote);
  if (!(IURAN_KINDS as readonly unknown[]).includes(data.kind)) throw new Error("Jenis iuran tidak valid.");
  return { year: parseYear(data.year), mada: field(data.mada, "MADA / wilayah", true), mawil: field(data.mawil, "MAWIL"), churchName: field(data.churchName, "Nama jemaat", true), pastorName: field(data.pastorName, "Nama gembala"), kind: data.kind as string, months };
}

export function accountKey(data: Pick<IuranInput, "year" | "mada" | "mawil" | "churchName" | "kind">): string {
  return JSON.stringify([data.year, data.mada, data.mawil, data.churchName, data.kind]);
}
