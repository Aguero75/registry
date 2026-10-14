import Link from "next/link";
import {
  CalendarDays,
  FileText,
  LockKeyhole,
  PencilLine,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DeleteRecordButton } from "@/components/delete-dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RecordRow = {
  id: string;
  name: string;
  phone?: string;
  phoneMasked?: string;
  serialNumber: string;
  fileName?: string;
  fileType?: string;
  createdAt?: Date | null;
};

function RecordStatus() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      Verified
    </span>
  );
}

function RecordDate({ value }: { value?: Date | null }) {
  if (!value) return <>—</>;

  return (
    <time dateTime={new Date(value).toISOString()}>
      {new Date(value).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
    </time>
  );
}

export function RecordsTable({
  rows,
  admin = false,
}: {
  rows: RecordRow[];
  admin?: boolean;
}) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableCaption className="sr-only">Registry records</TableCaption>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-100/75 hover:bg-slate-100/75">
              <TableHead scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Serial no.</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Record holder name</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {admin ? "Phone number" : "Protected phone"}
              </TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date added</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
              {admin ? (
                <TableHead scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Manage</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-slate-100 hover:bg-slate-50/90">
                <TableCell className="px-4 py-3.5 font-mono text-[13px] font-medium tabular-nums text-slate-700">{row.serialNumber}</TableCell>
                <TableCell className="px-4 py-3.5 font-semibold text-slate-900">{row.name}</TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50 px-2 py-1 font-mono text-xs tabular-nums text-slate-600">
                    <LockKeyhole aria-hidden="true" className="size-3.5 text-slate-400" />
                    {admin ? row.phone : row.phoneMasked}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm tabular-nums text-slate-500">
                  <RecordDate value={row.createdAt} />
                </TableCell>
                <TableCell className="px-4 py-3.5"><RecordStatus /></TableCell>
                {admin ? (
                  <TableCell className="px-4 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/api/documents/${row.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 text-slate-600 hover:text-indigo-700" })}>
                        <FileText aria-hidden="true" className="size-4" />
                        Document
                      </Link>
                      <Link href={`/admin/${row.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-8 border-slate-200 bg-white" })}>
                        <PencilLine aria-hidden="true" className="size-3.5" />
                        Edit
                      </Link>
                      <DeleteRecordButton recordId={row.id} />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={admin ? 6 : 5} className="h-36 px-4 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-500">
                    <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <CalendarDays aria-hidden="true" className="size-5" />
                    </span>
                    <span className="font-medium text-slate-800">No matching records</span>
                    <span className="text-sm">Try another name or serial number.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words font-semibold leading-5 text-slate-900">{row.name}</h2>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-indigo-700">{row.serialNumber}</p>
              </div>
              <RecordStatus />
            </div>
            <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-slate-500">{admin ? "Phone" : "Protected phone"}</dt>
                <dd className="flex min-w-0 items-center gap-1.5 text-right font-mono text-xs tabular-nums text-slate-700">
                  {!admin ? <LockKeyhole aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" /> : null}
                  <span className="break-all">{admin ? row.phone : row.phoneMasked}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Date added</dt>
                <dd className="tabular-nums text-slate-600"><RecordDate value={row.createdAt} /></dd>
              </div>
              {admin ? (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link href={`/api/documents/${row.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "border-slate-200" })}>
                    <FileText aria-hidden="true" className="size-4" />
                    Document
                  </Link>
                  <Link href={`/admin/${row.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm", className: "border-slate-200" })}>
                    <PencilLine aria-hidden="true" className="size-4" />
                    Edit
                  </Link>
                  <DeleteRecordButton recordId={row.id} />
                </div>
              ) : null}
            </dl>
          </article>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
            <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <CalendarDays aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-3 font-semibold text-slate-900">No matching records</h2>
            <p className="mt-1 text-sm text-slate-500">Try another name or serial number.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
