import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpDown, Plus, Search, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { RecordsTable } from "@/components/records-table";
import { RegistryHeader } from "@/components/registry-header";
import { SearchInput } from "@/components/search-input";
import { StorageMeter } from "@/components/storage-meter";
import { countRecords, listAdmin, PAGE_SIZE } from "@/db/queries";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  await connection();
  const params = await searchParams;
  const q = params.q ?? "";
  const requestedPage = Math.max(1, Number(params.page ?? "1") || 1);
  const [total, activeRecords] = await Promise.all([
    countRecords(q),
    q ? countRecords() : Promise.resolve(0),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const rows = await listAdmin({ q, page });

  return (
    <>
      <RegistryHeader admin />
      <main className="min-h-[calc(100vh-4rem)] flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <section className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Secure workspace
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[32px]">
                Registry management
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:text-[15px]">
                Review records, manage documents, and keep directory details up to date.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Link href="/admin/new" className={buttonVariants({ className: "h-10 flex-1 gap-2 bg-indigo-600 px-4 text-white hover:bg-indigo-700 sm:flex-none" })}>
                <Plus aria-hidden="true" className="size-4" />
                Add record
              </Link>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" className="h-10 border-slate-200 bg-white px-4 text-slate-700">
                  Sign out
                </Button>
              </form>
            </div>
          </section>

          <section className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(240px,0.75fr)]">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs text-slate-500">Active records</p>
                <p className="text-xl font-semibold leading-6 tabular-nums text-slate-900">{(q ? activeRecords : total).toLocaleString()}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                <span className="size-1 rounded-full bg-emerald-600" />
                Live
              </span>
            </div>
            <StorageMeter />
          </section>

          <form
            action="/admin"
            method="get"
            role="search"
            aria-label="Search admin records"
            className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <SearchInput name="q" defaultValue={q} />
              </div>
              <input type="hidden" name="page" value="1" />
              <div className="flex items-center justify-between gap-2 sm:justify-start">
                <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700">
                  All records
                </span>
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
                  <ArrowUpDown aria-hidden="true" className="size-4" />
                  <span>Newest first</span>
                </span>
                <Button type="submit" className="h-10 gap-2 bg-indigo-600 px-4 text-white hover:bg-indigo-700">
                  <Search aria-hidden="true" className="size-4" />
                  <span>Search</span>
                </Button>
              </div>
            </div>
            {q ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
                <p>Showing results for <span className="font-semibold text-slate-800">“{q}”</span></p>
                <Link href="/admin" className="font-medium text-indigo-600 hover:text-indigo-700">Clear search</Link>
              </div>
            ) : null}
          </form>

          <section aria-label="Manage registry records" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <RecordsTable
              rows={rows.map((row) => ({
                id: row.id,
                name: row.name,
                phone: row.phone,
                phoneMasked: row.phoneMasked,
                serialNumber: row.serialNumber,
                fileName: row.fileName,
                fileType: row.fileType,
                createdAt: row.createdAt,
              }))}
              admin
            />
            <Pagination
              page={page}
              hasPrevious={page > 1}
              hasNext={page < totalPages}
              basePath="/admin"
              query={q}
              total={total}
              pageSize={PAGE_SIZE}
            />
          </section>
        </div>
      </main>
    </>
  );
}
