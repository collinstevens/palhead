# Partner skills verification — session log

Append a short entry each time you verify skills or change corrections. Newest at the top.

---

## 2026-07-12 — Chikipi #003 Egg Layer

- Evidence: `corrections/evidence/003-chikipi--egg-layer--20260712-194407.jpg`
- In-game: **Egg Layer** — "Sometimes lays an Egg when assigned to Ranch."
- Correction: `chikipi-egg-layer`
- Sites: wiki-gg + paldb **ok**; game8 **paraphrase** (produces Eggs)
- Checklist: Chikipi → `verified`

**Next:** Lifmunk #004.

---

## 2026-07-12 — Cattiva #002 Cat Helper

- Evidence: `corrections/evidence/002-cattiva--cat-helper--20260712-194338.jpg`
- In-game: **Cat Helper** — "While in party, Cattiva helps carry supplies, increasing the player's max carrying capacity by 100. (Does not stack)"
- Correction: `cattiva-cat-helper` (description uses fixed **100**, not range)
- Sites: paldb range (100~200) paraphrase; wiki-gg "team" + no number outdated; game8 paraphrase; fandom carry 50–90 wrong vs shown 100
- Checklist: Cattiva → `verified`

**Next:** Chikipi #003.

---

## 2026-07-12 — Lamball #001 Fluffy Shield (first Palpedia screenshot)

- Evidence: `corrections/evidence/001-lamball--fluffy-shield--20260712-194244.jpg`
- In-game: **Fluffy Shield** — "When activated, equips to the player and becomes a shield. Sometimes drops Wool when assigned to Ranch."
- Correction: `lamball-fluffy-shield` (description)
- Sites: wiki-gg + paldb **ok**; game8 **paraphrase** ("produces Wool" / different activation wording)
- Checklist: Lamball → `verified`

**Next:** Cattiva #002 and onward in deck order.

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
