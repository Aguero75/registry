# Build Phases

Ordered build plan for the MVP (about 7.5 hours), followed by Phase 2. Each phase has tasks, a deliverable, and **exit criteria**. Do not start the next phase until the current one passes.

Reference: `MVP.md` (scope), `ARCHITECTURE.md` (design), `PROJECT_CONTEXT.md` (rules).

---

## Phase 0: Accounts and setup (before coding, about 15 min)

- [ ] Create Neon project (note the region), copy `DATABASE_URL`
- [ ] Create UploadThing app, copy `UPLOADTHING_TOKEN`, confirm the 2GB free plan
- [ ] Create Upstash Redis database, copy REST URL and token
- [ ] Create Vercel project (link later)
- [ ] Generate `SESSION_SECRET` (32+ random bytes)

**Exit:** all secrets in hand.

---

## Phase 1: Scaffold (0.5h)

**Tasks**
- [ ] `create-next-app` (TypeScript, Tailwind, App Router, `src/` dir)
- [ ] Install: `drizzle-orm`, `drizzle-kit`, Neon driver, `zod`, `jose`, `react-hook-form`, `@hookform/resolvers`, `libphonenumber-js`, `uploadthing`, `@uploadthing/react`, `@upstash/redis`, `@upstash/ratelimit`, `pdf-lib`, `jszip`, `sonner`
- [ ] Init shadcn/ui (button, input, label, table, dialog, alert-dialog, skeleton, card, badge, progress)
- [ ] `.env.local` and `.env.example`
- [ ] `src/lib/env.ts` with Zod validation
- [ ] Strict TypeScript, ESLint passing

**Exit:** `npm run dev` starts, and a missing env var throws a clear error.

---

## Phase 2: Database and utilities (1h)

**Tasks**
- [ ] `db/schema.ts` (see `ARCHITECTURE.md` section 4), `db/index.ts`
- [ ] Generate and run the first migration on Neon
- [ ] `lib/phone.ts`: `normalizePhone(input)` using NG as the default, and `maskPhone(e164)`
- [ ] `lib/validations.ts`: `recordSchema` (name, phone, serial)
- [ ] `db/queries.ts`: `listPublic`, `listAdmin`, `getById`, `getUsedBytes`
- [ ] Seed script with about 25 fake rows (for list and pagination testing)

**Exit:** unit checks pass for phone edge cases (`0803…`, `+234803…`, `234803…`, invalid), and the seed data is queryable.

---

## Phase 3: Authentication (1h)

**Tasks**
- [ ] `lib/session.ts`: fingerprint, sign, verify, `requireAdmin()`
- [ ] `lib/ratelimit.ts`: login limiter (5 per 10 min per IP)
- [ ] `actions/auth.ts`: `loginAction`, `logoutAction`
- [ ] `/admin/login` page and form
- [ ] `proxy.ts`: redirect `/admin/*` without a valid JWT (not login itself)
- [ ] `(protected)/layout.tsx` calls `requireAdmin()`

**Exit:**
- [ ] Wrong password is rejected, five failures trigger the limit
- [ ] Logged out visits to `/admin` redirect to login
- [ ] Changing `ADMIN_PASSWORD` and restarting invalidates an existing session

---

## Phase 4: Uploads and document proxy (1h)

**Tasks**
- [ ] `api/uploadthing/core.ts`: one route accepting PDF and DOCX, `maxFileSize: 1MB`, `maxFileCount: 1`, middleware with `requireAdmin()` and the storage guard
- [ ] `api/uploadthing/route.ts`
- [ ] `lib/utapi.ts` and `lib/storage.ts` (`guard`, `getUsedBytes`)
- [ ] `api/documents/[id]/route.ts` (admin-only, streaming, correct headers)

**Exit:**
- [ ] Upload from the admin session succeeds; without a session it is rejected
- [ ] A file over 1MB or of the wrong type is rejected by the server
- [ ] The proxy serves a PDF inline and a DOCX as a download, and returns 401 when logged out

---

## Phase 5: Compression (1.25h, riskiest, test early)

**Tasks**
- [ ] `compress/pdf.ts`: `pdf-lib` lossless re-save
- [ ] `compress/docx.ts`: JSZip, image downscale to max 1600px, same formats, strip thumbnail
- [ ] `compress/index.ts`: dispatch by type, returns `{ file, before, after }`
- [ ] Test on real files: text PDF, scanned PDF, image-heavy DOCX, text-only DOCX
- [ ] Confirm the compressed DOCX opens in Word or LibreOffice and the PDF opens in a viewer

