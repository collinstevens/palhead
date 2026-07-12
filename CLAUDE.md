# Palhead

Palworld tools site. First tool is a work-suitability spreadsheet for all pals: sortable/filterable table with icons, element filters, and links to paldb.cc.

**Live:** https://palhead.pages.dev  
**Pages project:** `palhead`

## Architecture

Static site. No framework, no bundler for the app itself.

| Path | Role |
|------|------|
| `build.js` | Source of truth for the UI. Embeds `pals_data.json` and writes `index.html`. |
| `index.html` | Generated output. Do not hand-edit; change `build.js` and rebuild. |
| `pals_data.json` | Compact pal dataset (`id`, `n` name, `d` deck #, `e` elements, `w` work levels array, `img` icon filename). |
| `reference/passive_skills.json` | Local reference: all passive skills (rank, effects, fixed-on pals). Agent lookup only; not deployed. |
| `reference/work_suitability.json` | Local reference: work suitability definitions, priority, tips. Agent lookup only; not deployed. |
| `icons/` | Local pal icons (`.webp`), referenced as `icons/<file>`. |
| `download-icons.js` | Scrapes/resolves paldb CDN icons into `icons/` and updates `img` on pals. |
| `scripts/scrape-reference-data.js` | Pulls passive skills + work suitability from wikis into `reference/`. |
| `scripts/prepare-dist.js` | Copies `index.html` + `icons/` → `dist/` for deploy. |
| `dist/` | Deploy artifact (gitignored). |
| `wrangler.toml` | Cloudflare Pages config (`pages_build_output_dir = "dist"`). |

Work suitability columns order in `pals_data.json` `work` array:

Kindling, Watering, Planting, Generating Electricity, Handiwork, Gathering, Lumbering, Mining, Medicine Production, Cooling, Transporting, Farming

Zero work levels are shown as empty cells. Pal names link to `https://paldb.cc/en/<Name_With_Underscores>`.

## Commands

```bash
npm install
npm run build            # rebuild index.html + dist/
npm run download-icons   # re-fetch icons (needs network)
npm run scrape-reference # re-fetch wiki reference data into reference/ (needs network)
npm run login            # wrangler OAuth
npm run whoami
npm run deploy           # build + wrangler pages deploy dist --project-name palhead
npm run preview          # local static server on dist/
```

After UI changes: edit `build.js` → `npm run build` (or `npm run deploy`).

## Data

- `pals_data.json` is derived from community game data (oMaN-Rod/palworld-save-pal style dumps) + paldb icons.
- Prefer regenerating via scripts over hand-editing hundreds of pals.
- Keep the site offline-capable except Tailwind CDN and outbound paldb name links.
- Agent reference (not shipped in `dist/`):
  - `reference/passive_skills.json` — from [wiki.gg Passive Skills/List](https://palworld.wiki.gg/wiki/Passive_Skills/List)
  - `reference/work_suitability.json` — from [fandom Work Suitability](https://palworld.fandom.com/wiki/Work_Suitability)
  - Refresh with `npm run scrape-reference` when game data changes.

## Hosting

- Cloudflare Pages project name: **palhead**
- Deploy only `dist/` contents (HTML + icons)
- Production branch: `main` (Pages project); local git may still be on `master` until renamed

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
