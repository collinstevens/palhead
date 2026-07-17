const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");
const { genericBrowserScript } = require("../client/generic-browser");

function listPage({
  title,
  blurb,
  path,
  activeNav,
  siteMeta,
  crumbs,
  rows,
  columns,
  filterFields = [],
  defaultSort = "name",
  pageSize = 100,
}) {
  const prefix = depthPrefix(path);
  const filterHtml = filterFields
    .map((f) => {
      const opts = [
        ...new Set(rows.map((r) => r[f.field]).filter((v) => v != null && String(v).trim())),
      ].sort();
      return (
        '<div><label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">' +
        escapeHtml(f.label) +
        '</label><select data-filter="' +
        escapeHtml(f.field) +
        '" class="bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm min-w-[8rem]"><option value="">Any</option>' +
        opts
          .map(
            (o) =>
              '<option value="' +
              escapeHtml(String(o)) +
              '">' +
              escapeHtml(String(o)) +
              "</option>"
          )
          .join("") +
        "</select></div>"
      );
    })
    .join("");

  const headers = columns
    .map(
      (c) =>
        '<th class="' +
        (c.sortable === false ? "" : "sortable ") +
        'px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="' +
        escapeHtml(c.field) +
        '">' +
        escapeHtml(c.label) +
        "</th>"
    )
    .join("");

  const crumbHtml =
    '<div class="wh-breadcrumb"><a href="' +
    escapeHtml(prefix) +
    'index.html">Home</a>' +
    (crumbs || [])
      .map((c) => {
        if (c.href) {
          return (
            "<span> / </span><a href=\"" +
            escapeHtml(prefix + c.href.replace(/^\//, "")) +
            '">' +
            escapeHtml(c.label) +
            "</a>"
          );
        }
        return (
          '<span> / </span><span style="color:#c5ccda">' +
          escapeHtml(c.label) +
          "</span>"
        );
      })
      .join("") +
    "</div>";

  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    ${crumbHtml}
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="wh-h1">${escapeHtml(title)}</h1>
        <p class="wh-lede">${escapeHtml(blurb || "")}</p>
      </div>
      <span class="wh-chip wh-chip-live">live</span>
    </div>
    <section class="wh-panel" style="margin-bottom:8px">
      <div class="wh-panel-head"><h2>Filters</h2></div>
      <div class="wh-panel-body">
        <div class="flex flex-wrap items-end gap-2">
          <div class="flex-1 min-w-[12rem]">
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Search</label>
            <input id="search" type="search" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" placeholder="Search…" />
          </div>
          ${filterHtml}
          <button id="resetFilters" type="button" class="wh-btn wh-btn-ghost">Reset</button>
        </div>
        <div class="text-xs text-pal-muted mt-2 flex flex-wrap items-center gap-3">
          <span>Showing <span id="resultCount" class="text-pal-text font-bold">0</span> of <span id="totalCount" class="text-pal-text font-bold">0</span></span>
          <span>Page <span id="pageInfo">1 / 1</span></span>
          <button type="button" id="pagePrev" class="wh-btn wh-btn-ghost" style="padding:2px 8px">Prev</button>
          <button type="button" id="pageNext" class="wh-btn wh-btn-ghost" style="padding:2px 8px">Next</button>
        </div>
      </div>
    </section>
    <section class="wh-panel flex-1" style="margin:0">
      <div class="overflow-auto max-h-[calc(100vh-14rem)]">
        <table class="w-full text-sm border-collapse">
          <thead class="sticky top-0 z-10" style="background:var(--wh-panel)"><tr>${headers}</tr></thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </section>
  </main>`;

  const colConfig = {
    cols: columns,
    searchFields: columns.map((c) => c.field).concat(["name", "description", "code"]),
    pageSize,
  };

  return shell({
    title: title + " — Palhead",
    description: blurb || title,
    activeNav,
    body,
    prefix,
    siteMeta,
    headExtra:
      "<style>th.sortable{cursor:pointer;user-select:none}th.sortable:hover{color:#e8eaed}</style>",
    bodyScripts:
      "<script>const ASSET_PREFIX=" +
      JSON.stringify(prefix) +
      ";const DATA=" +
      JSON.stringify({ rows }) +
      ";" +
      genericBrowserScript({
        columns: colConfig,
        defaultSort,
      }) +
      "</script>",
  });
}

function hubPage({ title, blurb, path, activeNav, siteMeta, crumbs, cards }) {
  const prefix = depthPrefix(path);
  const cardHtml = (cards || [])
    .map((c) => {
      const href = prefix + String(c.path || "").replace(/^\//, "");
      return (
        '<a class="wh-panel" style="display:flex;flex-direction:column;text-decoration:none;color:inherit;margin:0" href="' +
        escapeHtml(href) +
        '"><div class="wh-panel-head"><h2 style="text-transform:none;letter-spacing:0;font-size:13px">' +
        escapeHtml(c.label) +
        '</h2><span class="wh-chip wh-chip-live">live</span></div><div class="wh-panel-body"><p style="margin:0 0 8px;font-size:12px;color:var(--wh-muted)">' +
        escapeHtml(c.blurb || "") +
        '</p><div style="font-size:11px;color:var(--wh-link)">' +
        escapeHtml(String(c.count ?? "—")) +
        "</div></div></a>"
      );
    })
    .join("");

  const crumbHtml =
    '<div class="wh-breadcrumb"><a href="' +
    escapeHtml(prefix) +
    'index.html">Home</a>' +
    (crumbs || [])
      .map((c) =>
        c.href
          ? '<span> / </span><a href="' +
            escapeHtml(prefix + c.href.replace(/^\//, "")) +
            '">' +
            escapeHtml(c.label) +
            "</a>"
          : '<span> / </span><span style="color:#c5ccda">' +
            escapeHtml(c.label) +
            "</span>"
      )
      .join("") +
    "</div>";

  const body = `
  <main class="wh-page wh-page-pad">
    ${crumbHtml}
    <h1 class="wh-h1">${escapeHtml(title)}</h1>
    <p class="wh-lede">${escapeHtml(blurb || "")}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">${cardHtml}</div>
  </main>`;

  return shell({
    title: title + " — Palhead",
    description: blurb || title,
    activeNav,
    body,
    prefix,
    siteMeta,
  });
}

function detailPage({
  title,
  kindLabel,
  path,
  activeNav,
  siteMeta,
  crumbs,
  stats = [],
  sections = [],
  subtitle = null,
}) {
  const prefix = depthPrefix(path);
  const crumbHtml =
    '<div class="wh-breadcrumb"><a href="' +
    escapeHtml(prefix) +
    'index.html">Home</a>' +
    (crumbs || [])
      .map((c) =>
        c.href
          ? '<span> / </span><a href="' +
            escapeHtml(prefix + c.href.replace(/^\//, "")) +
            '">' +
            escapeHtml(c.label) +
            "</a>"
          : '<span> / </span><span style="color:#c5ccda">' +
            escapeHtml(c.label) +
            "</span>"
      )
      .join("") +
    "</div>";

  const statsHtml = stats
    .map(
      (s) =>
        '<div class="stat-card"><div class="label">' +
        escapeHtml(s.label) +
        '</div><div class="value">' +
        escapeHtml(s.value == null || s.value === "" ? "—" : String(s.value)) +
        "</div></div>"
    )
    .join("");

  const sectionsHtml = sections
    .filter((s) => s && s.body)
    .map(
      (s) =>
        '<section class="wh-panel" style="margin:0"><div class="wh-panel-head"><h2>' +
        escapeHtml(s.title) +
        "</h2>" +
        (s.meta
          ? '<span class="wh-panel-meta">' + escapeHtml(String(s.meta)) + "</span>"
          : "") +
        '</div><div class="wh-panel-body">' +
        s.body +
        "</div></section>"
    )
    .join("");

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="max-w-3xl flex flex-col gap-3">
      ${crumbHtml}
      <header class="wh-panel" style="padding:12px;margin:0">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <span class="wh-chip wh-chip-live">paldb</span>
          <span class="text-xs text-pal-muted">${escapeHtml(kindLabel || "")}</span>
        </div>
        <h1 class="wh-h1" style="margin:0">${escapeHtml(title)}</h1>
        ${
          subtitle
            ? '<p class="text-sm text-pal-muted mt-1">' +
              escapeHtml(subtitle) +
              "</p>"
            : ""
        }
      </header>
      ${statsHtml ? '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">' + statsHtml + "</div>" : ""}
      ${sectionsHtml}
    </div>
  </main>`;

  return shell({
    title: title + " — Palhead",
    description: subtitle || title,
    activeNav,
    body,
    prefix,
    siteMeta,
  });
}

function materialsHtml(prefix, materials) {
  if (!materials || !materials.length) return "";
  return (
    '<ul class="text-sm space-y-1">' +
    materials
      .map((m) => {
        const qty =
          m.quantity != null
            ? ' <span class="text-pal-muted">×' +
              escapeHtml(String(m.quantity)) +
              "</span>"
            : "";
        if (m.path) {
          return (
            "<li><a href=\"" +
            escapeHtml(prefix + m.path.replace(/^\//, "")) +
            '">' +
            escapeHtml(m.name) +
            "</a>" +
            qty +
            "</li>"
          );
        }
        return (
          '<li class="text-pal-muted">' + escapeHtml(m.name) + qty + "</li>"
        );
      })
      .join("") +
    "</ul>"
  );
}

function dropsHtml(prefix, drops) {
  if (!drops || !drops.length) return "";
  return (
    '<div class="overflow-auto max-h-72"><table class="w-full text-sm"><thead><tr>' +
    '<th class="px-2 py-1 text-left text-[10px] uppercase text-pal-muted">Item</th>' +
    '<th class="px-2 py-1 text-center text-[10px] uppercase text-pal-muted">Qty</th>' +
    '<th class="px-2 py-1 text-center text-[10px] uppercase text-pal-muted">Rate</th>' +
    "</tr></thead><tbody>" +
    drops
      .map((d) => {
        const name = d.path
          ? '<a href="' +
            escapeHtml(prefix + d.path.replace(/^\//, "")) +
            '">' +
            escapeHtml(d.name) +
            "</a>"
          : escapeHtml(d.name || "—");
        return (
          '<tr class="border-t border-pal-border/40"><td class="px-2 py-1.5">' +
          name +
          '</td><td class="px-2 py-1.5 text-center text-xs">' +
          escapeHtml(d.quantity || "—") +
          '</td><td class="px-2 py-1.5 text-center text-xs">' +
          (d.rate != null ? escapeHtml(String(d.rate)) + "%" : "—") +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div>"
  );
}

module.exports = {
  listPage,
  hubPage,
  detailPage,
  materialsHtml,
  dropsHtml,
};
