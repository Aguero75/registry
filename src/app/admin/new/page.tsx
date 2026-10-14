import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RegistryHeader } from "@/components/registry-header";
import { requireAdmin } from "@/lib/session";
import { RecordForm } from "@/components/record-form";

async function ProtectedRecordForm() {
  await requireAdmin();
  return <RecordForm mode="create" />;
}

export default function NewRecordPage() {
  return (
    <>
      <RegistryHeader admin />
      <main className="min-h-[calc(100vh-4rem)] flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-9">
          <Link href="/admin" className={buttonVariants({ variant: "ghost", className: "mb-5 -ml-2 text-slate-600 hover:text-slate-900" })}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to records
          </Link>
          <div className="mb-5 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FilePlus2 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Add a record</h1>
              <p className="mt-1 text-sm text-slate-600">Enter the record holder details and attach their document.</p>
            </div>
          </div>
          <Suspense
            fallback={
              <div
                role="status"
                aria-label="Loading record form"
                aria-busy="true"
                className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            }
          >
            <ProtectedRecordForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}
