# Deploying the NETSA web frontend to Cloudflare Pages

The web app is a **static single-page app**: `npm run build` runs
`expo export --platform web` and emits `dist/` (one `index.html` + content-hashed
`_expo/static/*` bundles). No Node server is needed in production — Cloudflare Pages
serves `dist/` directly from its CDN.

> **Pages vs Workers:** Cloudflare's current Pages page nudges new projects toward
> **Workers (static assets)**, but Pages is still fully supported and is the simplest
> path for a pre-built static SPA with a custom domain. This guide uses **Pages**.

---

## 1. Create the Pages project

Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
→ pick `Rohit-huta-p/netsaa-frontend`.

Set the build settings (Expo is not a framework preset — enter them manually):

| Field | Value |
|-------|-------|
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank — repo root)* |

Node version is pinned by the committed **`.nvmrc`** (`22`). The Pages v3 build image
ignores `package.json` "engines", so the `.nvmrc` file is what controls it.

## 2. Build-time environment variables

Dashboard → project → **Settings → Environment variables** (Production + Preview).
Expo only inlines variables prefixed `EXPO_PUBLIC_` into the web bundle, and they must
be present **at build time**.

- **Not needed:** API URLs. `src/lib/constants.ts` hardcodes the `*.onrender.com`
  production hosts and returns them whenever `__DEV__` is false (i.e. in the Pages
  build). No `EXPO_PUBLIC_API_*` var is required.
- **Mirror from the current Render service** only the ones that matter in production,
  e.g. `EXPO_PUBLIC_RAZORPAY_KEY_ID`, `EXPO_PUBLIC_PAYMENT_PROVIDER`,
  `EXPO_PUBLIC_CASHFREE_ENV` (whatever payments actually use).
- **Skip:** `EXPO_PUBLIC_DEV_IP`, `EXPO_PUBLIC_USE_PROD_API` (dev-only) and every
  `EXPO_PUBLIC_FEATURE_*` (the feature-flag system was removed).

## 3. Routing & caching (already handled by this repo)

- **SPA routing is automatic.** Because `dist/` has no top-level `404.html`, Pages
  serves `index.html` for any unmatched path. **Do not** add a `/* /index.html 200`
  redirect — Pages always follows redirects, so a catch-all would shadow real assets.
- **Caching:** `public/_headers` (copied into `dist/` on build) sets a 1-year immutable
  cache on the hashed `/_expo/static/*` and `/assets/*` files, while leaving
  `index.html` on Pages' revalidating default so new deploys appear immediately.
  After the first build, confirm `dist/_headers` exists.

## 4. Verify on the preview URL

The first deploy is reachable at `https://<project>.pages.dev`.

- The static shell, routing, fonts and images should all work there.
- ⚠️ **API calls (including login) will be CORS-blocked on `*.pages.dev`.** Every
  backend service hardcodes its CORS allow-list to `netsaa.com` / `www.netsaa.com`
  (only `media-service` reads it from the `CORS_ORIGINS` env var). This is expected
  and does **not** affect production (see step 5). To exercise API flows on the
  preview, temporarily add the `pages.dev` origin to the services' allow-lists.

## 5. Cut over the domain (zero-downtime)

1. Keep the existing Render service running.
2. Verify static + routing on `<project>.pages.dev`.
3. Pages → project → **Custom domains** → add `netsaa.com` and `www.netsaa.com`.
   Since the zone is already on Cloudflare, Pages repoints the DNS records off Render
   automatically.
4. Load `https://netsaa.com` and verify login + payments now work (the `Origin` is
   back to `netsaa.com`, so CORS passes).
5. Once confident, decommission the Render web service. `server.js` / the Express
   dependency are no longer needed for production.

**Review before cutover:** check the existing Cloudflare **Rules / cache rules** for
the `netsaa.com` zone (the old `s-maxage=300` HTML cache) so they don't conflict with
Pages' own cache behaviour.

**Rollback:** repoint the `netsaa.com` DNS record back to the Render origin.

## Why move off Render

Pages' Git integration auto-builds and deploys on every push to `main`, with a fresh
content-hashed bundle each time. That removes the current two-step pain (a push to
`main` doesn't update the site until a manual Render "Deploy latest commit" **and** the
~5-minute Cloudflare HTML cache clears).

## Limits (for reference)

The current export is **105 files / 36 MB / 8.6 MB largest file** — comfortably under
Pages' limits (25 MiB per file, 20,000 files on the Free plan).
