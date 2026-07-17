# Palhead style notes (Phase 3)

**Identity:** Palhead (not a rebrand).  
**Influence:** Wowhead-class game-database density via `wowhead-com-exports` → `data/style-vendor/`.  
**Game data:** paldb only — never use style corpus as Palworld facts.

## Decisions locked

| Choice | Decision |
|--------|----------|
| Name | **Palhead** |
| Density | High — multi-panel home, dual-row nav (primary + subnav), sticky header |
| **Content width** | **Centered island** `max-width: 1280px` for header inner, icon rail, main, footer (black gutters like Wowhead) |
| Empty content | **Stub hubs** for everything not built yet; honest “coming soon” / reserved feed rows |
| Live surfaces | Migrate pals, skills, work suitability into the new chrome |
| Framework | Multi-page SSG + vanilla JS only |

## Taken from Wowhead (feel)

- Sticky top bar + dropdown mega-sections (News / Guides / Database / Tools)
- Secondary quick-link strip under the main nav
- Panel blocks with uppercase section headers
- Home: main column + right rail (tools list, snapshot, samples)
- Empty feed rows that look like a news list without inventing posts
- Dense tables with sticky name columns
- Search field stub in header (global search = later phase)

## Color & type (matched to Wowhead `global.css` / `universal.css`)

| Token | Value | Source cue |
|-------|--------|------------|
| Page / html bg | `#000` | `html{background-color:#000}` |
| Footer / panel | `#181818` | `.footer{background-color:#181818}` |
| Raised panel | `#1e1e1e` / `#222` | UI surfaces |
| Inputs | `#282828` | form control backgrounds |
| Borders | `#2a2a2a` / `#444` | beveled / outline |
| Body text | `#e3e0d9` | body text tokens |
| Muted | `#9d9d9d` / `#818181` | secondary labels |
| Links | `#0070dd` → hover `#338dff` | classic WH / quality blue |
| Brand accent | `#a71a19` / loud `#da2020` | live env accent red |
| Section gold | `#e5cc80` | rare/legendary gold tone |
| Body font | **Open Sans**, Arial, Helvetica Neue, Helvetica | `font-family:"Open Sans",Arial,...` |
| Mono | JetBrains Mono, Consolas | code traces in WH CSS |

Loaded via Google Fonts: Open Sans 400/600/700.

## Explicitly not taken

- Wowhead logo, name, gold brand lockups, or assets
- SPA / client-side app router
- Fake game data to fill empty hubs
- Copying WoW news/guide article text into Palhead product UI

## Stub routes (empty)

`/news/`, `/guides/`, `/guides/base-tips/`, `/guides/status-effects/`,  
`/database/`, `/items/`, `/structures/`, `/tech/`, `/world/`,  
`/tools/`, `/tools/breeding/`, `/tools/team-builder/`, `/tools/drop-finder/`

## Live routes (migrated chrome)

`/`, `/pals/`, `/pal/{slug}/`, `/skills/…`, `/tools/work-suitability/`

## Refresh style sample

```bash
npm run style:import
```

See also `reference/PROVENANCE.md` and `docs/SITE-REBUILD.md` Phase 3.
