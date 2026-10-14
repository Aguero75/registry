"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkSerial, createRecord, updateRecord } from "@/actions/records";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/file-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordSchema, type RecordFormValues } from "@/lib/validations";
import { compressDocument } from "@/lib/compress";
import { useUploadThing } from "@/lib/uploadthing-client";

const MAX_DOCUMENT_BYTES = 1_000_000;

function formatBytes(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

export function RecordForm({
  mode = "create",
  recordId,
  defaultValues,
}: {
  mode?: "create" | "edit";
  recordId?: string;
  defaultValues?: Partial<RecordFormValues>;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [compressedFile, setCompressedFile] = React.useState<File | null>(null);
  const [compressionSummary, setCompressionSummary] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const { startUpload, isUploading } = useUploadThing("recordDocument", {
    onUploadProgress: setUploadProgress,
  });
  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      serialNumber: defaultValues?.serialNumber ?? "",
    },
  });

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.currentTarget.files?.[0] ?? null;
    setCompressedFile(null);
    setCompressionSummary(null);
    setFileError(null);

    if (!file) return;

    setIsCompressing(true);
    try {
      const result = await compressDocument(file);
      setCompressedFile(result.file);
      setCompressionSummary(`${formatBytes(result.before)} → ${formatBytes(result.after)}`);
      if (result.after > MAX_DOCUMENT_BYTES) {
        setFileError("The document is still over 1MB after compression. Please choose a smaller file.");
      }
    } catch (error) {
      setFileError(
        error instanceof Error
          ? `Could not compress this document: ${error.message}`
          : "Could not compress this document.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const submit = async (values: RecordFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (mode === "create" && !compressedFile) {
        setFileError("Select a PDF or DOCX document.");
        return;
      }
      if (compressedFile && compressedFile.size > MAX_DOCUMENT_BYTES) {
        setFileError("The document must be 1MB or smaller after compression.");
        return;
      }

      const serialResult = await checkSerial(values.serialNumber, recordId);
      if (!serialResult.ok || !serialResult.available) {
        setSubmitError(
          serialResult.ok
            ? "A record with that serial number already exists."
            : serialResult.error ?? "Could not check the serial number.",
        );
        return;
      }

      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("phone", values.phone);
      formData.set("serialNumber", values.serialNumber);
      if (recordId) {
        formData.set("recordId", recordId);
      }

      if (compressedFile) {
        setUploadProgress(0);
        const uploadedFiles = await startUpload([compressedFile]);
        const uploadedFile = uploadedFiles?.[0]?.serverData;
        if (!uploadedFile) {
          setSubmitError("The document upload did not complete. Please try again.");
          return;
        }

        formData.set("fileKey", uploadedFile.key);
        formData.set("fileUrl", uploadedFile.url);
        formData.set("fileName", uploadedFile.name);
        formData.set("fileSize", String(uploadedFile.size));
        formData.set("fileType", uploadedFile.type);
      }

      const result = mode === "create" ? await createRecord(formData) : await updateRecord(formData);
      if (!result.ok) {
        setSubmitError(result.error ?? "Unable to save the record. Please try again.");
        return;
      }
      router.push("/admin");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save the record. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const isBusy = isSubmitting || isCompressing || isUploading;

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-slate-700">Record holder name</Label>
        <Input
          id="name"
          className="h-10 border-slate-200 bg-white px-3 text-sm focus-visible:ring-indigo-600/20"
          aria-invalid={Boolean(form.formState.errors.name)}
          aria-describedby={form.formState.errors.name ? "name-error" : undefined}
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p id="name-error" role="alert" className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone number</Label>
        <Input
          id="phone"
          placeholder="08031234567"
          className="h-10 border-slate-200 bg-white px-3 text-sm focus-visible:ring-indigo-600/20"
          aria-invalid={Boolean(form.formState.errors.phone)}
          aria-describedby={form.formState.errors.phone ? "phone-error" : undefined}
          {...form.register("phone")}
        />
        {form.formState.errors.phone && (
          <p id="phone-error" role="alert" className="text-sm text-destructive">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="serialNumber" className="text-sm font-medium text-slate-700">Serial number</Label>
        <Input
          id="serialNumber"
          className="h-10 border-slate-200 bg-white px-3 text-sm focus-visible:ring-indigo-600/20"
          aria-invalid={Boolean(form.formState.errors.serialNumber)}
          aria-describedby={form.formState.errors.serialNumber ? "serialNumber-error" : undefined}
          {...form.register("serialNumber")}
        />
        {form.formState.errors.serialNumber && (
          <p id="serialNumber-error" role="alert" className="text-sm text-destructive">
            {form.formState.errors.serialNumber.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <FileInput onChange={handleFileChange} disabled={isBusy} error={fileError} />
        {compressionSummary ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {compressionSummary}
          </p>
        ) : null}
        {isCompressing ? (
          <p className="text-sm text-slate-500" role="status">Compressing document…</p>
        ) : null}
        {isUploading && uploadProgress !== null ? (
          <p className="text-sm text-slate-500" role="status" aria-live="polite">
            Uploading document: {uploadProgress}%
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" className="h-10 border-slate-200 bg-white px-4" onClick={() => router.push("/admin")} disabled={isBusy}>
          Cancel
        </Button>
        <Button type="submit" className="h-10 bg-indigo-600 px-4 text-white hover:bg-indigo-700" disabled={isBusy}>
          {isCompressing
            ? "Compressing..."
            : isUploading
              ? "Uploading..."
              : isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create record"
                  : "Save changes"}
        </Button>
      </div>
      {submitError ? (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
