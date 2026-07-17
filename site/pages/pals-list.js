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
      <section class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4 space-y-3">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1 min-w-[12rem]">
            <label class="block text-xs text-pal-muted mb-1 font-medium">Search</label>
            <input id="search" type="search" placeholder="Name, skill, element…" class="w-full bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
          </div>
          <div>
            <label class="block text-xs text-pal-muted mb-1 font-medium">Size</label>
            <select id="sizeFilter" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent">${sizeOpts}</select>
          </div>
          <div>
            <label class="block text-xs text-pal-muted mb-1 font-medium">Food ≥</label>
            <input id="foodMin" type="number" min="0" max="10" class="w-20 bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent" />
          </div>
          <div>
            <label class="block text-xs text-pal-muted mb-1 font-medium">Rarity ≥</label>
            <input id="rarityMin" type="number" min="0" class="w-20 bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent" />
          </div>
          <div>
            <label class="block text-xs text-pal-muted mb-1 font-medium">Work type</label>
            <select id="workKey" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent min-w-[10rem]">${workOpts}</select>
          </div>
          <div>
            <label class="block text-xs text-pal-muted mb-1 font-medium">Work ≥</label>
            <input id="workMin" type="number" min="1" max="5" placeholder="1" class="w-16 bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent" />
          </div>
          <label class="inline-flex items-center gap-2 text-sm text-pal-muted cursor-pointer select-none pb-2">
            <input id="dexOnly" type="checkbox" checked class="rounded border-pal-border bg-pal-bg" />
            Dex only
          </label>
          <button id="resetFilters" type="button" class="px-3 py-2 text-sm rounded-lg border border-pal-border text-pal-muted hover:text-pal-text hover:border-pal-accent transition">Reset</button>
        </div>
        <div class="flex flex-wrap gap-1.5 items-center">
          <span class="text-xs text-pal-muted mr-1">Elements</span>
          ${elementChips}
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-pal-border/60">
          <div class="text-sm text-pal-muted">
            Showing <span id="resultCount" class="text-pal-text font-semibold">0</span>
            of <span id="totalCount" class="text-pal-text font-semibold">0</span>
            ${isWork ? " · work columns default high → low (zeros sink)" : ""}
          </div>
          <div class="flex flex-wrap gap-1">
            <button type="button" data-view="table" class="view-btn is-active">Table</button>
            <button type="button" data-view="cards" class="view-btn">Cards</button>
            <button type="button" data-view="compact" class="view-btn">Compact</button>
          </div>
        </div>
        <div class="text-xs text-pal-muted">
          ${
            isWork
              ? 'Also browse the full <a class="text-pal-accent underline underline-offset-2" href="' +
                escapeHtml(prefix + "pals/") +
                '">pals database</a>.'
              : 'Need work-focused columns? Open the <a class="text-pal-accent underline underline-offset-2" href="' +
                escapeHtml(prefix + "tools/work-suitability/") +
                '">work suitability tool</a>.'
          }
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
  .elem-chip { cursor: pointer; opacity: 0.45; border: 1px solid transparent; }
  .elem-chip.is-on { opacity: 1; box-shadow: 0 0 0 1px rgba(255,255,255,0.25); }
  .view-btn {
    font-size: 12px; padding: 0.35rem 0.65rem; border-radius: 0.5rem;
    border: 1px solid #252a33; color: #8b919a; background: #0c0e12;
  }
  .view-btn.is-active { color: #e8eaed; border-color: #5b9fd4; background: rgba(91,159,212,0.12); }
  .table-wrap { overflow: auto; max-height: calc(100vh - 16rem); }
  table { border-collapse: collapse; width: 100%; }
  th.sortable { cursor: pointer; user-select: none; }
  th.sortable:hover { color: #e8eaed; }
  .sticky-left { position: sticky; left: 0; background: #14181f; z-index: 1; }
  .sticky-name { position: sticky; left: 2.5rem; background: #14181f; z-index: 1; }
  thead .sticky-left, thead .sticky-name { z-index: 2; background: #14181f; }
  tbody tr:hover .sticky-left, tbody tr:hover .sticky-name { background: #1a1f28; }
`;

  const body = `
  <main class="flex-1 px-3 md:px-4 py-4 w-full flex flex-col gap-3">
    <div class="page-title-bar flex flex-wrap items-end justify-between gap-2">
      <div>
        <div class="text-xs text-pal-muted mb-1">
          <a class="hover:text-pal-text" href="${escapeHtml(prefix)}index.html">Home</a>
          <span class="mx-1">/</span>
          <span class="text-pal-text">${escapeHtml(heading)}</span>
        </div>
        <h1 class="text-xl font-semibold">${escapeHtml(heading)}</h1>
        <p class="text-sm text-pal-muted mt-0.5">${escapeHtml(subtitle)}</p>
      </div>
    </div>

    ${filterChrome({ mode, prefix })}

    <section id="tableWrap" class="bg-pal-panel border border-pal-border rounded-lg overflow-hidden flex-1">
      <div class="table-wrap">
        <table id="table" class="text-sm">
          <thead class="bg-pal-panel"><tr id="theadRow"></tr></thead>
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
