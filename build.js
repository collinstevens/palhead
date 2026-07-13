const fs = require("fs");
const data = require("./pals_data.json");
const partnerResolved = require("./reference/partner-skills/resolved.json");
const partnerChecklist = require("./reference/partner-skills/checklist.json");
const partnerDiff = require("./reference/partner-skills/discrepancies/cross-source-diff.json");
const dataJson = JSON.stringify(data);

const WORK = data.work;
const PALS = data.pals;

const NAV_SECTIONS = [
  {
    id: "news",
    label: "News",
    href: "index.html#news",
    activeOn: ["home"],
    items: [
      { href: "index.html#news", label: "All News", soon: true },
      { href: "index.html#news", label: "Patch Notes", soon: true },
      { href: "index.html#news", label: "Community", soon: true },
    ],
  },
  {
    id: "guides",
    label: "Guides",
    href: "base-tips.html",
    activeOn: ["base-tips"],
    items: [
      { href: "base-tips.html", label: "Base Tips" },
      { href: "index.html#guides", label: "Breeding", soon: true },
      { href: "index.html#guides", label: "Combat", soon: true },
      { href: "index.html#guides", label: "Exploration", soon: true },
      { href: "index.html#guides", label: "Bosses", soon: true },
    ],
  },
  {
    id: "database",
    label: "Database",
    href: "pals.html",
    activeOn: ["pals", "partner-skills"],
    items: [
      { href: "pals.html", label: "Pals" },
      { href: "partner-skills.html", label: "Partner Skills" },
      { href: "index.html#database", label: "Passive Skills", soon: true },
      { href: "index.html#database", label: "Items", soon: true },
      { href: "index.html#database", label: "Structures", soon: true },
      { href: "index.html#database", label: "Technology", soon: true },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    href: "partner-verify.html",
    activeOn: ["partner-verify"],
    items: [
      { href: "pals.html", label: "Work Suitability" },
      { href: "partner-skills.html", label: "Partner Skill Catalog" },
      { href: "partner-verify.html", label: "Palpedia Verify" },
      { href: "base-tips.html", label: "Base Boosters" },
      { href: "index.html#tools", label: "Breeding Calculator", soon: true },
      { href: "index.html#tools", label: "Team Builder", soon: true },
    ],
  },
];

const FOOTER_COLS = [
  {
    title: "Database",
    links: [
      { href: "pals.html", label: "Pals" },
      { href: "partner-skills.html", label: "Partner Skills" },
      { href: "#", label: "Passive Skills", soon: true },
      { href: "#", label: "Items", soon: true },
      { href: "#", label: "Structures", soon: true },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "pals.html", label: "Work Suitability" },
      { href: "partner-verify.html", label: "Palpedia Verify" },
      { href: "base-tips.html", label: "Base Boosters" },
      { href: "#", label: "Breeding Calculator", soon: true },
      { href: "#", label: "Team Builder", soon: true },
    ],
  },
  {
    title: "Guides",
    links: [
      { href: "base-tips.html", label: "Base Tips" },
      { href: "#", label: "Breeding", soon: true },
      { href: "#", label: "Combat", soon: true },
      { href: "#", label: "Exploration", soon: true },
      { href: "#", label: "Bosses", soon: true },
    ],
  },
  {
    title: "Site",
    links: [
      { href: "index.html", label: "Home" },
      { href: "index.html#news", label: "News", soon: true },
      { href: "#", label: "About", soon: true },
      { href: "https://paldb.cc", label: "paldb.cc", external: true },
    ],
  },
];

const BASE_WORK_BOOSTERS = [
  {
    work: "Watering",
    skill: "Magical Twin Powers",
    pal: "Amione",
    note: "While at base, +1 Watering for all other base pals.",
  },
  {
    work: "Generating Electricity",
    skill: "Crackle Booster",
    pal: "Puffolt",
    note: "While at base, +1 Generating Electricity for all other base pals.",
  },
  {
    work: "Handiwork",
    skill: "Happy-Go-Lucky Bunny",
    pal: "Ribbuny",
    note: "Also buffs Neutral party attack. +1 Handiwork for base pals.",
  },
  {
    work: "Gathering",
    skill: "Happy Clover",
    pal: "Clovee",
    note: "While at base, +1 Gathering for all other base pals.",
  },
  {
    work: "Mining",
    skill: "Masonry Archelon",
    pal: "Tetroise",
    note: "Mount. +1 Mining for all other base pals.",
  },
  {
    work: "Medicine Production",
    skill: "Charming Spore",
    pal: "Mycora",
    note: "+1 Medicine Production for other base pals at the base.",
  },
  {
    work: "Cooling",
    skill: "Cryo Instincts",
    pal: "Smokie Cryst",
    note: "+1 Cooling for all other base pals.",
  },
  {
    work: "Transporting",
    skill: "Guardian of the Snowy Mountain",
    pal: "Wumpo",
    note: "Mount. +1 Transporting for all other base pals (does not stack).",
  },
];

const AMBIGUOUS_BOOSTERS = [
  {
    work: "Planting",
    skill: "Blessing of the Flower Spirit",
    pal: "Petallia",
    note: "Raises Planting suitability while at base — wording does not clearly say “other base pals.”",
  },
  {
    work: "Farming",
    skill: "Mysterious Scales",
    pal: "Cinnamoth",
    note: "Boosts Farming suitability while at base — wording does not clearly say “other base pals.”",
  },
];

const NO_BOOST_WORK = ["Kindling", "Lumbering"];

function findPal(name) {
  return PALS.find((p) => p.n === name) || null;
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );
}

function paldbUrl(name) {
  return "https://paldb.cc/en/" + encodeURIComponent(name.replace(/ /g, "_"));
}

function renderNav(activeId) {
  return NAV_SECTIONS.map((sec) => {
    const active = (sec.activeOn || []).includes(activeId);
    const items = (sec.items || [])
      .map((item) => {
        if (item.soon) {
          return (
            '<span class="nav-dd-item nav-dd-soon">' +
            escapeHtml(item.label) +
            ' <em>soon</em></span>'
          );
        }
        return (
          '<a class="nav-dd-item" href="' +
          escapeHtml(item.href) +
          '">' +
          escapeHtml(item.label) +
          "</a>"
        );
      })
      .join("");
    return (
      '<div class="nav-item' +
      (active ? " is-active" : "") +
      '">' +
      '<a class="nav-link" href="' +
      escapeHtml(sec.href) +
      '">' +
      escapeHtml(sec.label) +
      "</a>" +
      (items ? '<div class="nav-dropdown">' + items + "</div>" : "") +
      "</div>"
    );
  }).join("\n          ");
}

function renderFooter() {
  const cols = FOOTER_COLS.map((col) => {
    const links = col.links
      .map((l) => {
        if (l.soon) {
          return (
            '<li><span class="footer-soon">' +
            escapeHtml(l.label) +
            " <em>soon</em></span></li>"
          );
        }
        const ext = l.external
          ? ' target="_blank" rel="noopener noreferrer"'
          : "";
        return (
          "<li><a href=\"" +
          escapeHtml(l.href) +
          '"' +
          ext +
          ">" +
          escapeHtml(l.label) +
          "</a></li>"
        );
      })
      .join("");
    return (
      '<div class="footer-col">' +
      "<h4>" +
      escapeHtml(col.title) +
      "</h4>" +
      "<ul>" +
      links +
      "</ul></div>"
    );
  }).join("");

  return (
    '<footer class="site-footer">' +
    '<div class="footer-inner">' +
    '<div class="footer-brand">' +
    '<a href="index.html" class="footer-logo">Palhead</a>' +
    '<p>Palworld tools — work suitability, partner skills, and verification. Not affiliated with Pocketpair.</p>' +
    "</div>" +
    '<div class="footer-cols">' +
    cols +
    "</div></div>" +
    '<div class="footer-bottom">' +
    "<span>Data from community dumps + multi-source scrapes · icons from paldb</span>" +
    "</div></footer>"
  );
}

function emptyState({ title, body, icon = "—" }) {
  return (
    '<div class="empty-state">' +
    '<div class="empty-icon" aria-hidden="true">' +
    escapeHtml(icon) +
    "</div>" +
    '<div class="empty-title">' +
    escapeHtml(title) +
    "</div>" +
    (body
      ? '<p class="empty-body">' + escapeHtml(body) + "</p>"
      : "") +
    "</div>"
  );
}

