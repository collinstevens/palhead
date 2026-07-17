# Game icons (Phase 4b)

Local game icons for Pals, items, and structures. Source: **paldb.cc CDN** (`cdn.paldb.cc`), discovered from offline HTML in `paldb-cc-exports` when available. Production pages use **local** files only (no CDN hotlink).

## Refresh

```bash
npm run download-icons
npm run data:normalize
npm run build:static
```

Useful flags:

| Flag | Meaning |
|------|---------|
| `--dry-run` | Plan only; no downloads, no manifest write |
| `--no-scrape` | Reuse `data/icon-cdn-index.json` instead of rescanning HTML |
| `--concurrency=N` | Parallel downloads (default 6) |
| `--exports=PATH` | Offline HTML dir (default `../paldb-cc-exports/data/raw/exports/en`) |

Env: `PALDB_EXPORTS_EN` overrides the exports directory.

The script is **resume-safe**: existing non-empty files are skipped.

## Layout

| Kind | Path | Notes |
|------|------|--------|
| Pals | `icons/T_{Code}_icon_normal.webp` | Flat (backward compatible with existing normalize) |
| Items | `icons/items/{icon_name\|code}.webp` | Shared `icon_name` → one file (e.g. skill fruits, blueprints, saddles) |
| Structures | `icons/structures/{code}.webp` | Uses vendor `code` (e.g. `BreedFarm`) |

`build.js` / `prepare-dist.js` recursively copy `icons/` → `dist/icons/`.

## CDN path templates (verified)

Base: `https://cdn.paldb.cc/image/`

| Kind | Template | Example |
|------|----------|---------|
| Pal | `Pal/Texture/PalIcon/Normal/T_{Code}_icon_normal.webp` | `…/T_Anubis_icon_normal.webp` |
| Item | `Others/InventoryItemIcon/Texture/T_itemicon_{Type}_{Name}.webp` | `…/T_itemicon_Material_AIcore.webp` |
| Structure | `Pal/Texture/BuildObject/PNG/T_icon_buildObject_{Code}.webp` | `…/T_icon_buildObject_BreedFarm.webp` |

### Item type notes

Vendor `type_a` does not always match the CDN type segment:

- Materials → `Material`
- Weapons → `Weapon`, armor → `Armor`
- Accessories often embed the type in `icon_name` (`Accessory_TalentChecker` → `T_itemicon_Accessory_TalentChecker`)
- Consumable potions often live under **`Food`**, not `Consume`
- Spheres → `PalSphere` (not `SpecialWeapon`)
- Sphere modules → `SphereModule`
- Skill fruits → `Consume_SkillCard_{Element}`
- Saddles / pal gear → `Essential_SkillUnlock_*`
- Many schematics share `T_itemicon_Material_Blueprint`

The downloader scrapes offline HTML into `data/icon-cdn-index.json`, then tries scraped matches first and template fallbacks second.

## Manifest

`data/icon-manifest.json` records successful local files:

```json
{
  "built_at": "…",
  "counts": { "pals": 0, "items": 0, "structures": 0, "failed": 0 },
  "files": [
    {
      "kind": "item",
      "code": "AIcore",
      "icon_name": "AIcore",
      "file": "icons/items/AIcore.webp",
      "source": "https://cdn.paldb.cc/image/…"
    }
  ],
  "failed": []
}
```

Normalize reads the manifest (and scans `icons/`) to set `icon` on pals, items, and structures. Missing icons never break pages (empty placeholder / text-only).

## Normalize / UI

- Pals: `icon` is the flat filename (`T_Anubis_icon_normal.webp`).
- Items / structures: `icon` is relative to `icons/` (e.g. `items/AIcore.webp`, `structures/BreedFarm.webp`).
- UI: `ASSET_PREFIX + "icons/" + entity.icon` with `loading="lazy"` where lists render images.

## Coverage notes (typical run)

After a full download against current vendor data + offline HTML index:

| Kind | Rough outcome |
|------|----------------|
| Items | Majority of rows with `icon_name` resolve (~85%+ of normalized items) |
| Structures | Most codes with CDN build icons (~75%+) |
| Pals | Existing flat icons preserved; gaps filled when CDN has `T_{Code}_icon_normal.webp` |
| Failures | BOSS/GYM-only codes, thin export rows without icons, assets not on CDN — listed in `data/icon-manifest.json` → `failed` |

Missing icons never break pages (empty placeholder / text-only).

## Attribution

Game data and icon textures are derived from **paldb** community exports / CDN. Not Wowhead assets. Not official Pocketpair packages.
