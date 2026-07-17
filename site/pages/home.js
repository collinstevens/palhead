const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");
const { emptyState, emptyFeedRows, panel } = require("../empty");

function formatCount(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function linkCell(prefix, href, label, soon) {
  if (soon) {
    return (
      '<span class="soon-cell">' + escapeHtml(label) + " · soon</span>"
    );
  }
  return (
    '<a href="' +
    escapeHtml(prefix + href.replace(/^\//, "")) +
    '">' +
    escapeHtml(label) +
    "</a>"
  );
}

function homePage({ siteMeta, pals }) {
  const href = "/";
  const prefix = depthPrefix(href);
  const c = siteMeta.counts || {};

  const liveLinks = [
    ["pals/", "Pals database"],
    ["skills/", "Skills catalog"],
    ["items/", "Items database"],
    ["recipes/", "Recipes browser"],
    ["tools/work-suitability/", "Work suitability"],
    ["skills/partner/", "Partner skills"],
    ["skills/passive/", "Passive skills"],
    ["skills/active/", "Active skills"],
  ]
    .map(
      ([h, label]) =>
        '<a href="' +
        escapeHtml(prefix + h) +
        '" style="display:block;padding:4px 0;font-size:12px;font-weight:600;color:var(--wh-link);text-decoration:none">' +
        escapeHtml(label) +
        "</a>"
    )
    .join("");

  const soonLinks = [
    "Breeding calculator",
    "Team builder",
    "Drop finder",
    "Structures",
    "World / drops",
  ]
    .map(
      (label) =>
        '<span style="display:block;padding:4px 0;font-size:12px;font-weight:600;color:#666">' +
        escapeHtml(label) +
        " · soon</span>"
    )
    .join("");

  const newsEmpty =
    emptyState({
      compact: true,
      icon: "N",
      title: "No news yet",
      body: "Headlines will use this two-column feed layout when patch notes and updates ship.",
    }) + emptyFeedRows(4);

  const sampleRows = (pals || [])
    .filter((p) => p.is_dex)
    .slice(0, 8)
    .map((p) => {
      const link = prefix + p.path.replace(/^\//, "");
      const img = p.icon
        ? '<img src="' +
          escapeHtml(prefix + "icons/" + p.icon) +
          '" alt="" width="28" height="28" style="width:28px;height:28px;border-radius:2px;background:#111" loading="lazy" />'
        : "";
      return (
        '<a href="' +
        escapeHtml(link) +
        '" style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-bottom:1px solid var(--wh-border);text-decoration:none;color:var(--wh-link);font-size:12px;font-weight:600">' +
        img +
        '<span style="color:var(--wh-muted);font-weight:600;width:2rem">#' +
        escapeHtml(String(p.deck)) +
        "</span>" +
        '<span style="color:var(--wh-text)">' +
        escapeHtml(p.name) +
        "</span></a>"
      );
    })
    .join("");

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="wh-stack">

      ${panel({
        title: "Database & tools",
        meta: "Live · placeholders marked soon",
        body:
          '<div class="wh-section-grid-2">' +
          '<div class="wh-split" style="padding:8px 10px 10px">' +
          '<div style="font-size:11px;font-weight:700;color:var(--wh-gold);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Live</div>' +
          liveLinks +
          "</div>" +
          '<div class="wh-split" style="padding:8px 10px 10px">' +
          '<div style="font-size:11px;font-weight:700;color:var(--wh-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Coming soon</div>' +
          soonLinks +
          "</div></div>",
      })}

      ${panel({
        title: "Featured database",
        meta: "Palworld · paldb.cc",
        body:
          '<div class="wh-feat-row">' +
          '<div class="wh-feat-media">PALHEAD<br/><span style="font-weight:600;color:var(--wh-muted);font-size:11px">Game database</span></div>' +
          '<div class="wh-feat-col">' +
          "<h3>Pals</h3>" +
          linkCell(prefix, "pals/", "Browse all pals") +
          linkCell(prefix, "pals/", formatCount(c.pals_dex) + " dex entries") +
          linkCell(prefix, "tools/work-suitability/", "Work suitability tool") +
          '<span class="soon-line">Mounts · soon</span>' +
          "</div>" +
          '<div class="wh-feat-col">' +
          "<h3>Skills</h3>" +
          linkCell(prefix, "skills/partner/", "Partner skills") +
          linkCell(prefix, "skills/passive/", "Passive skills") +
          linkCell(prefix, "skills/active/", "Active skills") +
          linkCell(prefix, "skills/", "Skills hub") +
          "</div>" +
          '<div class="wh-feat-col">' +
          "<h3>Items</h3>" +
          linkCell(prefix, "items/", "Items hub") +
          linkCell(prefix, "recipes/", "Recipes") +
          linkCell(prefix, "items/", formatCount(c.items) + " items") +
          linkCell(prefix, "recipes/", formatCount(c.recipes) + " recipes") +
          '<span class="soon-line">Structures · soon</span>' +
          '<span class="soon-line">World & drops · soon</span>' +
          "</div></div>",
      })}

      ${panel({
        id: "news",
        title: "News",
        meta: "Empty — Phase 8+",
        body:
          '<div class="wh-section-grid-2">' +
          '<div class="wh-split">' +
          emptyState({
            compact: true,
            icon: "N",
            title: "No news yet",
            body: "Site updates and patch notes will list here in a dense two-column feed.",
          }) +
          emptyFeedRows(3) +
          "</div>" +
          '<div class="wh-split">' +
          emptyFeedRows(4) +
          "</div></div>",
      })}

      ${panel({
        title: "Dex pals",
        meta: "Live sample",
        body:
          '<div style="display:grid;grid-template-columns:1fr 1fr">' +
          '<div style="border-right:1px solid var(--wh-border)">' +
          (sampleRows || "") +
          "</div>" +
          '<div style="padding:10px">' +
          '<ul class="wh-stat-list">' +
          [
            ["Data version", siteMeta.data_version || "—"],
            ["Validation", siteMeta.validation_status || "—"],
            ["Bundle", siteMeta.source_name || "—"],
            ["Pals (dex)", formatCount(c.pals_dex)],
            ["Pals (all)", formatCount(c.pals)],
            ["Partner skills", formatCount(c.skill_partner)],
            ["Passive skills", formatCount(c.skill_passive)],
            ["Active skills", formatCount(c.skill_active)],
            ["Items", formatCount(c.items)],
            ["Recipes", formatCount(c.recipes)],
          ]
            .map(
              ([label, val]) =>
                '<li><span class="label">' +
                escapeHtml(label) +
                '</span><span class="val">' +
                escapeHtml(String(val)) +
                "</span></li>"
            )
            .join("") +
          "</ul>" +
          '<div style="padding-top:10px"><a class="wh-btn wh-btn-primary" href="' +
          escapeHtml(prefix + "pals/") +
          '">View all pals</a></div>' +
          "</div></div>",
      })}

      ${panel({
        id: "guides",
        title: "Guides",
        meta: "Empty hub",
        body:
          emptyState({
            compact: true,
            icon: "G",
            title: "No guides published",
            body: "Base tips, status effects, breeding, and boss write-ups will use this section card. Structure only for now.",
            ctaHref: prefix + "guides/",
            ctaLabel: "Open guides hub",
          }) +
          '<div class="wh-link-grid" style="border-top:1px solid var(--wh-border);margin-top:8px">' +
          [
            ["Base tips", true],
            ["Status effects", true],
            ["Breeding", true],
            ["Combat", true],
            ["Bosses", true],
            ["Exploration", true],
          ]
            .map(([label, soon]) =>
              soon
                ? '<span class="soon-cell">' + escapeHtml(label) + "</span>"
                : ""
            )
            .join("") +
          "</div>",
      })}

      ${panel({
        title: "Countdowns & status",
        meta: "Reserved",
        body:
          '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:4px 0">' +
          '<div style="flex:1;min-width:200px;background:var(--wh-input);border:1px solid var(--wh-border);padding:12px;min-height:64px;display:flex;align-items:center;justify-content:center;color:#555;font-weight:700;font-size:12px">Event art · soon</div>' +
          '<div style="flex:2;min-width:220px">' +
          '<div style="font-size:14px;font-weight:700;color:var(--wh-text-bright);margin-bottom:4px">Nothing scheduled</div>' +
          '<div style="font-size:12px;color:var(--wh-muted)">Countdowns and “today in Palworld” style blocks will sit here.</div>' +
          "</div></div>",
      })}

    </div>
  </main>`;

  return shell({
    title: "Palhead — Palworld Database & Tools",
    description:
      "Palhead is a Palworld database and tools site — pals, skills, work suitability, and more. Game data from paldb.cc.",
    activeNav: "home",
    body,
    prefix,
    siteMeta,
  });
}

module.exports = { homePage };
