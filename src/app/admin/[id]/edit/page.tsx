import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RegistryHeader } from "@/components/registry-header";
import { requireAdmin } from "@/lib/session";
import { getById } from "@/db/queries";
import { RecordForm } from "@/components/record-form";

export default async function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const record = await getById(id);

  if (!record) {
    notFound();
  }

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
              <FilePenLine aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Edit record</h1>
              <p className="mt-1 text-sm text-slate-600">Update the record details or replace its document.</p>
            </div>
          </div>
          <RecordForm
            mode="edit"
            recordId={record.id}
            defaultValues={{
              name: record.name,
              phone: record.phone,
              serialNumber: record.serialNumber,
            }}
          />
        </div>
      </main>
    </>
  );
}
