import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { accountKey, type IuranInput } from "@/lib/iuran";
import crypto from "node:crypto";

export class IuranConflict extends Error {}

export async function listIuran(year: number) {
  const rows = await prisma.iuranAccount.findMany({ where: { year }, include: { months: { orderBy: { month: "asc" } } }, orderBy: [{ mada: "asc" }, { mawil: "asc" }, { churchName: "asc" }, { kind: "asc" }] });
  return rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString(), months: row.months.map((m) => ({ month: m.month, amount: m.amount?.toFixed(2) ?? null, receiptNote: m.receiptNote })) }));
}

export async function createIuran(data: IuranInput, userId: string) {
  const { months, ...account } = data;
  return prisma.iuranAccount.create({ data: { ...account, createdBy: userId, updatedBy: userId, months: { create: months } } });
}

export async function updateIuran(id: string, updatedAt: string, data: IuranInput, userId: string) {
  const { months, ...account } = data;
  return prisma.$transaction(async (tx) => {
    const changed = await tx.iuranAccount.updateMany({ where: { id, updatedAt: new Date(updatedAt) }, data: { ...account, updatedBy: userId, updatedAt: new Date(Math.max(Date.now(), Date.parse(updatedAt) + 1)) } });
    if (!changed.count) throw new IuranConflict("Data telah berubah atau dihapus. Muat ulang sebelum mengedit kembali.");
    await tx.iuranMonth.deleteMany({ where: { accountId: id } });
    if (months.length) await tx.iuranMonth.createMany({ data: months.map((month) => ({ ...month, accountId: id })) });
    const updated = await tx.iuranAccount.findUniqueOrThrow({ where: { id }, include: { months: { orderBy: { month: "asc" } } } });
    return { ...updated, updatedAt: updated.updatedAt.toISOString(), months: updated.months.map((month) => ({ month: month.month, amount: month.amount?.toFixed(2) ?? null, receiptNote: month.receiptNote })) };
  });
}

export async function deleteIuran(id: string, updatedAt: string) {
  const removed = await prisma.iuranAccount.deleteMany({ where: { id, updatedAt: new Date(updatedAt) } });
  if (!removed.count) throw new IuranConflict("Data telah berubah atau dihapus. Muat ulang sebelum menghapus kembali.");
}

/** Existing accounts and edited monthly receipts are never overwritten by an import. */
export async function importIuran(rows: (IuranInput & { source: string })[], userId: string) {
  const unique = new Map(rows.map((row) => [accountKey(row), row]));
  if (unique.size !== rows.length) throw new IuranConflict("Ada jemaat / jenis iuran duplikat antarlembar. Pilih satu lembar sumber untuk data tersebut.");
  return prisma.$transaction(async (tx) => {
    const prepared = rows.map(({ months, ...row }) => ({ account: { ...row, id: crypto.randomUUID(), createdBy: userId, updatedBy: userId }, months }));
    const created = await tx.iuranAccount.createManyAndReturn({
      data: prepared.map((row) => row.account), skipDuplicates: true, select: { id: true },
    });
    const ids = new Set(created.map((row) => row.id));
    const months = prepared.filter((row) => ids.has(row.account.id)).flatMap((row) => row.months.map((month) => ({ ...month, accountId: row.account.id })));
    for (let i = 0; i < months.length; i += 1000) await tx.iuranMonth.createMany({ data: months.slice(i, i + 1000) });
    return { created: created.length, skipped: rows.length - created.length };
  }, { timeout: 60000 });
}

export function isDuplicateIuran(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
