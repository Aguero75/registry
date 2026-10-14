import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const fileTypeByExtension = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export const recordSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(255),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform((value, ctx) => {
      try {
        return normalizePhone(value);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid phone number" });
        return z.NEVER;
      }
    }),
  serialNumber: z
    .string()
    .trim()
    .min(1, "Serial number is required")
    .max(64, "Serial number is too long")
    .refine((value) => /^[A-Za-z0-9-]+$/.test(value), {
      message: "Serial number may only contain letters, numbers, and dashes",
    }),
});

export const uploadedFileSchema = z
  .object({
    fileKey: z.string().trim().min(1).max(512),
    fileUrl: z.string().url(),
    fileName: z.string().trim().min(1).max(255),
    fileSize: z.coerce.number().int().positive().max(1_000_000),
    fileType: z.enum([
      fileTypeByExtension.pdf,
      fileTypeByExtension.docx,
    ]),
  })
  .refine((file) => {
    const extension = file.fileName.toLowerCase().split(".").pop();
    return extension === "pdf" || extension === "docx"
      ? file.fileType === fileTypeByExtension[extension]
      : false;
  }, "Only PDF and DOCX files are allowed.")
  .refine((file) => {
    const url = new URL(file.fileUrl);
    return (
      url.protocol === "https:" &&
      (url.hostname === "utfs.io" ||
        url.hostname === "ufs.sh" ||
        url.hostname.endsWith(".ufs.sh"))
    );
  }, "Document URL must be hosted by UploadThing.");

export type RecordFormValues = z.infer<typeof recordSchema>;
export type UploadedFileValues = z.infer<typeof uploadedFileSchema>;
