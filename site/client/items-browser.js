function itemsBrowserScript() {
  return `
const state = {
  search: "",
  rarity: "",
  hasRecipe: "",
  sortKey: "name",
  sortDir: "asc",
};

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function rarityClass(r) {
  const k = String(r || "").toLowerCase();
  if (k.includes("legendary")) return "rarity-legendary";
  if (k.includes("epic")) return "rarity-epic";
  if (k.includes("rare")) return "rarity-rare";
  if (k.includes("uncommon")) return "rarity-uncommon";
  if (k.includes("common")) return "rarity-common";
  return "rarity-common";
}

function matches(it) {
  if (state.rarity && String(it.rarity || "") !== state.rarity) return false;
  if (state.hasRecipe === "yes" && !it.has_recipe) return false;
  if (state.hasRecipe === "no" && it.has_recipe) return false;
  if (state.search) {
    const q = state.search.toLowerCase();
    const hay = [it.name, it.code, it.rarity, it.type_a, it.type_b, it.category_label]
      .join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortValue(it, key) {
  if (key === "name") return (it.name || "").toLowerCase();
  if (key === "rarity") return (it.rarity || "").toLowerCase();
  if (key === "weight") return it.weight == null ? 99999 : Number(it.weight);
  if (key === "stack") return it.max_stack == null ? -1 : Number(it.max_stack);
  if (key === "rank") return it.rank == null ? 99999 : Number(it.rank);
  return 0;
}

function filteredSorted() {
  let list = DATA.items.filter(matches);
  const dir = state.sortDir === "asc" ? 1 : -1;
  const key = state.sortKey;
  list.sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (typeof av === "string" || typeof bv === "string") {
      const cmp = String(av).localeCompare(String(bv));
      if (cmp) return cmp * dir;
    } else if (av !== bv) return (av - bv) * dir;
    return (a.name || "").localeCompare(b.name || "");
  });
  return list;
}

function itemHref(it) {
  const p = it.path || ("/item/" + it.slug + "/");
  return ASSET_PREFIX + p.replace(/^\\//, "");
}

function iconHtml(it) {
  if (!it.icon) {
    return '<span class="inline-block w-7 h-7 rounded bg-pal-bg shrink-0"></span>';
  }
  return (
    '<img class="inline-block w-7 h-7 rounded bg-pal-bg shrink-0" src="' +
    escapeHtml(ASSET_PREFIX + "icons/" + it.icon) +
    '" alt="" width="28" height="28" loading="lazy" />'
  );
}

function render() {
  const list = filteredSorted();
  document.getElementById("resultCount").textContent = String(list.length);
  document.getElementById("totalCount").textContent = String(DATA.items.length);
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = list.map(it =>
    '<tr class="border-t border-pal-border/40 hover:bg-white/[0.02]">' +
      '<td class="px-3 py-2 sticky left-0 z-[1]" style="background:var(--wh-panel)">' +
        '<a class="font-semibold hover:text-pal-accent inline-flex items-center gap-2" href="' +
        escapeHtml(itemHref(it)) + '">' + iconHtml(it) +
        '<span>' + escapeHtml(it.name) + "</span></a></td>" +
      '<td class="px-3 py-2 text-xs"><span class="' + rarityClass(it.rarity) + '">' +
        escapeHtml(it.rarity || "—") + "</span></td>" +
      '<td class="px-3 py-2 text-xs text-pal-muted tabular-nums text-center">' +
        (it.weight != null ? it.weight : "—") + "</td>" +
      '<td class="px-3 py-2 text-xs text-pal-muted tabular-nums text-center">' +
        (it.max_stack != null ? it.max_stack : "—") + "</td>" +
      '<td class="px-3 py-2 text-xs text-center">' +
        (it.has_recipe ? '<span class="wh-chip wh-chip-live">craft</span>' : "—") +
      "</td>" +
      '<td class="px-3 py-2 text-xs text-pal-muted font-mono max-w-[10rem] truncate" title="' +
        escapeHtml(it.code || "") + '">' + escapeHtml(it.code || "—") + "</td>" +
    "</tr>"
  ).join("") || '<tr><td colspan="6" class="px-4 py-10 text-center text-pal-muted">No items match.</td></tr>';
}

function bind() {
  const search = document.getElementById("search");
  const rarity = document.getElementById("rarityFilter");
  const recipe = document.getElementById("recipeFilter");
  const reset = document.getElementById("resetFilters");
  search.addEventListener("input", () => { state.search = search.value.trim(); render(); });
  rarity.addEventListener("change", () => { state.rarity = rarity.value; render(); });
  recipe.addEventListener("change", () => { state.hasRecipe = recipe.value; render(); });
  reset.addEventListener("click", () => {
    state.search = ""; state.rarity = ""; state.hasRecipe = "";
    state.sortKey = "name"; state.sortDir = "asc";
    search.value = ""; rarity.value = ""; recipe.value = "";
    render();
  });
  document.querySelectorAll("th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      else { state.sortKey = key; state.sortDir = key === "name" || key === "rarity" ? "asc" : "desc"; }
      render();
    });
  });
}

bind();
render();
`;
}

module.exports = { itemsBrowserScript };
