# MVP: Records CRUD (Next.js + UploadThing)

Derived from `planning.md`. The MVP is the smallest version that is **secure, usable, and deployable today**. Everything cut from it is listed in section 4 as Phase 2.

## 1. MVP goal

A public landing page that lists records (masked phone) and a protected admin area to add, edit, and delete them. Each record has a name, phone, serial number, and one PDF or DOCX document of 1MB or less.

**Definition of done:** the admin can log in with the `.env` credentials, add a record with a compressed document, edit it, and delete it. Visitors see the list with masked phones and no document access. It is deployed on Vercel.

## 2. In scope

### Auth
- Login with `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`
- SHA-256 digest comparison with `timingSafeEqual`
- `jose` JWT (7 days) in an httpOnly, secure, sameSite=lax cookie
- Credential fingerprint in the JWT, so changing `.env` logs everyone out
- `requireAdmin()` helper used in every Server Action, admin page, UploadThing middleware, and the document route
- `proxy.ts` redirect for `/admin/*` (convenience gate only)
- Login rate limiting through Upstash Redis (5 attempts per 10 minutes per IP)
- Logout

### Database
- Neon Postgres + Drizzle, one `records` table (fields as in `planning.md` section 5)
- Unique index on `serialNumber`, index on `createdAt desc`
- Search with `ILIKE` on name and serial (fast enough for 1,500 rows)

### Add / Edit / Delete (admin)
- Form: name, phone, serial number, file (react-hook-form + Zod)
- Phone parsed with `libphonenumber-js`, default country **NG**, stored as E.164, mask precomputed on write
- Serial uniqueness pre-check before compression and upload
- Add: validate, compress, upload, insert, `revalidateTag`, toast, redirect
- Edit: text only, or replace the file (upload new, update the DB, delete the old key)
- Delete: confirm dialog, delete the DB row, delete the file, `revalidateTag`
- Inline orphan cleanup: if the DB step fails after upload, delete the new file immediately
- Submit disabled during compression, upload, and save

### Files and compression
- UploadThing file route: PDF and DOCX only, `maxFileSize: 1MB`, admin-only middleware
- **Storage guard:** reject uploads once `SUM(fileSize) + 1MB` would exceed 1.9GB
- Storage usage meter on the admin dashboard
- **PDF:** lossless re-save with `pdf-lib`
- **DOCX:** unzip with JSZip, downscale images over about 1600px, keep original formats, strip the thumbnail, rezip
- Show the size result ("2.4MB to 680KB"). If still over 1MB, block the upload with a clear message

### Document access
- `GET /api/documents/[id]` proxy, **admin-only** (`PUBLIC_DOCUMENTS` fixed to false in the MVP)
- PDF served inline, DOCX as an attachment, `Cache-Control: private, no-store`
- The UploadThing URL is never sent to the browser

### Public landing page
- Server Component, DB queries cached with tags, invalidated on every mutation
- Shows name, serial, masked phone, date
- Server-side pagination (20 per page)
- Search by name or serial only (`?q=`, debounced, 2-character minimum)
- Skeleton loading, empty state, error state, responsive (cards on mobile)
- `robots: noindex` and basic security headers
- Full phone and file URL never leave the server

### Admin dashboard
- Same table with the full phone, search, pagination, storage meter
- PDF preview or DOCX download through the proxy, plus Edit and Delete

### Deploy
- Vercel with all env vars set, Neon and Upstash connected
- Manual end-to-end test (section 6)

## 3. Environment variables (MVP)

```
ADMIN_USERNAME=
ADMIN_PASSWORD=
SESSION_SECRET=
UPLOADTHING_TOKEN=
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
DEFAULT_PHONE_COUNTRY=NG
```

Validated with Zod at startup. All server-only.

## 4. Out of scope (Phase 2)

| Item | Why it can wait |
|---|---|
| Ghostscript-WASM PDF compression | Biggest build risk and a large bundle. The MVP rejects PDFs that stay over 1MB after the lossless pass, and the admin must shrink them first. This will cause some rejections until Phase 2 |
| Daily orphan cleanup cron | Inline cleanup covers failed saves. The cron only catches closed tabs mid-upload, so check the UploadThing dashboard manually until it exists |
| `PUBLIC_DOCUMENTS` toggle | Admin-only is the safe default |
| Rate limiting on the document proxy | The route is already admin-only |
| `pg_trgm` index | `ILIKE` is fine at 1,500 rows |
| Upgrade to private files (UploadThing paid or R2) | Only needed if the public-URL limitation becomes unacceptable |
| Bulk import, CSV export, audit log | Not requested |

## 5. Build order and time

| Step | Task | Time |
|---|---|---|
| 1 | Scaffold: Next.js, Tailwind, shadcn, Drizzle, Neon, Upstash, env validation | 0.5h |
| 2 | Schema, migration, phone normalize/mask utilities | 1h |
| 3 | Auth: login, session fingerprint, `requireAdmin()`, rate limit, logout | 1h |
| 4 | UploadThing route, storage guard, document proxy | 1h |
| 5 | Compression: `pdf-lib` and DOCX image downscale, tested on real files | 1.25h |
| 6 | Admin CRUD: actions and forms with inline cleanup | 1.5h |
| 7 | Landing page: cache, search, pagination, states | 1.25h |
| 8 | Headers, noindex, polish, responsive check | 0.5h |
| 9 | Deploy and end-to-end test | 0.5h |

**Total: about 7.5 hours.**

## 6. Acceptance checklist

**Auth**
- [ ] Wrong credentials are rejected; five failures trigger the rate limit
- [ ] `/admin` redirects to login when logged out
- [ ] Changing `.env` credentials invalidates existing sessions
- [ ] Calling any Server Action or `/api/documents/[id]` without a session fails

**Add / Edit / Delete**
- [ ] Add works with a valid PDF and with a valid DOCX
- [ ] A phone like `08031234567` is stored as `+2348031234567`
- [ ] A duplicate serial is blocked before upload
- [ ] A file still over 1MB after compression is blocked with a clear message
- [ ] A non-PDF/DOCX file is rejected, including by the server route
- [ ] Editing text only keeps the same file; replacing the file removes the old one
- [ ] Deleting removes both the DB row and the file in UploadThing
- [ ] A forced DB failure after upload leaves no orphan file

**Public page**
- [ ] The list shows the masked phone only; view-source and network responses contain no full phone and no file URL
- [ ] Pagination and search (name, serial) work; phone search does not
- [ ] A new, edited, or deleted record shows up on the landing page right away
- [ ] The page is usable on a phone

**Deploy**
- [ ] Production env vars are set and the app runs on Vercel
- [ ] The storage meter matches the UploadThing dashboard roughly

## 7. Known MVP limitations

- Files are on UploadThing's free tier, so the underlying URLs are technically public. The proxy only keeps them out of your app's HTML and API.
- Image-heavy PDFs may be rejected until Ghostscript-WASM is added.
- Abandoned uploads (tab closed mid-upload) are not auto-cleaned; check the UploadThing dashboard occasionally.
- Confirm the 2GB free tier in your UploadThing dashboard when you sign up.
