# ADR 001 — Client-side persistence for Hold Frame

- **Status:** Accepted (v1)
- **Date:** 2026-06-14
- **Applies to:** the single-file build of Hold Frame (one self-contained `.html`, no server, no build step)

## Context

Hold Frame is a single HTML file run locally or served static. We're adding day-by-day
motivation — a daily goal with today's progress, a forgiving 7-day consistency strip, and a
cumulative "time given back" figure. All three need data to **survive across sessions**, which the
current in-memory build does not.

The data is tiny and non-relational: a per-day rollup plus one setting. That shape does not call
for a query engine.

## Decision

Use **localStorage** for v1, reached through a tiny key-value seam (`Store.get` / `Store.set`)
with an in-memory fallback. Store **facts** and **derive** everything else at runtime.

```
state = {
  goal: 8,                              // user setting (a stepper, 4–16)
  days: { "YYYY-MM-DD": { h, s } }      // h = holds, s = break-seconds, that day
}
```

- Keyed by **local** calendar date (built from `getFullYear/Month/Date`), never `toISOString()`,
  so the day doesn't roll over at UTC midnight.
- Streak / weekly strip / totals / active-days are **computed from `days`** on each render — none
  of them is persisted. This can't desync and needs no migration when motivation features change.
- Size: ~20 bytes/day → a few KB/year. No pruning needed for years.

The app never reads storage mid-session; it reads the in-memory `state` (hydrated once via
`loadState`, written through `saveState`). That isolation is deliberate — see migration path.

## Options considered

| | In-memory (current) | **localStorage (chosen)** | IndexedDB | SQLite (WASM/OPFS) |
|---|---|---|---|---|
| Survives session | No | Yes | Yes | Yes |
| API | n/a | sync, trivial | async, transactional | async, SQL |
| Capacity | RAM | ~5 MB/origin | hundreds of MB+ | large |
| Querying | n/a | load blob, filter in JS | indexed key ranges | full SQL |
| Works double-clicked (`file://`) | Yes | usually (quirky origin) | fragile / often blocked | no (needs secure context) |
| Dependencies | none | none | none (or small wrapper) | ~hundreds of KB WASM |
| Fit for this data | loses everything | right-sized | premature | overkill, not relational |

## Why not the others

- **In-memory:** no persistence (the thing we're fixing).
- **IndexedDB:** its real wins (large, indexed history) and reliable persistence both require a
  proper origin — it's fragile or disabled from `file://` — and it adds async complexity for data
  that's currently a few hundred bytes. Deferred, not rejected (see below).
- **SQLite (sqlite-wasm + OPFS):** a multi-hundred-KB WASM payload against a ~30 KB app, needs a
  secure context plus cross-origin isolation, and won't run from a double-clicked file. The data
  isn't relational. Overkill.

## Consequences / caveats

- **Not a file you control.** Storage is browser-managed and per-origin (Chromium backs it with
  LevelDB, Firefox with SQLite internally). It isn't portable, committable, or named by us.
- **`file://` is the weak spot.** Double-clicking the HTML generally works for localStorage but the
  origin is quirky and persistence isn't guaranteed.
- **Best-effort storage is evictable** under disk pressure. To make it durable, serve the file over
  http(s)/localhost (or install as a PWA) and call `navigator.storage.persist()` — both of which
  need a real origin.
- **In-chat preview** (sandboxed iframe) can't persist either store; the in-memory fallback keeps
  the app functional there.

Net: if it stays a literally-double-clicked file, persistence is best-effort. Giving it a real
origin (serving it — no build step, just reached over http) is what makes persistence solid, and is
also the prerequisite for IndexedDB.

## Migration path to IndexedDB

Trigger: when we want queryable multi-month history (heatmaps, region analytics over time) or hit
localStorage size/perf limits — and once the app is served (which IndexedDB needs anyway).

Work involved is contained to the seam: reimplement `Store.get/set` only. They become **async**, but
because the app already reads from the in-memory `state` (hydrated once on load, written through
`saveState`), going async only affects `loadState` — make it `await`. No call site that reads game
state needs to change.
