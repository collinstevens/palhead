const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");
const { hubPage, detailPage } = require("./catalog");

function guidesHubPage({ siteMeta }) {
  return hubPage({
    title: "Guides",
    blurb: "Base tips, status effects, and SAN thresholds.",
    path: "/guides/",
    activeNav: "guides",
    siteMeta,
    crumbs: [{ label: "Guides" }],
    cards: [
      {
        label: "Base tips",
        blurb: "Partner skills useful for base work boosts.",
        path: "/guides/base-tips/",
        count: siteMeta.counts?.base_tips,
      },
      {
        label: "Status effects",
        blurb: "In-game Survival Guide transcriptions.",
        path: "/guides/status-effects/",
        count: 8,
      },
      {
        label: "SAN",
        blurb: "Sanity thresholds and sickness treatments.",
        path: "/guides/san/",
        count: siteMeta.counts?.work_suitabilities ? "—" : "—",
      },
    ],
  });
}

function baseTipsPage({ siteMeta, tips }) {
  const path = "/guides/base-tips/";
  const prefix = depthPrefix(path);
  const rows = (tips.tips || [])
    .map((t) => {
      const href = t.path
        ? prefix + t.path.replace(/^\//, "")
        : null;
      return (
        '<tr class="border-t border-pal-border/40">' +
        '<td class="px-3 py-2">' +
        (href
          ? '<a class="font-semibold" href="' +
            escapeHtml(href) +
            '">' +
            escapeHtml(t.name) +
            "</a>"
          : escapeHtml(t.name)) +
        '</td><td class="px-3 py-2 text-xs text-pal-muted">' +
        escapeHtml(String(t.owners ?? "—")) +
        '</td><td class="px-3 py-2 text-sm text-pal-muted">' +
        escapeHtml(t.description || "—") +
        "</td></tr>"
      );
    })
    .join("");

  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}guides/">Guides</a>
      <span> / </span>
      <span style="color:#c5ccda">Base tips</span>
    </div>
    <h1 class="wh-h1">Base tips</h1>
    <p class="wh-lede">Partner skills that mention base camp or work suitability boosts. Filtered from paldb partner skill text.</p>
    <section class="wh-panel" style="margin:0">
      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead style="background:var(--wh-panel)"><tr>
            <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Skill</th>
            <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Owners</th>
            <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Description</th>
          </tr></thead>
          <tbody>${rows || '<tr><td class="px-4 py-8 text-center text-pal-muted" colspan="3">No base tips matched.</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  </main>`;

  return shell({
    title: "Base tips — Palhead",
    description: "Partner skills for base work boosts.",
    activeNav: "guides",
    body,
    prefix,
    siteMeta,
  });
}

function statusEffectsPage({ siteMeta, status }) {
  const path = "/guides/status-effects/";
  const prefix = depthPrefix(path);
  const intro = (status?.intro || [])
    .map((p) => '<p class="text-sm text-pal-muted mb-2">' + escapeHtml(p) + "</p>")
    .join("");
  const cards = (status?.effects || [])
    .map(
      (e) =>
        '<div class="wh-panel" style="margin:0"><div class="wh-panel-head"><h2 style="text-transform:none;letter-spacing:0;font-size:13px">' +
        escapeHtml(e.name) +
        '</h2><span class="wh-panel-meta">' +
        escapeHtml(e.accent || "") +
        '</span></div><div class="wh-panel-body text-sm">' +
        escapeHtml(e.description || "") +
        "</div></div>"
    )
    .join("");

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}guides/">Guides</a>
      <span> / </span>
      <span style="color:#c5ccda">Status effects</span>
    </div>
    <h1 class="wh-h1">Status effects</h1>
    <p class="wh-lede">Transcribed from the in-game Survival Guide (screenshot-verified). Not wiki paraphrases.</p>
    <div class="mb-3">${intro}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px">${cards}</div>
  </main>`;

  return shell({
    title: "Status effects — Palhead",
    description: "Palworld status effects from the Survival Guide.",
    activeNav: "guides",
    body,
    prefix,
    siteMeta,
  });
}

function sanPage({ siteMeta, san }) {
  const path = "/guides/san/";
  const prefix = depthPrefix(path);
  const thresholds = (san?.thresholds || [])
    .map(
      (t) =>
        '<tr class="border-t border-pal-border/40"><td class="px-3 py-2 tabular-nums">' +
        escapeHtml(String(t.san ?? "—")) +
        '</td><td class="px-3 py-2">' +
        escapeHtml(t.status || "—") +
        "</td></tr>"
    )
    .join("");
  const sicknesses = (san?.sicknesses || [])
    .map(
      (s) =>
        '<tr class="border-t border-pal-border/40"><td class="px-3 py-2 font-semibold">' +
        escapeHtml(s.name || "—") +
        '</td><td class="px-3 py-2 text-sm text-pal-muted">' +
        escapeHtml(s.effects || "—") +
        '</td><td class="px-3 py-2 text-sm">' +
        escapeHtml(s.treatment || "—") +
        "</td></tr>"
    )
    .join("");

  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-3">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}guides/">Guides</a>
      <span> / </span>
      <span style="color:#c5ccda">SAN</span>
    </div>
    <h1 class="wh-h1">SAN</h1>
    <p class="wh-lede">Sanity thresholds and sickness treatments from paldb.</p>
    <section class="wh-panel" style="margin:0">
      <div class="wh-panel-head"><h2>Thresholds</h2></div>
      <div class="wh-panel-body overflow-auto">
        <table class="w-full text-sm"><thead><tr>
          <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">SAN</th>
          <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Status</th>
        </tr></thead><tbody>${thresholds || '<tr><td colspan="2" class="px-4 py-6 text-pal-muted">No thresholds.</td></tr>'}</tbody></table>
      </div>
    </section>
    <section class="wh-panel" style="margin:0">
      <div class="wh-panel-head"><h2>Sicknesses</h2></div>
      <div class="wh-panel-body overflow-auto">
        <table class="w-full text-sm"><thead><tr>
          <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Name</th>
          <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Effects</th>
          <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Treatment</th>
        </tr></thead><tbody>${sicknesses || '<tr><td colspan="3" class="px-4 py-6 text-pal-muted">No sickness data.</td></tr>'}</tbody></table>
      </div>
    </section>
  </main>`;

  return shell({
    title: "SAN — Palhead",
    description: "Palworld SAN thresholds and sicknesses.",
    activeNav: "guides",
    body,
    prefix,
    siteMeta,
  });
}

