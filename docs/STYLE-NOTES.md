# Palhead style notes

**Identity:** Palhead (not a rebrand).  
**Influence:** Wowhead-class game-database density via `wowhead-com-exports` → `data/style-vendor/`.  
**Game data:** paldb only — never use style corpus as Palworld facts.

## Decisions locked

| Choice | Decision |
|--------|----------|
| Name | **Palhead** |
| Density | High — multi-panel home, dual-row nav (primary + subnav), sticky header |
| **Content width** | **Centered island** `max-width: 1280px` for header inner, icon rail, main, footer (black gutters like Wowhead) |
| Empty content | Honest empty states via `site/empty.js` — never invent fake entities |
| Framework | Multi-page SSG + vanilla JS only |

## Taken from Wowhead (feel)

- Sticky top bar + dropdown mega-sections (News / Guides / Database / Tools)
- Secondary quick-link strip under the main nav
- Panel blocks with uppercase section headers
- Home: main column + right rail (tools list, snapshot, samples)
- Dense tables with sticky name columns
- Header global search (Cmd/Ctrl-K) over the search index

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

## Live routes

`/`, `/pals/`, `/pal/{slug}/`, `/skills/…`,  
`/items/`, `/items/{category}/`, `/item/{slug}/`, `/recipes/`,  
`/structures/`, `/structure/{slug}/`, `/tech/`, `/tech/{slug}/`,  
`/world/…`, `/guides/…`, `/news/`, `/database/`,  
`/tools/`, `/tools/work-suitability/`, `/tools/breeding/`,  
`/tools/team-builder/`, `/tools/drop-finder/`

## Page chrome contract

When adding or changing pages:

1. **Extend, don’t fork** — every page goes through `site/shell.js` (centered 1280px island, dual nav, icon rail, footer).
2. **Same list chrome as pals/skills** — filter bar, result count, dense table; client pattern after `site/client/pals-browser.js` / `skills-browser.js`.
3. **Same detail chrome** — breadcrumb → entity head → quick facts → stacked `wh-panel` sections.
4. **Empty states** — `site/empty.js` only; never invent fake entities to fill hubs.
5. **Cross-link the graph** — item ↔ recipe ↔ structure ↔ drop ↔ pal; dead-end pages are a UX failure.
6. **Style cues** — `data/style-vendor/` + this file; game facts only from `data/vendor/` / normalized.

**Shared primitives:** `site/shell.js`, `site/empty.js`, list clients under `site/client/`, page modules under `site/pages/`.

## Refresh style sample

```bash
npm run style:import
```

See also `reference/PROVENANCE.md` and `docs/ICONS.md`.