function sharedStyles() {
  return `
  body {
    background: #0b0c0e;
    color: #e4e4e7;
  }
  a { color: inherit; }
  .site-header {
    position: sticky; top: 0; z-index: 40;
    background: linear-gradient(180deg, #14161a 0%, #101114 100%);
    border-bottom: 1px solid #1f2228;
    box-shadow: 0 1px 0 rgba(0,0,0,0.4);
  }
  .header-top {
    display: flex; align-items: center; gap: 1rem;
    padding: 0 1rem; min-height: 48px;
    max-width: 1400px; margin: 0 auto;
  }
  .brand {
    display: flex; align-items: center; gap: 0.55rem;
    text-decoration: none; flex-shrink: 0; padding: 0.5rem 0;
  }
  .brand-mark {
    width: 30px; height: 30px; border-radius: 4px;
    background: linear-gradient(145deg, #f0a020, #c47a10);
    color: #1a1000; font-weight: 800; font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    letter-spacing: -0.03em;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.35);
  }
  .brand-name {
    font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em;
    color: #f4f4f5;
  }
  .brand-name span { color: #f0a020; }
  .primary-nav {
    display: flex; align-items: stretch; gap: 0.15rem;
    flex: 1; min-width: 0; overflow-x: auto;
  }
  .nav-item { position: relative; display: flex; align-items: stretch; }
  .nav-link {
    display: flex; align-items: center;
    padding: 0 0.85rem; height: 48px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; text-decoration: none;
    color: #a1a1aa; white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color 0.12s, border-color 0.12s;
  }
  .nav-link:hover, .nav-item.is-active .nav-link {
    color: #fafafa; border-bottom-color: #f0a020;
  }
  .nav-dropdown {
    display: none; position: absolute; top: 100%; left: 0; min-width: 12.5rem;
    background: #16181d; border: 1px solid #2a2e36; border-top: none;
    border-radius: 0 0 6px 6px; padding: 0.35rem 0;
    box-shadow: 0 12px 28px rgba(0,0,0,0.45); z-index: 50;
  }
  .nav-item:hover .nav-dropdown, .nav-item:focus-within .nav-dropdown { display: block; }
  .nav-dd-item {
    display: block; padding: 0.45rem 0.9rem; font-size: 13px;
    color: #d4d4d8; text-decoration: none; white-space: nowrap;
  }
  a.nav-dd-item:hover { background: #1e2229; color: #fff; }
  .nav-dd-soon { color: #52525b; cursor: default; }
  .nav-dd-soon em { font-style: normal; font-size: 10px; color: #3f3f46; margin-left: 0.25rem; }
  .header-search {
    display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
    margin-left: auto;
  }
  .header-search input {
    width: 11rem; max-width: 28vw;
    background: #0b0c0e; border: 1px solid #2a2e36; border-radius: 4px;
    padding: 0.35rem 0.65rem; font-size: 12px; color: #e4e4e7;
  }
  .header-search input:focus { outline: none; border-color: #f0a020; }
  .header-search input::placeholder { color: #52525b; }
  .header-search button {
    background: #1e2229; border: 1px solid #2a2e36; border-radius: 4px;
    color: #a1a1aa; font-size: 12px; font-weight: 600;
    padding: 0.35rem 0.65rem; cursor: pointer;
  }
  .header-search button:hover { color: #fff; border-color: #3f3f46; }
  @media (max-width: 720px) {
    .header-top { flex-wrap: wrap; min-height: auto; padding: 0.4rem 0.65rem; gap: 0.35rem 0.65rem; }
    .primary-nav { order: 3; width: 100%; height: 40px; }
    .nav-link { height: 40px; padding: 0 0.65rem; font-size: 11px; }
    .header-search { margin-left: 0; }
    .header-search input { width: 8rem; }
  }
  .promo-bar {
    background: #12141a; border-bottom: 1px solid #1f2228;
    padding: 0.55rem 1rem; text-align: center;
    font-size: 13px; color: #a1a1aa;
  }
  .promo-bar strong { color: #f0a020; font-weight: 700; }
  .promo-bar a { color: #e4e4e7; text-decoration: underline; text-underline-offset: 2px; }
  .promo-bar a:hover { color: #fff; }
  .page-wrap {
    max-width: 1400px; margin: 0 auto; width: 100%;
    padding: 0.85rem 0.75rem 2rem;
  }
  .page-wrap-wide {
    max-width: none;
  }
  .panel {
    background: #12141a; border: 1px solid #1f2228; border-radius: 4px;
  }
  .panel-head {
    display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
    padding: 0.55rem 0.85rem; border-bottom: 1px solid #1f2228;
    background: linear-gradient(180deg, #171a21 0%, #13151b 100%);
  }
  .panel-head h2, .panel-head h3 {
    font-size: 13px; font-weight: 700; letter-spacing: 0.02em;
    display: flex; align-items: center; gap: 0.45rem; margin: 0;
  }
  .panel-head h2::before, .panel-head h3::before {
    content: ""; width: 3px; height: 14px; border-radius: 1px;
    background: #f0a020; flex-shrink: 0;
  }
  .panel-head .panel-meta { font-size: 11px; color: #71717a; }
  .panel-body { padding: 0.75rem 0.85rem; }
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 1.75rem 1rem; min-height: 8rem;
    color: #52525b;
  }
  .empty-icon {
    width: 2.5rem; height: 2.5rem; border-radius: 6px;
    border: 1px dashed #2a2e36; background: #0b0c0e;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #3f3f46; margin-bottom: 0.65rem;
  }
  .empty-title { font-size: 13px; font-weight: 600; color: #71717a; }
  .empty-body { font-size: 12px; color: #52525b; margin-top: 0.3rem; max-width: 22rem; line-height: 1.45; }
  .quick-list { list-style: none; margin: 0; padding: 0; }
  .quick-list li { border-bottom: 1px solid #1a1d24; }
  .quick-list li:last-child { border-bottom: none; }
  .quick-list a, .quick-list .soon-row {
    display: flex; align-items: center; gap: 0.55rem;
    padding: 0.45rem 0.85rem; font-size: 13px; text-decoration: none;
    color: #c4c4c8;
  }
  .quick-list a:hover { background: #171a21; color: #fff; }
  .quick-list .dot {
    width: 6px; height: 6px; border-radius: 50%; background: #f0a020; flex-shrink: 0;
  }
  .quick-list .dot.muted { background: #3f3f46; }
  .quick-list .soon-row { color: #52525b; cursor: default; }
  .quick-list .tag {
    margin-left: auto; font-size: 10px; font-weight: 600; color: #71717a;
    background: #0b0c0e; border: 1px solid #1f2228; border-radius: 3px;
    padding: 1px 6px; white-space: nowrap;
  }
  .stat-list { list-style: none; margin: 0; padding: 0.35rem 0; }
  .stat-list li {
    display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem;
    padding: 0.4rem 0.85rem; font-size: 13px; border-bottom: 1px solid #1a1d24;
  }
  .stat-list li:last-child { border-bottom: none; }
  .stat-list .label { color: #a1a1aa; }
  .stat-list .val { font-weight: 700; color: #f4f4f5; font-variant-numeric: tabular-nums; }
  .stat-list a { color: #e4e4e7; text-decoration: none; }
  .stat-list a:hover { color: #f0a020; }
  .feature-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.65rem;
  }
  @media (max-width: 1000px) { .feature-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .feature-grid { grid-template-columns: 1fr; } }
  .feature-card {
    display: flex; flex-direction: column; min-height: 100%;
    background: #12141a; border: 1px solid #1f2228; border-radius: 4px;
    text-decoration: none; color: inherit; overflow: hidden;
    transition: border-color 0.12s, transform 0.12s;
  }
  a.feature-card:hover { border-color: #f0a020; transform: translateY(-1px); }
  .feature-card.is-empty { opacity: 0.75; }
  .feature-thumb {
    height: 96px; background: linear-gradient(135deg, #1a1d24 0%, #0f1115 100%);
    border-bottom: 1px solid #1f2228;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; font-weight: 800; color: #2a2e36; letter-spacing: -0.03em;
  }
  .feature-card:not(.is-empty) .feature-thumb {
    background: linear-gradient(135deg, #2a2210 0%, #14161a 55%, #101218 100%);
    color: #f0a020;
  }
  .feature-body { padding: 0.7rem 0.8rem 0.85rem; display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
  .feature-cat {
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: #f0a020;
  }
  .feature-card.is-empty .feature-cat { color: #52525b; }
  .feature-title { font-size: 14px; font-weight: 700; color: #f4f4f5; line-height: 1.3; }
  .feature-card.is-empty .feature-title { color: #71717a; }
  .feature-desc { font-size: 12px; color: #71717a; line-height: 1.4; flex: 1; }
  .feature-meta { font-size: 11px; color: #52525b; margin-top: 0.25rem; }
  .feed-list { list-style: none; margin: 0; padding: 0; }
  .feed-item {
    display: grid; grid-template-columns: 120px 1fr; gap: 0.85rem;
    padding: 0.85rem; border-bottom: 1px solid #1a1d24;
  }
  .feed-item:last-child { border-bottom: none; }
  .feed-thumb {
    width: 120px; height: 72px; border-radius: 3px;
    background: #0b0c0e; border: 1px solid #1f2228;
    display: flex; align-items: center; justify-content: center;
    color: #2a2e36; font-weight: 700; font-size: 12px;
  }
  .feed-cat {
    font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    color: #f0a020; margin-bottom: 0.2rem;
  }
  .feed-title { font-size: 15px; font-weight: 700; color: #e4e4e7; margin: 0 0 0.25rem; }
  .feed-desc { font-size: 13px; color: #71717a; line-height: 1.4; margin: 0; }
  .feed-date { font-size: 11px; color: #52525b; margin-top: 0.35rem; }
  .home-top-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem;
  }
  @media (max-width: 800px) { .home-top-grid { grid-template-columns: 1fr; } }
  .guide-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.75rem 0.85rem; }
  .guide-pill {
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.4rem 0.7rem; border-radius: 3px; font-size: 12px; font-weight: 600;
    background: #0b0c0e; border: 1px solid #1f2228; color: #c4c4c8; text-decoration: none;
  }
  a.guide-pill:hover { border-color: #f0a020; color: #fff; }
  .guide-pill.soon { color: #52525b; border-style: dashed; cursor: default; }
  .site-footer {
    margin-top: auto; background: #0e1014; border-top: 1px solid #1f2228;
  }
  .footer-inner {
    max-width: 1400px; margin: 0 auto; padding: 1.75rem 1rem 1.25rem;
    display: grid; grid-template-columns: 1.2fr 2.5fr; gap: 1.5rem;
  }
  @media (max-width: 800px) { .footer-inner { grid-template-columns: 1fr; } }
  .footer-brand .footer-logo {
    font-weight: 800; font-size: 1.15rem; color: #f0a020; text-decoration: none;
  }
  .footer-brand p { font-size: 12px; color: #52525b; margin-top: 0.5rem; max-width: 16rem; line-height: 1.45; }
  .footer-cols {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
  }
  @media (max-width: 700px) { .footer-cols { grid-template-columns: repeat(2, 1fr); } }
  .footer-col h4 {
    font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: #a1a1aa; margin: 0 0 0.55rem;
  }
  .footer-col ul { list-style: none; margin: 0; padding: 0; }
  .footer-col li { margin-bottom: 0.3rem; }
  .footer-col a {
    font-size: 12px; color: #71717a; text-decoration: none;
  }
  .footer-col a:hover { color: #f0a020; }
  .footer-soon { font-size: 12px; color: #3f3f46; }
  .footer-soon em { font-style: normal; font-size: 10px; }
  .footer-bottom {
    border-top: 1px solid #1a1d24; padding: 0.7rem 1rem; text-align: center;
    font-size: 11px; color: #3f3f46;
  }
  .page-title-bar {
    padding: 0.85rem 0 0.65rem; margin-bottom: 0.5rem;
  }
  .page-title-bar h1 {
    font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; margin: 0;
  }
  .page-title-bar p { font-size: 13px; color: #71717a; margin: 0.25rem 0 0; }
  .table-wrap { max-height: calc(100vh - 220px); width: 100%; }
  #table { width: 100%; table-layout: auto; }
  th.sortable { cursor: pointer; user-select: none; }
  th.sortable:hover { color: #e4e4e7; }
  th.sortable .sort-ind { opacity: 0.35; font-size: 0.7em; margin-left: 2px; }
  th.sortable.active .sort-ind { opacity: 1; color: #e4e4e7; }
  tr:hover td { background: rgba(255, 255, 255, 0.03); }
  .lvl-0 { color: #3f3f46; }
  .lvl-1 { color: #71717a; }
  .lvl-2 { color: #a1a1aa; }
  .lvl-3 { color: #d4d4d8; }
  .lvl-4 { color: #e4e4e7; font-weight: 600; }
  .lvl-5, .lvl-6, .lvl-7, .lvl-8, .lvl-9, .lvl-10 { color: #fafafa; font-weight: 600; }
  .elem {
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600; letter-spacing: 0.02em;
    padding: 2px 8px; border-radius: 4px; border: 1px solid transparent;
    line-height: 1.25;
  }
  .elem-Neutral { background: #27272a; color: #d4d4d8; border-color: #3f3f46; }
  .elem-Fire { background: #2a1515; color: #c4a0a0; border-color: #4a2828; }
  .elem-Water { background: #15202a; color: #a0b4c4; border-color: #283848; }
  .elem-Grass { background: #152a18; color: #a0bca4; border-color: #284830; }
  .elem-Electric { background: #2a2615; color: #c4bca0; border-color: #484028; }
  .elem-Ice { background: #152628; color: #a0bcc0; border-color: #284048; }
  .elem-Ground { background: #2a1c15; color: #c4b0a0; border-color: #483828; }
  .elem-Dark { background: #1c1528; color: #b0a0c4; border-color: #382848; }
  .elem-Dragon { background: #1a1528; color: #a8a0c4; border-color: #342848; }
  .chip {
    display: inline-flex; align-items: center;
    padding: 0; border: none; background: transparent; cursor: pointer;
    border-radius: 4px; transition: opacity 0.12s ease;
    opacity: 0.7;
  }
  .chip .elem { font-size: 11px; padding: 4px 10px; }
  .chip:hover { opacity: 1; }
  .chip.active {
    opacity: 1;
    outline: 1px solid #a1a1aa;
    outline-offset: 2px;
  }
  #table thead th {
    position: sticky; top: 0; z-index: 10;
    background: #18181b; box-shadow: inset 0 -1px 0 #27272a;
  }
  #table thead th.sticky-left, #table tbody td.sticky-left {
    position: sticky; left: 0; z-index: 5;
    background: #121214;
  }
  #table thead th.sticky-left { z-index: 15; background: #18181b; }
  #table thead th.sticky-name, #table tbody td.sticky-name {
    position: sticky; left: 3.25rem; z-index: 5;
    background: #121214;
  }
  #table thead th.sticky-name { z-index: 15; background: #18181b; }
  #table tbody tr:hover td.sticky-left,
  #table tbody tr:hover td.sticky-name { background: #1a1a1d; }
  .col-work { min-width: 0; }
  .pal-icon {
    width: 36px; height: 36px; object-fit: contain;
    border-radius: 6px; background: #0a0a0b;
    border: 1px solid #27272a; flex-shrink: 0;
    image-rendering: auto;
  }
  .pal-icon-lg {
    width: 48px; height: 48px; object-fit: contain;
    border-radius: 6px; background: #0a0a0b;
    border: 1px solid #27272a; flex-shrink: 0;
  }
  .pal-name-cell {
    display: flex; align-items: center; gap: 0.5rem;
  }
  .pal-name-link {
    color: inherit; text-decoration: none;
  }
  .pal-name-link:hover {
    color: #fafafa; text-decoration: underline;
    text-underline-offset: 2px;
  }
  .work-pill {
    display: inline-flex; align-items: center;
    font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
    padding: 3px 10px; border-radius: 4px;
    background: #18181b; color: #d4d4d8; border: 1px solid #27272a;
  }
  .plus-badge {
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; font-family: ui-monospace, Consolas, monospace;
    min-width: 2.25rem; padding: 2px 8px; border-radius: 4px;
    background: #18181b; color: #d4d4d8; border: 1px solid #3f3f46;
  }
  .src-badge, .status-badge {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 600; letter-spacing: 0.02em;
    padding: 2px 7px; border-radius: 4px; border: 1px solid #27272a;
    line-height: 1.25; white-space: nowrap;
    background: #18181b; color: #a1a1aa;
  }
  .src-wiki-gg, .src-game8, .src-paldb, .src-correction {
    background: #18181b; color: #a1a1aa; border-color: #27272a;
  }
  .status-pending { background: #18181b; color: #71717a; border-color: #27272a; }
  .status-partial { background: #1c1a15; color: #a8a090; border-color: #3a3528; }
  .status-verified { background: #151a16; color: #90a898; border-color: #283a30; }
  .status-skipped { background: #18181b; color: #71717a; border-color: #27272a; }
  .desc-cell { max-width: 36rem; line-height: 1.4; }
  .per-source-block {
    margin-top: 0.4rem; padding: 0.45rem 0.6rem; border-radius: 6px;
    background: #0a0a0b; border: 1px solid #27272a;
    font-size: 11px; color: #71717a;
  }
  .per-source-block strong { color: #e4e4e7; font-weight: 600; }
  .stat-card {
    background: #121214; border: 1px solid #27272a; border-radius: 8px; padding: 0.75rem 1rem;
  }
  .stat-card .n { font-size: 1.35rem; font-weight: 600; line-height: 1.1; color: #e4e4e7; }
  .filter-chip {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.3rem 0.7rem; border-radius: 4px; border: 1px solid #27272a;
    background: #0a0a0b; color: #71717a; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: color 0.12s, border-color 0.12s, background 0.12s;
  }
  .filter-chip:hover { color: #e4e4e7; border-color: #3f3f46; }
  .filter-chip.active { color: #e4e4e7; border-color: #52525b; background: #18181b; }
  .section-tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .section-tab {
    padding: 0.4rem 0.85rem; border-radius: 4px; border: 1px solid #27272a;
    background: #0a0a0b; color: #71717a; font-size: 13px; font-weight: 500; cursor: pointer;
  }
  .section-tab.active { color: #0a0a0b; background: #e4e4e7; border-color: #e4e4e7; }
  .conflict-card {
    border: 1px solid #27272a; border-radius: 8px; background: #121214; padding: 0.85rem 1rem;
  }
`;
}

