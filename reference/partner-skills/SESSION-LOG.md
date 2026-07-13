# Partner skills verification — session log

Append a short entry each time you verify skills or change corrections. Newest at the top.

---

## 2026-07-12 — Palpedia checklist + evidence archive policy

- Added full pal checklist: `checklist.json` + `CHECKLIST.md` (301 pals)
- Progress statuses: pending / partial / verified / skipped
- Screenshot policy: **preserve every capture forever** in `corrections/evidence/`
- Builder: `npm run build-partner-checklist` (preserves status/evidence on rebuild)
- No screenshots received yet — all pals still `pending`

**Next session:** user sends Palpedia screenshots starting from deck order (Lamball #001…) → save evidence → mark checklist → corrections.

---

## 2026-07-12 — initial multi-source scrape scaffold

- Scraped all four sites into `sources/`:
  - wiki-gg: 226 catalog rows
  - game8: 302 catalog rows
  - paldb: 298 catalog rows
  - fandom: 68 level-table entries (not skill-name catalog)
- Built `discrepancies/cross-source-diff.json` (auto site-vs-site)
- Created empty `corrections/corrections.json` and `discrepancies/known-inaccuracies.json`
- Documented process in `README.md` and repo `reference/PROVENANCE.md`
- No in-game screenshots applied yet (`correctionsApplied: 0`)
