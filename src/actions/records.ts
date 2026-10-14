"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { records } from "@/db/schema";
import { normalizePhone, maskPhone } from "@/lib/phone";
import { recordSchema, uploadedFileSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/session";
import { utapi } from "@/lib/utapi";

export async function checkSerial(serialNumber: string, recordId?: string) {
  await requireAdmin();
  const trimmed = serialNumber.trim();
  if (!trimmed) {
    return { ok: false, error: "Serial number is required." };
  }

  const exists = await db
    .select({ id: records.id })
    .from(records)
    .where(eq(records.serialNumber, trimmed))
    .limit(1);
  return { ok: true, available: exists.length === 0 || exists[0]?.id === recordId };
}

function parseRecordInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const serialNumber = String(formData.get("serialNumber") ?? "").trim();
  const fileKey = String(formData.get("fileKey") ?? "").trim();
  const fileUrl = String(formData.get("fileUrl") ?? "").trim();
  const fileName = String(formData.get("fileName") ?? "").trim();
  const fileSize = Number(formData.get("fileSize") ?? 0);
  const fileType = String(formData.get("fileType") ?? "").trim();

  return { name, phone, serialNumber, fileKey, fileUrl, fileName, fileSize, fileType };
}

function parseUploadedFile(data: ReturnType<typeof parseRecordInput>) {
  if (!data.fileKey && !data.fileUrl && !data.fileName && !data.fileType && data.fileSize === 0) {
    return { ok: true as const, file: null };
  }

  const parsed = uploadedFileSchema.safeParse({
    fileKey: data.fileKey,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileSize: data.fileSize,
    fileType: data.fileType,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid document upload.",
    };
  }

  return { ok: true as const, file: parsed.data };
}

async function cleanupUploadedFile(fileKey: string): Promise<boolean> {
  try {
    const result = await utapi.deleteFiles(fileKey);
    if (result.success && result.deletedCount === 1) {
      return true;
    }

    console.error("UploadThing did not delete an orphaned record document.", {
      fileKey,
      deletedCount: result.deletedCount,
    });
    return false;
  } catch (error) {
    console.error("Failed to delete an orphaned record document.", { fileKey, error });
    return false;
  }
}

export async function createRecord(formData: FormData) {
  await requireAdmin();
  const data = parseRecordInput(formData);
  const uploaded = parseUploadedFile(data);
  if (!uploaded.ok) {
    return { ok: false, error: uploaded.error };
  }
  if (!uploaded.file) {
    return { ok: false, error: "Select a PDF or DOCX document before creating the record." };
  }

  const parsed = recordSchema.safeParse({
    name: data.name,
    phone: data.phone,
    serialNumber: data.serialNumber,
  });
  if (!parsed.success) {
    const cleanedUp = await cleanupUploadedFile(uploaded.file.fileKey);
    return {
      ok: false,
      error: cleanedUp
        ? parsed.error.issues[0]?.message ?? "Invalid record data."
        : `${parsed.error.issues[0]?.message ?? "Invalid record data."} The uploaded document needs manual cleanup.`,
    };
  }

  const normalized = parsed.data;
  let inserted: typeof records.$inferSelect;
  try {
    const existing = await db
      .select({ id: records.id })
      .from(records)
      .where(eq(records.serialNumber, normalized.serialNumber))
      .limit(1);
    if (existing.length > 0) {
      const cleanedUp = await cleanupUploadedFile(uploaded.file.fileKey);
      return {
        ok: false,
        error: cleanedUp
          ? "A record with that serial number already exists."
          : "A record with that serial number already exists, and the uploaded document needs manual cleanup.",
      };
    }

    const normalizedPhone = normalizePhone(normalized.phone);
    const [row] = await db
      .insert(records)
      .values({
        name: normalized.name,
        phone: normalizedPhone,
        phoneMasked: maskPhone(normalizedPhone),
        serialNumber: normalized.serialNumber,
        fileKey: uploaded.file.fileKey,
        fileUrl: uploaded.file.fileUrl,
        fileName: uploaded.file.fileName,
        fileSize: uploaded.file.fileSize,
        fileType: uploaded.file.fileType,
      })
      .returning();
    if (!row) {
      throw new Error("Record insert did not return a row.");
    }
    inserted = row;
  } catch (error) {
    const cleanedUp = await cleanupUploadedFile(uploaded.file.fileKey);
    const message = error instanceof Error ? error.message : "Failed to save record.";
    return {
      ok: false,
      error: cleanedUp ? message : `${message} The uploaded document needs manual cleanup.`,
    };
  }

  revalidateTag("records", "max");
  revalidatePath("/", "page");
  revalidatePath("/admin", "page");
  return { ok: true, data: inserted };
}

