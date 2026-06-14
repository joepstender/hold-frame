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

## Custom domain + HTTPS

The site is served from **`holdframe.art`** (with `www.holdframe.art` redirecting to it), over HTTPS.
This is the live setup; the steps below document how it's wired and how to reproduce it.

One caveat: a custom domain is a new origin, so saved progress from the old `*.github.io` URL won't
carry over — visitors there start fresh. Pick the final URL before you have real users on it.

### DNS (at your DNS host)

The apex (`holdframe.art`) uses A/AAAA records pointing at GitHub Pages; `www` is a CNAME to the
`github.io` host. GitHub then serves both names and redirects `www` → apex.

```
@     A      185.199.108.153
@     A      185.199.109.153
@     A      185.199.110.153
@     A      185.199.111.153
@     AAAA   2606:50c0:8000::153
@     AAAA   2606:50c0:8001::153
@     AAAA   2606:50c0:8002::153
@     AAAA   2606:50c0:8003::153
www   CNAME  joepstender.github.io.
```

Notes:
- Set **all four** A and AAAA records (GitHub's CDN), not just one.
- `www` must point to `joepstender.github.io.` — **not** any registrar "web forwarding" / redirect
  host. If web forwarding is on for `www`, disable it or it may overwrite the CNAME.
- DNS TTL is 3h, so changes can take that long to clear from caches even after the authoritative
  servers (and public resolvers like `8.8.8.8`) show the new values.

### GitHub side

- Settings → Pages → **Custom domain:** `holdframe.art` (apex only — do *not* add `www` here; the
  apex being primary plus the `www` CNAME makes GitHub redirect `www` → apex automatically). This is
  stored in the repo's `CNAME` file at the root.
- GitHub auto-provisions a single Let's Encrypt cert covering **both** `holdframe.art` and
  `www.holdframe.art` once DNS is correct (can take minutes to a few hours).
- Settings → Pages → **Enforce HTTPS:** on. Available only after the cert is issued.

If the cert seems stuck after DNS is correct, remove the custom domain and re-add it (Settings →
Pages, or via `gh api -X PUT repos/<owner>/<repo>/pages -f cname=...`) to force a fresh DNS check and
cert request. This makes the `github-pages` bot rewrite the `CNAME` file, so `git pull` afterward.

### Verify

```bash
curl -sI https://holdframe.art            # 200, valid cert
curl -sI http://holdframe.art             # 301 -> https://holdframe.art/
curl -sI https://www.holdframe.art        # 301 -> https://holdframe.art/
```

## Notes

- `.nojekyll` (included) tells Pages to skip Jekyll and serve every file verbatim.
- The site lives under `/<repo>/`; the app uses relative paths so that subpath works, service
  worker and all.
- You do **not** need a GitHub Actions workflow for this — branch deploy already redeploys on push.
  Add one only if you later introduce a build step.
