const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");
const { itemsBrowserScript } = require("../client/items-browser");
const { recipesBrowserScript } = require("../client/recipes-browser");

const RARITY_STYLE = `
.rarity-common{color:#9d9d9d}
.rarity-uncommon{color:#1eff00}
.rarity-rare{color:#0070dd}
.rarity-epic{color:#a335ee}
.rarity-legendary{color:#e5cc80}
th.sortable{cursor:pointer;user-select:none}
th.sortable:hover{color:#e8eaed}
`;

function itemsHubPage({ siteMeta, categories }) {
  const href = "/items/";
  const prefix = depthPrefix(href);
  const cats = categories || siteMeta.item_categories || [];
  const total = siteMeta.counts?.items ?? cats.reduce((n, c) => n + (c.count || 0), 0);
  const recipeCount = siteMeta.counts?.recipes ?? 0;

  const cards = cats
    .map((c) => {
      const path = (c.path || "/items/" + c.key + "/").replace(/^\//, "");
      return (
        '<a class="wh-panel" style="display:flex;flex-direction:column;text-decoration:none;color:inherit;margin:0" href="' +
        escapeHtml(prefix + path) +
        '"><div class="wh-panel-head"><h2 style="text-transform:none;letter-spacing:0;font-size:13px">' +
        escapeHtml(c.label) +
        '</h2><span class="wh-chip wh-chip-live">live</span></div><div class="wh-panel-body"><p style="margin:0 0 8px;font-size:12px;color:var(--wh-muted)">' +
        escapeHtml(c.blurb || "") +
        '</p><div style="font-size:11px;color:var(--wh-link)">' +
        escapeHtml(String(c.count ?? 0)) +
        " items</div></div></a>"
      );
    })
    .join("");

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}database/">Database</a>
      <span> / </span>
      <span style="color:#c5ccda">Items</span>
    </div>
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="wh-h1">Items</h1>
        <p class="wh-lede">${escapeHtml(String(total))} items across ${escapeHtml(String(cats.length))} categories from paldb.cc. Craft links via recipes.</p>
      </div>
      <span class="wh-chip wh-chip-live">live</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:10px">
      ${cards}
      <a class="wh-panel" style="display:flex;flex-direction:column;text-decoration:none;color:inherit;margin:0" href="${escapeHtml(prefix)}recipes/">
        <div class="wh-panel-head"><h2 style="text-transform:none;letter-spacing:0;font-size:13px">Recipes</h2><span class="wh-chip wh-chip-live">live</span></div>
        <div class="wh-panel-body"><p style="margin:0 0 8px;font-size:12px;color:var(--wh-muted)">Browse craft products, materials, and workstations.</p>
        <div style="font-size:11px;color:var(--wh-link)">${escapeHtml(String(recipeCount))} recipes</div></div>
      </a>
    </div>
  </main>`;

  return shell({
    title: "Items — Palhead",
    description: "Palworld items database: materials, gear, consumables, spheres, and more.",
    activeNav: "items",
    body,
    prefix,
    siteMeta,
  });
}

function itemsListPage({ category, siteMeta, itemsPayload }) {
  const meta = {
    key: category.key,
    title: category.label,
    path: category.path || "/items/" + category.key + "/",
    blurb: category.blurb || "",
  };
  const href = meta.path;
  const prefix = depthPrefix(href);

  const rarities = [
    ...new Set(
      (itemsPayload.items || [])
        .map((i) => i.rarity)
        .filter((r) => r && String(r).trim())
    ),
  ].sort();

  const rarityOpts =
    '<option value="">Any rarity</option>' +
    rarities
      .map(
        (r) =>
          '<option value="' +
          escapeHtml(String(r)) +
          '">' +
          escapeHtml(String(r)) +
          "</option>"
      )
      .join("");

  const headers =
    '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="name">Item</th>' +
    '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="rarity">Rarity</th>' +
    '<th class="sortable px-3 py-2 text-center text-[11px] uppercase text-pal-muted" data-sort="weight">Weight</th>' +
    '<th class="sortable px-3 py-2 text-center text-[11px] uppercase text-pal-muted" data-sort="stack">Stack</th>' +
    '<th class="px-3 py-2 text-center text-[11px] uppercase text-pal-muted">Craft</th>' +
    '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="name">Code</th>';

  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}database/">Database</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}items/">Items</a>
      <span> / </span>
      <span style="color:#c5ccda">${escapeHtml(meta.title)}</span>
    </div>
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="wh-h1">${escapeHtml(meta.title)}</h1>
        <p class="wh-lede">${escapeHtml(meta.blurb)} Source: paldb.cc.</p>
      </div>
      <span class="wh-chip wh-chip-live">live</span>
    </div>

    <section class="wh-panel" style="margin-bottom:8px">
      <div class="wh-panel-head"><h2>Filters</h2></div>
      <div class="wh-panel-body">
      <div class="flex flex-wrap items-end gap-2">
        <div class="flex-1 min-w-[12rem]">
          <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Search</label>
          <input id="search" type="search" placeholder="Name, code…" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Rarity</label>
          <select id="rarityFilter" class="bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm min-w-[8rem]">${rarityOpts}</select>
        </div>
        <div>
          <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Recipe</label>
          <select id="recipeFilter" class="bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm">
            <option value="">Any</option>
            <option value="yes">Has craft data</option>
            <option value="no">No craft data</option>
          </select>
        </div>
        <button id="resetFilters" type="button" class="wh-btn wh-btn-ghost">Reset</button>
      </div>
      <div class="text-xs text-pal-muted mt-2">
        Showing <span id="resultCount" class="text-pal-text font-bold">0</span>
        of <span id="totalCount" class="text-pal-text font-bold">0</span>
      </div>
      </div>
    </section>

    <section class="wh-panel flex-1" style="margin:0">
      <div class="overflow-auto max-h-[calc(100vh-14rem)]">
        <table id="table" class="w-full text-sm border-collapse">
          <thead class="sticky top-0 z-10" style="background:var(--wh-panel)"><tr>${headers}</tr></thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </section>
  </main>`;

  const bodyScripts = `
<script>
const ASSET_PREFIX = ${JSON.stringify(prefix)};
const DATA = ${JSON.stringify(itemsPayload)};
${itemsBrowserScript()}
</script>`;

  return shell({
    title: meta.title + " — Items — Palhead",
    description: meta.blurb,
    activeNav: "items",
    body,
    prefix,
    siteMeta,
    headExtra: "<style>" + RARITY_STYLE + "</style>",
    bodyScripts,
  });
}

