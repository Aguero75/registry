import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";

export function RegistryHeader({ admin = false }: { admin?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={admin ? "/admin" : "/"} className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <span className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            Records Directory
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:inline-flex">
            <span className={`size-1.5 rounded-full ${admin ? "bg-indigo-500" : "bg-emerald-500"}`} />
            {admin ? "Administration" : "Public · Read only"}
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-2">
          {admin ? (
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Public directory</span>
              <span className="sm:hidden">Directory</span>
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              Admin sign in
              <ArrowUpRight aria-hidden="true" className="size-4 text-slate-400" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
