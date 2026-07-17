const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");

function formatCount(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function homePage({ siteMeta, pals }) {
  const href = "/";
  const prefix = depthPrefix(href);
  const c = siteMeta.counts || {};

  const feature = (hrefRel, title, desc, meta) =>
    '<a class="rounded-lg border border-pal-border bg-pal-panel p-4 hover:border-pal-accent transition flex flex-col gap-2" href="' +
    escapeHtml(prefix + hrefRel) +
    '">' +
    '<div class="font-semibold">' +
    escapeHtml(title) +
    "</div>" +
    '<p class="text-sm text-pal-muted flex-1">' +
    escapeHtml(desc) +
    "</p>" +
    '<div class="text-xs text-pal-accent">' +
    escapeHtml(meta) +
    "</div></a>";

  const sampleCards = (pals || [])
    .filter((p) => p.is_dex)
    .slice(0, 8)
    .map((p) => {
      const link = prefix + p.path.replace(/^\//, "");
      const img = p.icon
        ? '<img src="' +
          escapeHtml(prefix + "icons/" + p.icon) +
          '" alt="" width="40" height="40" class="w-10 h-10 rounded bg-pal-bg" loading="lazy" />'
        : '<div class="w-10 h-10 rounded bg-pal-bg"></div>';
      const elems = (p.elements || [])
        .map(
          (e) =>
            '<span class="elem elem-' +
            escapeHtml(e) +
            '">' +
            escapeHtml(e) +
            "</span>"
        )
        .join(" ");
      return (
        '<a class="flex items-center gap-3 rounded-lg border border-pal-border bg-pal-panel p-3 hover:border-pal-accent transition" href="' +
        escapeHtml(link) +
        '">' +
        img +
        '<div class="min-w-0">' +
        '<div class="font-semibold truncate">' +
        escapeHtml(p.name) +
        "</div>" +
        '<div class="text-xs text-pal-muted">#' +
        escapeHtml(String(p.deck)) +
        (elems ? " · " + elems : "") +
        "</div></div></a>"
      );
    })
    .join("");

  const body = `
  <main class="flex-1 px-4 py-8 w-full">
    <div class="max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <p class="text-xs uppercase tracking-wide text-pal-muted mb-1">Palworld database</p>
        <h1 class="text-2xl sm:text-3xl font-semibold mb-2">Palhead</h1>
        <p class="text-pal-muted text-sm leading-relaxed max-w-2xl">
          Multi-page static database powered by
          <a class="text-pal-accent underline underline-offset-2" href="https://paldb.cc" target="_blank" rel="noopener noreferrer">paldb.cc</a>.
          Browse every pal, filter work suitability, open deep-linkable entity pages.
        </p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${feature(
          "pals/",
          "Pals database",
          "Filter by element, work, size, food, and rarity. Table, cards, or compact views.",
          formatCount(c.pals_dex) + " dex · " + formatCount(c.pals) + " total"
        )}
        ${feature(
          "skills/",
          "Skills",
          "Partner, passive, and active skills from paldb.cc.",
          formatCount(
            (c.skill_partner || 0) +
              (c.skill_passive || 0) +
              (c.skill_active || 0)
          ) + " total"
        )}
        ${feature(
          "tools/work-suitability/",
          "Work suitability",
          "Spreadsheet-style work columns. Sort high → low with zeros sinking.",
          "12 work types"
        )}
      </div>

      <section class="rounded-lg border border-pal-border bg-pal-panel p-4">
        <h2 class="text-sm font-semibold mb-3">Data snapshot</h2>
        <ul class="text-sm grid sm:grid-cols-2 gap-x-6">
          <li class="flex justify-between gap-3 border-b border-pal-border/40 py-1.5"><span class="text-pal-muted">Data version</span><span>${escapeHtml(siteMeta.data_version || "—")}</span></li>
          <li class="flex justify-between gap-3 border-b border-pal-border/40 py-1.5"><span class="text-pal-muted">Validation</span><span>${escapeHtml(siteMeta.validation_status || "—")}</span></li>
          <li class="flex justify-between gap-3 border-b border-pal-border/40 py-1.5"><span class="text-pal-muted">Pals (dex)</span><span>${escapeHtml(formatCount(c.pals_dex))}</span></li>
          <li class="flex justify-between gap-3 border-b border-pal-border/40 py-1.5"><span class="text-pal-muted">Search index</span><span>${escapeHtml(formatCount(c.search_entries))}</span></li>
        </ul>
      </section>

      <section>
        <div class="flex items-end justify-between gap-3 mb-3">
          <h2 class="text-sm font-semibold">Dex pals</h2>
          <a class="text-xs text-pal-accent underline underline-offset-2" href="${escapeHtml(prefix)}pals/">View all →</a>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          ${sampleCards || '<p class="text-sm text-pal-muted">No pals loaded.</p>'}
        </div>
      </section>
    </div>
  </main>`;

  return shell({
    title: "Palhead — Palworld database",
    description:
      "Palworld pals database and work suitability tools. Static multi-page site powered by paldb.cc.",
    activeNav: "home",
    body,
    prefix,
    siteMeta,
  });
}

module.exports = { homePage };
