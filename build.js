const fs = require("fs");
const data = require("./pals_data.json");
const partnerResolved = require("./reference/partner-skills/resolved.json");
const partnerChecklist = require("./reference/partner-skills/checklist.json");
const partnerDiff = require("./reference/partner-skills/discrepancies/cross-source-diff.json");
const dataJson = JSON.stringify(data);

const WORK = data.work;
const PALS = data.pals;

const NAV = [
  { id: "pals", href: "index.html", label: "Pals" },
  { id: "partner-skills", href: "partner-skills.html", label: "Partner Skills" },
  { id: "partner-verify", href: "partner-verify.html", label: "Verify" },
  { id: "base-tips", href: "base-tips.html", label: "Base Tips" },
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
  return NAV.map((item) => {
    if (item.id === activeId) {
      return (
        '<a href="' +
        item.href +
        '" class="px-3 py-1.5 rounded-lg bg-pal-accent/15 text-pal-accent font-semibold border border-pal-accent/30">' +
        escapeHtml(item.label) +
        "</a>"
      );
    }
    return (
      '<a href="' +
      item.href +
      '" class="px-3 py-1.5 rounded-lg text-pal-muted border border-transparent hover:text-pal-text hover:border-pal-border transition">' +
      escapeHtml(item.label) +
      "</a>"
    );
  }).join("\n          ");
}

