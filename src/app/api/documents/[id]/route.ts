import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { records } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const row = await db.select().from(records).where(eq(records.id, id)).limit(1);
  const record = row[0];

  if (!record) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  let response: Response;
  try {
    response = await fetch(record.fileUrl);
  } catch {
    return NextResponse.json({ error: "Document storage could not be reached" }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "Document unavailable" }, { status: 502 });
  }

  const contentType = record.fileType || "application/octet-stream";
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Robots-Tag", "noindex");

  if (record.fileType === "application/pdf") {
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `inline; filename="${record.fileName}"`);
  } else {
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${record.fileName}"`);
  }

  return new NextResponse(response.body, { status: 200, headers });
}
