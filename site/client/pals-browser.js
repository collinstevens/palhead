const { WORK_ORDER, WORK_SHORT, ELEMENTS } = require("../constants");

function palsBrowserScript({ mode }) {
  const isWork = mode === "work";
  return `
const MODE = ${JSON.stringify(isWork ? "work" : "database")};
const WORK_ORDER = ${JSON.stringify(WORK_ORDER)};
const WORK_SHORT = ${JSON.stringify(WORK_SHORT)};
const ELEMENTS = ${JSON.stringify(ELEMENTS)};

const state = {
  search: "",
  elements: new Set(),
  dexOnly: true,
  size: "",
  foodMin: "",
  rarityMin: "",
  workKey: "",
  workMin: "",
  view: "table",
  sortKey: ${JSON.stringify(isWork ? "work:Kindling" : "deck")},
  sortDir: ${JSON.stringify(isWork ? "desc" : "asc")},
};

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function workLevel(pal, workName) {
  const w = pal.work || {};
  const n = w[workName];
  return n == null ? 0 : Number(n) || 0;
}

function topWorks(pal, n) {
  return Object.entries(pal.work || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n);
}

function matches(pal) {
  if (state.dexOnly && !pal.is_dex) return false;
  if (state.size && pal.size !== state.size) return false;
  if (state.foodMin !== "" && (pal.food_amount == null || pal.food_amount < Number(state.foodMin))) return false;
  if (state.rarityMin !== "" && (pal.rarity == null || pal.rarity < Number(state.rarityMin))) return false;
  if (state.elements.size) {
    const els = pal.elements || [];
    let ok = false;
    for (const e of state.elements) {
      if (els.includes(e)) { ok = true; break; }
    }
    if (!ok) return false;
  }
  if (state.workKey) {
    const min = state.workMin === "" ? 1 : Number(state.workMin);
    if (workLevel(pal, state.workKey) < min) return false;
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    const hay = [
      pal.name, pal.slug, pal.code, pal.partner_skill_name,
      String(pal.deck ?? ""), ...(pal.elements || []),
      ...Object.keys(pal.work || {})
    ].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortValue(pal, key) {
  if (key === "deck") return pal.deck == null || pal.deck <= 0 ? 99999 : pal.deck;
  if (key === "name") return (pal.name || "").toLowerCase();
  if (key === "size") return pal.size || "";
  if (key === "food") return pal.food_amount == null ? -1 : pal.food_amount;
  if (key === "rarity") return pal.rarity == null ? -1 : pal.rarity;
  if (key.startsWith("work:")) return workLevel(pal, key.slice(5));
  return 0;
}

function filteredSorted() {
  let list = DATA.pals.filter(matches);
  const key = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;
  const isWorkSort = key.startsWith("work:");
  list.sort((a, b) => {
    let av = sortValue(a, key);
    let bv = sortValue(b, key);
    if (isWorkSort && state.sortDir === "desc") {
      if (av === 0 && bv !== 0) return 1;
      if (bv === 0 && av !== 0) return -1;
    }
    if (typeof av === "string" || typeof bv === "string") {
      const cmp = String(av).localeCompare(String(bv));
      if (cmp) return cmp * dir;
    } else if (av !== bv) {
      return (av - bv) * dir;
    }
    const da = a.deck == null || a.deck <= 0 ? 99999 : a.deck;
    const db = b.deck == null || b.deck <= 0 ? 99999 : b.deck;
    if (da !== db) return da - db;
    return (a.name || "").localeCompare(b.name || "");
  });
  return list;
}

function iconHtml(pal, size) {
  const cls = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-9 h-9";
  if (!pal.icon) return '<div class="' + cls + ' rounded bg-pal-bg shrink-0"></div>';
  return '<img class="' + cls + ' rounded bg-pal-bg shrink-0" src="' + escapeHtml(ASSET_PREFIX + "icons/" + pal.icon) + '" alt="" width="36" height="36" loading="lazy" />';
}

function elemsHtml(pal) {
  return (pal.elements || []).map(e =>
    '<span class="elem elem-' + escapeHtml(e) + '">' + escapeHtml(e) + "</span>"
  ).join(" ");
}

function palHref(pal) {
  const p = pal.path || ("/pal/" + pal.path_segment + "/");
  return ASSET_PREFIX + p.replace(/^\\//, "");
}

function workCell(n) {
  if (!n) return '<td class="px-1 py-1.5 text-center text-pal-muted/40 text-xs">·</td>';
  const cls = n >= 4 ? "text-pal-accent font-semibold" : n >= 2 ? "text-pal-text font-medium" : "text-pal-muted";
  return '<td class="px-1 py-1.5 text-center tabular-nums text-xs ' + cls + '">' + n + "</td>";
}

function renderTable(list) {
  const showWorkCols = MODE === "work" || state.view === "table";
  const workHeaders = WORK_ORDER.map(w => {
    const key = "work:" + w;
    const active = state.sortKey === key;
    const arrow = active ? (state.sortDir === "asc" ? " ▲" : " ▼") : "";
    return '<th class="sortable px-1 py-2 text-[10px] font-semibold uppercase tracking-wide text-pal-muted text-center whitespace-nowrap' +
      (active ? " active text-pal-text" : "") +
      '" data-sort="' + escapeHtml(key) + '" title="' + escapeHtml(w) + '">' +
      escapeHtml(WORK_SHORT[w] || w) + arrow + "</th>";
  }).join("");

  const head =
    '<tr>' +
    '<th class="sortable sticky-left px-2 py-2 text-[11px] font-semibold uppercase text-pal-muted text-center" data-sort="deck">#</th>' +
    '<th class="sortable sticky-name px-2 py-2 text-[11px] font-semibold uppercase text-pal-muted text-left min-w-[10rem]" data-sort="name">Pal</th>' +
    (MODE === "database"
      ? '<th class="sortable px-2 py-2 text-[11px] font-semibold uppercase text-pal-muted" data-sort="size">Size</th>' +
        '<th class="sortable px-2 py-2 text-[11px] font-semibold uppercase text-pal-muted" data-sort="food">Food</th>' +
        '<th class="sortable px-2 py-2 text-[11px] font-semibold uppercase text-pal-muted" data-sort="rarity">Rarity</th>' +
        '<th class="px-2 py-2 text-[11px] font-semibold uppercase text-pal-muted text-left">Partner</th>'
      : "") +
    (showWorkCols ? workHeaders : "") +
    "</tr>";

  const rows = list.map(pal => {
    const works = WORK_ORDER.map(w => workCell(workLevel(pal, w))).join("");
    return '<tr class="border-t border-pal-border/40 hover:bg-white/[0.02]">' +
      '<td class="sticky-left px-2 py-1.5 text-center text-pal-muted font-mono text-xs">' +
      (pal.deck != null && pal.deck > 0 ? pal.deck : "—") + "</td>" +
      '<td class="sticky-name px-2 py-1.5">' +
        '<a class="flex items-center gap-2 min-w-0 group" href="' + escapeHtml(palHref(pal)) + '">' +
          iconHtml(pal, "sm") +
          '<span class="min-w-0">' +
            '<span class="font-semibold text-sm group-hover:text-pal-accent">' + escapeHtml(pal.name) + "</span>" +
            '<span class="flex flex-wrap gap-0.5 mt-0.5">' + elemsHtml(pal) + "</span>" +
          "</span></a></td>" +
      (MODE === "database"
        ? '<td class="px-2 py-1.5 text-xs text-pal-muted text-center">' + escapeHtml(pal.size || "—") + "</td>" +
          '<td class="px-2 py-1.5 text-xs text-pal-muted text-center tabular-nums">' + (pal.food_amount != null ? pal.food_amount : "—") + "</td>" +
          '<td class="px-2 py-1.5 text-xs text-pal-muted text-center tabular-nums">' + (pal.rarity != null ? pal.rarity : "—") + "</td>" +
          '<td class="px-2 py-1.5 text-xs text-pal-muted max-w-[12rem] truncate" title="' + escapeHtml(pal.partner_skill_name || "") + '">' +
            escapeHtml(pal.partner_skill_name || "—") + "</td>"
        : "") +
      (showWorkCols ? works : "") +
    "</tr>";
  }).join("");

  return { head, rows, colSpan: 2 + (MODE === "database" ? 4 : 0) + (showWorkCols ? WORK_ORDER.length : 0) };
}

function renderCards(list) {
  return list.map(pal => {
    const tops = topWorks(pal, 4).map(([k, v]) =>
      '<span class="text-[11px] text-pal-muted"><span class="text-pal-text font-medium">' + escapeHtml(String(v)) + "</span> " + escapeHtml(WORK_SHORT[k] || k) + "</span>"
    ).join('<span class="text-pal-border mx-0.5">·</span>');
    return '<a class="flex flex-col gap-2 rounded-lg border border-pal-border bg-pal-panel p-3 hover:border-pal-accent transition" href="' + escapeHtml(palHref(pal)) + '">' +
      '<div class="flex items-center gap-2">' + iconHtml(pal, "lg") +
        '<div class="min-w-0"><div class="font-semibold truncate">' + escapeHtml(pal.name) + "</div>" +
        '<div class="text-xs text-pal-muted">#' + (pal.deck != null && pal.deck > 0 ? pal.deck : "—") +
        (pal.size ? " · " + escapeHtml(pal.size) : "") + "</div></div></div>" +
      '<div class="flex flex-wrap gap-0.5">' + elemsHtml(pal) + "</div>" +
      (tops ? '<div class="flex flex-wrap gap-x-1 gap-y-0.5 items-center">' + tops + "</div>" : "") +
    "</a>";
  }).join("");
}

function renderCompact(list) {
  return list.map(pal => {
    return '<a class="flex items-center gap-2 rounded border border-pal-border/80 bg-pal-panel/80 px-2 py-1.5 hover:border-pal-accent text-sm" href="' + escapeHtml(palHref(pal)) + '">' +
      iconHtml(pal, "sm") +
      '<span class="text-pal-muted font-mono text-xs w-8 shrink-0">' + (pal.deck != null && pal.deck > 0 ? pal.deck : "—") + "</span>" +
      '<span class="font-medium truncate flex-1">' + escapeHtml(pal.name) + "</span>" +
      '<span class="hidden sm:flex flex-wrap gap-0.5 justify-end">' + elemsHtml(pal) + "</span>" +
    "</a>";
  }).join("");
}

function render() {
  const list = filteredSorted();
  const countEl = document.getElementById("resultCount");
  if (countEl) countEl.textContent = String(list.length);
  const totalEl = document.getElementById("totalCount");
  if (totalEl) totalEl.textContent = String(DATA.pals.length);

  const tableWrap = document.getElementById("tableWrap");
  const cardsWrap = document.getElementById("cardsWrap");
  const compactWrap = document.getElementById("compactWrap");

  if (state.view === "cards") {
    tableWrap.classList.add("hidden");
    compactWrap.classList.add("hidden");
    cardsWrap.classList.remove("hidden");
    cardsWrap.innerHTML = renderCards(list) || '<p class="text-sm text-pal-muted col-span-full py-8 text-center">No pals match.</p>';
  } else if (state.view === "compact") {
    tableWrap.classList.add("hidden");
    cardsWrap.classList.add("hidden");
    compactWrap.classList.remove("hidden");
    compactWrap.innerHTML = renderCompact(list) || '<p class="text-sm text-pal-muted py-8 text-center">No pals match.</p>';
  } else {
    cardsWrap.classList.add("hidden");
    compactWrap.classList.add("hidden");
    tableWrap.classList.remove("hidden");
    const t = renderTable(list);
    document.getElementById("theadRow").innerHTML = t.head;
    document.getElementById("tbody").innerHTML = t.rows ||
      '<tr><td colspan="' + t.colSpan + '" class="px-4 py-10 text-center text-pal-muted">No pals match.</td></tr>';
  }

  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.view === state.view);
  });
}

function bind() {
  const search = document.getElementById("search");
  if (search) search.addEventListener("input", e => { state.search = e.target.value; render(); });

  document.querySelectorAll("[data-element]").forEach(btn => {
    btn.addEventListener("click", () => {
      const el = btn.dataset.element;
      if (state.elements.has(el)) state.elements.delete(el);
      else state.elements.add(el);
      btn.classList.toggle("is-on", state.elements.has(el));
      render();
    });
  });

  const dex = document.getElementById("dexOnly");
  if (dex) dex.addEventListener("change", e => { state.dexOnly = e.target.checked; render(); });

  const size = document.getElementById("sizeFilter");
  if (size) size.addEventListener("change", e => { state.size = e.target.value; render(); });

  const food = document.getElementById("foodMin");
  if (food) food.addEventListener("input", e => { state.foodMin = e.target.value; render(); });

  const rarity = document.getElementById("rarityMin");
  if (rarity) rarity.addEventListener("input", e => { state.rarityMin = e.target.value; render(); });

  const workKey = document.getElementById("workKey");
  if (workKey) workKey.addEventListener("change", e => { state.workKey = e.target.value; render(); });

  const workMin = document.getElementById("workMin");
  if (workMin) workMin.addEventListener("input", e => { state.workMin = e.target.value; render(); });

  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => { state.view = btn.dataset.view; render(); });
  });

  document.getElementById("resetFilters")?.addEventListener("click", () => {
    state.search = "";
    state.elements = new Set();
    state.dexOnly = true;
    state.size = "";
    state.foodMin = "";
    state.rarityMin = "";
    state.workKey = "";
    state.workMin = "";
    state.sortKey = MODE === "work" ? "work:Kindling" : "deck";
    state.sortDir = MODE === "work" ? "desc" : "asc";
    if (search) search.value = "";
    if (dex) dex.checked = true;
    if (size) size.value = "";
    if (food) food.value = "";
    if (rarity) rarity.value = "";
    if (workKey) workKey.value = "";
    if (workMin) workMin.value = "";
    document.querySelectorAll("[data-element]").forEach(b => b.classList.remove("is-on"));
    render();
  });

  document.getElementById("table")?.addEventListener("click", e => {
    const th = e.target.closest("th[data-sort]");
    if (!th) return;
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else {
      state.sortKey = key;
      state.sortDir = key.startsWith("work:") || key === "rarity" || key === "food" ? "desc" : "asc";
    }
    render();
  });
}

bind();
render();
`;
}

module.exports = { palsBrowserScript };