function sharedStyles() {
  return `
  body {
    background:
      radial-gradient(1200px 600px at 10% -10%, #16304f 0%, transparent 55%),
      radial-gradient(900px 500px at 100% 0%, #1a2a1f 0%, transparent 40%),
      #0b1220;
  }
  .table-wrap { max-height: calc(100vh - 220px); width: 100%; }
  #table { width: 100%; table-layout: auto; }
  th.sortable { cursor: pointer; user-select: none; }
  th.sortable:hover { color: #5eead4; }
  th.sortable .sort-ind { opacity: 0.35; font-size: 0.7em; margin-left: 2px; }
  th.sortable.active .sort-ind { opacity: 1; color: #5eead4; }
  tr:hover td { background: rgba(94, 234, 212, 0.05); }
  .lvl-0 { color: #3a4a63; }
  .lvl-1 { color: #94a3b8; }
  .lvl-2 { color: #7dd3fc; }
  .lvl-3 { color: #34d399; }
  .lvl-4 { color: #fbbf24; font-weight: 700; }
  .lvl-5, .lvl-6, .lvl-7, .lvl-8, .lvl-9, .lvl-10 { color: #f472b6; font-weight: 800; }
  .elem {
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
    padding: 2px 8px; border-radius: 999px; border: none;
    line-height: 1.25;
  }
  .elem-Neutral { background: #475569; color: #f1f5f9; }
  .elem-Fire { background: #dc2626; color: #fff1f2; }
  .elem-Water { background: #0284c7; color: #f0f9ff; }
  .elem-Grass { background: #16a34a; color: #f0fdf4; }
  .elem-Electric { background: #ca8a04; color: #fefce8; }
  .elem-Ice { background: #0891b2; color: #ecfeff; }
  .elem-Ground { background: #c2410c; color: #fff7ed; }
  .elem-Dark { background: #7c3aed; color: #f5f3ff; }
  .elem-Dragon { background: #6d28d9; color: #f5f3ff; }
  .chip {
    display: inline-flex; align-items: center;
    padding: 0; border: none; background: transparent; cursor: pointer;
    border-radius: 999px; transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
    opacity: 0.72;
  }
  .chip .elem { font-size: 11px; padding: 4px 10px; }
  .chip:hover { opacity: 1; transform: translateY(-1px); }
  .chip.active {
    opacity: 1;
    box-shadow: 0 0 0 2px #0b1220, 0 0 0 4px #5eead4;
  }
  #table thead th {
    position: sticky; top: 0; z-index: 10;
    background: #182338; box-shadow: inset 0 -1px 0 #2a3a55;
  }
  #table thead th.sticky-left, #table tbody td.sticky-left {
    position: sticky; left: 0; z-index: 5;
    background: #121a2b;
  }
  #table thead th.sticky-left { z-index: 15; background: #182338; }
  #table thead th.sticky-name, #table tbody td.sticky-name {
    position: sticky; left: 3.25rem; z-index: 5;
    background: #121a2b;
  }
  #table thead th.sticky-name { z-index: 15; background: #182338; }
  #table tbody tr:hover td.sticky-left,
  #table tbody tr:hover td.sticky-name { background: #162033; }
  .col-work { min-width: 0; }
  .pal-icon {
    width: 36px; height: 36px; object-fit: contain;
    border-radius: 8px; background: #0b1220;
    border: 1px solid #2a3a55; flex-shrink: 0;
    image-rendering: auto;
  }
  .pal-icon-lg {
    width: 48px; height: 48px; object-fit: contain;
    border-radius: 10px; background: #0b1220;
    border: 1px solid #2a3a55; flex-shrink: 0;
  }
  .pal-name-cell {
    display: flex; align-items: center; gap: 0.5rem;
  }
  .pal-name-link {
    color: inherit; text-decoration: none;
  }
  .pal-name-link:hover {
    color: #5eead4; text-decoration: underline;
  }
  .work-pill {
    display: inline-flex; align-items: center;
    font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
    padding: 3px 10px; border-radius: 999px;
    background: #1e3a4f; color: #7dd3fc; border: 1px solid #2a5a75;
  }
  .plus-badge {
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; font-family: ui-monospace, Consolas, monospace;
    min-width: 2.25rem; padding: 2px 8px; border-radius: 8px;
    background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.35);
  }
  .src-badge, .status-badge {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
    padding: 2px 7px; border-radius: 999px; border: 1px solid transparent;
    line-height: 1.25; white-space: nowrap;
  }
  .src-wiki-gg { background: rgba(56, 189, 248, 0.12); color: #7dd3fc; border-color: rgba(56, 189, 248, 0.3); }
  .src-game8 { background: rgba(251, 191, 36, 0.12); color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); }
  .src-paldb { background: rgba(52, 211, 153, 0.12); color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
  .src-correction { background: rgba(244, 114, 182, 0.12); color: #f472b6; border-color: rgba(244, 114, 182, 0.35); }
  .status-pending { background: rgba(148, 163, 184, 0.12); color: #94a3b8; border-color: rgba(148, 163, 184, 0.3); }
  .status-partial { background: rgba(251, 191, 36, 0.12); color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); }
  .status-verified { background: rgba(52, 211, 153, 0.12); color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
  .status-skipped { background: rgba(167, 139, 250, 0.12); color: #a78bfa; border-color: rgba(167, 139, 250, 0.3); }
  .desc-cell { max-width: 36rem; line-height: 1.4; }
  .per-source-block {
    margin-top: 0.4rem; padding: 0.45rem 0.6rem; border-radius: 8px;
    background: rgba(11, 18, 32, 0.65); border: 1px solid #2a3a55;
    font-size: 11px; color: #8b9bb8;
  }
  .per-source-block strong { color: #e8eefc; font-weight: 600; }
  .stat-card {
    background: #121a2b; border: 1px solid #2a3a55; border-radius: 12px; padding: 0.75rem 1rem;
  }
  .stat-card .n { font-size: 1.35rem; font-weight: 800; line-height: 1.1; }
  .filter-chip {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.3rem 0.7rem; border-radius: 999px; border: 1px solid #2a3a55;
    background: #0b1220; color: #8b9bb8; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: color 0.12s, border-color 0.12s, background 0.12s;
  }
  .filter-chip:hover { color: #e8eefc; border-color: #5eead4; }
  .filter-chip.active { color: #5eead4; border-color: rgba(94, 234, 212, 0.45); background: rgba(94, 234, 212, 0.08); }
  .section-tabs { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .section-tab {
    padding: 0.4rem 0.85rem; border-radius: 999px; border: 1px solid #2a3a55;
    background: #0b1220; color: #8b9bb8; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .section-tab.active { color: #0b1220; background: #5eead4; border-color: #5eead4; }
  .conflict-card {
    border: 1px solid #2a3a55; border-radius: 12px; background: #121a2b; padding: 0.85rem 1rem;
  }
`;
}

