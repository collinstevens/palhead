# Partner skills — multi-source reference

Goal: resolve inaccuracies across wiki sites and the live game by keeping **immutable per-site scrapes**, a **separate corrections ledger**, and a **resolved query view**.

This work spans multiple sessions (screenshots arrive over days). Read this file + [../PROVENANCE.md](../PROVENANCE.md) at the start of each session.

## Why

| Site | What it gives us | Known shape limits |
|------|------------------|--------------------|
| [wiki.gg Partner Skills](https://palworld.wiki.gg/wiki/Partner_Skills) | Skill name, pal(s), deck no, type, description | Coverage lags; some TBA stubs |
| [Game8 Partner Skills](https://game8.co/games/Palworld/archives/439665) | Skill name, description, pal | No deck no/type; wording often paraphrased |
| [Fandom Partner Skills](https://palworld.fandom.com/wiki/Partner_Skills) | **Level tables** (%, carry weight, drop rates, party buffs) | Almost no skill *names* or full flavor text |
| [paldb Partner Skill](https://paldb.cc/en/Partner_Skill) | Pal, skill name, description (often with numeric ranges) | Tab groupings; may still lag patches |

None of these is automatically authoritative. **In-game text (screenshot) wins.**

## Directory map

```
reference/partner-skills/
  README.md                          ← this file (process for agents)
  CHECKLIST.md                       ← human-readable pal verification checklist
  checklist.json                     ← progress source of truth (status + evidence paths)
  SESSION-LOG.md                     ← append multi-session notes
  sources/                           ← scraped snapshots only (do not hand-edit)
    wiki-gg.json
    game8.json
    fandom.json
    paldb.json
  corrections/
    corrections.json                 ← ground-truth amendments (hand-edit)
    evidence/                        ← PERMANENT screenshot archive (never delete)
  discrepancies/
    DISCREPANCIES.md                 ← human-readable site-vs-site name/description conflicts
    cross-source-diff.json           ← machine-readable twin of the above
    known-inaccuracies.json          ← human: which site is wrong, status open/resolved
  resolved.json                      ← query view: merge preference + corrections applied
```

Legacy stub: `reference/partner_skills.json` points here. Do not put new data there.

## Commands

```bash
npm run scrape-partner-skills
npm run build-partner-checklist      # refresh checklist rows; preserves status/evidence
npm run build-partner-discrepancies  # rebuild DISCREPANCIES.md from current sources/
# or
npm run scrape-reference   # also refreshes passives + work suitability
```

Re-scrape **refreshes `sources/*` and rebuilds discrepancy report + `resolved.json` + checklist**.  
It does **not** wipe `corrections/`, checklist progress fields, or `discrepancies/known-inaccuracies.json`.

## Screenshot preservation (mandatory)

**Every screenshot the user provides must be kept forever.**

| Rule | Detail |
|------|--------|
| Save immediately | Before OCR/analysis side-effects, copy the image into `corrections/evidence/` |
| Never delete | Do not remove evidence files, even if a better shot arrives later |
| Never overwrite | Always write a **new** filename; keep prior shots |
| Stable names | `{deckNo}-{pal-slug}--{skill-slug}--{YYYYMMDD-HHmmss}.png` |
| Index | Append the relative path on that pal’s row in `checklist.json` → `evidence[]` |
| Retakes | Keep old + new; mark newest in notes if needed |

If the client only embeds an image in chat (no path), the agent must still write a file under `corrections/evidence/` from the attachment so the archive is in-repo.

## Session workflow (screenshots / in-game checks)

### 1. Start of session

1. Read this README, `CHECKLIST.md` / `checklist.json`, and open corrections/inaccuracies.
2. Optionally re-scrape if sites may have updated: `npm run scrape-partner-skills`.
3. Use `checklist.json` to see next `pending` pals; `cross-source-diff.json` for site conflicts.

### 2. When the user pastes a screenshot or states in-game text

1. **Preserve the screenshot** under `corrections/evidence/` (unique name; never overwrite).
2. Identify **pal** + **partner skill name** + exact **description** (and no/type if visible).
3. Update that pal in `checklist.json`: `evidence[]`, status `partial` or `verified`, `verifiedAt`.
4. Add or update a **correction** in `corrections/corrections.json` (see schema below).
5. Log site wrongness in `discrepancies/known-inaccuracies.json`.
6. Rebuild: `npm run scrape-partner-skills` then `npm run build-partner-checklist`.
7. Append `SESSION-LOG.md` with pals verified this session.

### 3. What not to do

- Do **not** edit `sources/*.json` to fix text.
- Do **not** delete or overwrite screenshots in `corrections/evidence/`.
- Do **not** “average” or invent descriptions without an in-game or user-verified source.
- Do **not** treat `cross-source-diff.json` as ground truth — only as a diff of websites.
- Do **not** delete open inaccuracy entries when a site scrape changes; mark `status: "resolved"` and record `resolvedAt`.

## Correction entry schema

`corrections/corrections.json`:

```json
{
  "schemaVersion": 1,
  "purpose": "...",
  "entries": [
    {
      "id": "lamball-fluffy-shield",
      "status": "active",
      "match": {
        "pal": "Lamball",
        "skillName": "Fluffy Shield"
      },
      "fields": {
        "description": "Exact in-game partner skill text here.",
        "type": "Combat / Farming"
      },
      "verifiedAt": "2026-07-12",
      "verifiedBy": "user-screenshot",
      "evidence": "reference/partner-skills/corrections/evidence/lamball-fluffy-shield.png",
      "notes": "Game8 paraphrase omitted ranch wool drop.",
      "gameVersion": null
    }
  ]
}
```

- `status`: `active` (applied) or `retired` (ignored by resolver).
- `fields`: only set keys you verified; they overwrite the merged scrape for that skill+pal.
- If the skill is missing from all scrapes, a correction with `match` + `fields` **inserts** a row into resolved.

## Known-inaccuracy entry schema

`discrepancies/known-inaccuracies.json`:

```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "id": "lamball-fluffy-shield-desc",
      "status": "open",
      "pal": "Lamball",
      "skillName": "Fluffy Shield",
      "field": "description",
      "sources": {
        "game8": { "value": "…", "assessment": "outdated" },
        "wiki-gg": { "value": "…", "assessment": "ok" },
        "paldb": { "value": "…", "assessment": "ok" },
        "fandom": { "value": null, "assessment": "missing" }
      },
      "correctValue": "… or null until verified …",
      "correctionId": "lamball-fluffy-shield",
      "evidence": "reference/partner-skills/corrections/evidence/lamball-fluffy-shield.png",
      "notes": "",
      "updatedAt": "2026-07-12",
      "resolvedAt": null
    }
  ]
}
```

`assessment` values: `ok` | `outdated` | `wrong` | `paraphrase` | `missing` | `unknown` | `n/a`.

Fandom often uses `n/a` for description fields because that page is level tables, not flavor text.

## Resolved merge rules

Builder: `scripts/scrape-partner-skills.js`.

1. Union catalog entries from **paldb → game8 → wiki-gg** (first source supplies description when present; later sources fill missing `no` / `type` / description only).
2. Keep `perSource` on each resolved row so agents can still see site wording.
3. Apply **corrections** last (`sources` gains `"correction"`, `corrected: true`).
4. Fandom is **not** merged into skill-name rows; it stays in `sources/fandom.json` for numeric level data.

## Site pages (generated)

| Page | Role |
|------|------|
| `partner-skills.html` | Our merged partner skill catalog (from `resolved.json`) |
| `partner-verify.html` | Palpedia checklist + name conflicts + severe diffs + only-on-one-site |

Rebuild UI: edit nothing in those HTML files — run `npm run build` after reference data changes.

## Agent query cheat sheet

| Need | Read |
|------|------|
| Best current belief | `resolved.json` (or live Partner Skills page) |
| What Game8 said on last scrape | `sources/game8.json` |
| Level % tables | `sources/fandom.json` |
| Sites disagree on wording | `discrepancies/DISCREPANCIES.md` / Verify page |
| Confirmed site bugs | `discrepancies/known-inaccuracies.json` |
| In-game overrides | `corrections/corrections.json` |

## Related repo docs

- [../PROVENANCE.md](../PROVENANCE.md) — repo-wide provenance rules
- Root `AGENTS.md` / `CLAUDE.md` — architecture + commands
