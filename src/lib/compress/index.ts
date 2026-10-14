export async function compressDocument(file: File): Promise<{ file: File; before: number; after: number }> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const { compressPdf } = await import("@/lib/compress/pdf");
    return compressPdf(file);
  }

  if (lower.endsWith(".docx")) {
    const { compressDocx } = await import("@/lib/compress/docx");
    return compressDocx(file);
  }

  return { file, before: file.size, after: file.size };
}