function shell({ title, subtitle, activeNav, body, headExtra = "", bodyScripts = "" }) {
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
          bg: '#0b1220',
          panel: '#121a2b',
          panel2: '#182338',
          border: '#2a3a55',
          muted: '#8b9bb8',
          text: '#e8eefc',
          accent: '#5eead4',
          accent2: '#38bdf8',
          gold: '#fbbf24',
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
    <header class="border-b border-pal-border/80 bg-pal-panel/80 backdrop-blur sticky top-0 z-30">
      <div class="w-full mx-auto px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
        <div class="flex items-center gap-3">
          <a href="index.html" class="w-9 h-9 rounded-xl bg-gradient-to-br from-pal-accent to-pal-accent2 flex items-center justify-center font-black text-pal-bg text-lg shadow-lg shadow-pal-accent/20">P</a>
          <div>
            <h1 class="text-lg font-bold tracking-tight leading-none">Palhead</h1>
            <p class="text-xs text-pal-muted mt-0.5">${escapeHtml(subtitle)}</p>
          </div>
        </div>
        <nav class="flex items-center gap-2 text-sm">
          ${renderNav(activeNav)}
        </nav>
      </div>
    </header>

    ${body}

    <footer class="border-t border-pal-border/60 py-3 text-center text-xs text-pal-muted">
      Palhead · data derived from community game data dumps · not affiliated with Pocketpair
    </footer>
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
        '<span class="text-pal-accent font-semibold text-xs">+1 aura</span>';
      detail = escapeHtml(b.pal);
    } else if (a) {
      status =
        '<span class="text-pal-gold font-semibold text-xs">unclear</span>';
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
    <main class="flex-1 w-full mx-auto px-3 md:px-4 py-4 flex flex-col gap-4 max-w-5xl">
      <section class="bg-pal-panel border border-pal-border rounded-xl p-4 md:p-5 space-y-3">
        <div>
          <h2 class="text-xl font-bold tracking-tight">Base tips</h2>
          <p class="text-sm text-pal-muted mt-1 leading-relaxed">
            Partner skills that raise <span class="text-pal-text font-medium">work suitability level by +1</span>
            for other pals at your base. Passive skills never grant work levels — only work speed and similar stats.
          </p>
        </div>
        <ul class="grid sm:grid-cols-2 gap-2 text-sm text-pal-muted">
          <li class="flex gap-2"><span class="text-pal-accent font-bold">·</span><span>Effects apply while the booster pal is assigned to that base.</span></li>
          <li class="flex gap-2"><span class="text-pal-accent font-bold">·</span><span>Duplicates generally do not stack (Wumpo text says so explicitly).</span></li>
          <li class="flex gap-2"><span class="text-pal-accent font-bold">·</span><span>Only pals that already have the work type benefit from the +1.</span></li>
          <li class="flex gap-2"><span class="text-pal-accent font-bold">·</span><span>No known base-wide +1 for Kindling or Lumbering.</span></li>
        </ul>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-xl overflow-hidden">
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

      <section class="bg-pal-panel border border-pal-border rounded-xl p-4 md:p-5 space-y-3">
        <h3 class="font-semibold">Coverage by work type</h3>
        <p class="text-xs text-pal-muted">Same column order as the <a class="text-pal-accent2 hover:underline" href="index.html">Pals spreadsheet</a>.</p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          ${coverageGrid()}
        </div>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-xl overflow-hidden">
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

      <section class="bg-pal-panel border border-pal-border rounded-xl p-4 md:p-5 space-y-3">
        <h3 class="font-semibold">Other base work tips</h3>
        <ul class="space-y-2 text-sm text-pal-muted">
          <li class="flex gap-2"><span class="text-pal-gold font-bold">·</span><span><span class="text-pal-text">Pal Essence Condenser</span> can raise a work suitability by one level on the individual pal.</span></li>
          <li class="flex gap-2"><span class="text-pal-gold font-bold">·</span><span>Match specialized workers to <span class="text-pal-text">Medicine Production</span> and <span class="text-pal-text">Cooling</span> — those tasks sit low in work priority.</span></li>
          <li class="flex gap-2"><span class="text-pal-gold font-bold">·</span><span>Keep <span class="text-pal-text">Gathering</span> + <span class="text-pal-text">Transporting</span> covered so farms and mines actually clear into chests.</span></li>
          <li class="flex gap-2"><span class="text-pal-gold font-bold">·</span><span>Use the <span class="text-pal-text">Monitor Stand</span> to allow/disallow work types when pals wander off priority jobs.</span></li>
          <li class="flex gap-2"><span class="text-pal-gold font-bold">·</span><span>Passives like Artisan / Work Slave raise <span class="text-pal-text">work speed</span>, not suitability rank.</span></li>
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
    <main class="flex-1 w-full mx-auto px-3 md:px-4 py-4 flex flex-col gap-3">
      <section class="bg-pal-panel border border-pal-border rounded-xl p-3 md:p-4 space-y-3">
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
            <span id="sortLabel" class="ml-2 text-pal-accent/90"></span>
          </div>
          <div class="text-xs text-pal-muted">Tip: click any column header to sort. Work columns default to high → low.</div>
        </div>
      </section>

      <section class="bg-pal-panel border border-pal-border rounded-xl overflow-hidden flex-1">
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
    <main class="flex-1 w-full mx-auto px-3 md:px-4 py-4 flex flex-col gap-3">
      <section class="bg-pal-panel border border-pal-border rounded-xl p-3 md:p-4 space-y-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 max-w-3xl">
            <h2 class="text-base font-semibold">Partner skills</h2>
            <p class="text-sm text-pal-muted mt-1 leading-relaxed">
              Our merged catalog from local scrapes
              (<span class="text-pal-text">paldb</span> → <span class="text-pal-text">game8</span> → <span class="text-pal-text">wiki.gg</span>)
              with in-game <span class="text-pal-text">corrections</span> applied on top.
              Not affiliated with those sites — use
              <a class="text-pal-accent2 hover:underline" href="partner-verify.html">Verify</a>
              for the Palpedia screenshot checklist and site conflicts.
            </p>
          </div>
          <div class="text-xs text-pal-muted text-right space-y-0.5">
            <div><span id="builtAt" class="text-pal-text">—</span></div>
            <div>Corrections applied: <span id="corrCount" class="text-pal-accent font-semibold">0</span></div>
          </div>
        </div>

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

      <section class="bg-pal-panel border border-pal-border rounded-xl overflow-hidden flex-1">
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
      (row.name && row.name !== s.name ? ' · <span class="text-pal-gold">' + escapeHtml(row.name) + '</span>' : '') +
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
    <main class="flex-1 w-full mx-auto px-3 md:px-4 py-4 flex flex-col gap-3">
      <section class="bg-pal-panel border border-pal-border rounded-xl p-3 md:p-4 space-y-3">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 max-w-3xl">
            <h2 class="text-base font-semibold">Palpedia verification</h2>
            <p class="text-sm text-pal-muted mt-1 leading-relaxed">
              Work checklist for in-game partner skill screenshots, plus where the websites disagree.
              Full merged catalog:
              <a class="text-pal-accent2 hover:underline" href="partner-skills.html">Partner Skills</a>.
              Screenshots are archived permanently under <span class="text-pal-text font-mono text-xs">reference/partner-skills/corrections/evidence/</span>.
            </p>
          </div>
        </div>

        <div id="statCards" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"></div>

        <div class="section-tabs" id="sectionTabs">
          <button type="button" class="section-tab active" data-section="checklist">Checklist</button>
          <button type="button" class="section-tab" data-section="names">Name conflicts</button>
          <button type="button" class="section-tab" data-section="severe">Severe text diffs</button>
          <button type="button" class="section-tab" data-section="onlyone">Only on one site</button>
        </div>
      </section>

      <section id="panel-checklist" class="space-y-3">
        <div class="bg-pal-panel border border-pal-border rounded-xl p-3 md:p-4 space-y-3">
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
            next pending: <span id="nextPending" class="text-pal-accent font-semibold">—</span>
          </div>
        </div>
        <div class="bg-pal-panel border border-pal-border rounded-xl overflow-hidden">
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
        <div class="bg-pal-panel border border-pal-border rounded-xl p-3 md:p-4">
          <h3 class="font-semibold">Same pal, different skill names</h3>
          <p class="text-sm text-pal-muted mt-1">High priority for Palpedia screenshots — sites do not even agree on the skill title.</p>
          <div class="mt-3">
            <input id="nameSearch" type="search" placeholder="Filter by pal…" class="w-full max-w-md bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
          </div>
        </div>
        <div id="nameList" class="grid lg:grid-cols-2 gap-2"></div>
      </section>

      <section id="panel-severe" class="hidden space-y-3">
        <div class="bg-pal-panel border border-pal-border rounded-xl p-3 md:p-4">
          <h3 class="font-semibold">Severe description mismatches</h3>
          <p class="text-sm text-pal-muted mt-1">Same skill name + pal, but wording barely overlaps (outdated rewrite or wrong effect text).</p>
          <div class="mt-3">
            <input id="severeSearch" type="search" placeholder="Filter by pal or skill…" class="w-full max-w-md bg-pal-bg border border-pal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pal-accent placeholder:text-pal-muted/60" />
          </div>
        </div>
        <div id="severeList" class="space-y-2"></div>
      </section>

      <section id="panel-onlyone" class="hidden space-y-3">
        <div class="bg-pal-panel border border-pal-border rounded-xl p-3 md:p-4">
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
        <div class="bg-pal-panel border border-pal-border rounded-xl overflow-hidden">
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
    { label: 'Partial', n: s.partial || 0, cls: 'text-pal-gold' },
    { label: 'Verified', n: s.verified || 0, cls: 'text-pal-accent' },
    { label: 'Name conflicts', n: sum.nameConflictPalCount || (DATA.nameConflicts || []).length, cls: 'text-pal-accent2' },
    { label: 'Severe diffs', n: sum.severeDescriptionMismatchCount || (DATA.severeDescriptionMismatches || []).length, cls: 'text-pal-gold' },
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
      ? p.evidence.map(e => '<span class="font-mono text-xs text-pal-accent2">' + escapeHtml(String(e).split(/[\\\\\\/]/).pop()) + '</span>').join('<br>')
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

const indexHtml = buildPalsPage();
const baseTipsHtml = buildBaseTipsPage();
const partnerSkillsHtml = buildPartnerSkillsPage();
const partnerVerifyHtml = buildPartnerVerifyPage();

fs.writeFileSync("index.html", indexHtml);
fs.writeFileSync("base-tips.html", baseTipsHtml);
fs.writeFileSync("partner-skills.html", partnerSkillsHtml);
fs.writeFileSync("partner-verify.html", partnerVerifyHtml);
console.log("wrote index.html", fs.statSync("index.html").size, "bytes");
console.log("wrote base-tips.html", fs.statSync("base-tips.html").size, "bytes");
console.log("wrote partner-skills.html", fs.statSync("partner-skills.html").size, "bytes");
console.log("wrote partner-verify.html", fs.statSync("partner-verify.html").size, "bytes");
console.log("pals:", data.pals.length);
console.log("partner skills:", (partnerResolved.skills || []).length);
console.log("checklist pals:", (partnerChecklist.pals || []).length);
