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

`data/vendor/`, `data/style-vendor/`, and `data/normalized/` contents are gitignored (dirs kept via `.gitkeep`).

## Normalized game outputs

| File | Purpose |
|------|---------|
| `site-meta.json` | Footer version, bundle name, validation, counts |
| `search-index.json` | Search entries |
| `pals.json` / `pals-by-slug.json` | Pal list + detail |
| `skills-*.json` | Partner / passive / active |
| `items-*.json` | Materials / weapons / armor |
| `structures.json` / `technologies.json` | Base / tech |
| `relations.json` | pal↔skill links |
| `manifest.json` | Build inventory |

## Routing (site)

- `/` → home  
- `/pals/`, `/pal/{slug}/`  
- `/skills/…`  
- `/tools/work-suitability/`  
