# Deploying Hold Frame to GitHub Pages

A one-time setup. After this, every push to `main` redeploys automatically (~1 minute) — no build
step or workflow needed, Pages serves these files as-is. The result is a public HTTPS URL where the
app installs as a PWA and stores progress in each visitor's own browser.

## 1. Create the repository

- On GitHub: **New repository**, name it e.g. `hold-frame`.
- Make it **Public** — free GitHub Pages requires a public repo (private needs a paid plan).
- Create it empty (no README; this folder already has one).

## 2. Put these files in the repo

The contents of this folder go at the **repo root** — `index.html` must be at the top level.

**With git:**

```bash
cd hold-frame                 # this folder
git init
git add .
git commit -m "Hold Frame"
git branch -M main
git remote add origin https://github.com/<you>/hold-frame.git
git push -u origin main
```

**Without git:** on the empty repo's page, click **uploading an existing file** and drag the files
in, then **Commit changes**.

## 3. Turn on Pages

- Repo → **Settings** → **Pages** (left sidebar, under "Code and automation").
- **Build and deployment → Source:** choose **Deploy from a branch**.
- **Branch:** `main`  ·  **Folder:** `/ (root)`  →  **Save**.

## 4. Get the URL

- Wait ~1–2 minutes (the first deploy is the slowest), then refresh the Pages settings page.
- It shows: **"Your site is live at `https://<you>.github.io/hold-frame/`."**
- Open it. HTTPS is on automatically, so install and offline both work:
  - **Chrome / Edge:** an install icon appears in the address bar.
  - **iOS Safari:** Share → **Add to Home Screen**.

Share that URL with anyone — clicking it and installing is all they do.

## Updating later

Edit → commit → push to `main`. Pages redeploys in ~1 minute. Saved progress survives deploys
because `localStorage` is keyed by the site **origin**, not the version — so updates never reset
anyone's streak, as long as you keep the same URL and don't change the storage key (`holdframe.v1`).

## Optional: custom domain

Settings → Pages → **Custom domain** gives a clean, dedicated origin (and drops the `/repo/` path).
One caveat: a new domain is a new origin, so existing visitors' saved data won't carry over — they'd
start fresh. Pick the final URL before you have real users on it.

## Notes

- `.nojekyll` (included) tells Pages to skip Jekyll and serve every file verbatim.
- The site lives under `/<repo>/`; the app uses relative paths so that subpath works, service
  worker and all.
- You do **not** need a GitHub Actions workflow for this — branch deploy already redeploys on push.
  Add one only if you later introduce a build step.
