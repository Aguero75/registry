# Architecture

## 1. System overview

```
                 ┌──────────────────────────────────────────┐
                 │                 Browser                  │
                 │  Public list  |  Admin UI  |  Compressor │
                 └───────┬──────────────┬──────────┬────────┘
                         │              │          │ direct upload
                         │ RSC / SA     │ SA       │ (compressed file)
                         ▼              ▼          ▼
              ┌───────────────────────────────┐  ┌──────────────┐
              │      Next.js on Vercel        │  │ UploadThing  │
              │  Pages (RSC)  Server Actions  │◄─┤ (file store) │
              │  /api/uploadthing             │  └──────▲───────┘
              │  /api/documents/[id]  ────────┼─────────┘ server-side fetch
              └──────┬──────────────┬─────────┘
                     │              │
                     ▼              ▼
              ┌────────────┐  ┌──────────────┐
              │ Neon (PG)  │  │ Upstash Redis│
              │ records    │  │ rate limits  │
              └────────────┘  └──────────────┘
```

Key idea: **files go browser to UploadThing directly; metadata goes browser to Server Action to Postgres; documents are only ever read back through our proxy.**

## 2. Layers

| Layer | Location | Responsibility |
|---|---|---|
| Pages (RSC) | `src/app/**/page.tsx` | Read data, render. No mutations |
| Server Actions | `src/actions/` | All writes. Each starts with `requireAdmin()` (except login) |
| Route handlers | `src/app/api/` | UploadThing, document proxy |
| Domain libs | `src/lib/` | Session, env, phone, validations, cache, rate limit, compression |
| Data access | `src/db/` | Drizzle schema, client, query functions |
| UI components | `src/components/` | Presentational and form components |
| Gate | `src/proxy.ts` | Redirect `/admin/*` when no valid JWT (convenience only) |

## 3. Directory layout

```
src/
  app/
    layout.tsx
    page.tsx                         public list
    loading.tsx
    error.tsx
    admin/
      login/page.tsx
      (protected)/
        layout.tsx                   calls requireAdmin()
        page.tsx                     table + storage meter
        new/page.tsx
        [id]/edit/page.tsx
    api/
      uploadthing/core.ts            file router + middleware
      uploadthing/route.ts
      documents/[id]/route.ts        proxy
  actions/
    auth.ts                          login, logout
    records.ts                       checkSerial, create, update, delete
  db/
    schema.ts
    index.ts
    queries.ts                       cached reads
  lib/
    env.ts
    session.ts                       sign, verify, fingerprint, requireAdmin
    phone.ts                         normalize, mask
    validations.ts                   Zod schemas
    ratelimit.ts
    cache.ts                         tags
    storage.ts                       usage sum, guard
    utapi.ts                         UTApi instance
    compress/{index,pdf,docx}.ts
  components/
    records-table.tsx
    record-form.tsx
    file-input.tsx
    search-input.tsx
    pagination.tsx
    delete-dialog.tsx
    storage-meter.tsx
  proxy.ts
```

## 4. Data model

```
records
  id            uuid  PK  default gen_random_uuid()
  name          text  NOT NULL
  phone         text  NOT NULL          E.164
  phone_masked  text  NOT NULL
  serial_number text  NOT NULL UNIQUE
  file_key      text  NOT NULL
  file_url      text  NOT NULL          never leaves the server
  file_name     text  NOT NULL
  file_size     int   NOT NULL          bytes
  file_type     text  NOT NULL          pdf | docx MIME
  created_at    timestamptz default now()
  updated_at    timestamptz default now()

indexes: UNIQUE(serial_number), (created_at DESC)
```

Public queries return a **narrow DTO**: `{ id, name, serialNumber, phoneMasked, createdAt }`. Admin queries return the full phone and file metadata but never expose `file_url` to the client.

## 5. Authentication

```
Login form ──► loginAction
                 1. rate limit (Upstash, per IP)
                 2. sha256(input) vs sha256(env) with timingSafeEqual
                 3. fp = HMAC(SESSION_SECRET, username + password)
                 4. jwt = sign({ fp }, exp 7d)
                 5. set httpOnly secure sameSite=lax cookie
```

```
requireAdmin():
  read cookie ─► verify JWT signature + expiry
              ─► recompute fp from current env ─► compare with token fp
              ─► throw / redirect if any step fails
```

If `.env` credentials change and the app is redeployed, every existing token fails the fingerprint check.

## 6. Add-record flow

