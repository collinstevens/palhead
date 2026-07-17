# Palhead Site Rebuild — Palworld Wowhead Plan

**Status:** draft for review  
**Date:** 2026-07-16  
**Live site:** https://palhead.pages.dev  
**Primary data source:** `C:\projects\collinstevens\paldb-cc-exports` (distilled / publish bundle)

This document is the product and engineering plan to recreate Palhead as a full **entity database + tools** site (Wowhead-shaped for Palworld), using the offline paldb.cc extract pipeline as the structured data backbone.

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

### Palhead today

| Asset | Role |
|-------|------|
| `build.js` | Single-file SSG: home, pals sheet, partner skills, verify, base tips, status effects |
| `pals_data.json` | Compact pal work/elements/icons (~dex pals) |
| `icons/` | ~285 local pal icons (`.webp`) |
| `reference/partner-skills/` | Multi-source scrapes + corrections + evidence screenshots |
| `reference/status-effects/` | In-game Survival Guide text + evidence |
| Cloudflare Pages | `dist/` only; project `palhead`; production branch `master` |

Nav already has “soon” stubs for News, Passive Skills, Items, Structures, Technology, Breeding Calculator, Team Builder.

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

- Status-effects **in-game evidence** under `reference/status-effects/` (Survival Guide; not multi-site wiki verification)
- paldb-as-SoT policy in `reference/PROVENANCE.md`
- Dark `pal.*` visual language
- Deploy path: `npm run deploy` → `dist` → Pages `--branch master`

---

## 3. Product principles

1. **Database-first, tools-second** — tools consume the same normalized entities as pages.
2. **Cross-links everywhere** — Wowhead’s power is graph navigation, not walls of text.
3. **paldb.cc is the game-data source of truth** — no multi-site verification, Palpedia checklists, or correction overlays that override paldb. Attribute data version / extract date in the footer when shipping distilled data.
4. **Static-first** — no app server required for v1; Cloudflare Pages only.
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
| Client JS | Small vanilla modules per tool/list | No framework tax for v1 |
| Data | Vendored publish bundle snapshot | Reproducible deploys |
| Icons | Existing pal icons first; item icons later | Unblocks content |

**Default routing model:** SSG multi-page site + client-side filter/search on list pages (SEO-friendly deep links, Wowhead-like share URLs).

**Not default for v1:** React/Next SPA rewrite before URL scheme and normalize layer are stable.

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

Partner corrections and status-effect evidence are **never** overwritten by import.

---

## 5. Phase map

| Phase | Name | Outcome |
|------:|------|---------|
| 0 | Foundations | Ingest, normalize contract, URL scheme, shell, search schema |
| 1 | Pals database | Pal list + detail; work tool migration |
| 2 | Skills database | Partner / passive / active lists + detail |
| 3 | Items & recipes | Inventory encyclopedia + craft/drop links |
| 4 | Base & technology | Structures, workstations, tech, work/SAN |
| 5 | World content | Alphas, bosses, drops, merchants, maps (list-first) |
| 6 | Tools | Breeding (honest limits), team builder, drop finder |
| 7 | Platform polish | Global search, tooltips, news, SEO, perf |

**Suggested public MVP cut:** Phases 0 + 1 + 2 + work-tool migration + search stub.  
Items / world / breeding calculators ship after MVP unless priorities change.

Phases 1–5 can be parallel PR streams after Phase 0 if desired.

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
   - Overlay path for `reference/partner-skills/` corrections

3. **URL + build skeleton**
   - Modular SSG entry (split from monolithic `build.js` over time)
   - Shared shell: header, nav, footer, entity page layout tokens
   - One sample entity page generated end-to-end from distilled JSON

4. **Search index contract**
   - Compact records: `{ name, type, slug, path, elements?, icon?, rank? }`
   - Built at normalize/build time; client loads for Cmd/Ctrl-K later

5. **Docs / agent notes**
   - Architecture section in this doc is source of truth until AGENTS.md is updated after Phase 0 lands
   - Document refresh commands in package.json scripts

### Decisions to lock in Phase 0

- [ ] Nested routes (`/pal/anubis/`) vs flat HTML (`pal-anubis.html`)
- [ ] Vendor snapshot in-repo vs always read sibling `paldb-cc-exports` path in dev
- [ ] Default list filter: dex pals only vs all entities
- [ ] Confirm stack: SSG + vanilla JS (default) vs framework

### Exit criteria

- [ ] Import + normalize + build is one documented command chain
- [ ] Home shows real catalog counts from vendored data
- [ ] Sample entity page renders from distilled JSON
- [ ] Footer shows data version + validation status when available
- [ ] Old pages still build/deploy (no regression)

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

