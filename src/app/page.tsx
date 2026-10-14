import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpDown, BadgeCheck, Search, ShieldCheck } from "lucide-react";
import { countRecords, listPublic, PAGE_SIZE } from "@/db/queries";
import { Button } from "@/components/ui/button";
import { RecordsTable } from "@/components/records-table";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { RegistryHeader } from "@/components/registry-header";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const requestedPage = Math.max(1, Number(params.page ?? "1") || 1);
  await connection();
  const [total, activeRecords] = await Promise.all([
    countRecords(q),
    q ? countRecords() : Promise.resolve(0),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const rows = await listPublic({ q, page });

  return (
    <>
      <RegistryHeader />
      <main className="min-h-[calc(100vh-4rem)] flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <section className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-600" />
                  tricycle drivers registry database
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span>Privacy-protected public view</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[32px]">
                Registry Records
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                Public verification directory for registered record holders.
                Contact details are masked for data protection.
              </p>
            </div>

            <div className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:w-auto sm:p-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 pr-1">
                <p className="text-xs text-slate-500">Active records</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold leading-6 tabular-nums text-slate-900">
                    {(q ? activeRecords : total).toLocaleString()}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    <span className="size-1 rounded-full bg-emerald-600" />
                    Live
                  </span>
                </div>
              </div>
            </div>
          </section>

          <form
            action="/"
            method="get"
            role="search"
            aria-label="Search public records"
            className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <SearchInput name="q" defaultValue={q} />
              </div>
              <input type="hidden" name="page" value="1" />
              <div className="flex items-center justify-between gap-2 sm:justify-start">
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700">
                  All records
                </span>
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
                  <ArrowUpDown aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">Newest first</span>
                  <span className="sm:hidden">Newest</span>
                </span>
                <Button
                  type="submit"
                  className="h-10 gap-2 bg-indigo-600 px-4 text-white hover:bg-indigo-700"
                >
                  <Search aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="sr-only sm:hidden">Search</span>
                </Button>
              </div>
            </div>
            {q ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
                <p>
                  Showing results for{" "}
                  <span className="font-semibold text-slate-800">“{q}”</span>
                </p>
                <Link
                  href="/"
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear search
                </Link>
              </div>
            ) : null}
          </form>

          <section
            aria-label="Registry records"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <RecordsTable rows={rows} />
            <Pagination
              page={page}
              hasPrevious={page > 1}
              hasNext={page < totalPages}
              basePath="/"
              query={q}
              total={total}
              pageSize={PAGE_SIZE}
            />
          </section>

          <aside className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-start gap-3.5">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                <BadgeCheck aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                  Data governance &amp; privacy safeguards
                  <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Protected view
                  </span>
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                  Phone numbers are masked in this directory. Document access
                  and full record details are restricted to authorized
                  administrators.
                </p>
              </div>
            </div>
            <Link
              href="/admin/login"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              Admin sign in
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
