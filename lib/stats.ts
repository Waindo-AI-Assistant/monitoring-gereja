// Agregasi statistik untuk Monitoring Gereja.
export const ALL = "__all__";

export type Filters = {
  daerah: string | typeof ALL;
  kabupaten: string | typeof ALL;
  desa: string | typeof ALL;
};

export const DEFAULT_FILTERS: Filters = { daerah: ALL, kabupaten: ALL, desa: ALL };

export type Summary = {
  jumlahMada: number;
  totalGereja: number;
  gerejaTerfilter: number;
};

const NUMBER_ID = new Intl.NumberFormat("id-ID");
const NUMBER_ID_2 = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatInt(value: number): string {
  return NUMBER_ID.format(Math.round(value));
}

export function formatArea(value: number): string {
  return NUMBER_ID_2.format(value);
}
