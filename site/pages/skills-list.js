const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");
const { ELEMENTS } = require("../constants");
const { skillsBrowserScript } = require("../client/skills-browser");

const KIND_META = {
  partner: {
    title: "Partner Skills",
    path: "/skills/partner/",
    blurb: "Mount, combat, and base partner skills with known owner pals.",
    nav: "skills",
  },
  passive: {
    title: "Passive Skills",
    path: "/skills/passive/",
    blurb: "Ranked passives with effects. Owner links when pals list fixed passives.",
    nav: "skills",
  },
  active: {
    title: "Active Skills",
    path: "/skills/active/",
    blurb: "Combat skills: element, power, cooldown, status, skill fruit.",
    nav: "skills",
  },
};

function skillsListPage({ kind, siteMeta, skillsPayload }) {
  const meta = KIND_META[kind];
  const href = meta.path;
  const prefix = depthPrefix(href);

  const categories = [
    ...new Set(
      (skillsPayload.skills || [])
        .map((s) => s.category)
        .filter((c) => c && String(c).trim())
    ),
  ].sort();

  const ranks = [
    ...new Set(
      (skillsPayload.skills || [])
        .map((s) => s.rank)
        .filter((r) => r != null)
    ),
  ].sort((a, b) => a - b);

  const elementOpts =
    '<option value="">Any element</option>' +
    ELEMENTS.map(
      (e) =>
        '<option value="' + escapeHtml(e) + '">' + escapeHtml(e) + "</option>"
    ).join("");

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

  const rankOpts =
    '<option value="">Any rank</option>' +
    ranks
      .map(
        (r) =>
          '<option value="' +
          escapeHtml(String(r)) +
          '">' +
          escapeHtml(String(r)) +
          "</option>"
      )
      .join("");

  let headers = "";
  if (kind === "partner") {
    headers =
      '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="name">Skill</th>' +
      '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="owners">Owners</th>' +
      '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="category">Category</th>' +
      '<th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Description</th>';
  } else if (kind === "passive") {
    headers =
      '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="name">Skill</th>' +
      '<th class="sortable px-3 py-2 text-center text-[11px] uppercase text-pal-muted" data-sort="rank">Rank</th>' +
      '<th class="sortable px-3 py-2 text-center text-[11px] uppercase text-pal-muted" data-sort="weight">Weight</th>' +
      '<th class="sortable px-3 py-2 text-center text-[11px] uppercase text-pal-muted" data-sort="owners">Owners</th>' +
      '<th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Description</th>';
  } else {
    headers =
      '<th class="sortable px-3 py-2 text-left text-[11px] uppercase text-pal-muted" data-sort="name">Skill</th>' +
      '<th class="sortable px-3 py-2 text-center text-[11px] uppercase text-pal-muted" data-sort="power">Power</th>' +
      '<th class="sortable px-3 py-2 text-center text-[11px] uppercase text-pal-muted" data-sort="cool_time">CT</th>' +
      '<th class="sortable px-3 py-2 text-center text-[11px] uppercase text-pal-muted" data-sort="category">Category</th>' +
      '<th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Status</th>' +
      '<th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Description</th>';
  }

  const filters =
    kind === "active"
      ? '<div><label class="block text-xs text-pal-muted mb-1">Element</label><select id="elementFilter" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm">' +
        elementOpts +
        "</select></div>" +
        '<div><label class="block text-xs text-pal-muted mb-1">Category</label><select id="categoryFilter" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm min-w-[8rem]">' +
        categoryOpts +
        "</select></div>"
      : kind === "passive"
        ? '<div><label class="block text-xs text-pal-muted mb-1">Rank</label><select id="rankFilter" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm">' +
          rankOpts +
          "</select></div>"
        : '<div><label class="block text-xs text-pal-muted mb-1">Category</label><select id="categoryFilter" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm min-w-[10rem]">' +
          categoryOpts +
          "</select></div>";

  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}skills/">Skills</a>
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
          <input id="search" type="search" placeholder="Name, description…" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" />
        </div>
        ${filters}
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
const DATA = ${JSON.stringify(skillsPayload)};
${skillsBrowserScript({ kind })}
</script>`;

  return shell({
    title: meta.title + " — Palhead",
    description: meta.blurb,
    activeNav: meta.nav,
    body,
    prefix,
    siteMeta,
    headExtra:
      "<style>th.sortable{cursor:pointer;user-select:none}th.sortable:hover{color:#e8eaed}</style>",
    bodyScripts,
  });
}

function skillsHubPage({ siteMeta, counts }) {
  const href = "/skills/";
  const prefix = depthPrefix(href);
  const c = counts || {};

  const card = (rel, title, desc, n) =>
    '<a class="wh-panel" style="display:flex;flex-direction:column;text-decoration:none;color:inherit;margin:0" href="' +
    escapeHtml(prefix + rel) +
    '"><div class="wh-panel-head"><h2 style="text-transform:none;letter-spacing:0;font-size:13px">' +
    escapeHtml(title) +
    '</h2><span class="wh-chip wh-chip-live">live</span></div><div class="wh-panel-body"><p style="margin:0 0 8px;font-size:12px;color:var(--wh-muted)">' +
    escapeHtml(desc) +
    '</p><div style="font-size:11px;color:var(--wh-link)">' +
    escapeHtml(String(n ?? "—")) +
    " skills</div></div></a>";

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}database/">Database</a>
      <span> / </span>
      <span style="color:#c5ccda">Skills</span>
    </div>
    <h1 class="wh-h1">Skills</h1>
    <p class="wh-lede">Partner, passive, and active skills from paldb.cc.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">
      ${card("skills/partner/", "Partner skills", "Rides, combat boosts, base utilities.", c.skill_partner)}
      ${card("skills/passive/", "Passive skills", "Ranks, weights, fixed-on pals when known.", c.skill_passive)}
      ${card("skills/active/", "Active skills", "Power, CT, elements, skill fruits.", c.skill_active)}
    </div>
  </main>`;

  return shell({
    title: "Skills — Palhead",
    description: "Partner, passive, and active skills database.",
    activeNav: "skills",
    body,
    prefix,
    siteMeta,
  });
}

module.exports = { skillsListPage, skillsHubPage, KIND_META };
