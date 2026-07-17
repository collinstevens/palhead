# Palhead

Palworld multi-page static database & tools site. Rebuilding toward a full entity DB using paldb-derived data.

**Live:** https://palhead.pages.dev  
**Pages project:** `palhead`  
**Game data source of truth:** [paldb.cc](https://paldb.cc)  
**Plan:** `docs/SITE-REBUILD.md`

## Architecture

Static multi-page site. **No React, Next.js, Vue, SvelteKit, or SPA/client-router app.** No framework bundler for the app UI — Node SSG generates HTML; small vanilla JS for interactivity only.

| Path | Role |
|------|------|
| `build.js` | SSG entry. Writes HTML pages. |
| `scripts/data-import.js` | Copy paldb publish bundle → `data/vendor/` |
| `scripts/data-normalize.js` | Normalize vendor → `data/normalized/` (Phase 0 stub) |
| `scripts/prepare-dist.js` | Copy HTML + `icons/` → `dist/` |
| `data/vendor/` | Pinned paldb publish snapshot (gitignored contents) |
| `data/normalized/` | Build-facing normalized JSON (gitignored contents) |
| `data/README.md` | Pipeline notes |
| `docs/SITE-REBUILD.md` | Multi-phase rebuild plan |
| `icons/` | Local pal icons (`.webp`) |
| `reference/PROVENANCE.md` | paldb SoT policy |
| `reference/status-effects/` | In-game Survival Guide status effects + evidence (not paldb; not shipped yet) |
| `dist/` | Deploy artifact (gitignored) |
| `wrangler.toml` | Cloudflare Pages (`pages_build_output_dir = "dist"`) |

## Commands

```bash
npm install
npm run data:import      # pin paldb publish bundle into data/vendor/
npm run data:normalize   # write data/normalized/ (stub → full later)
npm run build            # HTML + dist/
npm run login
npm run whoami
npm run deploy           # build + wrangler pages deploy dist --project-name palhead --branch master
npm run preview          # local static server on dist/
```

Import source defaults to  
`C:\projects\collinstevens\paldb-cc-exports\data\publish\paldb-data-demo`  
Override: `PALDB_PUBLISH_DIR=...` or `npm run data:import -- <path>`.

## Data

- **Source of truth for game data is [paldb.cc](https://paldb.cc)** via `paldb-cc-exports` distilled/publish bundles.
- No multi-site verification, Palpedia checklists, or correction overlays.
- External pipeline repo: `C:\projects\collinstevens\paldb-cc-exports`
- Status effects remain in-game Survival Guide captures under `reference/status-effects/` (re-ship in a later phase).

## Hosting

- Cloudflare Pages project: **palhead**
- Deploy only `dist/`
- Production branch: **`master` only** (`npm run deploy` uses `--branch master`)

## UI conventions

- Tailwind via CDN (for now)
- Dark theme `pal.*` colors
- Full-width layout for data tables when they return
- Nested static routes preferred for new pages (lock in Phase 0)

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