- [ ] Every dex pal has a detail page
- [ ] List filters match or beat current spreadsheet
- [ ] Deep-linkable pal URLs
- [ ] Work suitability tool still available and linked from nav

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

- [ ] All three skill types browsable
- [ ] Pal detail pages link to skill details

---

## 9. Phase 3 — Items, gear, recipes

### Goal

Inventory encyclopedia + “how do I get / craft this?”

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

### Data hygiene

- Normalize stringy material/workstation fields into structured arrays
- Drop junk rows (empty slug `-`, thin export shells)
- Hide empty sections rather than showing placeholders

### Icons sub-phases

- **3a:** Text + rarity color (ship without icons)
- **3b:** Icon harvest pipeline (CDN or export assets) — separate task

### Exit criteria

- [ ] Major item categories have list + detail
- [ ] Bidirectional craft links work for majority of clean recipes
- [ ] Item pages link from pals/drops when data exists

---

## 10. Phase 4 — Base, work, technology

### Goal

Base-building side of the database: buildings, stations, tech tree, work power.

### Pages

- Structures by category (Production, Storage, Food, Infrastructure, Lighting, Foundations, Defenses, Furniture, Other, Breeding Farm, Expedition, Fishing Pond, …)
- Work stations + recipes they support
- Technologies by player level / points / category
- Work suitabilities: level→power, pals by level (upgrades current tool data path)
- SAN thresholds / sicknesses (`san.json`)
- Keep **Base Tips** as a guide fed by partner skills

### Exit criteria

- [ ] Structures + technologies browsable
- [ ] Work suitability tool reads normalized distilled work data (not only legacy `pals_data.json`)
- [ ] Structure detail links to recipes and required work types when known

---

## 11. Phase 5 — World content

### Goal

Answer “where does this live / drop / spawn?”

### Priority order

1. Alpha pals, tower bosses, raids, rampaging
2. Drops browser (by source / by item) — paginate or virtualize; never dump 12k rows into one unpaginated table
3. Merchants, bounty tokens, treasure boxes
4. Eggs, caged pals, fishing zones
5. Maps / POIs (list-first; interactive map only if POI quality justifies cost)
6. Humans, enemy camps, ancient ruins, journals

### Detail pattern

Source entity → loot table → item links → region notes when present

### Exit criteria

- [ ] Alphas + bosses + drops searchable
- [ ] Pal/item pages show “obtained from” when data exists
- [ ] Large tables remain performant on mobile

---

## 12. Phase 6 — Tools

### Goal

Sticky calculators that make Palhead more useful than raw tables.

| Tool | Depends on | Notes |
|------|------------|--------|
| Work suitability | Phases 1, 4 | Already strong; upgrade filters + data source |
| Partner catalog / base boosters | Phase 2 | Partially done |
| Breeding calculator | Phase 1 + `breeding.json` | CombiRank heuristics only until full matrix exists; UI must state limit |
| Team builder | Pals + skills + elements | Party of 5; element + work coverage |
| Capture helper | `capture_rates.json` | Thin data — ship only if useful |
| Drop finder | Phase 5 | “Where do I farm X?” |

### Breeding honesty rule

Do **not** invent a complete parent×parent matrix. Options later:

- Improve extract if paldb offline export gains matrix data
- Import an external open matrix with clear attribution
- Keep rank-based “possible outcomes” heuristics labeled as approximate

### Exit criteria

- [ ] Work suitability live on new data
- [ ] At least one new calculator (breeding **or** team builder) live
- [ ] Tools consume normalized entities, not one-off JSON forks

---

## 13. Phase 7 — Platform polish

- Global search (Cmd/Ctrl-K) over search index
- Hover tooltips on entity links (icon + name + one-liner)
- News section: patch notes / versions / tips from distilled meta tables
- SEO: titles, meta description, Open Graph, sitemap from entity index
- Performance: split JSON, lazy icons, list virtualization for drops
- Accessibility + mobile nav polish
- Optional later: multi-language (exports are `en` today)
- Optional later: interactive map (high cost)

### Exit criteria

- [ ] Search finds entities across shipped kinds
- [ ] Core list pages stay fast on mid-range mobile
- [ ] Sitemap covers entity pages

---

## 14. What not to do early

- Full SPA framework rewrite before URL + normalize contracts stabilize
- Interactive world map before drop/entity quality is proven
- Claiming complete breeding combinations without source data
- Shipping unpaginated 12k-row drop tables
- Deleting partner evidence / corrections pipeline
- Copying paldb.cc branding or layout wholesale
- Mixing scrape rows into correction files (provenance rule)

---

## 15. Risk register