function shell({ title, subtitle, activeNav, body, headExtra = "", bodyScripts = "", showPromo = false }) {
  const promo = showPromo
    ? `<div class="promo-bar"><strong>Palhead</strong> — work suitability spreadsheet, partner skills catalog, and Palpedia verification tools. <a href="pals.html">Open the pals database →</a></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        pal: {
          bg: '#0b0c0e',
          panel: '#12141a',
          panel2: '#171a21',
          border: '#1f2228',
          muted: '#71717a',
          text: '#e4e4e7',
          accent: '#f0a020',
          accent2: '#a1a1aa',
          gold: '#f0a020',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'Cascadia Code', 'Consolas', 'monospace']
      }
    }
  }
}
</script>
<style>
${sharedStyles()}
</style>
${headExtra}
</head>
<body class="text-pal-text font-sans antialiased min-h-screen">
  <div class="min-h-screen flex flex-col">
    <header class="site-header">
      <div class="header-top">
        <a href="index.html" class="brand" aria-label="Palhead home">
          <span class="brand-mark">P</span>
          <span class="brand-name">Pal<span>head</span></span>
        </a>
        <nav class="primary-nav" aria-label="Primary">
          ${renderNav(activeNav)}
        </nav>
        <form class="header-search" action="pals.html" method="get" role="search">
          <input type="search" name="q" placeholder="Search pals…" aria-label="Search pals" />
          <button type="submit">Search</button>
        </form>
      </div>
    </header>
    ${promo}

    ${body}

    ${renderFooter()}
  </div>
${bodyScripts}
</body>
</html>
`;
}

function palCell(name) {
  const pal = findPal(name);
  const img = pal && pal.img
    ? '<img class="pal-icon" src="icons/' +
      escapeHtml(pal.img) +
      '" alt="" width="36" height="36" />'
    : '<div class="pal-icon" aria-hidden="true"></div>';
  const deck = pal ? '<span class="text-pal-muted font-mono text-xs">#' + pal.d + "</span>" : "";
  const elems =
    pal && pal.e
      ? pal.e
          .map((e) => '<span class="elem elem-' + e + '">' + escapeHtml(e) + "</span>")
          .join(" ")
      : "";
  return (
    '<div class="flex items-center gap-3 min-w-0">' +
    img +
    '<div class="min-w-0">' +
    '<div class="flex items-center gap-2 flex-wrap">' +
    '<a class="pal-name-link font-semibold" href="' +
    paldbUrl(name) +
    '" target="_blank" rel="noopener noreferrer">' +
    escapeHtml(name) +
    "</a>" +
    deck +
    "</div>" +
    (elems ? '<div class="mt-1 flex flex-wrap gap-1">' + elems + "</div>" : "") +
    "</div></div>"
  );
}

