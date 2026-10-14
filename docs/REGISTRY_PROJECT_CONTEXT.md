# Project Context

Single source of truth for **what this project is, what was decided, and the rules to follow while building it.** Read this first, then the documents listed in section 10.

## 1. What this is

A small records system for about **1,500 individuals**. Each record has a name, phone number, serial number, and one PDF or DOCX document.

- **Public landing page:** read-only list with search and pagination. Phones are masked. No document access.
- **Admin area:** add, edit, and delete records. Protected by a single username and password stored in `.env`. No auth provider.

## 2. Users

| User | Can do |
|---|---|
| Visitor (public) | Browse and search the list (name, serial, masked phone, date). Nothing else |
| Admin (one person) | Everything: see full phones, view or download documents, add, edit, delete |

## 3. Locked decisions

| Topic | Decision |
|---|---|
| Framework | Next.js (App Router) + TypeScript, Server Components and Server Actions |
| Database | Neon Postgres + Drizzle ORM |
| File storage | UploadThing **free tier** (2GB, public URLs hidden behind a server proxy) |
| Auth | `.env` username and password, `jose` JWT in an httpOnly cookie, credential fingerprint |
| Rate limiting | Upstash Redis (login only in the MVP) |
| Validation | Zod, `libphonenumber-js` for phones |
| UI | Tailwind + shadcn/ui + sonner |
| Hosting | Vercel |
| File types | One PDF or DOCX per record |
| File cap | **1MB hard cap**, target average about 700KB |
| Compression | Client-side before upload (`pdf-lib` and DOCX image downscale in the MVP; Ghostscript-WASM in Phase 2) |
| Phone default country | **NG** |
| Document access | **Admin-only** by default |
| Public phone display | Masked, server-side |

## 4. Hard constraints

1. **Storage budget:** 2GB shared across all UploadThing apps. Application budget is 1.9GB. At 700KB average, 1,500 files use about 1.05GB.
2. **Free-tier privacy limit:** UploadThing URLs are technically public. They must **never** appear in public HTML, API responses, or client code. All file access goes through `/api/documents/[id]`.
3. **Sensitive data:** the full phone number and file URL never leave the server for public requests.
4. **Server Actions body limit is small and Vercel functions cap request bodies at 4.5MB.** Files upload directly to UploadThing from the browser, never through our server.
5. **Vercel Hobby** is for non-commercial use.
6. **No Ghostscript on Vercel.** PDF image compression can only happen in the browser (WASM) in Phase 2.

## 5. Security rules (non-negotiable)

- `requireAdmin()` runs in **every** Server Action, admin page, UploadThing middleware, and the document route. `proxy.ts` is only a redirect convenience.
- Credentials are compared as SHA-256 digests with `timingSafeEqual` (avoids the length-mismatch throw).
- The JWT carries `HMAC(SESSION_SECRET, username + password)`. Changing `.env` logs everyone out.
- All input is re-validated with Zod on the server, regardless of client validation.
- File type and size are enforced on the UploadThing route, not only in the UI.
- Public queries select only the columns they need. Never `select *` for public pages.
- Public pages and the document route send `noindex`.
- Secrets are never prefixed `NEXT_PUBLIC_`.

## 6. Data rules

- Phone is stored as **E.164 text** (e.g. `+2348031234567`). `phoneMasked` is computed once on write.
- `serialNumber` is unique. Check before upload, and handle the race on insert.
- Deleting: remove the DB row first, then the file. Never leave a row pointing at a missing file.
- Replacing a file: upload new, update the DB, delete the old key. If the DB step fails, delete the new key.
- Public search covers **name and serial only**, never phone.

## 7. Conventions

- TypeScript strict mode, no `any`.
- Mutations are Server Actions in `src/actions/`. Return `{ ok: true, data }` or `{ ok: false, error }`, never throw to the client for expected errors.
- One Zod schema per form, shared by client and server (`src/lib/validations.ts`).
- Env access goes through `src/lib/env.ts` only (validated at startup).
- Cache reads with tags (`records`, `records:list`) and call `revalidateTag` after every mutation.
- Components: server by default, `"use client"` only for forms, dialogs, and interactive inputs.
- Check current Next.js, UploadThing, and Drizzle docs when scaffolding. Some APIs changed between recent major versions (for example `middleware.ts` became `proxy.ts`).

## 8. Out of scope for the MVP

Ghostscript-WASM compression, cleanup cron, public-documents toggle, document-route rate limiting, `pg_trgm`, bulk import or export, audit log. See `MVP.md` section 4.

## 9. Glossary

| Term | Meaning |
|---|---|
| Masked phone | Display form like `+234803••••567`, safe for the public list |
| Proxy route | `/api/documents/[id]`, the only way a document is fetched |
| Credential fingerprint | HMAC of username and password stored in the JWT to invalidate sessions on `.env` change |
| Orphan file | A file in UploadThing with no matching DB row |
| Storage guard | Server check that blocks uploads once total size would exceed 1.9GB |

## 10. Document index

| File | Purpose |
|---|---|
| `planning.md` | Full original plan and reasoning |
| `MVP.md` | Scope for today, acceptance checklist |
| `PROJECT_CONTEXT.md` | This file: decisions, constraints, rules |
| `ARCHITECTURE.md` | Structure, data flows, module responsibilities |
| `BUILD_PHASES.md` | Step-by-step build order with exit criteria |
| `DESIGN.md` | UI and UX specification |