```
Admin picks file
  │
  ▼
[client] Zod validate fields (phone parsed, NG default)
  │
  ▼
[SA] checkSerial(serial)            ◄── requireAdmin, fast fail on duplicate
  │
  ▼
[client] compress(file)             pdf-lib (PDF) / JSZip image downscale (DOCX)
  │        size > 1MB? ──► block with message, stop
  ▼
[UT middleware] requireAdmin + storage guard (sum + 1MB <= 1.9GB)
  │
  ▼
[client ──► UploadThing] direct upload with progress  → { key, url, name, size }
  │
  ▼
[SA] createRecord(fields, fileMeta)
        requireAdmin → Zod re-validate → normalize + mask phone → INSERT
        on unique violation or DB error: UTApi.deleteFiles(key)
        on success: revalidateTag('records') → { ok: true }
  │
  ▼
[client] toast + redirect to /admin
```

## 7. Edit and delete flows

**Edit (file replaced):** compress → upload new → `updateRecord` updates the row and returns the old key → delete old key. If the update fails, delete the new key.

**Edit (text only):** `updateRecord` with no file meta. The phone mask is recomputed if the phone changed.

**Delete:** confirm dialog → `deleteRecord(id)` → `requireAdmin` → DELETE row (returns `file_key`) → `UTApi.deleteFiles(key)` → `revalidateTag`. If the file deletion fails, log it. The orphan stays until the Phase 2 cron or a manual cleanup.

## 8. Document proxy

```
GET /api/documents/[id]
  1. requireAdmin()            (MVP: always)
  2. SELECT file_url, file_type, file_name WHERE id
  3. fetch(file_url) server-side, stream body
  4. headers:
       PDF  → Content-Type: application/pdf, Content-Disposition: inline
       DOCX → Content-Type: <docx MIME>, Content-Disposition: attachment
       Cache-Control: private, no-store
       X-Robots-Tag: noindex
```

Phase 2 adds IP rate limiting and the `PUBLIC_DOCUMENTS` toggle at this same choke point.

## 9. Caching and revalidation

```
Reads (src/db/queries.ts)
  unstable_cache / "use cache" with tags:
    'records'               everything
    'records:list'          paginated lists keyed by (page, q)
  
Mutations
  create / update / delete ──► revalidateTag('records')
```

Use the caching API of the installed Next.js version (it changed across recent majors). Check the docs when implementing. The public page sends `noindex`. Search and pagination are driven by `searchParams`, so list queries are cached per `(page, q)` key.

## 10. Compression module

```
compress(file): Promise<{ file: File, before: number, after: number }>
  ├─ pdf:  pdf-lib load → save({ useObjectStreams: true }) → strip metadata
  └─ docx: JSZip load
           for each word/media/* image:
             decode → canvas downscale (max 1600px) → re-encode same format
           remove docProps/thumbnail.*
           generate zip (DEFLATE, level 9)
```

- Runs entirely in the browser, loaded only on admin form pages (dynamic import).
- Never converts image formats, so the DOCX stays valid.
- Caller enforces the 1MB cap on the result.
- Phase 2 adds Ghostscript-WASM as a PDF fallback when the lossless pass is not enough.

## 11. Storage guard

```
getUsedBytes()  = SELECT COALESCE(SUM(file_size), 0) FROM records
guard(newSize)  = used + newSize <= 1.9 GB
```

Runs in the UploadThing middleware. `newSize` is not known to the middleware before upload, so it assumes the 1MB maximum. The admin dashboard renders the same sum as a meter.

## 12. Error handling

| Case | Behavior |
|---|---|
| Validation error | Field-level messages from the Zod error map |
| Duplicate serial | Pre-check message, and a handled unique violation on race |
| Over 1MB after compression | Blocking message, no upload |
| Storage guard hit | Clear "storage full" message |
| UploadThing failure | Toast with retry. No DB write happens |
| DB failure after upload | Delete the new file, show an error |
| Session expired | Redirect to `/admin/login` |
| Rate limited | "Too many attempts, try again later" |

## 13. Environment variables

`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `UPLOADTHING_TOKEN`, `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DEFAULT_PHONE_COUNTRY=NG`. All validated in `src/lib/env.ts`.

## 14. Deployment

- Vercel project connected to the repo, env vars in the dashboard.
- Neon database in the same region as the Vercel functions.
- Run Drizzle migrations against Neon before the first deploy.
- Allow UploadThing hosts in `next.config` only if `next/image` is used for them. Not needed for PDF and DOCX.
- Phase 2 adds `vercel.json` with the cleanup cron.
