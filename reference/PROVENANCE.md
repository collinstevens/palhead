# Reference data provenance

Every fact in this repository should be traceable: **where it came from**, **when it was captured**, and **whether it was later corrected**.

This matters because community sites lag the live game in different places. Scrapes are valuable local copies of *what a site said*, not automatic truth.

## Layers (never mix)

| Layer | Role | Editable by hand? | Examples |
|-------|------|-------------------|----------|
| **Source scrapes** | Exact local snapshot of an external site at `scrapedAt` | **No** — re-scrape only | `partner-skills/sources/*.json` |
| **Corrections** | Ground truth that overrides scrapes when querying | **Yes** — only place for in-game truth | `partner-skills/corrections/corrections.json` |
| **Discrepancies** | Tracking which sources disagree / are wrong | **Yes** for known-inaccuracies; auto for cross-diff | `partner-skills/discrepancies/*` |
| **Resolved views** | Merge of scrapes + corrections for agent/tool queries | **No** — rebuild via scripts | `partner-skills/resolved.json` |
| **Deployed data** | What the live site ships | Via build pipeline, not wiki scrapes | `pals_data.json`, `icons/`, generated HTML |

**Rule:** never edit a scrape file to “fix” a wrong description. Add a correction (and log the inaccuracy). Re-scraping must not erase human verification.

## Provenance fields on scraped files

Scraped JSON should include a `provenance` object:

```json
{
  "provenance": {
    "sourceId": "game8",
    "sourceLabel": "Game8",
    "sourceUrl": "https://game8.co/games/Palworld/archives/439665",
    "kind": "skill_catalog",
    "scrapedAt": "2026-07-12T00:00:00.000Z",
    "scraper": "scripts/scrape-partner-skills.js",
    "note": "Scraped snapshot only. Do not hand-edit."
  }
}
```

Older single-file refs (`passive_skills.json`, `work_suitability.json`) still use top-level `source` / `scrapedAt`. Prefer the fuller `provenance` shape for new work.

## Partner skills (active multi-source project)

See **[partner-skills/README.md](./partner-skills/README.md)** for the session workflow, file map, and how to apply screenshot-based corrections.

- Progress checklist: `partner-skills/checklist.json` + `CHECKLIST.md` (all pals)
- **Evidence archive:** every in-game screenshot is permanent under `partner-skills/corrections/evidence/` — never delete or overwrite

Sources (each file is independent):

| sourceId | URL |
|----------|-----|
| `wiki-gg` | https://palworld.wiki.gg/wiki/Partner_Skills |
| `game8` | https://game8.co/games/Palworld/archives/439665 |
| `fandom` | https://palworld.fandom.com/wiki/Partner_Skills |
| `paldb` | https://paldb.cc/en/Partner_Skill |

## Other reference sets (current)

| File | Source | Notes |
|------|--------|--------|
| `passive_skills.json` | wiki.gg Passive Skills/List | Single-source scrape today |
| `work_suitability.json` | fandom Work Suitability | Definitions + priority notes |
| `pals_data.json` (repo root) | Community dumps + paldb icons | Deployed dataset; separate from wiki partner-skill catalogs |

When those gain multi-source treatment, follow the same **sources / corrections / discrepancies / resolved** split as partner skills.

## Query policy for agents

1. Prefer **`resolved.json`** (or equivalent) for “what we believe is correct.”
2. If resolving a conflict or citing a site, read that site’s **source** file and cite `sourceUrl` + `scrapedAt`.
3. If the user provides an in-game screenshot, update **corrections** + **known-inaccuracies**, then rebuild resolved — do not overwrite sources.
4. Never invent provenance. If origin is unknown, mark it unknown.

## Rebuild commands

```bash
npm run scrape-partner-skills   # partner skills only (all 4 sources + resolved)
npm run scrape-reference        # passives + work suitability + partner skills
```
