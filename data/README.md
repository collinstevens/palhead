# Data pipeline

Palhead has **two imports** from sibling offline pipelines:

```text
paldb-cc-exports/data/publish/          →  data/vendor/        (GAME DATA)
wowhead-com-exports/data/publish/       →  data/style-vendor/  (UX / STYLE SAMPLE)
```

```text
        data:import          style:import
              │                    │
              ▼                    ▼
        data/vendor/         data/style-vendor/
              │
              ▼  data:normalize
        data/normalized/     (game entities only)
              │
              ▼  build.js
        dist/                (site HTML — Wowhead-like chrome, paldb facts)
```

## Roles

| Path | Upstream | Used for |
|------|----------|----------|
| `data/vendor/` | [paldb.cc](https://paldb.cc) via `paldb-cc-exports` | Palworld stats, skills, items, … |
| `data/style-vendor/` | [wowhead.com](https://www.wowhead.com/) sample via `wowhead-com-exports` | Homepage density, news/guide structure, DB hub patterns |
| `data/normalized/` | Built from **vendor only** | SSG input |

Style vendor is **not** fed into normalize as game entities. Agents and UI work should read it when matching Wowhead feel.

## npm scripts

| Script | What it does |
|--------|----------------|
| `npm run data:import` | Latest **paldb** publish → `data/vendor/` |
| `npm run style:import` | Latest **wowhead** sample publish → `data/style-vendor/` |
| `npm run data:normalize` | Vendor → `data/normalized/` |
| `npm run build` | **both imports** + normalize + SSG |
| `npm run build:ci` | Same as build; in CI, reuses committed `data/vendor/` and skips missing style source |
| `npm run build:html` | normalize + SSG (reuse current vendors) |
| `npm run build:static` | SSG only |

## Resolving latest bundles

### Game (`data:import`)

1. `PALDB_PUBLISH_DIR`  
2. CLI path  
3. Newest `catalog.json` under  
   `C:\projects\collinstevens\paldb-cc-exports\data\publish`  
   (or `PALDB_PUBLISH_ROOT`)

### Style (`style:import`)

1. `WOWHEAD_STYLE_DIR`  
2. CLI path  
3. Newest publish under  
   `C:\projects\collinstevens\wowhead-com-exports\data\publish`  
   (or `WOWHEAD_PUBLISH_ROOT`)  
4. Else `wowhead-com-exports/data/distilled`

## Git

| Path | Tracked? | Notes |
|------|----------|--------|
| `data/vendor/` | **Yes** | Pinned game snapshot for CI / reproducible deploys |
| `data/style-vendor/` | No (gitignored) | UX reference only; not required for SSG |
| `data/normalized/` | No (gitignored) | Built in CI and locally from vendor |

After refreshing game data locally (`npm run data:import`), **commit `data/vendor/`** so production CI deploys the new snapshot.

## CI deploy

Push to `master` (or `main`) runs `.github/workflows/deploy.yml`: `npm run build:ci` → Cloudflare Pages (`--branch master`).

Required GitHub repo secrets:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | API token with **Cloudflare Pages — Edit** (and Account read) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id (see `npx wrangler whoami`) |

## Normalized game outputs

| File | Purpose |
|------|---------|
| `site-meta.json` | Footer version, bundle name, validation, counts |
| `search-index.json` | Global search entries |
| `pals.json` / `pals-by-slug.json` | Pal list + detail |
| `skills-*.json` | Partner / passive / active |
| `items-*.json` / `recipes.json` | Items by category + craft |
| `structures.json` / `technologies.json` | Base / tech |
| `world-*.json` / `drops-browser.json` | World content + drop finder |
| `breeding.json` | Breeding tool inputs |
| `news.json` / `tips.json` / `status-effects.json` | News + guides |
| `relations.json` | Cross-entity links |
| `manifest.json` | Build inventory |

## Routing (site)

Nested static folders under `dist/`. Full map: `AGENTS.md` / `CLAUDE.md`.

- `/` → home  
- `/pals/`, `/pal/{slug}/`  
- `/skills/…`  
- `/items/…`, `/item/{slug}/`, `/recipes/`  
- `/structures/…`, `/structure/{slug}/`, `/tech/…`  
- `/world/…`  
- `/tools/work-suitability/`, `/tools/breeding/`, `/tools/team-builder/`, `/tools/drop-finder/`  
- `/guides/…`, `/news/`, `/database/`  
