# Hold Frame

A break timer for people who draw — targeted micro-breaks (by body region, biased toward the
strength moves with the strongest evidence), intervals kept inside the supported microbreak window,
and day-by-day motivation: a daily goal, a forgiving 7-day consistency strip, and a cumulative
"time given back" figure.

Self-contained static web app — one HTML file plus a manifest, service worker, and icons. No build
step, no backend. Installable as a PWA; progress is stored in the visitor's own browser.

## Live site

Deployed via GitHub Pages from this repo's root. Once enabled it lives at:

```
https://<your-username>.github.io/<repo-name>/
```

See **DEPLOY.md** for the one-time setup (≈5 minutes).

## Files

```
index.html              the app (UI + logic, self-contained)
manifest.webmanifest    PWA install metadata
service-worker.js       offline app shell + update handling
icon-192/512/180.png    PWA icons + iOS home-screen icon
.nojekyll               tells Pages to serve files as-is (skip Jekyll)
DEPLOY.md               GitHub Pages setup, step by step
storage-decision.md     ADR: why localStorage now, IndexedDB later
LICENSE                 MIT license
.gitignore              ignores OS / editor cruft
```

## Run locally

```
python3 -m http.server 8000     # then open http://localhost:8000
```

(For non-technical local use without a terminal, the double-click launchers are in the separate
bundle zip from earlier.)

## Storage

Client-side only — a small JSON blob in `localStorage`, keyed by **local** date:

```
{ goal, days: { "YYYY-MM-DD": { h: holds, s: breakSeconds } } }
```

Facts are stored; streak / weekly strip / totals are derived at runtime. It's per-browser,
per-device, no sync — and nothing ever leaves the device. Everything sits behind a `Store.get/set`
seam, so swapping to IndexedDB later is a drop-in. Full rationale and migration path in
`storage-decision.md`.