function newsPage({ siteMeta, news }) {
  const path = "/news/";
  const prefix = depthPrefix(path);
  const items = news.items || [];
  const feed = items
    .map((n) => {
      const bullets = (n.bullets || [])
        .slice(0, 4)
        .map((b) => "<li>" + escapeHtml(b) + "</li>")
        .join("");
      return (
        '<li class="wh-feed-item">' +
        '<div class="wh-feed-thumb">' +
        escapeHtml(String(n.title || "").slice(0, 2)) +
        '</div><div class="min-w-0 flex-1">' +
        '<div class="wh-feed-cat">' +
        escapeHtml(n.kind || "news") +
        '</div><div class="wh-feed-title">' +
        escapeHtml(n.title) +
        '</div><div class="wh-feed-desc">' +
        (bullets
          ? '<ul class="list-disc pl-4 text-xs mt-1 space-y-0.5">' +
            bullets +
            "</ul>"
          : "No bullet summary in export.") +
        "</div></div></li>"
      );
    })
    .join("");

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <span style="color:#c5ccda">News</span>
    </div>
    <h1 class="wh-h1">News & patch notes</h1>
    <p class="wh-lede">From paldb patch notes / version tables. Dense feed layout.</p>
    <section class="wh-panel" style="margin:0">
      <div class="wh-panel-head"><h2>Updates</h2><span class="wh-panel-meta">${escapeHtml(String(items.length))}</span></div>
      <div class="wh-panel-body">
        <ul class="wh-feed-list">${feed || '<li class="wh-feed-item is-empty"><div class="wh-feed-title">No posts yet</div></li>'}</ul>
      </div>
    </section>
  </main>`;

  return shell({
    title: "News — Palhead",
    description: "Palworld patch notes and updates.",
    activeNav: "news",
    body,
    prefix,
    siteMeta,
  });
}

function workSuitRefPage({ siteMeta, work }) {
  const path = "/guides/work-power/";
  const prefix = depthPrefix(path);
  const blocks = (work.work_suitabilities || [])
    .map((w) => {
      const power = (w.level_power || [])
        .map(
          (lp) =>
            '<span class="wh-chip">Lv' +
            escapeHtml(String(lp.level)) +
            ": " +
            escapeHtml(String(lp.power)) +
            "</span>"
        )
        .join(" ");
      return (
        '<section class="wh-panel" style="margin:0 0 8px"><div class="wh-panel-head"><h2 style="text-transform:none;letter-spacing:0;font-size:13px">' +
        escapeHtml(w.name) +
        '</h2><span class="wh-panel-meta">' +
        escapeHtml(String(w.pal_count || 0)) +
        " pals</span></div><div class=\"wh-panel-body\"><div class=\"flex flex-wrap gap-1 mb-2\">" +
        power +
        "</div></div></section>"
      );
    })
    .join("");

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}guides/">Guides</a>
      <span> / </span>
      <span style="color:#c5ccda">Work power</span>
    </div>
    <h1 class="wh-h1">Work suitability power</h1>
    <p class="wh-lede">Level → power curves from paldb. Pal browser remains at <a href="${escapeHtml(prefix)}tools/work-suitability/">Work suitability tool</a>.</p>
    ${blocks}
  </main>`;

  return shell({
    title: "Work power — Palhead",
    description: "Work suitability level power curves.",
    activeNav: "guides",
    body,
    prefix,
    siteMeta,
  });
}

module.exports = {
  guidesHubPage,
  baseTipsPage,
  statusEffectsPage,
  sanPage,
  newsPage,
  workSuitRefPage,
};
