# Data pipeline

```text
paldb-cc-exports publish bundle
        │
        ▼  npm run data:import
data/vendor/          pinned snapshot (catalog.json + tables + validation)
        │
        ▼  npm run data:normalize   (also run at start of npm run build)
data/normalized/      pals, skills, items, relations, search-index, site-meta
        │
        ▼  node build.js
dist/                 nested HTML + icons + data/search-index.json
```

**Source of truth:** [paldb.cc](https://paldb.cc) via local `paldb-cc-exports` publish output.

Default import path (override with `PALDB_PUBLISH_DIR` or `npm run data:import -- <path>`):

`C:\projects\collinstevens\paldb-cc-exports\data\publish\paldb-data-demo`

`data/vendor/` and `data/normalized/` contents are gitignored (dirs kept via `.gitkeep`).

## Normalized outputs (Phase 0)

| File | Purpose |
|------|---------|
| `site-meta.json` | Footer version, validation, counts |
| `search-index.json` | `{ name, type, slug, path, elements?, icon?, rank? }[]` |
| `pals.json` | Compact pal list (`default_filter: dex`) |
| `pals-by-slug.json` | Full pal detail keyed by path segment |
| `skills-*.json` | Partner / passive / active skill catalogs |
| `items-*.json` | Materials / weapons / armor indexes |
| `structures.json` / `technologies.json` | Base / tech indexes |
| `relations.json` | pal↔skill links |
| `manifest.json` | Build inventory |

## Routing

Nested static paths (locked):

- `/` → `dist/index.html`
- `/pal/{slug}/` → `dist/pal/{slug}/index.html`