function boosterRows(list) {
  return list
    .map((b) => {
      return (
        '<tr class="border-t border-pal-border/40">' +
        '<td class="px-3 py-3 whitespace-nowrap"><span class="work-pill">' +
        escapeHtml(b.work) +
        "</span></td>" +
        '<td class="px-3 py-3 text-center"><span class="plus-badge">+1</span></td>' +
        '<td class="px-3 py-3">' +
        palCell(b.pal) +
        "</td>" +
        '<td class="px-3 py-3">' +
        '<div class="font-semibold text-sm">' +
        escapeHtml(b.skill) +
        "</div>" +
        '<div class="text-xs text-pal-muted mt-0.5 leading-relaxed">' +
        escapeHtml(b.note) +
        "</div>" +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

function coverageGrid() {
  const boosted = new Map(BASE_WORK_BOOSTERS.map((b) => [b.work, b]));
  const ambiguous = new Map(AMBIGUOUS_BOOSTERS.map((b) => [b.work, b]));

  return WORK.map((work) => {
    const b = boosted.get(work);
    const a = ambiguous.get(work);
    let status;
    let detail;
    if (b) {
      status =
        '<span class="text-pal-text font-medium text-xs">+1 aura</span>';
      detail = escapeHtml(b.pal);
    } else if (a) {
      status =
        '<span class="text-pal-gold font-medium text-xs">unclear</span>';
      detail = escapeHtml(a.pal);
    } else if (NO_BOOST_WORK.includes(work)) {
      status =
        '<span class="text-pal-muted font-semibold text-xs">none known</span>';
      detail = "—";
    } else {
      status =
        '<span class="text-pal-muted font-semibold text-xs">none known</span>';
      detail = "—";
    }
    return (
      '<div class="rounded-lg border border-pal-border/70 bg-pal-bg/40 px-3 py-2.5">' +
      '<div class="text-[11px] uppercase tracking-wide text-pal-muted font-semibold">' +
      escapeHtml(work) +
      "</div>" +
      '<div class="mt-1 flex items-center justify-between gap-2">' +
      status +
      '<span class="text-sm font-medium truncate">' +
      detail +
      "</span>" +
      "</div></div>"
    );
  }).join("");
}

function buildBaseTipsPage() {
  const body = `
    <main class="flex-1 page-wrap flex flex-col gap-3">
      <div class="page-title-bar">
        <h1>Base Tips</h1>
        <p>Partner skills that raise work suitability for other pals at your base.</p>
      </div>
      <section class="bg-pal-panel border border-pal-border rounded-lg p-4 md:p-5 space-y-3">
        <div>
          <h2 class="text-xl font-semibold tracking-tight">How +1 auras work</h2>
          <p class="text-sm text-pal-muted mt-1 leading-relaxed">
            Partner skills that raise <span class="text-pal-text font-medium">work suitability level by +1</span>
            for other pals at your base. Passive skills never grant work levels — only work speed and similar stats.
          </p>
        </div>
        <ul class="grid sm:grid-cols-2 gap-2 text-sm text-pal-muted">
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span>Effects apply while the booster pal is assigned to that base.</span></li>
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span>Duplicates generally do not stack (Wumpo text says so explicitly).</span></li>
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span>Only pals that already have the work type benefit from the +1.</span></li>
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span>No known base-wide +1 for Kindling or Lumbering.</span></li>
        </ul>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-pal-border/70 flex flex-wrap items-center justify-between gap-2">
          <h3 class="font-semibold">Work suitability +1 partner skills</h3>
          <span class="text-xs text-pal-muted">${BASE_WORK_BOOSTERS.length} boosters · clear “other base pals” wording</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-pal-panel2 text-left text-[11px] uppercase tracking-wide text-pal-muted">
                <th class="px-3 py-2.5 font-semibold">Work</th>
                <th class="px-3 py-2.5 font-semibold text-center">Boost</th>
                <th class="px-3 py-2.5 font-semibold">Pal</th>
                <th class="px-3 py-2.5 font-semibold">Partner skill</th>
              </tr>
            </thead>
            <tbody>
              ${boosterRows(BASE_WORK_BOOSTERS)}
            </tbody>
          </table>
        </div>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-lg p-4 md:p-5 space-y-3">
        <h3 class="font-semibold">Coverage by work type</h3>
        <p class="text-xs text-pal-muted">Same column order as the <a class="text-pal-text underline underline-offset-2 hover:text-white" href="pals.html">Pals spreadsheet</a>.</p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          ${coverageGrid()}
        </div>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-pal-border/70">
          <h3 class="font-semibold">Ambiguous / self-only wording</h3>
          <p class="text-xs text-pal-muted mt-1">These raise suitability at base, but descriptions do not clearly say “other base pals.” Treat as uncertain until verified in-game.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-pal-panel2 text-left text-[11px] uppercase tracking-wide text-pal-muted">
                <th class="px-3 py-2.5 font-semibold">Work</th>
                <th class="px-3 py-2.5 font-semibold text-center">Boost</th>
                <th class="px-3 py-2.5 font-semibold">Pal</th>
                <th class="px-3 py-2.5 font-semibold">Partner skill</th>
              </tr>
            </thead>
            <tbody>
              ${boosterRows(AMBIGUOUS_BOOSTERS)}
            </tbody>
          </table>
        </div>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-lg p-4 md:p-5 space-y-3">
        <h3 class="font-semibold">Other base work tips</h3>
        <ul class="space-y-2 text-sm text-pal-muted">
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span><span class="text-pal-text">Pal Essence Condenser</span> can raise a work suitability by one level on the individual pal.</span></li>
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span>Match specialized workers to <span class="text-pal-text">Medicine Production</span> and <span class="text-pal-text">Cooling</span> — those tasks sit low in work priority.</span></li>
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span>Keep <span class="text-pal-text">Gathering</span> + <span class="text-pal-text">Transporting</span> covered so farms and mines actually clear into chests.</span></li>
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span>Use the <span class="text-pal-text">Monitor Stand</span> to allow/disallow work types when pals wander off priority jobs.</span></li>
          <li class="flex gap-2"><span class="text-pal-muted">·</span><span>Passives like Artisan / Work Slave raise <span class="text-pal-text">work speed</span>, not suitability rank.</span></li>
        </ul>
      </section>
    </main>
  `;

  return shell({
    title: "Palhead — Base Tips",
    subtitle: "Palworld tools — base work suitability boosts",
    activeNav: "base-tips",
    body,
  });
}

function buildPalsPage() {
  const body = `
    <main class="flex-1 page-wrap page-wrap-wide flex flex-col gap-3">
      <div class="page-title-bar">
        <h1>Pals — Work Suitability</h1>
        <p>Sortable spreadsheet for every pal. Click column headers to sort; work columns default high → low.</p>
      </div>
      <section class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4 space-y-3">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs text-pal-muted mb-1 font-medium">Search</label>
            <input id="search" type="search" placeholder="Name or #…" class="w-full bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
          </div>
          <div>
            <label class="block text-xs text-pal-muted mb-1 font-medium">Quick sort</label>
            <select id="quickSort" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent min-w-[180px]">
              <option value="d:asc"># ascending</option>
              <option value="d:desc"># descending</option>
              <option value="n:asc">Name A–Z</option>
              <option value="n:desc">Name Z–A</option>
            </select>
          </div>
          <button id="resetFilters" type="button" class="px-3 py-2 text-sm rounded-lg border border-pal-border text-pal-muted hover:text-pal-text hover:border-pal-accent transition">Reset</button>
        </div>

        <div>
          <div class="text-xs text-pal-muted mb-1.5 font-medium">Element</div>
          <div id="elemFilters" class="flex flex-wrap gap-1.5"></div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 text-sm pt-1 border-t border-pal-border/60">
          <div class="text-pal-muted">
            Showing <span id="resultCount" class="text-pal-text font-semibold">0</span> of <span id="totalCount" class="text-pal-text font-semibold">0</span> pals
            <span id="sortLabel" class="ml-2 text-pal-muted"></span>
          </div>
          <div class="text-xs text-pal-muted">Tip: click any column header to sort. Work columns default to high → low.</div>
        </div>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-lg overflow-hidden flex-1">
        <div class="table-wrap overflow-auto">
          <table id="table" class="w-full min-w-full text-sm border-collapse">
            <thead>
              <tr id="theadRow"></tr>
            </thead>
            <tbody id="tbody"></tbody>
          </table>
        </div>
      </section>
    </main>
  `;

  const bodyScripts = `
<script>
const DATA = ${dataJson};

const ELEMENTS = ['Neutral','Fire','Water','Grass','Electric','Ice','Ground','Dark','Dragon'];
const WORK = DATA.work;
const PALS = DATA.pals;

const state = {
  search: '',
  elements: new Set(),
  sortKey: 'd',
  sortDir: 'asc',
};

function lvlClass(n) {
  if (n >= 5) return 'lvl-5';
  return 'lvl-' + Math.min(n, 4);
}

function buildChrome() {
  const elemBox = document.getElementById('elemFilters');
  elemBox.innerHTML = ELEMENTS.map(e =>
    '<button type="button" class="chip" data-elem="' + e + '"><span class="elem elem-' + e + '">' + e + '</span></button>'
  ).join('');

  const qs = document.getElementById('quickSort');
  WORK.forEach((w, i) => {
    const o1 = document.createElement('option');
    o1.value = 'w' + i + ':desc';
    o1.textContent = w + ' high → low';
    qs.appendChild(o1);
    const o2 = document.createElement('option');
    o2.value = 'w' + i + ':asc';
    o2.textContent = w + ' low → high';
    qs.appendChild(o2);
  });

  document.getElementById('totalCount').textContent = PALS.length;
  renderHead();
}

function renderHead() {
  const cols = [
    { key: 'd', label: '#', cls: 'sticky-left w-14 text-center' },
    { key: 'n', label: 'Name', cls: 'sticky-name text-left min-w-[12rem]' },
    { key: 'e', label: 'Element', cls: 'text-left min-w-[7rem]' },
    ...WORK.map((w, i) => ({ key: 'w' + i, label: w, cls: 'col-work text-center' })),
  ];

  document.getElementById('theadRow').innerHTML = cols.map(c => {
    const active = state.sortKey === c.key ? 'active' : '';
    const arrow = state.sortKey === c.key
      ? (state.sortDir === 'asc' ? ' ▲' : ' ▼')
      : '';
    const wrap = c.key.startsWith('w') ? 'whitespace-normal leading-tight' : 'whitespace-nowrap';
    return '<th class="sortable ' + active + ' ' + c.cls +
      ' px-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-pal-muted ' + wrap + '" data-sort="' +
      c.key + '" title="' + c.label + '">' + c.label +
      (arrow ? '<span class="sort-ind">' + arrow.trim() + '</span>' : '') + '</th>';
  }).join('');
}

function getSortValue(pal, key) {
  if (key === 'd') return pal.d;
  if (key === 'n') return pal.n.toLowerCase();
  if (key === 'e') return (pal.e[0] || '').toLowerCase();
  if (key.startsWith('w')) {
    const i = +key.slice(1);
    return pal.w[i] || 0;
  }
  return 0;
}

function filteredSorted() {
  const q = state.search.trim().toLowerCase();
  let list = PALS.filter(p => {
    if (q) {
      const hay = p.n.toLowerCase() + ' ' + p.d + ' #' + p.d;
      if (!hay.includes(q)) return false;
    }
    if (state.elements.size) {
      if (!p.e.some(e => state.elements.has(e))) return false;
    }
    return true;
  });

  const dir = state.sortDir === 'asc' ? 1 : -1;
  const key = state.sortKey;
  const isWork = key.startsWith('w');

  list.sort((a, b) => {
    let av = getSortValue(a, key);
    let bv = getSortValue(b, key);
    if (isWork && state.sortDir === 'desc') {
      if (av === 0 && bv !== 0) return 1;
      if (bv === 0 && av !== 0) return -1;
    }
    if (typeof av === 'string') {
      const cmp = av.localeCompare(bv);
      if (cmp !== 0) return cmp * dir;
    } else if (av !== bv) {
      return (av - bv) * dir;
    }
    return a.d - b.d || a.n.localeCompare(b.n);
  });

  return list;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderTable() {
  const list = filteredSorted();
  document.getElementById('resultCount').textContent = list.length;

  const sortName = state.sortKey === 'd' ? '#'
    : state.sortKey === 'n' ? 'Name'
    : state.sortKey === 'e' ? 'Element'
    : WORK[+state.sortKey.slice(1)];
  document.getElementById('sortLabel').textContent =
    '· sorted by ' + sortName + ' ' + (state.sortDir === 'asc' ? '↑' : '↓');

  const tbody = document.getElementById('tbody');
  const rows = list.map(p => {
    const elems = p.e.map(e =>
      '<span class="elem elem-' + e + '">' + e + '</span>'
    ).join(' ');
    const works = p.w.map(lv => {
      if (!lv) {
        return '<td class="px-1 py-1.5 text-center lvl-0"></td>';
      }
      return '<td class="px-1 py-1.5 text-center font-mono ' + lvlClass(lv) + '">' + lv + '</td>';
    }).join('');
    const img = p.img
      ? '<img class="pal-icon" src="icons/' + escapeHtml(p.img) + '" alt="" loading="lazy" width="36" height="36" />'
      : '<div class="pal-icon" aria-hidden="true"></div>';
    const paldbUrl = 'https://paldb.cc/en/' + encodeURIComponent(p.n.replace(/ /g, '_'));
    const nameLink = '<a class="pal-name-link" href="' + paldbUrl + '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(p.n) + '</a>';
    return '<tr class="border-t border-pal-border/40">' +
      '<td class="sticky-left px-2 py-1.5 text-center text-pal-muted font-mono text-xs">' + p.d + '</td>' +
      '<td class="sticky-name px-2 py-1.5 font-semibold whitespace-nowrap">' +
        '<div class="pal-name-cell">' + img + nameLink + '</div>' +
      '</td>' +
      '<td class="px-2 py-1.5 whitespace-nowrap">' + elems + '</td>' +
      works +
    '</tr>';
  }).join('');
  tbody.innerHTML = rows ||
    '<tr><td colspan="15" class="px-4 py-10 text-center text-pal-muted">No pals match your filters.</td></tr>';
  renderHead();
  syncQuickSort();
}

function syncQuickSort() {
  const qs = document.getElementById('quickSort');
  const val = state.sortKey + ':' + state.sortDir;
  if ([...qs.options].some(o => o.value === val)) qs.value = val;
}

function setSort(key) {
  if (state.sortKey === key) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortKey = key;
    state.sortDir = key.startsWith('w') ? 'desc' : 'asc';
  }
  renderTable();
}

function bind() {
  document.getElementById('search').addEventListener('input', e => {
    state.search = e.target.value;
    renderTable();
  });

  document.getElementById('elemFilters').addEventListener('click', e => {
    const btn = e.target.closest('[data-elem]');
    if (!btn) return;
    const el = btn.dataset.elem;
    if (state.elements.has(el)) state.elements.delete(el);
    else state.elements.add(el);
    btn.classList.toggle('active', state.elements.has(el));
    renderTable();
  });

  document.getElementById('quickSort').addEventListener('change', e => {
    const [key, dir] = e.target.value.split(':');
    state.sortKey = key;
    state.sortDir = dir;
    renderTable();
  });

  document.getElementById('table').addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    setSort(th.dataset.sort);
  });

  document.getElementById('resetFilters').addEventListener('click', () => {
    state.search = '';
    state.elements = new Set();
    state.sortKey = 'd';
    state.sortDir = 'asc';
    document.getElementById('search').value = '';
    document.querySelectorAll('#elemFilters .chip').forEach(c => c.classList.remove('active'));
    renderTable();
  });
}

buildChrome();
bind();
(function initFromQuery() {
  const q = new URLSearchParams(location.search).get('q');
  if (q) {
    state.search = q;
    const input = document.getElementById('search');
    if (input) input.value = q;
  }
})();
renderTable();
</script>
`;

  return shell({
    title: "Palhead — Pals Work Suitability Spreadsheet",
    subtitle: "Palworld tools — work suitability spreadsheet",
    activeNav: "pals",
    body,
    bodyScripts,
  });
}

function buildPartnerSkillsPayload() {
  const checklistByPal = new Map(
    (partnerChecklist.pals || []).map((p) => [p.pal, p])
  );
  const palsByName = new Map(PALS.map((p) => [p.n, p]));

  const skills = (partnerResolved.skills || []).map((s) => {
    const pal = palsByName.get(s.pal);
    const check = checklistByPal.get(s.pal);
    return {
      name: s.name,
      pal: s.pal,
      no: s.no,
      type: s.type,
      description: s.description,
      sources: s.sources || [],
      corrected: !!s.corrected,
      perSource: s.perSource || null,
      deck: pal ? pal.d : null,
      img: pal ? pal.img : null,
      elements: pal ? pal.e : s.elements || [],
      verifyStatus: check ? check.status : "pending",
    };
  });

  return {
    builtAt: partnerResolved.provenance?.builtAt || null,
    mergePreference: partnerResolved.provenance?.mergePreference || [],
    correctionsApplied: partnerResolved.correctionsApplied || 0,
    count: skills.length,
    skills,
  };
}

function buildPartnerVerifyPayload() {
  const palsByName = new Map(PALS.map((p) => [p.n, p]));
  const skillsByPal = new Map();
  for (const s of partnerResolved.skills || []) {
    if (!s.pal) continue;
    if (!skillsByPal.has(s.pal)) skillsByPal.set(s.pal, []);
    skillsByPal.get(s.pal).push({
      name: s.name,
      description: s.description,
      sources: s.sources || [],
    });
  }

  const pals = (partnerChecklist.pals || []).map((p) => {
    const pal = palsByName.get(p.pal);
    return {
      pal: p.pal,
      deckNo: p.deckNo,
      deckSort: p.deckSort,
      status: p.status,
      img: pal ? pal.img : p.img,
      elements: pal ? pal.e : p.elements || [],
      partnerSkills: (p.partnerSkills || []).map((s) => s.name).filter(Boolean),
      scraped: skillsByPal.get(p.pal) || [],
      evidence: (p.evidence || []).map((e) =>
        typeof e === "string" ? e : e.file || ""
      ),
      notes: p.notes,
    };
  });

  const onlyOne = (partnerDiff.coverageGaps || []).filter(
    (g) => g.kind === "only_one_source" || (g.presentIn && g.presentIn.length === 1)
  );

  return {
    generatedAt: partnerChecklist.generatedAt || partnerDiff.generatedAt || null,
    stats: partnerChecklist.stats || {},
    summary: partnerDiff.summary || {},
    screenshotPolicy: partnerChecklist.screenshotPolicy || null,
    pals,
    nameConflicts: partnerDiff.nameConflicts || [],
    severeDescriptionMismatches: partnerDiff.severeDescriptionMismatches || [],
    onlyOneSource: onlyOne.map((g) => ({
      pal: g.pal,
      name: g.name,
      onlyOn: (g.presentIn || [])[0] || null,
      description: g.descriptions
        ? g.descriptions[(g.presentIn || [])[0]] || null
        : null,
    })),
  };
}

function buildPartnerSkillsPage() {
  const payload = buildPartnerSkillsPayload();
  const payloadJson = JSON.stringify(payload);

  const body = `
    <main class="flex-1 page-wrap page-wrap-wide flex flex-col gap-3">
      <div class="page-title-bar flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Partner Skills</h1>
          <p>
            Merged catalog from local scrapes
            (<span class="text-pal-text">paldb</span> → <span class="text-pal-text">game8</span> → <span class="text-pal-text">wiki.gg</span>)
            with in-game <span class="text-pal-text">corrections</span>. Use
            <a class="text-pal-text underline underline-offset-2 hover:text-white" href="partner-verify.html">Verify</a>
            for the Palpedia checklist.
          </p>
        </div>
        <div class="text-xs text-pal-muted text-right space-y-0.5">
          <div><span id="builtAt" class="text-pal-text">—</span></div>
          <div>Corrections applied: <span id="corrCount" class="text-pal-text font-medium">0</span></div>
        </div>
      </div>
      <section class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4 space-y-3">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs text-pal-muted mb-1 font-medium">Search</label>
            <input id="search" type="search" placeholder="Pal, skill, description…" class="w-full bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
          </div>
          <div>
            <label class="block text-xs text-pal-muted mb-1 font-medium">Source</label>
            <select id="sourceFilter" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent min-w-[140px]">
              <option value="">All sources</option>
              <option value="paldb">paldb</option>
              <option value="game8">game8</option>
              <option value="wiki-gg">wiki-gg</option>
              <option value="correction">correction</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-pal-muted mb-1 font-medium">Verify status</label>
            <select id="statusFilter" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent min-w-[140px]">
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="partial">partial</option>
              <option value="verified">verified</option>
              <option value="skipped">skipped</option>
            </select>
          </div>
          <label class="inline-flex items-center gap-2 text-sm text-pal-muted cursor-pointer select-none pb-2">
            <input id="diffOnly" type="checkbox" class="rounded border-pal-border bg-pal-bg" />
            Sources disagree
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-pal-muted cursor-pointer select-none pb-2">
            <input id="showPerSource" type="checkbox" class="rounded border-pal-border bg-pal-bg" />
            Show per-source text
          </label>
          <button id="resetFilters" type="button" class="px-3 py-2 text-sm rounded-lg border border-pal-border text-pal-muted hover:text-pal-text hover:border-pal-accent transition">Reset</button>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 text-sm pt-1 border-t border-pal-border/60">
          <div class="text-pal-muted">
            Showing <span id="resultCount" class="text-pal-text font-semibold">0</span> of <span id="totalCount" class="text-pal-text font-semibold">0</span> skills
          </div>
          <div class="text-xs text-pal-muted">Click column headers to sort. Expand row details with per-source text when enabled.</div>
        </div>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-lg overflow-hidden flex-1">
        <div class="table-wrap overflow-auto">
          <table id="table" class="w-full min-w-full text-sm border-collapse">
            <thead>
              <tr id="theadRow"></tr>
            </thead>
            <tbody id="tbody"></tbody>
          </table>
        </div>
      </section>
    </main>
  `;

  const bodyScripts = `
<script>
const DATA = ${payloadJson};

const state = {
  search: '',
  source: '',
  status: '',
  diffOnly: false,
  showPerSource: false,
  sortKey: 'deck',
  sortDir: 'asc',
};

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function sourcesDisagree(s) {
  if (!s.perSource) return false;
  const descs = Object.values(s.perSource).map(x => (x.description || '').replace(/\\s+/g, ' ').trim().toLowerCase()).filter(Boolean);
  if (descs.length < 2) return false;
  return descs.some(d => d !== descs[0]);
}

function srcBadges(sources) {
  return (sources || []).map(src => {
    const cls = src === 'wiki-gg' ? 'src-wiki-gg'
      : src === 'game8' ? 'src-game8'
      : src === 'paldb' ? 'src-paldb'
      : src === 'correction' ? 'src-correction'
      : 'src-game8';
    return '<span class="src-badge ' + cls + '">' + escapeHtml(src) + '</span>';
  }).join(' ');
}

function statusBadge(status) {
  const s = status || 'pending';
  return '<span class="status-badge status-' + escapeHtml(s) + '">' + escapeHtml(s) + '</span>';
}

function filteredSorted() {
  const q = state.search.trim().toLowerCase();
  let list = DATA.skills.filter(s => {
    if (q) {
      const hay = [s.pal, s.name, s.description, s.type, s.no, ...(s.sources||[])].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.source && !(s.sources || []).includes(state.source)) return false;
    if (state.status && s.verifyStatus !== state.status) return false;
    if (state.diffOnly && !sourcesDisagree(s)) return false;
    return true;
  });

  const dir = state.sortDir === 'asc' ? 1 : -1;
  const key = state.sortKey;
  list.sort((a, b) => {
    let av, bv;
    if (key === 'deck') { av = a.deck == null ? 9999 : a.deck; bv = b.deck == null ? 9999 : b.deck; }
    else if (key === 'pal') { av = (a.pal || '').toLowerCase(); bv = (b.pal || '').toLowerCase(); }
    else if (key === 'name') { av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); }
    else if (key === 'type') { av = (a.type || '').toLowerCase(); bv = (b.type || '').toLowerCase(); }
    else if (key === 'status') { av = a.verifyStatus || ''; bv = b.verifyStatus || ''; }
    else { av = 0; bv = 0; }
    if (typeof av === 'string') {
      const cmp = av.localeCompare(bv);
      if (cmp) return cmp * dir;
    } else if (av !== bv) return (av - bv) * dir;
    return (a.pal || '').localeCompare(b.pal || '') || (a.name || '').localeCompare(b.name || '');
  });
  return list;
}

function renderHead() {
  const cols = [
    { key: 'deck', label: '#', cls: 'sticky-left w-14 text-center' },
    { key: 'pal', label: 'Pal', cls: 'sticky-name text-left min-w-[11rem]' },
    { key: 'name', label: 'Partner skill', cls: 'text-left min-w-[10rem]' },
    { key: 'type', label: 'Type', cls: 'text-left min-w-[7rem]' },
    { key: 'desc', label: 'Description', cls: 'text-left' },
    { key: 'sources', label: 'Sources', cls: 'text-left min-w-[8rem]' },
    { key: 'status', label: 'Verify', cls: 'text-left min-w-[5.5rem]' },
  ];
  document.getElementById('theadRow').innerHTML = cols.map(c => {
    const sortable = c.key !== 'desc' && c.key !== 'sources';
    const active = state.sortKey === c.key ? 'active' : '';
    const arrow = state.sortKey === c.key ? (state.sortDir === 'asc' ? ' ▲' : ' ▼') : '';
    if (!sortable) {
      return '<th class="' + c.cls + ' px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-pal-muted whitespace-nowrap">' + c.label + '</th>';
    }
    return '<th class="sortable ' + active + ' ' + c.cls +
      ' px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-pal-muted whitespace-nowrap" data-sort="' +
      c.key + '">' + c.label +
      (arrow ? '<span class="sort-ind">' + arrow.trim() + '</span>' : '') + '</th>';
  }).join('');
}

function perSourceHtml(s) {
  if (!state.showPerSource || !s.perSource) return '';
  const blocks = Object.entries(s.perSource).map(([src, row]) => {
    return '<div class="per-source-block"><strong>' + escapeHtml(src) + '</strong>' +
      (row.name && row.name !== s.name ? ' · <span class="text-pal-muted">' + escapeHtml(row.name) + '</span>' : '') +
      '<div class="mt-0.5">' + escapeHtml(row.description || '—') + '</div></div>';
  }).join('');
  return blocks;
}

function renderTable() {
  const list = filteredSorted();
  document.getElementById('resultCount').textContent = list.length;
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = list.map(s => {
    const img = s.img
      ? '<img class="pal-icon" src="icons/' + escapeHtml(s.img) + '" alt="" loading="lazy" width="36" height="36" />'
      : '<div class="pal-icon" aria-hidden="true"></div>';
    const elems = (s.elements || []).map(e =>
      '<span class="elem elem-' + escapeHtml(e) + '">' + escapeHtml(e) + '</span>'
    ).join(' ');
    const paldb = 'https://paldb.cc/en/' + encodeURIComponent(String(s.pal || '').replace(/ /g, '_'));
    const disagree = sourcesDisagree(s)
      ? ' <span class="src-badge src-correction" title="Source descriptions differ">diff</span>'
      : '';
    const corr = s.corrected ? ' <span class="src-badge src-correction">corrected</span>' : '';
    return '<tr class="border-t border-pal-border/40 align-top">' +
      '<td class="sticky-left px-2 py-2 text-center text-pal-muted font-mono text-xs">' + (s.deck != null ? s.deck : '—') + '</td>' +
      '<td class="sticky-name px-2 py-2">' +
        '<div class="pal-name-cell">' + img +
          '<div class="min-w-0">' +
            '<a class="pal-name-link font-semibold" href="' + paldb + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(s.pal || '—') + '</a>' +
            (elems ? '<div class="mt-1 flex flex-wrap gap-1">' + elems + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td class="px-2 py-2 font-semibold whitespace-nowrap">' + escapeHtml(s.name || '—') + corr + disagree + '</td>' +
      '<td class="px-2 py-2 text-xs text-pal-muted whitespace-nowrap">' + escapeHtml(s.type || '—') + '</td>' +
      '<td class="px-2 py-2 text-sm desc-cell">' + escapeHtml(s.description || '—') + perSourceHtml(s) + '</td>' +
      '<td class="px-2 py-2"><div class="flex flex-wrap gap-1">' + srcBadges(s.sources) + '</div></td>' +
      '<td class="px-2 py-2">' + statusBadge(s.verifyStatus) + '</td>' +
    '</tr>';
  }).join('') ||
    '<tr><td colspan="7" class="px-4 py-10 text-center text-pal-muted">No skills match your filters.</td></tr>';
  renderHead();
}

function bind() {
  document.getElementById('search').addEventListener('input', e => { state.search = e.target.value; renderTable(); });
  document.getElementById('sourceFilter').addEventListener('change', e => { state.source = e.target.value; renderTable(); });
  document.getElementById('statusFilter').addEventListener('change', e => { state.status = e.target.value; renderTable(); });
  document.getElementById('diffOnly').addEventListener('change', e => { state.diffOnly = e.target.checked; renderTable(); });
  document.getElementById('showPerSource').addEventListener('change', e => { state.showPerSource = e.target.checked; renderTable(); });
  document.getElementById('resetFilters').addEventListener('click', () => {
    state.search = ''; state.source = ''; state.status = ''; state.diffOnly = false; state.showPerSource = false;
    state.sortKey = 'deck'; state.sortDir = 'asc';
    document.getElementById('search').value = '';
    document.getElementById('sourceFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('diffOnly').checked = false;
    document.getElementById('showPerSource').checked = false;
    renderTable();
  });
  document.getElementById('table').addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else { state.sortKey = key; state.sortDir = key === 'deck' ? 'asc' : 'asc'; }
    renderTable();
  });
}

document.getElementById('totalCount').textContent = DATA.count;
document.getElementById('corrCount').textContent = DATA.correctionsApplied || 0;
document.getElementById('builtAt').textContent = DATA.builtAt
  ? 'Built ' + new Date(DATA.builtAt).toLocaleString()
  : 'Local reference build';
bind();
renderTable();
</script>
`;

  return shell({
    title: "Palhead — Partner Skills",
    subtitle: "Palworld tools — partner skill catalog",
    activeNav: "partner-skills",
    body,
    bodyScripts,
  });
}

function buildPartnerVerifyPage() {
  const payload = buildPartnerVerifyPayload();
  const payloadJson = JSON.stringify(payload);

  const body = `
    <main class="flex-1 page-wrap page-wrap-wide flex flex-col gap-3">
      <div class="page-title-bar">
        <h1>Palpedia Verification</h1>
        <p>
          In-game partner skill checklist and where the websites disagree.
          Merged catalog:
          <a class="text-pal-text underline underline-offset-2 hover:text-white" href="partner-skills.html">Partner Skills</a>.
          Screenshots live under <span class="text-pal-text font-mono text-xs">reference/partner-skills/corrections/evidence/</span>.
        </p>
      </div>
      <section class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4 space-y-3">
        <div id="statCards" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"></div>

        <div class="section-tabs" id="sectionTabs">
          <button type="button" class="section-tab active" data-section="checklist">Checklist</button>
          <button type="button" class="section-tab" data-section="names">Name conflicts</button>
          <button type="button" class="section-tab" data-section="severe">Severe text diffs</button>
          <button type="button" class="section-tab" data-section="onlyone">Only on one site</button>
        </div>
      </section>

      <section id="panel-checklist" class="space-y-3">
        <div class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4 space-y-3">
          <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1 min-w-[200px]">
              <label class="block text-xs text-pal-muted mb-1 font-medium">Search pals</label>
              <input id="checkSearch" type="search" placeholder="Pal or skill…" class="w-full bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
            </div>
            <div class="flex flex-wrap gap-1.5" id="statusChips"></div>
            <button id="checkReset" type="button" class="px-3 py-2 text-sm rounded-lg border border-pal-border text-pal-muted hover:text-pal-text hover:border-pal-accent transition">Reset</button>
          </div>
          <div class="text-sm text-pal-muted">
            Showing <span id="checkCount" class="text-pal-text font-semibold">0</span> pals ·
            next pending: <span id="nextPending" class="text-pal-text font-medium">—</span>
          </div>
        </div>
        <div class="bg-pal-panel border border-pal-border rounded-lg overflow-hidden">
          <div class="table-wrap overflow-auto">
            <table id="checkTable" class="w-full min-w-full text-sm border-collapse">
              <thead>
                <tr class="bg-pal-panel2 text-left text-[11px] uppercase tracking-wide text-pal-muted">
                  <th class="sticky-left px-2 py-2.5 font-semibold w-14 text-center">#</th>
                  <th class="sticky-name px-2 py-2.5 font-semibold min-w-[11rem]">Pal</th>
                  <th class="px-2 py-2.5 font-semibold">Status</th>
                  <th class="px-2 py-2.5 font-semibold">Partner skill(s)</th>
                  <th class="px-2 py-2.5 font-semibold">Evidence</th>
                </tr>
              </thead>
              <tbody id="checkBody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="panel-names" class="hidden space-y-3">
        <div class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4">
          <h3 class="font-semibold">Same pal, different skill names</h3>
          <p class="text-sm text-pal-muted mt-1">High priority for Palpedia screenshots — sites do not even agree on the skill title.</p>
          <div class="mt-3">
            <input id="nameSearch" type="search" placeholder="Filter by pal…" class="w-full max-w-md bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
          </div>
        </div>
        <div id="nameList" class="grid lg:grid-cols-2 gap-2"></div>
      </section>

      <section id="panel-severe" class="hidden space-y-3">
        <div class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4">
          <h3 class="font-semibold">Severe description mismatches</h3>
          <p class="text-sm text-pal-muted mt-1">Same skill name + pal, but wording barely overlaps (outdated rewrite or wrong effect text).</p>
          <div class="mt-3">
            <input id="severeSearch" type="search" placeholder="Filter by pal or skill…" class="w-full max-w-md bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
          </div>
        </div>
        <div id="severeList" class="space-y-2"></div>
      </section>

      <section id="panel-onlyone" class="hidden space-y-3">
        <div class="bg-pal-panel border border-pal-border rounded-lg p-3 md:p-4">
          <h3 class="font-semibold">Only listed on one site</h3>
          <p class="text-sm text-pal-muted mt-1">Skill+pal pairs that appear in only wiki-gg, game8, or paldb.</p>
          <div class="mt-3 flex flex-wrap items-end gap-3">
            <input id="onlySearch" type="search" placeholder="Filter…" class="flex-1 min-w-[200px] max-w-md bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
            <select id="onlySource" class="bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent">
              <option value="">All sites</option>
              <option value="wiki-gg">wiki-gg only</option>
              <option value="game8">game8 only</option>
              <option value="paldb">paldb only</option>
            </select>
          </div>
        </div>
        <div class="bg-pal-panel border border-pal-border rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-pal-panel2 text-left text-[11px] uppercase tracking-wide text-pal-muted">
                  <th class="px-3 py-2.5 font-semibold">Pal</th>
                  <th class="px-3 py-2.5 font-semibold">Skill</th>
                  <th class="px-3 py-2.5 font-semibold">Only on</th>
                  <th class="px-3 py-2.5 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody id="onlyBody"></tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  `;

  const bodyScripts = `
<script>
const DATA = ${payloadJson};

const state = {
  section: 'checklist',
  checkSearch: '',
  status: 'pending',
  nameSearch: '',
  severeSearch: '',
  onlySearch: '',
  onlySource: '',
};

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function statusBadge(status) {
  const s = status || 'pending';
  return '<span class="status-badge status-' + escapeHtml(s) + '">' + escapeHtml(s) + '</span>';
}

function srcBadge(src) {
  const cls = src === 'wiki-gg' ? 'src-wiki-gg'
    : src === 'game8' ? 'src-game8'
    : src === 'paldb' ? 'src-paldb'
    : 'src-correction';
  return '<span class="src-badge ' + cls + '">' + escapeHtml(src || '—') + '</span>';
}

function renderStats() {
  const s = DATA.stats || {};
  const sum = DATA.summary || {};
  const cards = [
    { label: 'Pending', n: s.pending || 0, cls: 'text-pal-muted' },
    { label: 'Partial', n: s.partial || 0, cls: 'text-pal-text' },
    { label: 'Verified', n: s.verified || 0, cls: 'text-pal-text' },
    { label: 'Name conflicts', n: sum.nameConflictPalCount || (DATA.nameConflicts || []).length, cls: 'text-pal-text' },
    { label: 'Severe diffs', n: sum.severeDescriptionMismatchCount || (DATA.severeDescriptionMismatches || []).length, cls: 'text-pal-text' },
    { label: 'Only one site', n: sum.onlyOneSourceCount || (DATA.onlyOneSource || []).length, cls: 'text-pal-muted' },
  ];
  document.getElementById('statCards').innerHTML = cards.map(c =>
    '<div class="stat-card"><div class="n ' + c.cls + '">' + c.n + '</div><div class="text-xs text-pal-muted mt-1">' + c.label + '</div></div>'
  ).join('');
}

function showSection(id) {
  state.section = id;
  ['checklist', 'names', 'severe', 'onlyone'].forEach(sec => {
    document.getElementById('panel-' + sec).classList.toggle('hidden', sec !== id);
  });
  document.querySelectorAll('#sectionTabs .section-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === id);
  });
}

function renderStatusChips() {
  const statuses = [
    { id: '', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'partial', label: 'Partial' },
    { id: 'verified', label: 'Verified' },
    { id: 'skipped', label: 'Skipped' },
  ];
  document.getElementById('statusChips').innerHTML = statuses.map(s =>
    '<button type="button" class="filter-chip' + (state.status === s.id ? ' active' : '') + '" data-status="' + s.id + '">' + s.label + '</button>'
  ).join('');
}

function renderChecklist() {
  const q = state.checkSearch.trim().toLowerCase();
  const list = (DATA.pals || []).filter(p => {
    if (state.status && p.status !== state.status) return false;
    if (!q) return true;
    const hay = [p.pal, p.deckNo, ...(p.partnerSkills || [])].join(' ').toLowerCase();
    return hay.includes(q);
  });
  document.getElementById('checkCount').textContent = list.length;
  const next = (DATA.pals || []).find(p => p.status === 'pending');
  document.getElementById('nextPending').textContent = next
    ? ((next.deckNo ? '#' + next.deckNo + ' ' : '') + next.pal)
    : 'none left';

  document.getElementById('checkBody').innerHTML = list.map(p => {
    const img = p.img
      ? '<img class="pal-icon" src="icons/' + escapeHtml(p.img) + '" alt="" loading="lazy" width="36" height="36" />'
      : '<div class="pal-icon" aria-hidden="true"></div>';
    const elems = (p.elements || []).map(e =>
      '<span class="elem elem-' + escapeHtml(e) + '">' + escapeHtml(e) + '</span>'
    ).join(' ');
    const skills = (p.partnerSkills || []).length
      ? p.partnerSkills.map(escapeHtml).join('<span class="text-pal-muted"> · </span>')
      : '<span class="text-pal-muted">—</span>';
    const ev = (p.evidence || []).length
      ? p.evidence.map(e => '<span class="font-mono text-xs text-pal-muted">' + escapeHtml(String(e).split(/[\\\\\\/]/).pop()) + '</span>').join('<br>')
      : '<span class="text-pal-muted">—</span>';
    return '<tr class="border-t border-pal-border/40 align-top">' +
      '<td class="sticky-left px-2 py-2 text-center text-pal-muted font-mono text-xs">' + escapeHtml(p.deckNo || '—') + '</td>' +
      '<td class="sticky-name px-2 py-2">' +
        '<div class="pal-name-cell">' + img +
          '<div class="min-w-0">' +
            '<div class="font-semibold">' + escapeHtml(p.pal) + '</div>' +
            (elems ? '<div class="mt-1 flex flex-wrap gap-1">' + elems + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td class="px-2 py-2">' + statusBadge(p.status) + '</td>' +
      '<td class="px-2 py-2 text-sm">' + skills + '</td>' +
      '<td class="px-2 py-2">' + ev + '</td>' +
    '</tr>';
  }).join('') ||
    '<tr><td colspan="5" class="px-4 py-10 text-center text-pal-muted">No pals match.</td></tr>';
}

function renderNames() {
  const q = state.nameSearch.trim().toLowerCase();
  const list = (DATA.nameConflicts || []).filter(r =>
    !q || String(r.pal || '').toLowerCase().includes(q)
  );
  document.getElementById('nameList').innerHTML = list.map(r => {
    const rows = ['wiki-gg', 'game8', 'paldb'].map(src => {
      const names = (r.sources && r.sources[src]) || [];
      return '<div class="flex gap-2 text-sm"><span class="w-16 shrink-0">' + srcBadge(src) + '</span>' +
        '<span>' + (names.length ? names.map(escapeHtml).join('; ') : '<span class="text-pal-muted">—</span>') + '</span></div>';
    }).join('');
    return '<div class="conflict-card"><div class="font-semibold mb-2">' + escapeHtml(r.pal) + '</div>' + rows + '</div>';
  }).join('') || '<div class="text-pal-muted text-sm px-1">No name conflicts match.</div>';
}

function renderSevere() {
  const q = state.severeSearch.trim().toLowerCase();
  const list = (DATA.severeDescriptionMismatches || []).filter(r => {
    if (!q) return true;
    const hay = [r.pal, r.name].join(' ').toLowerCase();
    return hay.includes(q);
  });
  document.getElementById('severeList').innerHTML = list.map(r => {
    const descs = ['wiki-gg', 'game8', 'paldb'].map(src => {
      const present = (r.presentIn || []).includes(src);
      const text = present ? (r.descriptions && r.descriptions[src]) : null;
      return '<div class="per-source-block"><strong>' + escapeHtml(src) + '</strong>' +
        '<div class="mt-0.5">' + (present ? escapeHtml(text || '_(empty)_') : '<em>missing</em>') + '</div></div>';
    }).join('');
    return '<div class="conflict-card">' +
      '<div class="font-semibold">' + escapeHtml(r.pal) + ' <span class="text-pal-muted font-normal">—</span> ' + escapeHtml(r.name) + '</div>' +
      '<div class="mt-2 space-y-1.5">' + descs + '</div></div>';
  }).join('') || '<div class="text-pal-muted text-sm px-1">No severe mismatches match.</div>';
}

function renderOnlyOne() {
  const q = state.onlySearch.trim().toLowerCase();
  const list = (DATA.onlyOneSource || []).filter(r => {
    if (state.onlySource && r.onlyOn !== state.onlySource) return false;
    if (!q) return true;
    return [r.pal, r.name, r.onlyOn, r.description].join(' ').toLowerCase().includes(q);
  });
  document.getElementById('onlyBody').innerHTML = list.map(r =>
    '<tr class="border-t border-pal-border/40 align-top">' +
      '<td class="px-3 py-2 font-semibold whitespace-nowrap">' + escapeHtml(r.pal) + '</td>' +
      '<td class="px-3 py-2 whitespace-nowrap">' + escapeHtml(r.name) + '</td>' +
      '<td class="px-3 py-2">' + srcBadge(r.onlyOn) + '</td>' +
      '<td class="px-3 py-2 text-sm text-pal-muted desc-cell">' + escapeHtml(r.description || '—') + '</td>' +
    '</tr>'
  ).join('') ||
    '<tr><td colspan="4" class="px-4 py-10 text-center text-pal-muted">No rows match.</td></tr>';
}

function bind() {
  document.getElementById('sectionTabs').addEventListener('click', e => {
    const btn = e.target.closest('[data-section]');
    if (!btn) return;
    showSection(btn.dataset.section);
  });
  document.getElementById('statusChips').addEventListener('click', e => {
    const btn = e.target.closest('[data-status]');
    if (!btn) return;
    state.status = btn.dataset.status;
    renderStatusChips();
    renderChecklist();
  });
  document.getElementById('checkSearch').addEventListener('input', e => {
    state.checkSearch = e.target.value;
    renderChecklist();
  });
  document.getElementById('checkReset').addEventListener('click', () => {
    state.checkSearch = '';
    state.status = 'pending';
    document.getElementById('checkSearch').value = '';
    renderStatusChips();
    renderChecklist();
  });
  document.getElementById('nameSearch').addEventListener('input', e => {
    state.nameSearch = e.target.value;
    renderNames();
  });
  document.getElementById('severeSearch').addEventListener('input', e => {
    state.severeSearch = e.target.value;
    renderSevere();
  });
  document.getElementById('onlySearch').addEventListener('input', e => {
    state.onlySearch = e.target.value;
    renderOnlyOne();
  });
  document.getElementById('onlySource').addEventListener('change', e => {
    state.onlySource = e.target.value;
    renderOnlyOne();
  });
}

renderStats();
renderStatusChips();
renderChecklist();
renderNames();
renderSevere();
renderOnlyOne();
bind();
showSection('checklist');
</script>
`;

  return shell({
    title: "Palhead — Partner Skill Verify",
    subtitle: "Palworld tools — Palpedia checklist & site conflicts",
    activeNav: "partner-verify",
    body,
    bodyScripts,
  });
}

function featureCard({ href, cat, title, desc, meta, icon, empty }) {
  if (empty) {
    return (
      '<div class="feature-card is-empty">' +
      '<div class="feature-thumb">' +
      escapeHtml(icon || "?") +
      "</div>" +
      '<div class="feature-body">' +
      '<div class="feature-cat">' +
      escapeHtml(cat || "Coming soon") +
      "</div>" +
      '<div class="feature-title">' +
      escapeHtml(title) +
      "</div>" +
      '<p class="feature-desc">' +
      escapeHtml(desc) +
      "</p>" +
      (meta ? '<div class="feature-meta">' + escapeHtml(meta) + "</div>" : "") +
      "</div></div>"
    );
  }
  return (
    '<a class="feature-card" href="' +
    escapeHtml(href) +
    '">' +
    '<div class="feature-thumb">' +
    escapeHtml(icon || "P") +
    "</div>" +
    '<div class="feature-body">' +
    '<div class="feature-cat">' +
    escapeHtml(cat) +
    "</div>" +
    '<div class="feature-title">' +
    escapeHtml(title) +
    "</div>" +
    '<p class="feature-desc">' +
    escapeHtml(desc) +
    "</p>" +
    (meta ? '<div class="feature-meta">' + escapeHtml(meta) + "</div>" : "") +
    "</div></a>"
  );
}

function buildHomePage() {
  const checkStats = partnerChecklist.stats || {};
  const pending = checkStats.pending ?? "—";
  const verified = checkStats.verified ?? 0;
  const totalCheck = checkStats.total ?? "—";
  const skillCount = (partnerResolved.skills || []).length;
  const palCount = PALS.length;
  const nameConflicts =
    partnerDiff.summary?.nameConflictPalCount ??
    (partnerDiff.nameConflicts || []).length;
  const severe =
    partnerDiff.summary?.severeDescriptionMismatchCount ??
    (partnerDiff.severeDescriptionMismatches || []).length;

  const quickTools = [
    { href: "pals.html", label: "Work Suitability spreadsheet", tag: palCount + " pals" },
    { href: "partner-skills.html", label: "Partner Skills catalog", tag: skillCount + " skills" },
    { href: "partner-verify.html", label: "Palpedia verification checklist", tag: pending + " pending" },
    { href: "base-tips.html", label: "Base work +1 partner skills", tag: BASE_WORK_BOOSTERS.length + " boosters" },
    { label: "Breeding calculator", soon: true },
    { label: "Team / party builder", soon: true },
    { label: "Passive skills database", soon: true },
    { label: "Item & structure browser", soon: true },
  ]
    .map((t) => {
      if (t.soon) {
        return (
          '<li><span class="soon-row"><span class="dot muted"></span>' +
          escapeHtml(t.label) +
          '<span class="tag">soon</span></span></li>'
        );
      }
      return (
        "<li><a href=\"" +
        escapeHtml(t.href) +
        '"><span class="dot"></span>' +
        escapeHtml(t.label) +
        (t.tag ? '<span class="tag">' + escapeHtml(t.tag) + "</span>" : "") +
        "</a></li>"
      );
    })
    .join("");

  const featured = [
    featureCard({
      href: "pals.html",
      cat: "Database",
      title: "Pals Work Suitability",
      desc: "Sortable table for every pal — filter by element, sort work columns high → low, jump to paldb.",
      meta: palCount + " pals · 12 work types",
      icon: "WS",
    }),
    featureCard({
      href: "partner-skills.html",
      cat: "Database",
      title: "Partner Skills Catalog",
      desc: "Merged catalog from paldb, game8, wiki.gg scrapes plus in-game corrections.",
      meta: skillCount + " skills · multi-source",
      icon: "PS",
    }),
    featureCard({
      href: "partner-verify.html",
      cat: "Tools",
      title: "Palpedia Verify",
      desc: "Screenshot checklist and cross-site conflicts while you verify partner skills in-game.",
      meta: pending + " pending · " + verified + " verified",
      icon: "✓",
    }),
    featureCard({
      href: "base-tips.html",
      cat: "Guides",
      title: "Base Tips: Work +1 Skills",
      desc: "Partner skills that raise work suitability for other pals at your base.",
      meta: BASE_WORK_BOOSTERS.length + " clear · " + AMBIGUOUS_BOOSTERS.length + " ambiguous",
      icon: "B+",
    }),
    featureCard({
      empty: true,
      cat: "News",
      title: "Patch notes & updates",
      desc: "Site news and Palworld patch coverage will land here.",
      meta: "Empty",
      icon: "N",
    }),
    featureCard({
      empty: true,
      cat: "Guides",
      title: "Breeding guide",
      desc: "Parent combos, passive inheritance, and hatching tips.",
      meta: "Coming soon",
      icon: "Br",
    }),
    featureCard({
      empty: true,
      cat: "Database",
      title: "Passive Skills",
      desc: "Ranked passives with effects and fixed-on pals.",
      meta: "Coming soon",
      icon: "Pa",
    }),
    featureCard({
      empty: true,
      cat: "Tools",
      title: "Team Builder",
      desc: "Plan parties by element, work load, and partner skills.",
      meta: "Coming soon",
      icon: "Tb",
    }),
  ].join("\n");

  const body = `
    <main class="flex-1 page-wrap flex flex-col gap-3">
      <div class="home-top-grid">
        <section class="panel" id="tools">
          <div class="panel-head">
            <h2>Quick Tools</h2>
            <span class="panel-meta">Live now · placeholders marked soon</span>
          </div>
          <ul class="quick-list">${quickTools}</ul>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Site Status</h2>
            <span class="panel-meta">Data snapshot</span>
          </div>
          <ul class="stat-list">
            <li><span class="label">Pals in database</span><span class="val"><a href="pals.html">${palCount}</a></span></li>
            <li><span class="label">Partner skills (resolved)</span><span class="val"><a href="partner-skills.html">${skillCount}</a></span></li>
            <li><span class="label">Palpedia checklist</span><span class="val"><a href="partner-verify.html">${verified}/${totalCheck}</a></span></li>
            <li><span class="label">Verify pending</span><span class="val"><a href="partner-verify.html">${pending}</a></span></li>
            <li><span class="label">Name conflicts (sites)</span><span class="val"><a href="partner-verify.html">${nameConflicts}</a></span></li>
            <li><span class="label">Severe description diffs</span><span class="val"><a href="partner-verify.html">${severe}</a></span></li>
            <li><span class="label">Base work +1 boosters</span><span class="val"><a href="base-tips.html">${BASE_WORK_BOOSTERS.length}</a></span></li>
          </ul>
        </section>
      </div>

      <section class="panel" id="database">
        <div class="panel-head">
          <h2>Featured</h2>
          <span class="panel-meta">Tools live now · empty slots reserved</span>
        </div>
        <div class="panel-body">
          <div class="feature-grid">
            ${featured}
          </div>
        </div>
      </section>

      <section class="panel" id="guides">
        <div class="panel-head">
          <h2>Guides</h2>
          <span class="panel-meta">1 live · more planned</span>
        </div>
        <div class="guide-pills">
          <a class="guide-pill" href="base-tips.html">Base Tips</a>
          <span class="guide-pill soon">Breeding <em>· soon</em></span>
          <span class="guide-pill soon">Combat <em>· soon</em></span>
          <span class="guide-pill soon">Exploration <em>· soon</em></span>
          <span class="guide-pill soon">Bosses <em>· soon</em></span>
          <span class="guide-pill soon">Farming routes <em>· soon</em></span>
        </div>
      </section>

      <section class="panel" id="news">
        <div class="panel-head">
          <h2>News</h2>
          <span class="panel-meta">No posts yet</span>
        </div>
        ${emptyState({
          icon: "…",
          title: "No news yet",
          body: "Patch notes, tool updates, and community write-ups will show up here as a feed — same layout as a dense DB site homepage.",
        })}
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Latest (placeholder feed)</h2>
          <span class="panel-meta">Empty state rows</span>
        </div>
        <ul class="feed-list">
          <li class="feed-item">
            <div class="feed-thumb">—</div>
            <div>
              <div class="feed-cat">Coming soon</div>
              <h3 class="feed-title">Nothing published yet</h3>
              <p class="feed-desc">When we add news or guide posts, each entry will use a thumbnail, category tag, title, blurb, and date — similar to a Wowhead-style feed.</p>
              <div class="feed-date">—</div>
            </div>
          </li>
          <li class="feed-item">
            <div class="feed-thumb">—</div>
            <div>
              <div class="feed-cat">Coming soon</div>
              <h3 class="feed-title">Reserved slot</h3>
              <p class="feed-desc">Extra empty row so the layout reads as a real content list before we have posts.</p>
              <div class="feed-date">—</div>
            </div>
          </li>
          <li class="feed-item">
            <div class="feed-thumb">—</div>
            <div>
              <div class="feed-cat">Coming soon</div>
              <h3 class="feed-title">Reserved slot</h3>
              <p class="feed-desc">Guides and database deep-dives will stack here under the featured grid.</p>
              <div class="feed-date">—</div>
            </div>
          </li>
        </ul>
      </section>
    </main>
  `;

  return shell({
    title: "Palhead — Palworld Database & Tools",
    subtitle: "Work suitability · partner skills · verification",
    activeNav: "home",
    body,
    showPromo: true,
  });
}

const homeHtml = buildHomePage();
const palsHtml = buildPalsPage();
const baseTipsHtml = buildBaseTipsPage();
const partnerSkillsHtml = buildPartnerSkillsPage();
const partnerVerifyHtml = buildPartnerVerifyPage();

fs.writeFileSync("index.html", homeHtml);
fs.writeFileSync("pals.html", palsHtml);
fs.writeFileSync("base-tips.html", baseTipsHtml);
fs.writeFileSync("partner-skills.html", partnerSkillsHtml);
fs.writeFileSync("partner-verify.html", partnerVerifyHtml);
console.log("wrote index.html", fs.statSync("index.html").size, "bytes");
console.log("wrote pals.html", fs.statSync("pals.html").size, "bytes");
console.log("wrote base-tips.html", fs.statSync("base-tips.html").size, "bytes");
console.log("wrote partner-skills.html", fs.statSync("partner-skills.html").size, "bytes");
console.log("wrote partner-verify.html", fs.statSync("partner-verify.html").size, "bytes");
console.log("pals:", data.pals.length);
console.log("partner skills:", (partnerResolved.skills || []).length);
console.log("checklist pals:", (partnerChecklist.pals || []).length);
