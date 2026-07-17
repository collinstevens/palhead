# Palhead

Palworld tools site. First tool is a work-suitability spreadsheet for all pals: sortable/filterable table with icons, element filters, and links to paldb.cc.

**Live:** https://palhead.pages.dev  
**Pages project:** `palhead`  
**Game data source of truth:** [paldb.cc](https://paldb.cc) (see `reference/PROVENANCE.md`)

## Architecture

Static multi-page site. **No React, Next.js, Vue, SvelteKit, or SPA/client-router app.** No framework bundler for the app UI — Node SSG generates HTML; small vanilla JS for interactivity only.

| Path | Role |
|------|------|
| `build.js` | Source of truth for the UI. Embeds data and writes all HTML pages. |
| `index.html` | Generated home / tools hub. Do not hand-edit; change `build.js` and rebuild. |
| `pals.html` | Generated pals work-suitability spreadsheet. Do not hand-edit; change `build.js` and rebuild. |
| `partner-skills.html` | Generated partner skills catalog from paldb scrape. Do not hand-edit; change `build.js` and rebuild. |
| `base-tips.html` | Generated base tips (work +1 partner skills). Do not hand-edit; change `build.js` and rebuild. |
| `status-effects.html` | Generated status effects catalog from in-game Survival Guide. Do not hand-edit; change `build.js` and rebuild. |
| `pals_data.json` | Compact pal dataset (`id`, `n` name, `d` deck #, `e` elements, `w` work levels array, `img` icon filename). |
| `reference/PROVENANCE.md` | Data policy: paldb.cc is SoT; local files are caches. |
| `reference/passive_skills.json` | Local cache (legacy wiki.gg); agent lookup only; not deployed. |
| `reference/partner-skills/` | paldb partner-skill scrape (`sources/paldb.json`). See its README. |
| `reference/partner_skills.json` | Deprecated stub pointing at `reference/partner-skills/sources/paldb.json`. |
| `reference/status-effects/` | Survival Guide status effects text + evidence screenshots. See its README. |
| `reference/work_suitability.json` | Local cache (legacy fandom); agent lookup only; not deployed. |
| `icons/` | Local pal icons (`.webp`), referenced as `icons/<file>`. |
| `download-icons.js` | Scrapes/resolves paldb CDN icons into `icons/` and updates `img` on pals. |
| `scripts/scrape-reference-data.js` | Pulls passive skills + work suitability; invokes partner-skills scraper. |
| `scripts/scrape-partner-skills.js` | Scrapes paldb.cc partner skills → `sources/paldb.json`. |
| `scripts/prepare-dist.js` | Copies HTML + `icons/` → `dist/` for deploy. |
| `dist/` | Deploy artifact (gitignored). |
| `wrangler.toml` | Cloudflare Pages config (`pages_build_output_dir = "dist"`). |
| `docs/SITE-REBUILD.md` | Plan to rebuild as full database from `paldb-cc-exports`. |

Work suitability columns order in `pals_data.json` `work` array:

Kindling, Watering, Planting, Generating Electricity, Handiwork, Gathering, Lumbering, Mining, Medicine Production, Cooling, Transporting, Farming

Zero work levels are shown as empty cells. Pal names link to `https://paldb.cc/en/<Name_With_Underscores>`.

## Commands

```bash
npm install
npm run build            # rebuild all HTML pages + dist/
npm run download-icons   # re-fetch icons (needs network)
npm run scrape-reference # re-fetch passives, work suitability, partner skills (needs network)
npm run scrape-partner-skills # re-fetch partner skills from paldb.cc (needs network)
npm run login            # wrangler OAuth
npm run whoami
npm run deploy           # build + wrangler pages deploy dist --project-name palhead
npm run preview          # local static server on dist/
```

After UI changes: edit `build.js` → `npm run build` (or `npm run deploy`).

## Data

- **Source of truth for game data is [paldb.cc](https://paldb.cc).** No multi-site verification, Palpedia checklist, or correction overlays.
- `pals_data.json` is a compact deployed table (community dumps + paldb icons). Prefer regenerating via scripts / paldb-derived data over hand-editing hundreds of pals.
- Keep the site offline-capable except Tailwind CDN and outbound paldb name links.
- **Provenance:** see `reference/PROVENANCE.md`.
- Agent reference (not shipped in `dist/`):
  - `reference/partner-skills/sources/paldb.json` — from [paldb Partner Skill](https://paldb.cc/en/Partner_Skill)
  - `reference/passive_skills.json` — legacy cache; replace with paldb extract when ready
  - `reference/work_suitability.json` — legacy cache; replace with paldb extract when ready
  - `reference/status-effects/` — in-game Survival Guide → Tips → Status Effects (screenshot-verified)
  - Refresh partner skills with `npm run scrape-partner-skills`
- **External reference repo (not in this tree):** `C:\projects\collinstevens\paldb-cc-exports` — local crawl/export/distill of [paldb.cc](https://paldb.cc). Prefer this over live fetches when looking up paldb content.

## Hosting

- Cloudflare Pages project name: **palhead**
- Deploy only `dist/` contents (HTML + icons)
- Production branch: **`master` only** (serves `palhead.pages.dev`). Local git and Pages production must both use `master` — never `main`. `npm run deploy` uses `--branch master`.

## UI conventions

- Tailwind via CDN only (no build pipeline for CSS)
- Dark theme using `pal.*` colors in the Tailwind config inside `build.js`
- Full-width layout (no max-width container on main content)
- Work column headers use full suitability names (not abbreviations)
- Sort: work columns default to desc (high → low) on first click; zeros sink when sorting work desc
- Element filter chips and table element pills share the same solid fill styles (no harsh borders)

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
