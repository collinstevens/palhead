function skillsBrowserScript({ kind }) {
  return `
const KIND = ${JSON.stringify(kind)};

const state = {
  search: "",
  element: "",
  category: "",
  rank: "",
  sortKey: KIND === "active" ? "power" : KIND === "passive" ? "rank" : "name",
  sortDir: KIND === "active" ? "desc" : KIND === "passive" ? "asc" : "asc",
};

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function matches(s) {
  if (state.element && s.element !== state.element && !(s.elements || []).includes(state.element)) return false;
  if (state.category && String(s.category || "") !== state.category) return false;
  if (state.rank !== "" && Number(s.rank) !== Number(state.rank)) return false;
  if (state.search) {
    const q = state.search.toLowerCase();
    const hay = [
      s.name, s.description, s.category, s.element, s.aggregate_status,
      s.skill_fruit_raw, String(s.power ?? ""), String(s.cool_time ?? ""),
      ...(s.owner_slugs || [])
    ].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortValue(s, key) {
  if (key === "name") return (s.name || "").toLowerCase();
  if (key === "rank") return s.rank == null ? 999 : s.rank;
  if (key === "weight") return s.weight == null ? -1 : s.weight;
  if (key === "power") return s.power == null ? -1 : s.power;
  if (key === "cool_time") return s.cool_time == null ? 9999 : s.cool_time;
  if (key === "owners") return s.owner_count == null ? 0 : s.owner_count;
  if (key === "element") return s.element || "";
  if (key === "category") return s.category || "";
  return 0;
}

function filteredSorted() {
  let list = DATA.skills.filter(matches);
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

function skillHref(s) {
  const p = s.path || ("/skills/" + KIND + "/" + s.slug + "/");
  return ASSET_PREFIX + p.replace(/^\\//, "");
}

function elemsHtml(s) {
  const els = s.elements || (s.element ? [s.element] : []);
  return els.map(e => '<span class="elem elem-' + escapeHtml(e) + '">' + escapeHtml(e) + "</span>").join(" ");
}

function render() {
  const list = filteredSorted();
  document.getElementById("resultCount").textContent = String(list.length);
  document.getElementById("totalCount").textContent = String(DATA.skills.length);
  const tbody = document.getElementById("tbody");

  if (KIND === "partner") {
    tbody.innerHTML = list.map(s =>
      '<tr class="border-t border-pal-border/40 hover:bg-white/[0.02]">' +
        '<td class="px-3 py-2"><a class="font-semibold hover:text-pal-accent" href="' + escapeHtml(skillHref(s)) + '">' + escapeHtml(s.name) + "</a></td>" +
        '<td class="px-3 py-2 text-xs text-pal-muted tabular-nums">' + (s.owner_count || 0) + "</td>" +
        '<td class="px-3 py-2 text-xs text-pal-muted max-w-[10rem] truncate" title="' + escapeHtml(s.category || "") + '">' + escapeHtml(s.category || "—") + "</td>" +
        '<td class="px-3 py-2 text-sm text-pal-muted">' + escapeHtml((s.description || "—").slice(0, 140)) + ((s.description || "").length > 140 ? "…" : "") + "</td>" +
      "</tr>"
    ).join("") || '<tr><td colspan="4" class="px-4 py-10 text-center text-pal-muted">No skills match.</td></tr>';
  } else if (KIND === "passive") {
    tbody.innerHTML = list.map(s =>
      '<tr class="border-t border-pal-border/40 hover:bg-white/[0.02]">' +
        '<td class="px-3 py-2"><a class="font-semibold hover:text-pal-accent" href="' + escapeHtml(skillHref(s)) + '">' + escapeHtml(s.name) + "</a></td>" +
        '<td class="px-3 py-2 text-xs text-center tabular-nums">' + (s.rank != null ? s.rank : "—") + "</td>" +
        '<td class="px-3 py-2 text-xs text-center tabular-nums text-pal-muted">' + (s.weight != null ? s.weight : "—") + "</td>" +
        '<td class="px-3 py-2 text-xs text-center tabular-nums text-pal-muted">' + (s.owner_count || 0) + "</td>" +
        '<td class="px-3 py-2 text-sm text-pal-muted">' + escapeHtml(s.description || "—") + "</td>" +
      "</tr>"
    ).join("") || '<tr><td colspan="5" class="px-4 py-10 text-center text-pal-muted">No skills match.</td></tr>';
  } else {
    tbody.innerHTML = list.map(s =>
      '<tr class="border-t border-pal-border/40 hover:bg-white/[0.02]">' +
        '<td class="px-3 py-2"><a class="font-semibold hover:text-pal-accent" href="' + escapeHtml(skillHref(s)) + '">' + escapeHtml(s.name) + "</a>" +
          '<div class="mt-0.5 flex flex-wrap gap-0.5">' + elemsHtml(s) + "</div></td>" +
        '<td class="px-3 py-2 text-xs text-center tabular-nums font-medium">' + (s.power != null ? s.power : "—") + "</td>" +
        '<td class="px-3 py-2 text-xs text-center tabular-nums text-pal-muted">' + (s.cool_time != null ? s.cool_time + "s" : "—") + "</td>" +
        '<td class="px-3 py-2 text-xs text-pal-muted text-center">' + escapeHtml(s.category || "—") + "</td>" +
        '<td class="px-3 py-2 text-xs text-pal-muted">' + escapeHtml(s.aggregate_status || "—") + "</td>" +
        '<td class="px-3 py-2 text-sm text-pal-muted">' + escapeHtml((s.description || "—").slice(0, 120)) + ((s.description || "").length > 120 ? "…" : "") + "</td>" +
      "</tr>"
    ).join("") || '<tr><td colspan="6" class="px-4 py-10 text-center text-pal-muted">No skills match.</td></tr>';
  }
}

function bind() {
  document.getElementById("search")?.addEventListener("input", e => { state.search = e.target.value; render(); });
  document.getElementById("elementFilter")?.addEventListener("change", e => { state.element = e.target.value; render(); });
  document.getElementById("categoryFilter")?.addEventListener("change", e => { state.category = e.target.value; render(); });
  document.getElementById("rankFilter")?.addEventListener("change", e => { state.rank = e.target.value; render(); });
  document.getElementById("resetFilters")?.addEventListener("click", () => {
    state.search = "";
    state.element = "";
    state.category = "";
    state.rank = "";
    state.sortKey = KIND === "active" ? "power" : KIND === "passive" ? "rank" : "name";
    state.sortDir = KIND === "active" ? "desc" : "asc";
    const search = document.getElementById("search");
    if (search) search.value = "";
    const ef = document.getElementById("elementFilter");
    if (ef) ef.value = "";
    const cf = document.getElementById("categoryFilter");
    if (cf) cf.value = "";
    const rf = document.getElementById("rankFilter");
    if (rf) rf.value = "";
    render();
  });
  document.getElementById("table")?.addEventListener("click", e => {
    const th = e.target.closest("th[data-sort]");
    if (!th) return;
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else {
      state.sortKey = key;
      state.sortDir = key === "power" || key === "owners" || key === "weight" ? "desc" : "asc";
    }
    render();
  });
}

bind();
render();
`;
}

module.exports = { skillsBrowserScript };
