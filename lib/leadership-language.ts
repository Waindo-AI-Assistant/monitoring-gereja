import copy from "@/content/leadership/en.json";

const english = copy as Record<string, string>;
export function leadershipText(text: string, isEn: boolean): string {
  return isEn ? english[text.trim().toLocaleLowerCase("id")] ?? text : text;
}

export function localizeLeadership<T extends { jabatan: string; jabatanEn?: string; kategori: string; subBidang?: string; keterangan?: string; nama: string }>(item: T, isEn: boolean): T {
  if (!isEn) return item;
  return {
    ...item,
    jabatan: item.jabatanEn?.trim() || leadershipText(item.jabatan, true),
    kategori: leadershipText(item.kategori, true),
    subBidang: item.subBidang && leadershipText(item.subBidang, true),
    keterangan: item.keterangan && leadershipText(item.keterangan, true),
    // Translate roster role prefixes, preserving each person's name and credentials.
    nama: item.nama.replace(/(^|\n)(Ketua|Wakil Ketua|Wkl\. Sekretaris|Sekretaris|Anggota)\s*:/g, (_, line, role) => `${line}${leadershipText(role, true)}:`),
  };
}
