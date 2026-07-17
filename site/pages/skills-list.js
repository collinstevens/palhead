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
  <main class="flex-1 px-3 md:px-4 py-4 w-full flex flex-col gap-3">
    <div>
      <div class="text-xs text-pal-muted mb-1">
        <a class="hover:text-pal-text" href="${escapeHtml(prefix)}index.html">Home</a>
        <span class="mx-1">/</span>
        <a class="hover:text-pal-text" href="${escapeHtml(prefix)}skills/">Skills</a>
        <span class="mx-1">/</span>
        <span class="text-pal-text">${escapeHtml(meta.title)}</span>
      </div>
      <h1 class="text-xl font-semibold">${escapeHtml(meta.title)}</h1>
      <p class="text-sm text-pal-muted mt-0.5">${escapeHtml(meta.blurb)}</p>
      <p class="text-xs text-pal-muted mt-1">Source: paldb.cc</p>
    </div>

    <section class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4 space-y-3">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[12rem]">
          <label class="block text-xs text-pal-muted mb-1 font-medium">Search</label>
          <input id="search" type="search" placeholder="Name, description…" class="w-full bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent" />
        </div>
        ${filters}
        <button id="resetFilters" type="button" class="px-3 py-2 text-sm rounded-lg border border-pal-border text-pal-muted hover:text-pal-text hover:border-pal-accent">Reset</button>
      </div>
      <div class="text-sm text-pal-muted">
        Showing <span id="resultCount" class="text-pal-text font-semibold">0</span>
        of <span id="totalCount" class="text-pal-text font-semibold">0</span>
      </div>
    </section>

    <section class="bg-pal-panel border border-pal-border rounded-lg overflow-hidden flex-1">
      <div class="overflow-auto max-h-[calc(100vh-14rem)]">
        <table id="table" class="w-full text-sm border-collapse">
          <thead class="bg-pal-panel sticky top-0 z-10"><tr>${headers}</tr></thead>
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
    '<a class="rounded-lg border border-pal-border bg-pal-panel p-4 hover:border-pal-accent transition flex flex-col gap-2" href="' +
    escapeHtml(prefix + rel) +
    '"><div class="font-semibold">' +
    escapeHtml(title) +
    '</div><p class="text-sm text-pal-muted flex-1">' +
    escapeHtml(desc) +
    '</p><div class="text-xs text-pal-accent">' +
    escapeHtml(String(n ?? "—")) +
    " skills</div></a>";

  const body = `
  <main class="flex-1 px-4 py-8 w-full">
    <div class="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <div class="text-xs text-pal-muted mb-1">
          <a class="hover:text-pal-text" href="${escapeHtml(prefix)}index.html">Home</a>
          <span class="mx-1">/</span>
          <span class="text-pal-text">Skills</span>
        </div>
        <h1 class="text-2xl font-semibold mb-2">Skills</h1>
        <p class="text-sm text-pal-muted">Partner, passive, and active skills from paldb.cc.</p>
      </div>
      <div class="grid sm:grid-cols-3 gap-3">
        ${card("skills/partner/", "Partner skills", "Rides, combat boosts, base utilities.", c.skill_partner)}
        ${card("skills/passive/", "Passive skills", "Ranks, weights, fixed-on pals when known.", c.skill_passive)}
        ${card("skills/active/", "Active skills", "Power, CT, elements, skill fruits.", c.skill_active)}
      </div>
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
