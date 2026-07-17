# Data pipeline (Phase 0+)

```text
paldb-cc-exports publish bundle
        │
        ▼  npm run data:import
data/vendor/          pinned snapshot (catalog.json + tables)
        │
        ▼  npm run data:normalize
data/normalized/      entities, relations, search-index (stub in Phase 0)
        │
        ▼  npm run build
dist/                 static site
```

**Source of truth:** [paldb.cc](https://paldb.cc) via local `paldb-cc-exports` publish output.

Default import path (override with `PALDB_PUBLISH_DIR` or `npm run data:import -- <path>`):

`C:\projects\collinstevens\paldb-cc-exports\data\publish\paldb-data-demo`

`data/vendor/` is local/generated — not required in git (see `.gitignore`).
