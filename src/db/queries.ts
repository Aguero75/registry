import { count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { records } from "@/db/schema";

export type PublicRecord = {
  id: string;
  name: string;
  serialNumber: string;
  phoneMasked: string;
  createdAt: Date | null;
};

export type AdminRecord = {
  id: string;
  name: string;
  phone: string;
  phoneMasked: string;
  serialNumber: string;
  fileName: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  createdAt: Date | null;
};

export const PAGE_SIZE = 20;

function searchCondition(q: string) {
  const query = q.trim();
  return query
    ? or(ilike(records.name, `%${query}%`), ilike(records.serialNumber, `%${query}%`))
    : undefined;
}

export async function listPublic({ page = 1, q = "" }: { page?: number; q?: string } = {}) {
  const offset = (page - 1) * PAGE_SIZE;

  const result = await db
    .select({
      id: records.id,
      name: records.name,
      serialNumber: records.serialNumber,
      phoneMasked: records.phoneMasked,
      createdAt: records.createdAt,
    })
    .from(records)
    .where(searchCondition(q))
    .orderBy(desc(records.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return result as PublicRecord[];
}

export async function listAdmin({ page = 1, q = "" }: { page?: number; q?: string } = {}) {
  const offset = (page - 1) * PAGE_SIZE;

  const result = await db
    .select({
      id: records.id,
      name: records.name,
      phone: records.phone,
      phoneMasked: records.phoneMasked,
      serialNumber: records.serialNumber,
      fileName: records.fileName,
      fileKey: records.fileKey,
      fileType: records.fileType,
      fileSize: records.fileSize,
      createdAt: records.createdAt,
    })
    .from(records)
    .where(searchCondition(q))
    .orderBy(desc(records.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return result as AdminRecord[];
}

export async function countRecords(q = "") {
  const [result] = await db
    .select({ total: count() })
    .from(records)
    .where(searchCondition(q));

  return result?.total ?? 0;
}

export async function getById(id: string) {
  const row = await db.select().from(records).where(eq(records.id, id)).limit(1);
  return row[0] ?? null;
}

export async function getUsedBytes() {
  const rows = await db.select({ total: records.fileSize }).from(records);
  return rows.reduce((sum, row) => sum + (row.total ?? 0), 0);
}
