# Palhead Site Rebuild — Palworld Wowhead Plan

**Status:** draft for review  
**Date:** 2026-07-16  
**Live site:** https://palhead.pages.dev  
**Game data source:** `C:\projects\collinstevens\paldb-cc-exports` (distilled / publish bundle)  
**Style / UX sample:** `C:\projects\collinstevens\wowhead-com-exports` (sample homepage + section links)

This document is the product and engineering plan to recreate Palhead as a full **entity database + tools** site (Wowhead-shaped for Palworld): **paldb** for structured Palworld facts, **wowhead-com-exports** for layout density, IA, and writing-style patterns (not WoW game data).

No implementation is implied by this file alone. Phases are ordered so each leaves a usable site.

---

## 1. Goal

Turn Palhead from a small tools hub (work suitability spreadsheet, partner skills, base tips, status effects) into a **comprehensive Palworld database**:

- Every important game entity is a **list + detail page**
- Entities **cross-link** (pal → skill → item → drop → recipe → structure)
- **Tools** sit on the same data (work suitability, breeding, team builder, drop finder)
- Site stays **static**, deployable to Cloudflare Pages on branch **`master`**
- Local **in-game corrections** (partner skills, status effects) remain first-class overlays with provenance

### Wowhead mapping

| Wowhead concept | Palhead equivalent |
|-----------------|--------------------|
| Creature / NPC | Pal, alpha, boss, human |
| Spell / ability | Active, passive, partner skill |
| Item | Materials, weapons, armor, consumables, spheres, … |
| Recipe / profession | Crafting recipes + workstations |
| Zone / map | Maps, POIs, camps, dungeons, fishing |
| Calculator / tool | Breeding, work suitability, team builder, drop finder |
| Global search + tooltips | Site-wide search + hover entity cards |
| Patch notes / news | Versions, patch notes, tips |

### Differentiation from paldb.cc

- Better **search, filter, and tools**
- **Curated overlays** (in-game verified partner skills + Survival Guide status effects)
- Cleaner UX and deep-linkable tools
- Do **not** 1:1 clone paldb layout or branding
- Attribute data source; treat extract as community/site-derived structured data, not “official game files”

---

## 2. Current baseline

### Palhead today (Phase 0 clean slate)

Old mini-site (work sheet, partner catalog, base tips, status-effects page, scrapes) was **removed** to prepare for the rebuild.

| Asset | Role |
|-------|------|
| `build.js` | Minimal SSG placeholder home |
| `scripts/data-import.js` | Pin paldb publish → `data/vendor/` |
| `scripts/data-normalize.js` | Stub normalize → `data/normalized/` |
| `icons/` | ~285 local pal icons (`.webp`) kept for Phase 1 |
| `reference/status-effects/` | Survival Guide JSON + evidence (not shipped yet) |
| `docs/SITE-REBUILD.md` | This plan |
| Cloudflare Pages | `dist/` only; project `palhead`; production branch `master` |

### paldb-cc-exports today

Pipeline complete through **extract → validate → publish**.

