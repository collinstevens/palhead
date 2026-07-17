# Reference data provenance

## Source of truth

**[paldb.cc](https://paldb.cc) is the complete source of truth for Palworld game data on this project.**

- Prefer paldb (live site, offline HTML export, or distilled JSON from `paldb-cc-exports`) over wiki.gg, Game8, Fandom, or ad-hoc in-game re-verification.
- Do **not** run multi-site discrepancy checks, Palpedia screenshot checklists, or “correction” overlays that override paldb.
- Site pages should attribute game data to paldb when shown.

Local files under `reference/` are **cached snapshots** for offline builds and agents — not competing truth layers.

## What we still keep separately

| Data | Why it is not “from paldb” |
|------|----------------------------|
| `reference/status-effects/` | Survival Guide text captured in-game with screenshots (paldb may not mirror this catalog the same way). |
| `pals_data.json` (repo root) | Compact deployed pal work/elements/icons table; icons historically from paldb CDN. Prefer regenerating from paldb-derived data going forward. |
| `docs/SITE-REBUILD.md` | Plan to rebuild the full database from `paldb-cc-exports`. |

## Partner skills

| Path | Role |
|------|------|
| `partner-skills/sources/paldb.json` | Scraped snapshot of https://paldb.cc/en/Partner_Skill — **only** partner-skill source used by the site |
| `partner-skills/README.md` | How to refresh the scrape |

Refresh:

```bash
npm run scrape-partner-skills
```

## Other reference caches (legacy / agent lookup)

These may still come from older single-site scrapes. When refreshing, prefer paldb / `paldb-cc-exports` if available.

| File | Current note |
|------|----------------|
| `passive_skills.json` | Legacy wiki.gg scrape; treat as cache until replaced by paldb extract |
| `work_suitability.json` | Legacy fandom scrape; treat as cache until replaced by paldb extract |

## Query policy for agents

1. For game facts: use **paldb.cc** or local paldb snapshots / `paldb-cc-exports` distilled tables.
2. Do not invent multi-source merges or in-game “corrections” unless the user explicitly asks.
3. Status effects: use `reference/status-effects/` (in-game Survival Guide).
4. Never invent provenance. If origin is unknown, mark it unknown.

## Rebuild commands

```bash
npm run scrape-partner-skills   # paldb partner skills only
npm run scrape-reference        # passives + work suitability + partner skills
npm run build                   # regenerate HTML + dist/
```