export async function updateRecord(formData: FormData) {
  await requireAdmin();
  const recordId = String(formData.get("recordId") ?? "");
  if (!recordId) {
    return { ok: false, error: "Record ID is required." };
  }

  const data = parseRecordInput(formData);
  const uploaded = parseUploadedFile(data);
  if (!uploaded.ok) {
    return { ok: false, error: uploaded.error };
  }

  const parsed = recordSchema.safeParse({
    name: data.name,
    phone: data.phone,
    serialNumber: data.serialNumber,
  });
  if (!parsed.success) {
    const cleanedUp = uploaded.file
      ? await cleanupUploadedFile(uploaded.file.fileKey)
      : true;
    const message = parsed.error.issues[0]?.message ?? "Invalid record data.";
    return {
      ok: false,
      error: cleanedUp ? message : `${message} The uploaded document needs manual cleanup.`,
    };
  }

  const normalized = parsed.data;
  let updated: typeof records.$inferSelect;
  let previousFileKey: string | null = null;
  try {
    const current = await db.select().from(records).where(eq(records.id, recordId)).limit(1);
    if (!current[0]) {
      const cleanedUp = uploaded.file
        ? await cleanupUploadedFile(uploaded.file.fileKey)
        : true;
      return {
        ok: false,
        error: cleanedUp
          ? "Record not found."
          : "Record not found. The uploaded document needs manual cleanup.",
      };
    }

    const duplicate = await db
      .select({ id: records.id })
      .from(records)
      .where(eq(records.serialNumber, normalized.serialNumber))
      .limit(1);
    if (duplicate.length > 0 && duplicate[0]?.id !== recordId) {
      const cleanedUp = uploaded.file
        ? await cleanupUploadedFile(uploaded.file.fileKey)
        : true;
      return {
        ok: false,
        error: cleanedUp
          ? "A record with that serial number already exists."
          : "A record with that serial number already exists, and the uploaded document needs manual cleanup.",
      };
    }

    const normalizedPhone = normalizePhone(normalized.phone);
    const [row] = await db
      .update(records)
      .set({
        name: normalized.name,
        phone: normalizedPhone,
        phoneMasked: maskPhone(normalizedPhone),
        serialNumber: normalized.serialNumber,
        fileKey: uploaded.file?.fileKey ?? current[0].fileKey,
        fileUrl: uploaded.file?.fileUrl ?? current[0].fileUrl,
        fileName: uploaded.file?.fileName ?? current[0].fileName,
        fileSize: uploaded.file?.fileSize ?? current[0].fileSize,
        fileType: uploaded.file?.fileType ?? current[0].fileType,
      })
      .where(eq(records.id, recordId))
      .returning();
    if (!row) {
      throw new Error("Record update did not return a row.");
    }
    updated = row;
    previousFileKey = current[0].fileKey;
  } catch (error) {
    if (uploaded.file) {
      const cleanedUp = await cleanupUploadedFile(uploaded.file.fileKey);
      const message = error instanceof Error ? error.message : "Failed to update record.";
      return {
        ok: false,
        error: cleanedUp ? message : `${message} The uploaded document needs manual cleanup.`,
      };
    }
    const message = error instanceof Error ? error.message : "Failed to update record.";
    return { ok: false, error: message };
  }

  if (
    uploaded.file &&
    previousFileKey &&
    previousFileKey !== "pending" &&
    uploaded.file.fileKey !== previousFileKey
  ) {
    const deleted = await cleanupUploadedFile(previousFileKey);
    if (!deleted) {
      console.error("Updated record saved, but its previous document remains in UploadThing.", {
        recordId,
        fileKey: previousFileKey,
      });
    }
  }

  revalidateTag("records", "max");
  revalidatePath("/", "page");
  revalidatePath("/admin", "page");
  return { ok: true, data: updated };
}

export async function deleteRecord(recordId: string) {
  await requireAdmin();
  const row = await db.select().from(records).where(eq(records.id, recordId)).limit(1);
  if (!row[0]) {
    return { ok: false, error: "Record not found." };
  }

  try {
    await db.delete(records).where(eq(records.id, recordId));
    if (row[0].fileKey && row[0].fileKey !== "pending") {
      await cleanupUploadedFile(row[0].fileKey);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete record.";
    return { ok: false, error: message };
  }

  revalidateTag("records", "max");
  revalidatePath("/", "page");
  revalidatePath("/admin", "page");
  redirect("/admin");
}
