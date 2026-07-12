const fs = require("fs");
const data = require("./pals_data.json");
const dataJson = JSON.stringify(data);

const WORK = data.work;
const PALS = data.pals;

const NAV = [
  { id: "pals", href: "index.html", label: "Pals" },
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

const indexHtml = buildPalsPage();
const baseTipsHtml = buildBaseTipsPage();

fs.writeFileSync("index.html", indexHtml);
fs.writeFileSync("base-tips.html", baseTipsHtml);
console.log("wrote index.html", fs.statSync("index.html").size, "bytes");
console.log("wrote base-tips.html", fs.statSync("base-tips.html").size, "bytes");
console.log("pals:", data.pals.length);
