# Chaudhary Traders — ERP (Netlify-ready, with shared live data via Supabase)

This is a standalone React + Vite build of your ERP app, ready to deploy on Netlify,
with optional shared data storage (Supabase) so **admin + staff on any device
(laptop, mobile, etc.) see the same live data**, synced in real time.

## Set up shared data (Supabase) — do this once

1. Go to https://supabase.com → sign up (free) → **New project**.
2. Once the project is ready, open **SQL Editor** → **New query**, paste the
   contents of `supabase-setup.sql` (included in this folder) → **Run**.
   This creates the `kv_store` table used to store all app data.
3. Go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key
4. Copy `.env.example` to a new file named `.env` in this project, and paste
   in your URL and key:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. Rebuild: `npm run build` (this bakes the values into the production build).
6. Re-deploy the new `dist` folder to Netlify (drag-and-drop it at
   https://app.netlify.com/drop, onto your **existing** site so the URL stays
   the same — see "Redeploying" below).

**Without Supabase configured, the app still works** — it just falls back to
the browser's localStorage (each device keeps its own separate copy, no sync).

⚠️ Note on security: this app has no server-side login system (the
admin/staff login is a simple in-app check), so the Supabase setup above
allows the public anon key to read/write the data. That's normal for an
internal tool but means anyone with your Supabase URL + anon key could
technically read/write the data too — don't share those publicly. Ask if
you'd like a version with real authenticated (locked-down) access instead.

## Redeploying after changes (drag-and-drop sites)

1. `npm run build`
2. Go to your site in the Netlify dashboard → **Deploys** tab
3. Drag the new `dist` folder onto the deploys page (this updates the same
   site/URL, instead of creating a new one)

## Deploy to Netlify — Option A (drag-and-drop, first time)

1. `npm install`
2. `npm run build` → creates a `dist` folder
3. Go to https://app.netlify.com/drop and drag in the **contents of `dist`**
   (or the `dist` folder itself) — this gives you a live URL immediately

## Deploy to Netlify — Option B (Git-connected, recommended for ongoing updates)

1. Push this whole folder to a GitHub repo (`.env` is gitignored — instead,
   add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as **Environment
   variables** in Netlify: Site settings → Environment variables).
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Build settings are already set via `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click **Deploy site** — every future `git push` auto-redeploys, and the
   env vars you set in Netlify are used automatically.

## Local development

```
npm install
npm run dev
```
Opens a local dev server (usually http://localhost:5173).

## Project structure

- `src/App.jsx` — the entire ERP app (all pages/components)
- `src/supabaseClient.js` — Supabase connection (reads `.env` values)
- `src/main.jsx` — React entry point
- `src/index.css` — Tailwind CSS import
- `supabase-setup.sql` — run once in Supabase to create the data table
- `.env.example` — copy to `.env` and fill in your Supabase values
- `netlify.toml` — Netlify build config + SPA redirect rule
- `tailwind.config.js`, `postcss.config.js` — Tailwind setup

## Default logins

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

Change these from the in-app **Settings** page after your first login.

