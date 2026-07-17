function recipesBrowserScript() {
  return `
const state = {
  search: "",
  category: "",
  workstation: "",
  sortKey: "product_name",
  sortDir: "asc",
};

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function matches(r) {
  if (state.category && String(r.category || "") !== state.category) return false;
  if (state.workstation) {
    const ws = (r.workstations || []).map(w => w.slug || w.name).join(" ");
    if (!ws.toLowerCase().includes(state.workstation.toLowerCase()) &&
        !(r.workstation_labels || "").toLowerCase().includes(state.workstation.toLowerCase())) {
      return false;
    }
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    const mats = (r.materials || []).map(m => m.name + " " + m.slug).join(" ");
    const hay = [r.product_name, r.category, r.workstation_labels, mats, r.product_code]
      .join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortValue(r, key) {
  if (key === "product_name") return (r.product_name || "").toLowerCase();
  if (key === "category") return (r.category || "").toLowerCase();
  if (key === "materials") return r.material_count || 0;
  if (key === "workstation") return (r.workstation_labels || "").toLowerCase();
  return 0;
}

function filteredSorted() {
  let list = DATA.recipes.filter(matches);
  const dir = state.sortDir === "asc" ? 1 : -1;
  const key = state.sortKey;
  list.sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (typeof av === "string" || typeof bv === "string") {
      const cmp = String(av).localeCompare(String(bv));
      if (cmp) return cmp * dir;
    } else if (av !== bv) return (av - bv) * dir;
    return (a.product_name || "").localeCompare(b.product_name || "");
  });
  return list;
}

function productHref(r) {
  if (!r.product_path) return null;
  return ASSET_PREFIX + r.product_path.replace(/^\\//, "");
}

function matsHtml(r) {
  return (r.materials || []).slice(0, 6).map(m => {
    const label = escapeHtml(m.name) + (m.quantity != null ? " ×" + escapeHtml(String(m.quantity)) : "");
    if (m.path) {
      return '<a href="' + escapeHtml(ASSET_PREFIX + m.path.replace(/^\\//, "")) + '">' + label + "</a>";
    }
    return '<span class="text-pal-muted">' + label + "</span>";
  }).join('<span class="text-pal-muted">, </span>') +
    ((r.materials || []).length > 6 ? '<span class="text-pal-muted">…</span>' : "");
}

function render() {
  const list = filteredSorted();
  document.getElementById("resultCount").textContent = String(list.length);
  document.getElementById("totalCount").textContent = String(DATA.recipes.length);
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = list.map(r => {
    const ph = productHref(r);
    const nameCell = ph
      ? '<a class="font-semibold hover:text-pal-accent" href="' + escapeHtml(ph) + '">' + escapeHtml(r.product_name) + "</a>"
      : '<span class="font-semibold">' + escapeHtml(r.product_name) + "</span>";
    return '<tr class="border-t border-pal-border/40 hover:bg-white/[0.02]">' +
      '<td class="px-3 py-2 sticky left-0 z-[1]" style="background:var(--wh-panel)">' + nameCell + "</td>" +
      '<td class="px-3 py-2 text-xs text-pal-muted">' + escapeHtml(r.category || "—") + "</td>" +
      '<td class="px-3 py-2 text-xs">' + matsHtml(r) + "</td>" +
      '<td class="px-3 py-2 text-xs text-pal-muted max-w-[12rem] truncate" title="' +
        escapeHtml(r.workstation_labels || "") + '">' +
        escapeHtml(r.workstation_labels || "—") + "</td>" +
    "</tr>";
  }).join("") || '<tr><td colspan="4" class="px-4 py-10 text-center text-pal-muted">No recipes match.</td></tr>';
}

function bind() {
  const search = document.getElementById("search");
  const category = document.getElementById("categoryFilter");
  const workstation = document.getElementById("workstationFilter");
  const reset = document.getElementById("resetFilters");
  search.addEventListener("input", () => { state.search = search.value.trim(); render(); });
  category.addEventListener("change", () => { state.category = category.value; render(); });
  workstation.addEventListener("change", () => { state.workstation = workstation.value; render(); });
  reset.addEventListener("click", () => {
    state.search = ""; state.category = ""; state.workstation = "";
    state.sortKey = "product_name"; state.sortDir = "asc";
    search.value = ""; category.value = ""; workstation.value = "";
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
}

bind();
render();
`;
}

module.exports = { recipesBrowserScript };
