import { PDFDocument } from "pdf-lib";

export async function compressPdf(file: File): Promise<{ file: File; before: number; after: number }> {
  const before = file.size;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const output = await pdf.save({ useObjectStreams: true });
  const pdfBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
  const compressedBlob = new Blob([pdfBuffer], { type: "application/pdf" });
  const compressed = new File([compressedBlob], file.name, { type: "application/pdf" });

  return {
    file: compressed,
    before,
    after: compressed.size,
  };
}
