import { getUsedBytes } from "@/db/queries";

export const STORAGE_LIMIT_BYTES = 1_900_000_000;

export async function storageGuard(fileSizeBytes: number) {
  const used = await getUsedBytes();
  const nextTotal = used + fileSizeBytes;

  if (nextTotal > STORAGE_LIMIT_BYTES) {
    return {
      ok: false,
      error: `Storage guard blocked upload: ${nextTotal} bytes exceeds the 1.9GB limit.`,
      used,
      nextTotal,
    };
  }

  return {
    ok: true,
    used,
    nextTotal,
  };
}