| Risk | Mitigation |
|------|------------|
| Distilled fields messy / thin | Normalize on import; hide empty UI sections; fix extract upstream when systematic |
| No full breeding matrix | Limited calculator + honest copy; improve data later |
| Icon coverage for items | Text + rarity first; icon pipeline as Phase 3b |
| Bundle size (~22 MB raw) | Per-page embed only needed fields; compact list indexes |
| Legal / attribution | Attribute paldb.cc; review terms before heavy marketing |
| Scope explosion | Hard phase exit criteria; MVP cut is 0–2 |
| Boss pollution in pal lists | Default dex filter; “show all entities” toggle |
| Dual data sources drift | Single normalize layer; tools never read raw vendor JSON ad hoc |

---

## 16. First reviewable milestone

**Phase 0 + Phase 1 only:**

- New hub homepage
- `/pals/` filterable list from distilled data
- `/pal/{slug}/` detail pages
- Work suitability tool still available (migrated path or alias)
- Existing partner / status tools still linked
- Footer: extract data version

This already reads as a database site rather than a single spreadsheet.

**Public MVP recommendation:** Phase 0 + 1 + 2 + work tool on new data + search stub.

---

## 17. Open questions (resolve before / during Phase 0)

1. **Identity:** Keep “Palhead” or rebrand for the database era?
2. **Dex filter default:** Only real pals (deck # > 0), or all 592 entities?
3. **Architecture:** Approve SSG + vanilla JS, or prefer Astro/Next/etc.?
4. **Data coupling:** Vendor snapshot in-repo for deploys vs symlink to sibling repo in dev only?
5. **Post-pals priority:** Skills (Phase 2) or Items/recipes (Phase 3)?
6. **Breeding:** Ship limited calculator soon, or wait for matrix data?
7. **Item icons:** OK to ship item pages without icons initially?
8. **v1 scope ceiling:** “Pals + skills + items + work tool” vs full world content at first public launch?

**Decided:** Palpedia verify tool, multi-site partner-skill scrapes, discrepancy reports, and correction overlays are **removed**. paldb.cc is the sole game-data source of truth.

---

## 18. Implementation checklist (high level)

Use this as a tracking board once execution starts. Do not start until open questions are decided (or explicitly deferred).

### Phase 0
- [ ] `data:import` script + vendor path
- [ ] `data:normalize` script + schemas
- [ ] URL scheme locked
- [ ] Shared shell / design tokens
- [ ] Sample entity page
- [ ] Footer data version
- [ ] package.json scripts + short README section

### Phase 1
- [ ] Pal list page
- [ ] Pal detail page
- [ ] Icon mapping
- [ ] Work suitability tool path migration
- [ ] Nav updates

### Phase 2
- [ ] Partner / passive / active lists
- [ ] Skill detail pages
- [ ] Links from pal pages

### Phase 3
- [ ] Item category hub + lists
- [ ] Item detail + recipes
- [ ] Reverse craft / drop indexes
- [ ] (Optional) icon pipeline 3b

### Phase 4
- [ ] Structures + workstations
- [ ] Technologies
- [ ] Work suitability data upgrade
- [ ] SAN page/section

### Phase 5
- [ ] Alphas / bosses / raids
- [ ] Drops browser
- [ ] Merchants / boxes / eggs (as quality allows)
- [ ] Maps/POIs list-first

### Phase 6
- [ ] Breeding tool (honest limits)
- [ ] Team builder and/or drop finder
- [ ] Tools hub page

### Phase 7
- [ ] Global search
- [ ] Tooltips
- [ ] News / patch notes
- [ ] SEO sitemap
- [ ] Perf pass

---

## 19. Related repos and paths

| Path | Role |
|------|------|
| `C:\projects\collinstevens\palhead` | Site + tools + corrections + deploy |
| `C:\projects\collinstevens\paldb-cc-exports` | Crawl/export/extract/validate/publish pipeline |
| `paldb-cc-exports/data/distilled/` | Domain JSON product (~70 tables) |
| `paldb-cc-exports/data/publish/` | Versioned bundles + `catalog.json` |
| `paldb-cc-exports/docs/DATA-REFERENCES.md` | Field intent + extract checklist |
| `paldb-cc-exports/docs/PIPELINE.md` | Stage contracts |
| `palhead/reference/PROVENANCE.md` | Scrape vs correction rules |
| `palhead/reference/partner-skills/` | paldb partner-skill scrape (`sources/paldb.json`) |

---

## 20. Changelog (plan doc)

| Date | Change |
|------|--------|
| 2026-07-16 | Initial multi-phase plan written for review |
| 2026-07-16 | Removed Palpedia verify / multi-source corrections; paldb.cc is SoT |

When decisions land on open questions, record them here and tick Phase 0 decision boxes so implementers do not re-litigate architecture mid-flight.
