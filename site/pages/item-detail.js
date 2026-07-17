const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");

const RARITY_STYLE = `
.rarity-common{color:#9d9d9d}
.rarity-uncommon{color:#1eff00}
.rarity-rare{color:#0070dd}
.rarity-epic{color:#a335ee}
.rarity-legendary{color:#e5cc80}
`;

function rarityClass(r) {
  const k = String(r || "").toLowerCase();
  if (k.includes("legendary")) return "rarity-legendary";
  if (k.includes("epic")) return "rarity-epic";
  if (k.includes("rare")) return "rarity-rare";
  if (k.includes("uncommon")) return "rarity-uncommon";
  return "rarity-common";
}

function statCard(label, value, extraClass = "") {
  return (
    '<div class="stat-card"><div class="label">' +
    escapeHtml(label) +
    '</div><div class="value ' +
    extraClass +
    '">' +
    escapeHtml(value == null || value === "" ? "—" : String(value)) +
    "</div></div>"
  );
}

function itemLink(prefix, path, name) {
  if (!path) {
    return (
      '<span class="text-pal-muted">' + escapeHtml(name || "—") + "</span>"
    );
  }
  return (
    '<a href="' +
    escapeHtml(prefix + path.replace(/^\//, "")) +
    '">' +
    escapeHtml(name || path) +
    "</a>"
  );
}

function materialsList(prefix, materials) {
  if (!materials || !materials.length) {
    return '<p class="text-sm text-pal-muted">No materials listed.</p>';
  }
  return (
    '<ul class="text-sm space-y-1">' +
    materials
      .map((m) => {
        const qty =
          m.quantity != null
            ? ' <span class="text-pal-muted tabular-nums">×' +
              escapeHtml(String(m.quantity)) +
              "</span>"
            : "";
        return (
          "<li>" + itemLink(prefix, m.path, m.name) + qty + "</li>"
        );
      })
      .join("") +
    "</ul>"
  );
}

function workstationsList(workstations) {
  if (!workstations || !workstations.length) {
    return '<p class="text-sm text-pal-muted">No workstations listed.</p>';
  }
  return (
    '<ul class="text-sm space-y-1">' +
    workstations
      .map(
        (w) =>
          '<li class="text-pal-muted">' +
          escapeHtml(w.name || w.slug || "—") +
          "</li>"
      )
      .join("") +
    "</ul>"
  );
}

function craftTimes(times) {
  if (!times || !times.length) return "";
  return (
    '<div class="mt-3"><div class="text-[10px] uppercase tracking-wide text-pal-muted font-bold mb-1">Craft times</div>' +
    '<div class="flex flex-wrap gap-2 text-xs">' +
    times
      .map(
        (t) =>
          '<span class="wh-chip">Lv ' +
          escapeHtml(String(t.level ?? "?")) +
          ": " +
          escapeHtml(String(t.time ?? "—")) +
          "</span>"
      )
      .join("") +
    "</div></div>"
  );
}

function itemDetailPage({ item, siteMeta }) {
  const href = item.path;
  const prefix = depthPrefix(href);
  const catPath = "items/" + (item.category || "") + "/";
  const catLabel = item.category_label || item.category || "Items";

  const stats =
    statCard("Rarity", item.rarity, rarityClass(item.rarity)) +
    statCard("Weight", item.weight) +
    statCard("Max stack", item.max_stack) +
    statCard("Rank", item.rank) +
    statCard("Category", catLabel) +
    (item.code ? statCard("Code", item.code) : "");

  let craftHtml = "";
  const recipes = item.recipes_as_product || [];
  if (recipes.length) {
    craftHtml = recipes
      .map((r, i) => {
        return (
          '<div class="' +
          (i ? "mt-4 pt-4 border-t border-pal-border/50" : "") +
          '">' +
          '<div class="text-[10px] uppercase tracking-wide text-pal-muted font-bold mb-2">Recipe ' +
          (recipes.length > 1 ? i + 1 : "") +
          "</div>" +
          '<div class="grid sm:grid-cols-2 gap-4">' +
          '<div><div class="text-xs text-pal-muted mb-1 font-semibold">Materials</div>' +
          materialsList(prefix, r.materials) +
          "</div>" +
          '<div><div class="text-xs text-pal-muted mb-1 font-semibold">Workstations</div>' +
          workstationsList(r.workstations) +
          craftTimes(r.craft_times) +
          "</div></div></div>"
        );
      })
      .join("");
  } else if ((item.materials && item.materials.length) || (item.workstations && item.workstations.length)) {
    craftHtml =
      '<div class="grid sm:grid-cols-2 gap-4">' +
      '<div><div class="text-xs text-pal-muted mb-1 font-semibold">Materials</div>' +
      materialsList(
        prefix,
        (item.materials || []).map((m) => ({
          ...m,
          path: m.path || null,
        }))
      ) +
      "</div>" +
      '<div><div class="text-xs text-pal-muted mb-1 font-semibold">Workstations</div>' +
      workstationsList(item.workstations) +
      craftTimes(item.craft_times) +
      "</div></div>";
  }

  const craftSection = craftHtml
    ? '<section class="wh-panel" style="margin:0"><div class="wh-panel-head"><h2>Crafted from</h2>' +
      (item.recipe_count
        ? '<span class="wh-panel-meta">' +
          escapeHtml(String(item.recipe_count)) +
          "</span>"
        : "") +
      '</div><div class="wh-panel-body">' +
      craftHtml +
      "</div></section>"
    : "";

  const usedIn = item.used_in || [];
  const usedSection = usedIn.length
    ? '<section class="wh-panel" style="margin:0"><div class="wh-panel-head"><h2>Used in</h2><span class="wh-panel-meta">' +
      escapeHtml(String(item.used_in_count || usedIn.length)) +
      (item.used_in_count > usedIn.length ? "+" : "") +
      '</span></div><div class="wh-panel-body"><ul class="text-sm space-y-1">' +
      usedIn
        .map((u) => {
          const qty =
            u.quantity != null
              ? ' <span class="text-pal-muted">×' +
                escapeHtml(String(u.quantity)) +
                "</span>"
              : "";
          const stations = (u.workstations || [])
            .map((w) => w.name || w.slug)
            .filter(Boolean)
            .join(", ");
          return (
            "<li>" +
            itemLink(prefix, u.product_path, u.product_name) +
            qty +
            (stations
              ? ' <span class="text-pal-muted text-xs">@ ' +
                escapeHtml(stations) +
                "</span>"
              : "") +
            "</li>"
          );
        })
        .join("") +
      "</ul></div></section>"
    : "";

  const drops = item.dropped_by || [];
  const dropSection = drops.length
    ? '<section class="wh-panel" style="margin:0"><div class="wh-panel-head"><h2>Dropped by</h2><span class="wh-panel-meta">' +
      escapeHtml(String(item.drop_count || drops.length)) +
      (item.drop_count > drops.length ? " (showing " + drops.length + ")" : "") +
      '</span></div><div class="wh-panel-body"><div class="overflow-auto max-h-72"><table class="w-full text-sm"><thead><tr>' +
      '<th class="px-2 py-1 text-left text-[10px] uppercase text-pal-muted">Source</th>' +
      '<th class="px-2 py-1 text-left text-[10px] uppercase text-pal-muted">Type</th>' +
      '<th class="px-2 py-1 text-center text-[10px] uppercase text-pal-muted">Qty</th>' +
      '<th class="px-2 py-1 text-center text-[10px] uppercase text-pal-muted">Rate</th>' +
      "</tr></thead><tbody>" +
      drops
        .map(
          (d) =>
            '<tr class="border-t border-pal-border/40">' +
            '<td class="px-2 py-1.5">' +
            escapeHtml(d.source_name || d.source_slug || "—") +
            '</td><td class="px-2 py-1.5 text-xs text-pal-muted">' +
            escapeHtml(d.source_type || "—") +
            '</td><td class="px-2 py-1.5 text-xs text-center tabular-nums">' +
            escapeHtml(d.quantity || "—") +
            '</td><td class="px-2 py-1.5 text-xs text-center tabular-nums">' +
            (d.rate != null ? escapeHtml(String(d.rate)) + "%" : "—") +
            "</td></tr>"
        )
        .join("") +
      "</tbody></table></div></div></section>"
    : "";

  const desc = item.description
    ? '<section class="wh-panel" style="margin:0"><div class="wh-panel-head"><h2>Description</h2></div><div class="wh-panel-body"><p class="text-sm leading-relaxed">' +
      escapeHtml(item.description) +
      "</p></div></section>"
    : "";

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="max-w-3xl flex flex-col gap-3">
      <div class="wh-breadcrumb">
        <a href="${escapeHtml(prefix)}index.html">Home</a>
        <span> / </span>
        <a href="${escapeHtml(prefix)}items/">Items</a>
        <span> / </span>
        <a href="${escapeHtml(prefix + catPath)}">${escapeHtml(catLabel)}</a>
        <span> / </span>
        <span style="color:#c5ccda">${escapeHtml(item.name)}</span>
      </div>

      <header class="wh-panel" style="padding:12px;margin:0">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <span class="wh-chip wh-chip-live">paldb</span>
          <span class="text-xs text-pal-muted">${escapeHtml(catLabel)}</span>
          ${
            item.rarity
              ? '<span class="' +
                rarityClass(item.rarity) +
                ' text-xs font-semibold">' +
                escapeHtml(item.rarity) +
                "</span>"
              : ""
          }
        </div>
        <h1 class="wh-h1" style="margin:0">${escapeHtml(item.name)}</h1>
        ${
          item.code
            ? '<p class="text-xs text-pal-muted font-mono mt-1">' +
              escapeHtml(item.code) +
              "</p>"
            : ""
        }
      </header>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${stats}</div>

      ${desc}
      ${craftSection}
      ${usedSection}
      ${dropSection}

      <p class="text-xs text-pal-muted">
        <a href="${escapeHtml(prefix)}recipes/">All recipes</a>
        ·
        <a href="${escapeHtml(prefix)}items/">Items hub</a>
      </p>
    </div>
  </main>`;

  return shell({
    title: item.name + " — Item — Palhead",
    description:
      item.description ||
      item.name + " (" + catLabel + ") — Palworld item database.",
    activeNav: "items",
    body,
    prefix,
    siteMeta,
    headExtra: "<style>" + RARITY_STYLE + "</style>",
  });
}

module.exports = { itemDetailPage };
