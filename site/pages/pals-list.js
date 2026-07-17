const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");
const { WORK_ORDER, ELEMENTS, SIZES } = require("../constants");
const { palsBrowserScript } = require("../client/pals-browser");

function filterChrome({ mode, prefix }) {
  const isWork = mode === "work";
  const elementChips = ELEMENTS.map(
    (e) =>
      '<button type="button" data-element="' +
      escapeHtml(e) +
      '" class="elem-chip elem elem-' +
      escapeHtml(e) +
      '">' +
      escapeHtml(e) +
      "</button>"
  ).join("");

  const sizeOpts =
    '<option value="">Any size</option>' +
    SIZES.map(
      (s) =>
        '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + "</option>"
    ).join("");

  const workOpts =
    '<option value="">Any work</option>' +
    WORK_ORDER.map(
      (w) =>
        '<option value="' + escapeHtml(w) + '">' + escapeHtml(w) + "</option>"
    ).join("");

  return `
      <section class="wh-panel" style="margin-bottom:8px">
        <div class="wh-panel-head"><h2>Filters</h2><span class="wh-panel-meta">client-side</span></div>
        <div class="wh-panel-body space-y-3">
        <div class="flex flex-wrap items-end gap-2">
          <div class="flex-1 min-w-[12rem]">
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Search</label>
            <input id="search" type="search" placeholder="Name, skill, element…" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-pal-accent" />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Size</label>
            <select id="sizeFilter" class="bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm">${sizeOpts}</select>
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Food ≥</label>
            <input id="foodMin" type="number" min="0" max="10" class="w-16 bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Rarity ≥</label>
            <input id="rarityMin" type="number" min="0" class="w-16 bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Work type</label>
            <select id="workKey" class="bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm min-w-[9rem]">${workOpts}</select>
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Work ≥</label>
            <input id="workMin" type="number" min="1" max="5" placeholder="1" class="w-14 bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" />
          </div>
          <label class="inline-flex items-center gap-2 text-xs text-pal-muted cursor-pointer select-none pb-1.5">
            <input id="dexOnly" type="checkbox" checked class="rounded border-pal-border bg-pal-bg" />
            Dex only
          </label>
          <button id="resetFilters" type="button" class="wh-btn wh-btn-ghost">Reset</button>
        </div>
        <div class="flex flex-wrap gap-1 items-center">
          <span class="text-[10px] uppercase tracking-wide text-pal-muted mr-1 font-bold">Elements</span>
          ${elementChips}
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-pal-border">
          <div class="text-xs text-pal-muted">
            Showing <span id="resultCount" class="text-pal-text font-bold">0</span>
            of <span id="totalCount" class="text-pal-text font-bold">0</span>
            ${isWork ? " · work sort high → low (zeros sink)" : ""}
          </div>
          <div class="flex flex-wrap gap-1">
            <button type="button" data-view="table" class="view-btn is-active">Table</button>
            <button type="button" data-view="cards" class="view-btn">Cards</button>
            <button type="button" data-view="compact" class="view-btn">Compact</button>
          </div>
        </div>
        <div class="text-[11px] text-pal-muted">
          ${
            isWork
              ? 'Also browse the full <a href="' +
                escapeHtml(prefix + "pals/") +
                '">pals database</a>.'
              : 'Need work-focused columns? Open the <a href="' +
                escapeHtml(prefix + "tools/work-suitability/") +
                '">work suitability tool</a>.'
          }
        </div>
        </div>
      </section>`;
}

function palsBrowserPage({ mode, siteMeta, palsPayload }) {
  const isWork = mode === "work";
  const href = isWork ? "/tools/work-suitability/" : "/pals/";
  const prefix = depthPrefix(href);
  const title = isWork
    ? "Work Suitability — Palhead"
    : "Pals — Palhead";
  const heading = isWork ? "Work Suitability" : "Pals";
  const subtitle = isWork
    ? "Sort and filter every pal by work levels. Zeros sink when sorting work high → low."
    : "Searchable pal encyclopedia. Default filter is dex (#>0); open any row for full stats.";

  const extraStyles = `
  .elem-chip { cursor: pointer; opacity: 0.4; border: 1px solid transparent; }
  .elem-chip.is-on { opacity: 1; outline: 1px solid rgba(255,255,255,0.35); }
  .view-btn {
    font-size: 11px; padding: 4px 8px; border-radius: 2px;
    border: 1px solid var(--wh-border); color: var(--wh-muted); background: #0a0d12;
  }
  .view-btn.is-active { color: var(--wh-text); border-color: var(--wh-accent); background: rgba(61,126,255,0.12); }
  .sticky-left { position: sticky; left: 0; background: var(--wh-panel); z-index: 1; }
  .sticky-name { position: sticky; left: 2.5rem; background: var(--wh-panel); z-index: 1; }
  thead .sticky-left, thead .sticky-name { z-index: 2; }
  tbody tr:hover .sticky-left, tbody tr:hover .sticky-name { background: #1a2030; }
  tbody tr:hover { background: var(--wh-row-hover); }
`;

  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      ${
        isWork
          ? '<a href="' +
            escapeHtml(prefix + "tools/") +
            '">Tools</a><span> / </span>'
          : '<a href="' +
            escapeHtml(prefix + "database/") +
            '">Database</a><span> / </span>'
      }
      <span style="color:#c5ccda">${escapeHtml(heading)}</span>
    </div>
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="wh-h1">${escapeHtml(heading)}</h1>
        <p class="wh-lede">${escapeHtml(subtitle)}</p>
      </div>
      <span class="wh-chip wh-chip-live">live</span>
    </div>

    ${filterChrome({ mode, prefix })}

    <section id="tableWrap" class="wh-panel flex-1" style="margin:0">
      <div class="table-wrap overflow-auto" style="max-height:calc(100vh - 16rem)">
        <table id="table" class="text-sm w-full">
          <thead style="background:var(--wh-panel)"><tr id="theadRow"></tr></thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </section>
    <div id="cardsWrap" class="hidden grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2"></div>
    <div id="compactWrap" class="hidden grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5"></div>
  </main>`;

  const bodyScripts = `
<script>
const ASSET_PREFIX = ${JSON.stringify(prefix)};
const DATA = ${JSON.stringify(palsPayload)};
${palsBrowserScript({ mode: isWork ? "work" : "database" })}
</script>`;

  return shell({
    title,
    description: subtitle,
    activeNav: isWork ? "work" : "pals",
    body,
    prefix,
    siteMeta,
    headExtra: "<style>" + extraStyles + "</style>",
    bodyScripts,
  });
}

module.exports = { palsBrowserPage };
