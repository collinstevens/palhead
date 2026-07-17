# Reference data provenance

## Source of truth

**[paldb.cc](https://paldb.cc) is the complete source of truth for Palworld game data on this project.**

- Prefer paldb (live site, offline HTML export, or distilled/publish JSON from `paldb-cc-exports`) over wiki.gg, Game8, Fandom, or ad-hoc verification overlays.
- Do **not** run multi-site discrepancy checks, Palpedia screenshot checklists, or “correction” layers that override paldb.
- Site pages should attribute game data to paldb when shown.

Build pipeline:

1. `npm run data:import` — pin a publish bundle into `data/vendor/`
2. `npm run data:normalize` — produce `data/normalized/`
3. `npm run build` — static HTML + `dist/`

## Exception: status effects

`reference/status-effects/` is in-game **Survival Guide → Tips → Status Effects** text with screenshots. It is not a multi-wiki scrape and is not currently shipped on the live rebuild scaffold. Preserve evidence; re-ship when guides return.

## Agent policy

1. Game facts → paldb / `data/vendor` / `paldb-cc-exports`
2. Do not invent multi-source merges
3. Never invent provenance
