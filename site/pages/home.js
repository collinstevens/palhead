const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");

function formatCount(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function homePage({ siteMeta, pals, samplePal }) {
  const href = "/";
  const prefix = depthPrefix(href);
  const c = siteMeta.counts || {};
  const sampleHref = samplePal
    ? prefix + samplePal.path.replace(/^\//, "")
    : null;

  const countRows = [
    ["Pals (all)", c.pals, null],
    ["Pals (dex default)", c.pals_dex, null],
    ["Partner skills", c.skill_partner, null],
    ["Passive skills", c.skill_passive, null],
    ["Active skills", c.skill_active, null],
    ["Materials", c.item_material, null],
    ["Weapons", c.item_weapon, null],
    ["Armor", c.item_armor, null],
    ["Structures", c.structure, null],
    ["Search index entries", c.search_entries, null],
  ]
    .map(([label, val]) => {
      return (
        "<li class=\"flex justify-between gap-4 border-b border-pal-border/50 py-1.5\">" +
        '<span class="text-pal-muted">' +
        escapeHtml(label) +
        "</span>" +
        '<span class="text-pal-text font-medium tabular-nums">' +
        escapeHtml(formatCount(val)) +
        "</span></li>"
      );
    })
    .join("");

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
        <p class="text-xs uppercase tracking-wide text-pal-muted mb-1">Phase 0 · foundations</p>
        <h1 class="text-2xl sm:text-3xl font-semibold mb-2">Palhead database rebuild</h1>
        <p class="text-pal-muted text-sm leading-relaxed max-w-2xl">
          Multi-page static SSG (no React/Next/SPA). Game data is imported from
          <a class="text-pal-accent underline underline-offset-2" href="https://paldb.cc" target="_blank" rel="noopener noreferrer">paldb.cc</a>
          publish bundles, normalized, then rendered to nested HTML routes.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <section class="rounded-lg border border-pal-border bg-pal-panel p-4">
          <h2 class="text-sm font-semibold mb-3">Vendor catalog</h2>
          <ul class="text-sm">${countRows}</ul>
        </section>
        <section class="rounded-lg border border-pal-border bg-pal-panel p-4 flex flex-col gap-3">
          <h2 class="text-sm font-semibold">Pipeline status</h2>
          <dl class="text-sm space-y-2">
            <div class="flex justify-between gap-3"><dt class="text-pal-muted">Data version</dt><dd class="text-pal-text">${escapeHtml(siteMeta.data_version || "—")}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-pal-muted">Validation</dt><dd class="text-pal-text">${escapeHtml(siteMeta.validation_status || "—")}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-pal-muted">Tables</dt><dd class="text-pal-text">${escapeHtml(String(siteMeta.table_count ?? "—"))}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-pal-muted">Routing</dt><dd class="text-pal-text">nested (/pal/…/)</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-pal-muted">Default pal filter</dt><dd class="text-pal-text">dex (#&gt;0)</dd></div>
          </dl>
          ${
            sampleHref
              ? '<a class="inline-flex items-center justify-center rounded-lg bg-pal-accent/15 text-pal-accent border border-pal-accent/40 px-3 py-2 text-sm font-medium hover:bg-pal-accent/25 transition" href="' +
                escapeHtml(sampleHref) +
                '">Open sample entity → ' +
                escapeHtml(samplePal.name) +
                "</a>"
              : ""
          }
        </section>
      </div>

      <section>
        <div class="flex items-end justify-between gap-3 mb-3">
          <h2 class="text-sm font-semibold">Sample dex pals</h2>
          <span class="text-xs text-pal-muted">Entity pages generated for all pals</span>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          ${sampleCards || '<p class="text-sm text-pal-muted">No pals in normalized data.</p>'}
        </div>
      </section>
    </div>
  </main>`;

  return shell({
    title: "Palhead — Palworld database",
    description:
      "Palworld database rebuild. Static multi-page site powered by paldb.cc data.",
    activeNav: "home",
    body,
    prefix,
    siteMeta,
  });
}

module.exports = { homePage };
