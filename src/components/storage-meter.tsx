import { getUsedBytes } from "@/db/queries";
import { HardDrive } from "lucide-react";

export async function StorageMeter() {
  const usedBytes = await getUsedBytes();
  const limitBytes = 1_900_000_000;
  const percent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const usedLabel =
    usedBytes >= 1_000_000_000
      ? `${(usedBytes / 1_000_000_000).toFixed(2)} GB`
      : `${(usedBytes / 1_000_000).toFixed(1)} MB`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <HardDrive aria-hidden="true" className="size-4 text-slate-500" />
          Storage
        </div>
        <span className="text-xs font-medium tabular-nums text-slate-500">{percent}% of 1.9 GB</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Storage used"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
        <span>{usedLabel} used</span>
        <span>{usedBytes.toLocaleString()} bytes</span>
      </div>
    </div>
  );
}
