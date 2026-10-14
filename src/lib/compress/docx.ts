import JSZip from "jszip";

const MAX_DIMENSION = 1600;

async function decodeImage(blob: Blob): Promise<HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }

    ctx.drawImage(bitmap, 0, 0);
    const dataUrl = canvas.toDataURL(blob.type || "image/png");
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    return image;
  }

  if (typeof window !== "undefined" && typeof window.Image !== "undefined") {
    const url = URL.createObjectURL(blob);
    const image = new window.Image();
    image.src = url;
    await image.decode();
    URL.revokeObjectURL(url);
    return image;
  }

  throw new Error("Browser image APIs are unavailable");
}

export async function compressDocx(file: File): Promise<{ file: File; before: number; after: number }> {
  const before = file.size;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const mediaFolder = zip.folder("word/media");

  if (!mediaFolder) {
    return { file, before, after: before };
  }

  const imageEntries = mediaFolder.file(/\.(png|jpe?g|gif|bmp|webp)$/i);

  for (const entry of imageEntries) {
    const blob = await entry.async("blob");
    const image = await decodeImage(blob);
    const ratio = Math.min(MAX_DIMENSION / image.naturalWidth, MAX_DIMENSION / image.naturalHeight, 1);
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }

    ctx.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL(blob.type || "image/png");
    const base64 = dataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

    mediaFolder.file(entry.name, bytes, { binary: true });
  }

  const output = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
  const compressed = new File([output], file.name, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

  return {
    file: compressed,
    before,
    after: compressed.size,
  };
}
