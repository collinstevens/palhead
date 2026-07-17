# Reference data provenance

Palhead uses **two external offline corpora**, with different jobs:

| Corpus | Path | Role |
|--------|------|------|
| **Game data (SoT)** | `C:\projects\collinstevens\paldb-cc-exports` | Palworld facts → `data/vendor/` |
| **Style / UX sample** | `C:\projects\collinstevens\wowhead-com-exports` | Wowhead layout, chrome, writing voice → `data/style-vendor/` |

Never mix them. Style JSON is not game truth. Game JSON is not a layout guide.

---

## 1. Game data — paldb.cc

**[paldb.cc](https://paldb.cc) is the complete source of truth for Palworld game data.**

- Prefer paldb (live site, offline HTML export, or distilled/publish JSON from `paldb-cc-exports`) over wiki.gg, Game8, Fandom, or ad-hoc verification overlays.
- Do **not** run multi-site discrepancy checks, Palpedia screenshot checklists, or “correction” layers that override paldb.
- Site pages should attribute game data to paldb when shown.

Import:

```bash
npm run data:import    # latest under paldb-cc-exports/data/publish → data/vendor/
```

Resolution: `PALDB_PUBLISH_DIR` → CLI path → newest `catalog.json` under  
`C:\projects\collinstevens\paldb-cc-exports\data\publish`.

---

## 2. Style / UX reference — wowhead.com sample

**[wowhead.com](https://www.wowhead.com/)** offline sample via  
`C:\projects\collinstevens\wowhead-com-exports` is the reference for making Palhead **feel like a Wowhead-class database site**:

- Homepage section density and card chrome  
- News / guide writing structure (headlines, bylines, TOC, callouts)  
- Database hub filter density and nav patterns  
- Blue Tracker / “today” hub UX patterns  

It is a **sample-first** corpus (homepage + ~2 links per front-page section), not a full Wowhead mirror. See that repo’s `docs/DATA-REFERENCES.md` and `README.md`.

Import:

```bash
npm run style:import   # latest under wowhead-com-exports/data/publish → data/style-vendor/
```

Resolution: `WOWHEAD_STYLE_DIR` → CLI path → newest publish under  
`C:\projects\collinstevens\wowhead-com-exports\data\publish` → else  
`wowhead-com-exports/data/distilled`.

**Rules:**

- Use style-vendor only for design, IA, and copy **patterns**.  
- Do **not** ship Wowhead branding, trademarks, or scraped WoW game content as Palhead product data.  
- Do **not** treat style fields as Palworld facts.

Typical style tables (when present): `homepage.json`, `news.json`, `guides.json`,  
`blue_tracker.json`, `today_in_wow.json`, `database_hub.json`, `sample_index.json`, `pages.json`.

---

## 3. Local exception: status effects

`reference/status-effects/` is in-game **Survival Guide → Tips → Status Effects** text with screenshots.  
Preserve evidence; re-ship when guides return. Not from paldb multi-wiki merge; not from Wowhead.

---

## Build pipeline

```bash
npm run build
# = data:import (paldb game) + style:import (wowhead UX) + normalize + SSG
```

| Step | Input | Output |
|------|--------|--------|
| `data:import` | paldb-cc-exports publish | `data/vendor/` |
| `style:import` | wowhead-com-exports publish | `data/style-vendor/` |
| `data:normalize` | `data/vendor/` only | `data/normalized/` |
| `build.js` | normalized game data | `dist/` |

Normalize and SSG **consume game vendor data**. Style vendor is agent/designer reference for implementing Wowhead-like chrome in `site/` (multi-page SSG + vanilla JS — never React/Next/SPA).

---

## Agent policy

1. **Game facts** → paldb / `data/vendor` / `paldb-cc-exports`  
2. **Layout / density / voice** → wowhead sample / `data/style-vendor` / `wowhead-com-exports`  
3. Do not invent multi-source game merges  
4. Never invent provenance  
5. Never use Wowhead sample content as Palworld mechanics or item tables  
