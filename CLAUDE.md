# Palhead

Palworld multi-page static database & tools site.

**Live:** https://palhead.com  
**Pages (previews):** https://palhead.pages.dev  
**Pages project:** `palhead`  
**Game data source of truth:** [paldb.cc](https://paldb.cc) via `paldb-cc-exports`  
**UX / style reference:** [wowhead.com](https://www.wowhead.com/) sample via `wowhead-com-exports`  
**Style notes:** `docs/STYLE-NOTES.md`  
**Icons:** `docs/ICONS.md`

## Architecture

Static multi-page site. **No React, Next.js, Vue, SvelteKit, or SPA/client-router app.** No framework bundler for the app UI — Node SSG generates HTML; small vanilla JS for interactivity only.

**Goal:** Palworld database in a **Wowhead-class** presentation — dense nav, entity lists/details, tools — with **paldb facts** and **Wowhead sample IA/chrome** (never mix the two corpora).

| Path | Role |
|------|------|
| `build.js` | SSG orchestrator → writes `dist/` |
| `site/` | Shell, paths, pages, client filter JS |
| `scripts/data-import.js` | Latest paldb publish → `data/vendor/` (game) |
| `scripts/style-import.js` | Latest wowhead sample publish → `data/style-vendor/` (UX only) |
| `scripts/data-normalize.js` | Normalize **game** vendor → `data/normalized/` |
| `scripts/download-icons.js` | Local pal/item/structure icons from paldb CDN |
| `scripts/prepare-dist.js` | Ensure `dist/icons` after build |
| `data/vendor/` | Pinned paldb game snapshot (gitignored contents) |
| `data/style-vendor/` | Pinned wowhead style sample (gitignored contents) |
| `data/normalized/` | pals, skills, items, relations, search-index, site-meta |
| `data/README.md` | Dual-import pipeline notes |
| `docs/STYLE-NOTES.md` | Chrome, density, tokens, page patterns |
| `docs/ICONS.md` | Icon download + layout |
| `icons/` | Local game icons (`.webp`) |
| `reference/PROVENANCE.md` | Game vs style corpus policy |
| `reference/status-effects/` | Survival Guide captures (guides source) |
| `dist/` | Deploy artifact (gitignored) |
| `wrangler.toml` | Cloudflare Pages (`pages_build_output_dir = "dist"`) |

### Locked decisions

- **Routes:** nested static folders, e.g. `/pals/`, `/pal/anubis/`, `/tools/work-suitability/`
- **Game vendor:** latest paldb publish auto-import into `data/vendor/`
- **Style vendor:** latest wowhead sample publish into `data/style-vendor/` (reference only; not normalize input)
- **Default pal list filter:** dex only (`deck > 0`); toggle for all entities
- **Stack:** multi-page SSG + vanilla JS forever — never React/Next/SPA

### Shipped routes

| Path | Role |
|------|------|
| `/` | Home hub |
| `/pals/` | Pal database (filter/sort, table/cards/compact) |
| `/pal/{slug}/` | Pal detail |
| `/skills/` | Skills hub |
| `/skills/partner\|passive\|active/` | Skill lists |
| `/skills/{kind}/{slug}/` | Skill detail + owners |
| `/items/` | Items hub (categories) |
| `/items/{category}/` | Item category list |
| `/item/{slug}/` | Item detail (craft / used-in / drops) |
| `/recipes/` | Recipes browser |
| `/structures/` | Structure list |
| `/structure/{slug}/` | Structure detail |
| `/tech/` | Technologies |
| `/tech/{slug}/` | Technology detail |
| `/world/` | World hub |
| `/world/{section}/…` | Alphas, bosses, drops, merchants, maps, … |
| `/tools/` | Tools hub |
| `/tools/work-suitability/` | Work-focused spreadsheet |
| `/tools/breeding/` | Breeding calculator (honest CombiRank limits) |
| `/tools/team-builder/` | Party planner |
| `/tools/drop-finder/` | Drop finder |
| `/guides/` | Guides hub |
| `/guides/status-effects/` | Survival Guide status effects |
| `/guides/base-tips/` | Base tips |
| `/guides/san/` | SAN guide |
| `/guides/work-power/` | Work power guide |
| `/news/` | Patch notes / versions from paldb |
| `/database/` | Database category hub |
| `/search/` (header Cmd/Ctrl-K) | Global entity search |

## Commands

```bash
npm install
npm run data:import      # latest paldb publish → data/vendor/ (game)
npm run style:import     # latest wowhead sample → data/style-vendor/ (UX)
npm run data:normalize   # write data/normalized/ from game vendor only
npm run download-icons   # local icons from paldb CDN (see docs/ICONS.md)
npm run build            # both imports + normalize + SSG + dist/
npm run build:html       # normalize + SSG (reuse current vendors)
npm run build:static     # SSG only (reuse normalized)
npm run login
npm run whoami
npm run deploy           # full build + pages deploy
npm run preview          # local static server on dist/
```

### Game import resolution (`data:import`)

1. `PALDB_PUBLISH_DIR`  
2. `npm run data:import -- <path>`  
3. Newest under `C:\projects\collinstevens\paldb-cc-exports\data\publish`

### Style import resolution (`style:import`)

1. `WOWHEAD_STYLE_DIR`  
2. `npm run style:import -- <path>`  
3. Newest under `C:\projects\collinstevens\wowhead-com-exports\data\publish`  
4. Else `wowhead-com-exports/data/distilled`

`npm run build` re-imports **both** latest corpora before normalize/SSG.

## Data

- **Game SoT:** [paldb.cc](https://paldb.cc) / `C:\projects\collinstevens\paldb-cc-exports` → `data/vendor/`
- **Style reference:** [wowhead.com](https://www.wowhead.com/) sample / `C:\projects\collinstevens\wowhead-com-exports` → `data/style-vendor/`
- Do not use style-vendor for Palworld mechanics; do not use game vendor as a layout dump of Wowhead
- No multi-site game verification or correction overlays over paldb
- Footer shows game data version, bundle name, validation, import time
- See `reference/PROVENANCE.md` and `data/README.md`

## Hosting

- Cloudflare Pages project: **palhead**
- Deploy only `dist/`
- Production branch: **`master` only** (`npm run deploy` uses `--branch master`)

## UI conventions

- Aim for Wowhead-class density: sticky chrome, filter bars, entity tables, deep links — informed by `data/style-vendor/` and `docs/STYLE-NOTES.md`
- **Extend existing chrome only** — `site/shell.js`, `wh-*` classes, `site/empty.js`, list + detail patterns from pals/skills. No second layout system.
- **Typography:** Open Sans + Arial/Helvetica stack (matches Wowhead body stack; loaded via Google Fonts)
- **Colors:** black page (`#000`), panels `#181818`, links `#0070dd`, brand accent `#a71a19` — see `docs/STYLE-NOTES.md` and `site/shell.js` CSS vars
- **Content width:** centered island `max-width: 1280px` (header, icon rail, main, footer)
- Tailwind via CDN (for now); `pal.*` tokens mirror the same palette
- Nested static routes for entities
- Element pills share solid fill styles
- Do **not** copy Wowhead branding/trademarks
- Hide empty sections; do not invent game data or full breeding matrices when the export lacks them

## Git Guidelines

- Don't push to main unless asked, branches are chill though.
- Use conventional commits, e.g `<type>(<optional scope>): <description>`.
  - In commit message bodies, focus on "why", more than "what" - the diff already shows the _true_ "what".
  - Make sure if there's multiple disjoint things going into a commit, each are differentiated in the body.
  - Use bullet points more than long prose paragraphs for readability.
  - Use an `ai(<optional scope>):` prefix for changes related to `CLAUDE.md`, `AGENTS.md`, and ai docs or skills.
- For PRs descriptions, focus on "Motivation" the most, then on "How did it change" in broad strokes.
  - The diff already shows the nitty gritty details.
  - Code block samples interspersed in both "Motivation" and "How", optionally with comments, are usually much more readable than just backticks in prose.
  - No need for a test plan section.
  - Include "fixes ..." for fixing github issues or linear tickets, to autolink.
- Unless the user says otherwise, when asked to push, usually assume that means a branch if you're currently on main, and create a PR if there's not already one for the branch.

## Code Comments

- Never write code comments. If code seems to need a comment, rewrite the code to be self-explanatory instead.
- When modifying code, delete any existing comments the change invalidates.
- Leave existing comments alone when the code they relate to isn't being modified.
