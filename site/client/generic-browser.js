function genericBrowserScript({ columns, defaultSort = "name", defaultDir = "asc" }) {
  return `
const COLS = ${JSON.stringify(columns)};
const state = {
  search: "",
  filters: {},
  sortKey: ${JSON.stringify(defaultSort)},
  sortDir: ${JSON.stringify(defaultDir)},
  page: 0,
  pageSize: ${columns.pageSize || 100},
};

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function matches(row) {
  for (const [k, v] of Object.entries(state.filters)) {
    if (!v) continue;
    if (String(row[k] ?? "") !== v) return false;
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    const hay = COLS.searchFields.map(f => row[f]).join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortValue(row, key) {
  const v = row[key];
  if (v == null) return key === "name" ? "" : -1;
  if (typeof v === "number") return v;
  return String(v).toLowerCase();
}

function filteredSorted() {
  let list = DATA.rows.filter(matches);
  const dir = state.sortDir === "asc" ? 1 : -1;
  list.sort((a, b) => {
    const av = sortValue(a, state.sortKey);
    const bv = sortValue(b, state.sortKey);
    if (typeof av === "string" || typeof bv === "string") {
      const cmp = String(av).localeCompare(String(bv));
      if (cmp) return cmp * dir;
    } else if (av !== bv) return (av - bv) * dir;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return list;
}

function cell(row, col) {
  if (col.render === "link") {
    const p = row.path || row[col.pathField];
    const label = row[col.field] || "—";
    if (!p) return escapeHtml(label);
    return '<a class="font-semibold hover:text-pal-accent" href="' +
      escapeHtml(ASSET_PREFIX + String(p).replace(/^\\//, "")) + '">' +
      escapeHtml(label) + "</a>";
  }
  if (col.render === "elements") {
    return (row.elements || []).map(e =>
      '<span class="elem elem-' + escapeHtml(e) + '">' + escapeHtml(e) + "</span>"
    ).join(" ") || "—";
  }
  const v = row[col.field];
  return escapeHtml(v == null || v === "" ? "—" : String(v));
}

function render() {
  const all = filteredSorted();
  const totalPages = Math.max(1, Math.ceil(all.length / state.pageSize));
  if (state.page >= totalPages) state.page = totalPages - 1;
  const start = state.page * state.pageSize;
  const list = all.slice(start, start + state.pageSize);
  document.getElementById("resultCount").textContent = String(all.length);
  document.getElementById("totalCount").textContent = String(DATA.rows.length);
  const pageInfo = document.getElementById("pageInfo");
  if (pageInfo) pageInfo.textContent = (state.page + 1) + " / " + totalPages;
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = list.map(row =>
    "<tr class=\\"border-t border-pal-border/40 hover:bg-white/[0.02]\\">" +
    COLS.cols.map(col =>
      '<td class="px-3 py-2 text-sm ' + (col.className || "") + '">' + cell(row, col) + "</td>"
    ).join("") +
    "</tr>"
  ).join("") || '<tr><td colspan="' + COLS.cols.length +
    '" class="px-4 py-10 text-center text-pal-muted">No results.</td></tr>';
}

function bind() {
  const search = document.getElementById("search");
  if (search) search.addEventListener("input", () => {
    state.search = search.value.trim(); state.page = 0; render();
  });
  document.querySelectorAll("[data-filter]").forEach(el => {
    el.addEventListener("change", () => {
      state.filters[el.getAttribute("data-filter")] = el.value;
      state.page = 0; render();
    });
  });
  const reset = document.getElementById("resetFilters");
  if (reset) reset.addEventListener("click", () => {
    state.search = ""; state.filters = {}; state.page = 0;
    if (search) search.value = "";
    document.querySelectorAll("[data-filter]").forEach(el => { el.value = ""; });
    render();
  });
  document.querySelectorAll("th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      else { state.sortKey = key; state.sortDir = "asc"; }
      render();
    });
  });
  const prev = document.getElementById("pagePrev");
  const next = document.getElementById("pageNext");
  if (prev) prev.addEventListener("click", () => { if (state.page > 0) { state.page--; render(); } });
  if (next) next.addEventListener("click", () => { state.page++; render(); });
}

bind();
render();
`;
}

module.exports = { genericBrowserScript };