**Exit:**
- [ ] Compressed files stay valid and open correctly
- [ ] Sizes are logged for each test file. Record which kinds of file land over 1MB so the Phase 2 Ghostscript work is justified

---

## Phase 6: Admin CRUD (1.5h)

**Tasks**
- [ ] `actions/records.ts`: `checkSerial`, `createRecord`, `updateRecord`, `deleteRecord` (each starts with `requireAdmin()`, re-validates with Zod, returns `{ ok, ... }`)
- [ ] `components/file-input.tsx`: select, compress, show before and after sizes, block over 1MB
- [ ] `components/record-form.tsx`: fields, serial pre-check, upload progress, disabled submit while busy
- [ ] `/admin/new` and `/admin/[id]/edit`
- [ ] `components/delete-dialog.tsx`
- [ ] Inline orphan cleanup on DB failure (create and update)
- [ ] `revalidateTag` after each mutation

**Exit:**
- [ ] Add, edit (text only and file replaced), and delete all work
- [ ] Duplicate serial is blocked, and a forced insert failure leaves no orphan in UploadThing
- [ ] Deleting a record removes the file

---

## Phase 7: Landing page and admin table (1.25h)

**Tasks**
- [ ] Cached queries with tags (`records`, `records:list`)
- [ ] `page.tsx`: list, pagination (20 per page), `?q=` search (name and serial, `ILIKE`, 2-character minimum)
- [ ] `components/search-input.tsx` (debounced), `pagination.tsx`, `records-table.tsx`
- [ ] `loading.tsx` skeletons, empty state, `error.tsx`
- [ ] Admin dashboard: full phone, document View/Download, Edit/Delete, `storage-meter.tsx`
- [ ] Responsive layout (cards on mobile)

**Exit:**
- [ ] Public HTML and network responses contain **no** full phone and **no** file URL
- [ ] New, edited, and deleted records appear on the landing page without a manual redeploy
- [ ] Phone numbers cannot be searched on the public page

---

## Phase 8: Hardening and polish (0.5h)

**Tasks**
- [ ] `robots: noindex` metadata, security headers in `next.config`
- [ ] Review: `requireAdmin()` present in every action, admin page, upload middleware, and the proxy
- [ ] Review: no `NEXT_PUBLIC_` secrets, no `select *` in public queries
- [ ] Accessibility pass (labels, focus, contrast, keyboard)
- [ ] Mobile check at 375px

**Exit:** all items in the `MVP.md` acceptance checklist pass locally.

---

## Phase 9: Deploy and verify (0.5h)

**Tasks**
- [ ] Run migrations on the production Neon database
- [ ] Set all env vars on Vercel
- [ ] Deploy, then run the full `MVP.md` acceptance checklist on the live URL
- [ ] Test on a real phone
- [ ] Compare the storage meter with the UploadThing dashboard

**Exit:** MVP is live and every checklist item passes.

---

## Phase 10 (Phase 2): After the MVP

Do these in order of value:

1. **Ghostscript-WASM PDF fallback** (about 2h). Load lazily on the admin form. Add it only if Phase 5 testing showed PDFs landing over 1MB
2. **Daily orphan cleanup cron** (about 1h). `vercel.json` cron calling `/api/cron/cleanup`, secured with `CRON_SECRET`
3. **`PUBLIC_DOCUMENTS` toggle and proxy rate limiting** (about 1h)
4. **`pg_trgm` index** if search feels slow
5. **True private files:** move to UploadThing paid private files or Cloudflare R2 if the public-URL limitation becomes unacceptable (only the proxy and upload code change)
6. Bulk import, CSV export, audit log, if needed

---

## Risk checkpoints

| When | Check | If it fails |
|---|---|---|
| End of Phase 5 | Do real files compress under 1MB? | Raise priority of Ghostscript-WASM, or temporarily lift the cap to 2MB with a smaller record count |
| End of Phase 4 | Does the proxy stream reliably on Vercel? | Fall back to buffering (files are 1MB or less) |
| End of Phase 6 | Any orphan files after forced failures? | Fix cleanup paths before moving on |
| Phase 9 | Storage meter vs dashboard mismatch? | Recount from the DB and check for orphans |
