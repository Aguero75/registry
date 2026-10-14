import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export function Pagination({
  page,
  hasPrevious,
  hasNext,
  basePath,
  query,
  total,
  pageSize = 20,
}: {
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  basePath: string;
  query?: string;
  total: number;
  pageSize?: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(targetPage));
    const suffix = params.toString();
    return `${basePath}${suffix ? `?${suffix}` : ""}`;
  };
  const visiblePages = Array.from(
    new Set([1, page - 1, page, page + 1, totalPages].filter((value) => value >= 1 && value <= totalPages)),
  ).sort((left, right) => left - right);
  const firstRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:px-5">
      <p className="text-center text-sm text-slate-500 sm:text-left">
        Showing <span className="font-semibold tabular-nums text-slate-900">{firstRecord}–{lastRecord}</span>
        {" "}of <span className="font-semibold tabular-nums text-slate-900">{total.toLocaleString()}</span> records
      </p>
      <div className="flex items-center gap-1">
      {hasPrevious ? (
        <Link href={buildHref(page - 1)} aria-label="Previous page" className={buttonVariants({ variant: "outline", className: "h-8 border-slate-200 bg-white px-2.5 text-slate-700" })}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Prev</span>
        </Link>
      ) : (
        <Button variant="outline" aria-label="Previous page" disabled className="h-8 border-slate-200 bg-white px-2.5 text-slate-400">
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
      )}
      <div className="flex items-center gap-1 px-1">
        {visiblePages.map((target, index) => {
          const previous = visiblePages[index - 1];
          return (
            <span key={target} className="flex items-center gap-1">
              {previous !== undefined && target - previous > 1 ? (
                <MoreHorizontal aria-hidden="true" className="size-4 text-slate-400" />
              ) : null}
              {target === page ? (
                <span aria-current="page" className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-indigo-600 px-2 text-sm font-semibold text-white shadow-sm">
                  {target}
                </span>
              ) : (
                <Link href={buildHref(target)} aria-label={`Page ${target}`} className={buttonVariants({ variant: "outline", className: "h-8 min-w-8 border-slate-200 bg-white px-2 text-slate-700" })}>
                  {target}
                </Link>
              )}
            </span>
          );
        })}
      </div>
      {hasNext ? (
        <Link href={buildHref(page + 1)} aria-label="Next page" className={buttonVariants({ variant: "outline", className: "h-8 border-slate-200 bg-white px-2.5 text-slate-700" })}>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <Button variant="outline" aria-label="Next page" disabled className="h-8 border-slate-200 bg-white px-2.5 text-slate-400">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      )}
      </div>
    </nav>
  );
}