function recipesListPage({ siteMeta, recipesPayload }) {
  const href = "/recipes/";
  const prefix = depthPrefix(href);

  const categories = [
    ...new Set(
      (recipesPayload.recipes || [])
        .map((r) => r.category)
        .filter((c) => c && String(c).trim())
    ),
  ].sort();

  const workstations = [
    ...new Set(
      (recipesPayload.recipes || []).flatMap((r) =>
        (r.workstations || []).map((w) => w.name || w.slug).filter(Boolean)
      )
    ),
  ].sort();

  const categoryOpts =
    '<option value="">Any category</option>' +
    categories
      .map(
        (c) =>
          '<option value="' +
          escapeHtml(String(c)) +
          '">' +
          escapeHtml(String(c)) +
          "</option>"
      )
      .join("");

  const workstationOpts =
    '<option value="">Any workstation</option>' +
    workstations
      .map(
        (w) =>
          '<option value="' +
          escapeHtml(String(w)) +
          '">' +
          escapeHtml(String(w)) +
          "</option>"
      )
      .join("");

  const headers =
    '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="product_name">Product</th>' +
    '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="category">Category</th>' +
    '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="materials">Materials</th>' +
    '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="workstation">Workstation</th>';

  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}database/">Database</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}items/">Items</a>
      <span> / </span>
      <span style="color:#c5ccda">Recipes</span>
    </div>
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="wh-h1">Recipes</h1>
        <p class="wh-lede">Craft products with materials and workstations. Source: paldb.cc.</p>
      </div>
      <span class="wh-chip wh-chip-live">live</span>
    </div>

    <section class="wh-panel" style="margin-bottom:8px">
      <div class="wh-panel-head"><h2>Filters</h2></div>
      <div class="wh-panel-body">
      <div class="flex flex-wrap items-end gap-2">
        <div class="flex-1 min-w-[12rem]">
          <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Search</label>
          <input id="search" type="search" placeholder="Product, material, station…" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Category</label>
          <select id="categoryFilter" class="bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm min-w-[8rem]">${categoryOpts}</select>
        </div>
        <div>
          <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Workstation</label>
          <select id="workstationFilter" class="bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm min-w-[10rem]">${workstationOpts}</select>
        </div>
        <button id="resetFilters" type="button" class="wh-btn wh-btn-ghost">Reset</button>
      </div>
      <div class="text-xs text-pal-muted mt-2">
        Showing <span id="resultCount" class="text-pal-text font-bold">0</span>
        of <span id="totalCount" class="text-pal-text font-bold">0</span>
      </div>
      </div>
    </section>

    <section class="wh-panel flex-1" style="margin:0">
      <div class="overflow-auto max-h-[calc(100vh-14rem)]">
        <table id="table" class="w-full text-sm border-collapse">
          <thead class="sticky top-0 z-10" style="background:var(--wh-panel)"><tr>${headers}</tr></thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </section>
  </main>`;

  const bodyScripts = `
<script>
const ASSET_PREFIX = ${JSON.stringify(prefix)};
const DATA = ${JSON.stringify(recipesPayload)};
${recipesBrowserScript()}
</script>`;

  return shell({
    title: "Recipes — Palhead",
    description: "Crafting recipes browser: products, materials, workstations.",
    activeNav: "items",
    body,
    prefix,
    siteMeta,
    headExtra: "<style>" + RARITY_STYLE + "</style>",
    bodyScripts,
  });
}

module.exports = { itemsHubPage, itemsListPage, recipesListPage };