| Fact | Value (as of 2026-07-16 demo bundle) |
|------|--------------------------------------|
| Tables | ~70 |
| Raw distilled size | ~22 MB |
| Validation | pass (0 errors, minor warnings) |
| Pals entities | 592 total (~266 with positive `ZukanIndex` / deck #) |
| Active skills | 374 |
| Passive skills | 286 |
| Partner skills | 289 |
| Recipes | ~1,759 |
| Structures | ~551 |
| Drop rows | ~12,653 |

**Known data limits (plan around these):**

- **Breeding:** CombiRank + breedable pal list only — **no full parent×parent matrix** in offline export
- Some index HTML shells are empty/thin (work priority, party buffs, some production indexes)
- Some fields still stringy (e.g. `recipe_materials`, `owner_slugs`) and need normalize-on-import
- Item/skill **icons** are not a first-class palhead asset pipeline yet
- `pals.json` includes bosses, gym leaders, specials — not only dex pals

### Must preserve

- Status-effects **in-game evidence** under `reference/status-effects/` (not shipped until guides return)
- paldb-as-SoT policy in `reference/PROVENANCE.md`
- Hard stack rule: multi-page SSG + vanilla JS — never React/Next/SPA
- Deploy path: `npm run deploy` → `dist` → Pages `--branch master`

---

## 3. Product principles

1. **Database-first, tools-second** — tools consume the same normalized entities as pages.
2. **Cross-links everywhere** — Wowhead’s power is graph navigation, not walls of text.
3. **paldb.cc is the game-data source of truth** — no multi-site verification, Palpedia checklists, or correction overlays that override paldb. Attribute data version / extract date in the footer when shipping distilled data.
4. **Static multi-page forever** — no app server; Cloudflare Pages only; never React/Next/SPA.
5. **Ship vertical slices** — each phase exits with something usable and deployable.
6. **Honest gaps** — hide empty sections; document missing matrices (breeding) instead of inventing data.

---

## 4. Architecture

### Data flow

```text
paldb-cc-exports
  data/distilled/*.json   (or data/publish/paldb-data-<tag>/)
           │
           ▼  npm run data:import
  palhead/data/vendor/    pinned snapshot + catalog/version meta
           │
           ▼  npm run data:normalize
  palhead/data/normalized/
    entities, relations, search-index, compact list indexes
           │
           ▼  npm run build  (modular SSG)
  dist/   HTML pages + icons + compact client JSON
           │
           ▼
  Cloudflare Pages (master)
```

### Recommended stack (default)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Hosting | Cloudflare Pages (existing) | Already production |
| Build | Node modular SSG (evolve beyond single `build.js`) | Thousands of entity pages |
| CSS | Tailwind CDN initially; local Tailwind optional later | Match current look |
| Client JS | Small vanilla modules per tool/list | Progressive enhancement only |
| Data | Vendored publish bundle snapshot | Reproducible deploys |
| Icons | Existing pal icons first; item icons later | Unblocks content |

**Routing model:** multi-page **static HTML** (SSG) + light client JS for filter/sort/search on list pages (SEO-friendly deep links, Wowhead-like share URLs).

### Hard stack rule — no SPA / React / Next

**Permanent decision (not a v1 temporary preference):**

- **Do not** rewrite Palhead as a React, Next.js, Vue, SvelteKit, or other SPA/CSR app framework site.
- **Do not** introduce a client-side router that owns the whole app shell.
- **Do** stay multi-page static HTML generated at build time (Node SSG is fine; Astro-like SSG only if it stays zero-JS-by-default and is explicitly approved later — default remains plain Node + HTML).
- **Do** use small vanilla JS modules for interactivity (tables, filters, calculators).
- Optional later: local Tailwind build, image tooling — still not a React/Next app.

### Proposed URL scheme

```text
/                              home / hub
/pals/                         pal list
/pal/{slug}/                   pal detail
/skills/partner/               partner skill list
/skills/partner/{slug}/        partner skill detail
/skills/passive/               …
/skills/active/                …
/items/                        item category hub
/items/{category}/             e.g. materials, weapons
/item/{slug}/                  item detail
/structures/                   structure list
/structure/{slug}/             structure detail
/tech/                         technologies
/world/alphas/                 world content sections
/world/drops/                  drop browser
/tools/work-suitability/       upgraded sheet
/tools/breeding/               calculator (limited by data)
/tools/team-builder/           party planner
/guides/base-tips/             existing guide content
/guides/status-effects/        existing guide content
/search/                       global search UI
```

Cloudflare Pages supports nested folders (`/pal/anubis/index.html`) or flat files; **lock one style in Phase 0** and keep aliases/redirects for old `pals.html` etc. during migration.

### Normalize layer responsibilities

- Canonical `id` / `slug` / `name` / `kind`
- Dex filter flags (`is_dex_pal`, positive zukan, `flags.is_pal`)
- Element name normalization (Leaf/Grass, Earth/Ground, etc.)
- Structured arrays for materials, workstations, owners where extract left strings
- Relation indexes: pal→skills, item→recipes, item→drops, skill→owners
- Compact list indexes + search index for the client

### Data refresh workflow

```text
1. paldb-cc-exports: discover → export → classify → extract --all → validate → publish
2. palhead: npm run data:import   # pin bundle + version
3. palhead: npm run data:normalize
4. palhead: npm run build
5. palhead: npm run deploy        # --branch master
```

Status-effect evidence under `reference/status-effects/` is separate from import and is never overwritten by import.

---

## 5. Phase map

| Phase | Name | Status | Outcome |
|------:|------|--------|---------|
| 0 | Foundations | **Done** | Ingest, normalize contract, URL scheme, shell, search schema |
| 1 | Pals database | **Done** | Pal list + detail; work tool migration |
| 2 | Skills database | **Done** | Partner / passive / active lists + detail |
| 3 | Design / style / UX | **Done** | Wowhead-influenced chrome, empty states, design system |
| **4** | **Items & recipes** | **Next** | Inventory encyclopedia + craft/drop links **inside Phase 3 chrome** |
| 5 | Base & technology | Pending | Structures, workstations, tech, work/SAN **inside Phase 3 chrome** |
| 6 | World content | Pending | Alphas, bosses, drops, merchants, maps (list-first) **inside Phase 3 chrome** |
| 7 | Tools | Pending | Breeding (honest limits), team builder, drop finder **inside Phase 3 chrome** |
| 8 | Platform polish | Pending | Global search, tooltips, news, SEO, perf — **extend chrome, do not replace it** |

**Why Phase 3 sits here:** Content surfaces for pals + skills already exist. Chrome, density, empty states, and shared components are **locked** so phases 4–8 only fill content into that system. Style corpus: `wowhead-com-exports` → `data/style-vendor/`.

**Earlier MVP note:** Phases 0–2 were the data MVP cut. Phase 3 design is done. **Current focus:** Phase 4 items — every new page reuses the Wowhead UX contract below.

### Wowhead UX contract (mandatory for phases 4–8)

Phases 4–8 are **content and tools inside existing chrome**, not redesigns. Before writing page code, re-read `docs/STYLE-NOTES.md` and skim `data/style-vendor/homepage.json` (and relevant database/guide samples) for density cues.

| Must | Must not |
|------|----------|
| Use `site/shell.js` page shell (header, dual nav, icon rail, centered 1280px main, footer) | Invent a second layout system or full-bleed content without the island |
| Reuse `wh-*` tokens/classes (`wh-panel`, `wh-filter-bar`, `wh-table`, `wh-breadcrumb`, `wh-entity-head`, `wh-btn`, …) | One-off hex colors or ad-hoc card kits that fight the design tokens |
| Reuse `site/empty.js` for no-results, reserved sections, and “coming soon” | Fake sample items/structures to “look finished” |
| Match pals/skills list pattern: filter bar → result count → table/cards (where lists apply) | Dump unpaginated walls of rows (especially drops) |
| Match pals/skills detail pattern: breadcrumb → title/icon block → quick facts → section panels | Bare wiki dumps without section hierarchy |
| Cross-link entities like Wowhead (item → recipe → structure → drop → pal) | Dead-end pages with no graph links |
| Keep multi-page SSG + vanilla JS; client JS only for filters/calculators | React / Next / SPA / client app router |
| Promote stubs to live content in place (same URLs); keep remaining stubs honest | Leave broken nav or invent parallel “v2” routes |
| Attribute game data via existing footer / subtle source chips | Wowhead trademarks, logos, or copied WoW article text |

**Shared primitives to extend (do not fork):**

- `site/shell.js` — CSS tokens, nav IA, footer, page wrap  
- `site/empty.js` — empty states, reserved feed rows, panel helper  
- List clients: pattern after `site/client/pals-browser.js` / `skills-browser.js`  
- Stub→live: replace `site/pages/stub.js` content for a path; do not invent a second hub style  

**Style refresh (optional mid-phase):** `npm run style:import` when layout questions arise — style-vendor is cues only, never game facts.

---

## 6. Phase 0 — Foundations

### Goal

Make the site capable of growing to thousands of pages without a second rewrite.

### Deliverables

1. **Data import**
   - Script copies `paldb-cc-exports` distilled or publish bundle into `data/vendor/`
   - Pin version from `catalog.json` / extract-manifest (`generated_at`, table counts)
   - Show data version in footer

2. **Normalize pipeline**
   - Output under `data/normalized/`
   - Entity kinds: pal, skill_partner, skill_passive, skill_active, item_*, structure, tech, world_*
   - Relation tables and search-index contract
   - No correction overlays — paldb vendor data only

3. **URL + build skeleton**
   - Modular SSG entry (started from minimal `build.js`)
   - Shared shell: header, nav, footer, entity page layout tokens
   - One sample entity page generated end-to-end from distilled JSON

4. **Search index contract**
   - Compact records: `{ name, type, slug, path, elements?, icon?, rank? }`
   - Built at normalize/build time; client loads for Cmd/Ctrl-K later

5. **Docs / agent notes**
   - Architecture section in this doc is source of truth until AGENTS.md is updated after Phase 0 lands
   - Document refresh commands in package.json scripts

### Decisions to lock in Phase 0

- [x] Nested routes (`/pal/anubis/`) — not flat HTML
- [x] Vendor via `npm run data:import` — auto-picks **latest** bundle under `paldb-cc-exports/data/publish` by `catalog.generated_at` (`npm run build` re-imports every time)
- [x] Default pal list filter: **dex** (`deck > 0`); all entities still normalized and get pages
- [x] Stack locked: multi-page SSG + vanilla JS — **never** React/Next/SPA

### Exit criteria

- [x] Import + normalize + build is one documented command chain (`data:import` → `build`)
- [x] Home shows real catalog counts from vendored/normalized data
- [x] Sample entity page renders from distilled JSON (`/pal/anubis/`; all pals also generated)
- [x] Footer shows data version + validation status when available
- [x] Deployable `dist/` (mini-site removed intentionally; placeholder + entities)

---

## 7. Phase 1 — Pals database

### Goal

Replace “spreadsheet-only identity” with a full pal encyclopedia; keep the work sheet as a first-class **tool view**.

### List page (`/pals/`)

- Filters: element, work suitability mins, size, food, rarity, deck range, mount?
- Columns: icon, #, name, elements, key stats, top work skills
- Sort all columns; preserve zero-work sink when sorting work desc
- View modes: **Table** (current strength) | **Cards** | **Compact**
- Default: dex pals; toggle for bosses/specials if desired

### Detail page (`/pal/{slug}/`)

Sections / tabs:

- Overview — elements, size, food, rarity, genus, deck #
- Stats — HP/ATK/DEF ranges, melee, support, work speed
- Work suitability
- Partner skill (link out; correction badge if overlayed)
- Passive skills
- Movement / ride
- Breeding — CombiRank, male %, egg type when present
- Drops — when drop data links by slug
- Related — variants, alpha, saddles, skill fruits

### Data sources

- `pals.json`, `pal_index.json`, `pal_stats.json`
- Existing `icons/` (+ gap fill)
- Element naming normalize

### Migration

- Current `pals.html` → `/tools/work-suitability/` (or keep filename alias)
- Outbound paldb.cc links become secondary “source” links, not primary identity

### Exit criteria

- [x] Every dex pal has a detail page (all pals have pages; list defaults to dex)
- [x] List filters: element, work min, size, food, rarity, search, dex toggle; table/cards/compact
- [x] Deep-linkable pal URLs (`/pal/{slug}/`)
- [x] Work suitability tool at `/tools/work-suitability/` linked from nav

---

## 8. Phase 2 — Skills database

### Goal

Partner, passive, and active skills as first-class entities with ownership and item links.

### Lists

| Kind | Key columns |
|------|-------------|
| Partner | Name, owner pals, category, short description |
| Passive | Name, rank, weight, modifiers |
| Active | Name, element, power, CT, range, status, skill fruit |

### Detail pages

- Full description and scaling text
- Owners / learners
- Related pals
- Related items (skill fruits for active skills)
- Provenance chips: `paldb` | `in-game verified`

### Data

- Partner / passive / active from paldb extract only (no multi-site merge)

### Migration

- Current partner catalog becomes the partner skills list (or a filtered view of it)
- Base tips remain a guide that links into skill + pal pages

### Exit criteria

- [x] All three skill types browsable (`/skills/partner|passive|active/`)
- [x] Pal detail pages link to partner skill details
- [x] Skill detail pages with owners (partner/passive) and skill fruit note (active)

---

## 9. Phase 3 — Design / style / UX (Wowhead-influenced) **Done**

### Goal

Make Palhead **look and feel like a serious game database** (Wowhead-class density and IA) **before** adding more entity kinds. Use empty / stub surfaces so layout can be judged without waiting on items/world data.

**Influences hard from:** `C:\projects\collinstevens\wowhead-com-exports` → `npm run style:import` → `data/style-vendor/`  
(homepage sections, news/guides chrome, database hub density — **not** WoW facts, **not** Wowhead trademarks)

**Game facts still from:** paldb only (`data/vendor/`).

### Why empty states first

- Design list headers, side rails, toolbars, and feed rows without shipping incomplete item/world content  
- Every future content phase reuses the same empty, loading, and “no results” patterns  
- Homepage can show reserved slots (News, Guides, Database cards) the way Wowhead reserves section chrome  

### Design principles (Palhead, not a clone)

| Take from Wowhead (feel) | Do not take |
|--------------------------|-------------|
| Dense primary nav + secondary tool links | Wowhead logo, name, colors, copy |
| Sticky header, filter bars above wide tables | SPA / client router |
| Entity page: icon + title + quick facts + tabs/sections | Live Wowhead assets or trackers |
| Homepage multi-panel grid (news / tools / db) | Full news CMS before we have posts |
| Clear empty states (“No news yet”, “Coming soon”) | Fake sample content that looks like real data |
| High information density, scannable tables | Clutter without hierarchy |

Still: multi-page SSG + vanilla JS only.

### Deliverables

1. **Design tokens + shell v2** (`site/shell.js` + shared CSS)
   - Header height, nav density, panel borders, table sticky columns, accent usage  
   - Align with dark `pal.*` palette but tighter Wowhead-like spacing  
   - Footer already shows data version / bundle — keep, restyle if needed  

2. **Empty-state component kit**
   - `emptyState({ icon, title, body, cta? })` — already partially exists; standardize  
   - Variants: **no results** (filters), **section reserved** (soon), **no posts** (news), **coming soon tool**  
   - Never invent fake pals/items to fill space  

3. **Homepage redesign (Wowhead-influenced layout, empty where needed)**
   - Top: quick tools / database entry points (live: Pals, Skills, Work)  
   - Mid: multi-column or grid **panels** for News / Guides / Database with empty rows  
   - Optional right rail or secondary column for “site status” / data version  
   - Read section order inspiration from `data/style-vendor/homepage.json` (Blue Tracker → Guides → Countdowns → Today → Featured News → All News as **layout metaphors**, rename to Palworld-relevant empty sections)

4. **Entity chrome pass (apply to existing pals + skills)**
   - List pages: filter bar + result count + table/cards toggle styling consistency  
   - Detail pages: breadcrumb, title block, stat cards, section headers — same rhythm on pal and skill  
   - “Source: paldb” chips stay subtle, not wiki-verify noise  

5. **Stub routes with empty shells (optional but recommended)**
   Wire navigable empty pages so IA is real before Phase 4 content:

   | Path | Empty state meaning |
   |------|---------------------|
   | `/news/` or home `#news` | No posts yet |
   | `/guides/` | Guides reserved (status-effects can reappear later) |
   | `/items/` | Items database coming (Phase 4) |
   | `/tools/` | Tools hub; work suitability linked; breeding/team “soon” |
   | `/database/` (optional) | Hub of category cards, empty or live |

6. **Style-vendor workflow**
   - `npm run style:import` (already on `npm run build`)  
   - Short `docs/STYLE-NOTES.md` or section in this plan: what we copied as patterns vs what we rejected  
   - Agents: when restyling, open `data/style-vendor/homepage.json` + guide/news samples for density cues  

### Explicit non-goals for this phase

- No new game entity tables (items, structures, world) beyond empty hubs  
- No React/Next/SPA  
- No pixel-perfect Wowhead clone or stolen assets  
- No real news/CMS backend  

### Exit criteria

- [x] Shared shell/tokens feel intentional and consistent across home, pals, skills, tools  
- [x] Standard empty-state patterns used for no-results + reserved sections  
- [x] Homepage has Wowhead-like multi-panel structure with honest empty/soon panels  
- [x] Existing live tools still work (pals list, work suitability, skill pages)  
- [x] Stub hubs (news, guides, items, structures, tech, world, tools children)  
- [x] Design notes document Wowhead influence vs Palhead identity (`docs/STYLE-NOTES.md`)  

### Status

**Done** (shell + stubs + migrate live pages). Chrome is the baseline for phases 4–8 — extend it; do not redesign from scratch.

---

## 10. Phase 4 — Items, gear, recipes **← current**

### Goal

Inventory encyclopedia + “how do I get / craft this?” — **shipped inside the Phase 3 Wowhead chrome**, not a parallel items UI.

### Wowhead UX requirements (this phase)

- Promote `/items/` stub → live **database hub** (category cards in `wh-panel` grid, same density as `/database/` / home panels)
- Category lists mirror **pals/skills list chrome**: sticky filter bar, search, result count, dense `wh-table` (and optional cards later)
- Item detail mirrors **pal/skill detail chrome**: `wh-breadcrumb` → entity head (name + rarity color; icon when 4b) → quick-fact chips → stacked `wh-panel` sections
- Recipes browser uses the same filter-bar + table pattern; craft tree is nested panels / indented rows, not a new visual language
- Bidirectional links (crafted at, materials, used in, dropped by) use standard entity link styles (`wh-link` / table name column)
- Empty: hide sections with no data; filter no-results use `empty.js` — never fake items
- Nav: Database → Items becomes **live** (drop “soon”); remaining empty categories stay stubs with reserved empty state
- Style cues: `data/style-vendor/` database hub samples for category-index density; do not invent full-width marketplace layouts

### Nav categories

Materials · Weapons · Armor · Accessories · Consumables · Ammo · Ingredients · Spheres · Sphere modules · Schematics · Key items · Saddles · Skill fruits

### Item detail

- Rarity, weight, stack, description, code
- Crafted at / materials (`recipes.json`)
- Dropped by (`drops.json` reverse index)
- Used in (reverse recipes)
- Tech unlock when linkable (`technologies.json`)

### Recipes browser

- Filter by workstation, product category, input material
- Craft tree expansion 1–2 levels deep in v1
- Same list chrome as category pages (filters + dense table)

### Data hygiene

- Normalize stringy material/workstation fields into structured arrays
- Drop junk rows (empty slug `-`, thin export shells)
- Hide empty sections rather than showing placeholders

### Icons sub-phases

- **4a:** Text + rarity color (ship without icons) — rarity uses gold/quality-adjacent tokens already in shell where possible
- **4b:** Icon harvest pipeline (CDN or export assets) — separate task; when icons land, drop into existing entity-head slot (like pal icons)

### Exit criteria

- [ ] Major item categories have list + detail **using shell + list/detail patterns from pals/skills**
- [ ] Bidirectional craft links work for majority of clean recipes
- [ ] Item pages link from pals/drops when data exists
- [ ] `/items/` is no longer a generic “coming soon” stub; remaining unbuilt surfaces still use honest empty states
- [ ] No new layout/CSS system; pages sit in the centered 1280px shell

---

## 11. Phase 5 — Base, work, technology

### Goal

Base-building side of the database: buildings, stations, tech tree, work power — **same encyclopedia chrome as pals/items**.

### Wowhead UX requirements (this phase)

- Promote `/structures/` and `/tech/` stubs → live lists/hubs with category chips or subnav (Wowhead database-section density)
- Structure detail: entity head + panels for category, work requirements, linked recipes, related tech
- Tech list/detail: level / points / category filters on the shared filter bar; detail links to unlocks (structures/items)
- Work suitability tool already live: any data-source upgrade **keeps** current tool chrome (filter bar + table); do not restyle into a different app
- SAN / sickness pages (if shipped): guide-like or table-like panels consistent with skill lists — not a third visual language
- Guides: when Base Tips returns under `/guides/`, use guide panel chrome from Phase 3 empty guide hub (fill reserved slots; do not invent CMS chrome)
- Cross-links: structure ↔ recipe ↔ item ↔ work type ↔ pal (graph navigation)

### Pages

- Structures by category (Production, Storage, Food, Infrastructure, Lighting, Foundations, Defenses, Furniture, Other, Breeding Farm, Expedition, Fishing Pond, …)
- Work stations + recipes they support
- Technologies by player level / points / category
- Work suitabilities: level→power, pals by level (upgrades current tool data path)
- SAN thresholds / sicknesses (`san.json`)
- Keep **Base Tips** as a guide fed by partner skills

### Exit criteria

- [ ] Structures + technologies browsable in Phase 3 shell
- [ ] Work suitability tool reads normalized distilled work data (not only legacy `pals_data.json`) without a visual rewrite
- [ ] Structure detail links to recipes and required work types when known
- [ ] Filter no-results / empty categories use shared empty states

---

## 12. Phase 6 — World content

### Goal

Answer “where does this live / drop / spawn?” — list-first, dense tables, Wowhead “finder” density without SPA maps-first.

### Wowhead UX requirements (this phase)

- Promote `/world/` stub → world hub with category cards (alphas, bosses, drops, merchants, …) matching database hub panels
- Entity lists: same filter bar + dense table pattern; **paginate or virtualize** large sets (drops ~12k) — never one unpaginated dump
- Detail pattern: source entity → loot table panel → item links → region notes — section stack like pal detail
- Pal/item “obtained from” sections: add `wh-panel` blocks on existing detail pages; do not invent a floating widget system
- Maps/POIs: **list-first** tables/cards; interactive map only later and only if it fits shell (no full-screen map app that abandons chrome)
- Performance is a UX requirement: sticky headers, compact rows, mobile-usable filter bars (same tokens as pals list)

### Priority order

1. Alpha pals, tower bosses, raids, rampaging
2. Drops browser (by source / by item) — paginate or virtualize; never dump 12k rows into one unpaginated table
3. Merchants, bounty tokens, treasure boxes
4. Eggs, caged pals, fishing zones
5. Maps / POIs (list-first; interactive map only if POI quality justifies cost)
6. Humans, enemy camps, ancient ruins, journals

### Detail pattern

Source entity → loot table → item links → region notes when present (all inside standard section panels)

### Exit criteria

- [ ] Alphas + bosses + drops searchable/browseable in shell chrome
- [ ] Pal/item pages show “obtained from” when data exists (panel sections)
- [ ] Large tables remain performant on mobile (pagination/virtualization + dense rows)
- [ ] World hub replaces stub; unfinished world slices stay honest empty states

---

## 13. Phase 7 — Tools

### Goal

Sticky calculators that make Palhead more useful than raw tables — **tools live under the same header/subnav chrome as the database**, not a separate product skin.

### Wowhead UX requirements (this phase)

- Promote `/tools/` hub and child stubs (`breeding`, `team-builder`, `drop-finder`) using tools-hub panel layout already sketched in Phase 3
- Each tool page: breadcrumb + title block + short honest limit copy (especially breeding) + calculator UI inside `wh-panel`s
- Controls: reuse input/button tokens (`wh-input`, `wh-btn`, filter chips) so tools feel like advanced list filters, not a different app
- Results: dense tables or result cards consistent with entity lists; entity names link out to detail pages
- Work suitability: remain the reference implementation for tool chrome; new tools should feel sibling to it
- Empty / invalid states: shared empty kit (“pick two parents”, “no results”) — no blank white voids
- Never ship a client-side router or full-screen SPA shell for tools

| Tool | Depends on | Notes |
|------|------------|--------|
| Work suitability | Phases 1, 5 | Already strong; upgrade filters + data source |
| Partner catalog / base boosters | Phase 2 | Partially done |
| Breeding calculator | Phase 1 + `breeding.json` | CombiRank heuristics only until full matrix exists; UI must state limit |
| Team builder | Pals + skills + elements | Party of 5; element + work coverage |
| Capture helper | `capture_rates.json` | Thin data — ship only if useful |
| Drop finder | Phase 6 | “Where do I farm X?” |

### Breeding honesty rule

Do **not** invent a complete parent×parent matrix. Options later:

- Improve extract if paldb offline export gains matrix data
- Import an external open matrix with clear attribution
- Keep rank-based “possible outcomes” heuristics labeled as approximate

### Exit criteria

- [ ] Work suitability live on new data (chrome unchanged in spirit)
- [ ] At least one new calculator (breeding **or** team builder) live **under tools hub chrome**
- [ ] Tools consume normalized entities, not one-off JSON forks
- [ ] Tools hub no longer all-stub; remaining tools still show reserved empty states

---

## 14. Phase 8 — Platform polish

### Goal

Layer Wowhead-class **platform** behaviors (search, tooltips, news fill, SEO, perf) **on top of** the Phase 3 shell — polish the product, do not replace the design system.

### Wowhead UX requirements (this phase)

- **Global search:** implement the existing header search field stub (Cmd/Ctrl-K); results dropdown dense like Wowhead quick-search (icon, name, type, path) — not a separate search app page only
- **Hover tooltips** on entity links: compact card (icon + name + one-liner + type) using panel tokens; no third-party tooltip skin that fights dark theme
- **News / patch notes:** fill Phase 3 empty news chrome (`wh-feed-list` / home panels) with real rows from distilled meta when available — same feed row structure as reserved slots
- **SEO:** titles/meta/OG consistent with entity head naming; sitemap covers nested entity URLs
- **Perf:** split JSON, lazy icons, list virtualization — keep visual density; do not thin the UI to “feel faster”
- **A11y + mobile:** polish existing sticky nav / dual-row header; do not invent a mobile-only app chrome
- Optional interactive map / i18n: only if they stay multi-page + shell-compatible

### Deliverables

- Global search (Cmd/Ctrl-K) over search index
- Hover tooltips on entity links (icon + name + one-liner)
- News section: patch notes / versions / tips from distilled meta tables (fills Phase 3 empty news chrome)
- SEO: titles, meta description, Open Graph, sitemap from entity index
- Performance: split JSON, lazy icons, list virtualization for drops
- Accessibility + mobile nav polish
- Optional later: multi-language (exports are `en` today)
- Optional later: interactive map (high cost)

### Exit criteria

- [ ] Search finds entities across shipped kinds from the header control
- [ ] Tooltips match shell tokens on major entity link surfaces
- [ ] News/home feed uses real data or stays honestly empty (no fake posts)
- [ ] Core list pages stay fast on mid-range mobile
- [ ] Sitemap covers entity pages
- [ ] No redesign that abandons centered shell / `wh-*` system

---

## 15. What not to do early

- React / Next / SPA / client-router app rewrites (**never** — see hard stack rule)
- Interactive world map before drop/entity quality is proven
- Claiming complete breeding combinations without source data
- Shipping unpaginated 12k-row drop tables
- Copying paldb.cc branding or layout wholesale
- Copying Wowhead branding, trademarks, or assets wholesale
- Mixing scrape rows into correction files (provenance rule)
- Filling empty states with fake game data to “look finished”

---

## 16. Risk register

| Risk | Mitigation |
|------|------------|
| Distilled fields messy / thin | Normalize on import; hide empty UI sections; fix extract upstream when systematic |
| No full breeding matrix | Limited calculator + honest copy; improve data later |
| Icon coverage for items | Text + rarity first; icon pipeline as Phase 4b |
| Bundle size (~22 MB raw) | Per-page embed only needed fields; compact list indexes |
| Legal / attribution | Attribute paldb.cc; never ship Wowhead marks; review terms before heavy marketing |
| Scope explosion | Hard phase exit criteria; design phase before more content |
| Boss pollution in pal lists | Default dex filter; “show all entities” toggle |
| Dual data sources drift | Single normalize layer for game; style-vendor never mixed into entity facts |
| Design thrash during content phases | Lock chrome in Phase 3 before items/world |

---

## 17. First reviewable milestone

**Done:** Phases 0–3 (foundations + pals + skills + Wowhead chrome / empty stubs).

**Next reviewable:** Phase 4 items —

- `/items/` hub + category lists + item detail **in existing shell**  
- Recipes browser + bidirectional craft links  
- Filter bar / empty states / panels match pals & skills (Wowhead UX contract)  
- Rarity-as-text first (4a); icons optional follow-up (4b)

---

## 18. Open questions

1. **Breeding:** Ship limited calculator soon (Phase 7), or wait for matrix data?
2. **Item icons:** OK to ship Phase 4 without icons initially?
3. **News later:** Real posts only in Phase 8, or light patch-notes feed earlier from paldb `patch_notes.json`?

**Decided:**

- Palpedia verify tool / multi-site corrections removed; paldb = game SoT  
- **No React / Next / SPA**  
- **Name = Palhead**  
- **Mimic Wowhead density/IA as much as possible** without trademarks/assets  
- **Stub empty hubs for everything not built**; migrate live pages into new chrome  
- Wowhead sample = style influence only (`wowhead-com-exports` / `data/style-vendor/`)

---

## 19. Implementation checklist (high level)

### Phase 0 — done
- [x] `data:import` + latest publish
- [x] `data:normalize` + schemas
- [x] URL scheme locked (nested)
- [x] Shared shell + footer data version
- [x] Pal entity pages + package scripts

### Phase 1 — done
- [x] Pal list page + work suitability tool
- [x] Pal detail + nav

### Phase 2 — done
- [x] Partner / passive / active lists + detail + pal links

### Phase 3 — design / UX
- [x] Design tokens + shell v2 (Wowhead-dense nav)
- [x] Empty-state kit + reserved feed rows
- [x] Homepage multi-panel structure
- [x] Entity list/detail chrome pass (pals + skills)
- [x] Stub hubs: news, guides, items, structures, tech, world, tools/*
- [x] `docs/STYLE-NOTES.md`
- [x] Wowhead UX contract documented for phases 4–8

### Phase 4 — items
- [ ] Item category hub + lists + detail + recipes **(reuse list/detail chrome)**
- [ ] Reverse craft / drop indexes + entity cross-links
- [ ] Promote `/items/` stub; honest empties for unbuilt slices
- [ ] (Optional) icon pipeline 4b into existing entity-head slot

### Phase 5 — base / tech
- [ ] Structures + workstations + technologies + SAN **in shell panels**
- [ ] Work tool data upgrade without visual fork
- [ ] Structure ↔ recipe ↔ item graph links

### Phase 6 — world
- [ ] World hub + alphas / bosses / drops (paginated) **in shell**
- [ ] “Obtained from” panels on pal/item detail
- [ ] Maps list-first; no SPA map shell

### Phase 7 — tools
- [ ] Breeding and/or team builder under tools hub chrome
- [ ] Calculator panels + shared inputs/buttons + entity result links
- [ ] Honest breeding limits copy in UI

### Phase 8 — polish
- [ ] Header global search + entity tooltips (shell tokens)
- [ ] News feed fill or honest empty
- [ ] SEO sitemap, perf, a11y/mobile polish — extend chrome, don’t replace

---

## 20. Related repos and paths

| Path | Role |
|------|------|
| `C:\projects\collinstevens\palhead` | Site + tools + deploy |
| `C:\projects\collinstevens\paldb-cc-exports` | **Game data** crawl/export/extract/validate/publish |
| `paldb-cc-exports/data/distilled/` | Palworld domain JSON (~70 tables) |
| `paldb-cc-exports/data/publish/` | Versioned game bundles + `catalog.json` → `data/vendor/` |
| `C:\projects\collinstevens\wowhead-com-exports` | **Style/UX sample** pipeline (sample-first; not full mirror) |
| `wowhead-com-exports/data/distilled/` | homepage, news, guides, database_hub, … |
| `wowhead-com-exports/data/publish/` | Versioned style bundles → `data/style-vendor/` |
| `wowhead-com-exports/docs/DATA-REFERENCES.md` | Style sample targets |
| `wowhead-com-exports/docs/PIPELINE.md` | Wowhead pipeline stages |
| `palhead/reference/PROVENANCE.md` | Game vs style corpus policy |
| `palhead/data/` | vendor (game) + style-vendor (UX) + normalized (game) |
| `palhead/reference/status-effects/` | Survival Guide captures (guides phase) |

---

## 21. Changelog (plan doc)

| Date | Change |
|------|--------|
| 2026-07-16 | Initial multi-phase plan written for review |
| 2026-07-16 | Removed Palpedia verify / multi-source corrections; paldb.cc is SoT |
| 2026-07-16 | Hard rule: never React/Next/SPA — multi-page SSG + vanilla JS only |
| 2026-07-16 | Phase 0 prep: deleted old mini-site; import/normalize stubs + placeholder home |
| 2026-07-16 | Phase 0 implemented: normalize, nested SSG shell, all pal pages, search-index |
| 2026-07-16 | Phase 1: pals list + work suitability tool + detail polish |
| 2026-07-16 | Phase 2: partner/passive/active skill lists + detail pages |
| 2026-07-16 | Document + import wowhead-com-exports as UX/style reference (separate from paldb game data) |
| 2026-07-16 | **Insert Phase 3 Design/style/UX** (Wowhead influence + empty states); renumber items→polish to 4–8 |
| 2026-07-16 | Phase 3 implemented: dense shell, empty stubs, migrate live pals/skills/work into chrome |
| 2026-07-16 | Phases 4–8 plan expanded: mandatory Wowhead UX contract (reuse shell/`wh-*`/empty kit; no layout forks) |

When decisions land on open questions, record them here so implementers do not re-litigate architecture mid-flight.
