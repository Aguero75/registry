import { createUploadthing, type FileRouter } from "uploadthing/next";
import { requireAdmin } from "@/lib/session";
import { storageGuard } from "@/lib/storage";
import { utapi } from "@/lib/utapi";

const f = createUploadthing();

export const uploadRouter = {
  recordDocument: f({
    blob: { maxFileSize: "1MB", maxFileCount: 1 },
  })
    .middleware(async ({ files }) => {
      await requireAdmin();
      const file = files[0];
      const extension = file?.name.toLowerCase().split(".").pop();

      if (files.length !== 1 || !file || !["pdf", "docx"].includes(extension ?? "")) {
        throw new Error("Only PDF and DOCX files are allowed.");
      }

      if (file.size > 1_000_000) {
        throw new Error("The document must be 1MB or smaller.");
      }

      const guard = await storageGuard(file.size);
      if (!guard.ok) {
        throw new Error(guard.error);
      }

      return {};
    })
    .onUploadComplete(async ({ file }) => {
      const guard = await storageGuard(file.size ?? 0);
      if (!guard.ok) {
        const deletion = await utapi.deleteFiles(file.key);
        if (!deletion.success || deletion.deletedCount !== 1) {
          console.error("Failed to clean up file after the storage limit was reached.", {
            fileKey: file.key,
          });
        }
        throw new Error(guard.error);
      }

      const extension = file.name.toLowerCase().split(".").pop();
      const type =
        extension === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      return {
        key: file.key,
        url: file.ufsUrl,
        size: file.size,
        name: file.name,
        type,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
