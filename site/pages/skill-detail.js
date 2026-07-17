const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");

function statCard(label, value) {
  return (
    '<div class="stat-card"><div class="label">' +
    escapeHtml(label) +
    '</div><div class="value">' +
    escapeHtml(value == null || value === "" ? "—" : String(value)) +
    "</div></div>"
  );
}

function ownerCards(ownerSlugs, palsBySlug, prefix) {
  if (!ownerSlugs || !ownerSlugs.length) {
    return '<p class="text-sm text-pal-muted">No linked owner pals in normalized data.</p>';
  }
  return (
    '<div class="grid sm:grid-cols-2 gap-2">' +
    ownerSlugs
      .map((seg) => {
        const pal = palsBySlug[seg];
        if (!pal) {
          return (
            '<div class="rounded border border-pal-border px-3 py-2 text-sm text-pal-muted">' +
            escapeHtml(seg) +
            "</div>"
          );
        }
        const href = prefix + (pal.path || "/pal/" + seg + "/").replace(/^\//, "");
        const img = pal.icon
          ? '<img src="' +
            escapeHtml(prefix + "icons/" + pal.icon) +
            '" alt="" class="w-9 h-9 rounded bg-pal-bg" width="36" height="36" loading="lazy" />'
          : '<div class="w-9 h-9 rounded bg-pal-bg"></div>';
        const elems = (pal.elements || [])
          .map(
            (e) =>
              '<span class="elem elem-' +
              escapeHtml(e) +
              '">' +
              escapeHtml(e) +
              "</span>"
          )
          .join(" ");
        return (
          '<a class="flex items-center gap-2 rounded-lg border border-pal-border bg-pal-bg/50 p-2 hover:border-pal-accent" href="' +
          escapeHtml(href) +
          '">' +
          img +
          '<div class="min-w-0"><div class="font-medium text-sm truncate">' +
          escapeHtml(pal.name) +
          "</div>" +
          '<div class="flex flex-wrap gap-0.5 mt-0.5">' +
          elems +
          "</div></div></a>"
        );
      })
      .join("") +
    "</div>"
  );
}

function skillDetailPage({ kind, skill, siteMeta, palsBySlug }) {
  const href = skill.path;
  const prefix = depthPrefix(href);
  const kindLabel =
    kind === "partner"
      ? "Partner skill"
      : kind === "passive"
        ? "Passive skill"
        : "Active skill";
  const listPath =
    kind === "partner"
      ? "skills/partner/"
      : kind === "passive"
        ? "skills/passive/"
        : "skills/active/";

  const elems = (skill.elements || (skill.element ? [skill.element] : []))
    .map(
      (e) =>
        '<span class="elem elem-' +
        escapeHtml(e) +
        '">' +
        escapeHtml(e) +
        "</span>"
    )
    .join(" ");

  let stats = "";
  if (kind === "partner") {
    stats =
      statCard("Owners", skill.owner_count ?? 0) +
      statCard("Level shown", skill.level_shown) +
      statCard("Category", skill.category);
  } else if (kind === "passive") {
    stats =
      statCard("Rank", skill.rank) +
      statCard("Weight", skill.weight) +
      statCard("Owners", skill.owner_count ?? 0);
  } else {
    stats =
      statCard("Power", skill.power) +
      statCard("Cool time", skill.cool_time != null ? skill.cool_time + "s" : null) +
      statCard(
        "Range",
        skill.min_range != null || skill.max_range != null
          ? (skill.min_range ?? "?") + " – " + (skill.max_range ?? "?")
          : null
      ) +
      statCard("Category", skill.category) +
      statCard("Status", skill.aggregate_status) +
      statCard("Status value", skill.aggregate_value) +
      statCard("Strength", skill.strength) +
      statCard("Inherit", skill.will_not_inherit ? "No" : "Yes");
  }

  const fruit =
    kind === "active" && (skill.skill_fruit_path || skill.skill_fruit_raw)
      ? '<section class="rounded-lg border border-pal-border bg-pal-panel p-4"><h2 class="text-sm font-semibold mb-1">Skill fruit</h2>' +
        (skill.skill_fruit_path
          ? '<p class="text-sm"><a href="' +
            escapeHtml(
              prefix + skill.skill_fruit_path.replace(/^\//, "")
            ) +
            '">' +
            escapeHtml(skill.skill_fruit_name || skill.skill_fruit_raw) +
            "</a></p>"
          : '<p class="text-sm text-pal-muted font-mono break-all">' +
            escapeHtml(skill.skill_fruit_raw) +
            "</p>") +
        "</section>"
      : "";

  const ownersSection =
    kind === "active"
      ? ""
      : '<section class="rounded-lg border border-pal-border bg-pal-panel p-4"><h2 class="text-sm font-semibold mb-2">Owner pals</h2>' +
        ownerCards(skill.owner_slugs, palsBySlug, prefix) +
        "</section>";

  const body = `
  <main class="wh-page wh-page-pad">
    <div class="max-w-3xl flex flex-col gap-3">
      <div class="wh-breadcrumb">
        <a href="${escapeHtml(prefix)}index.html">Home</a>
        <span> / </span>
        <a href="${escapeHtml(prefix)}skills/">Skills</a>
        <span> / </span>
        <a href="${escapeHtml(prefix + listPath)}">${escapeHtml(kindLabel + "s")}</a>
        <span> / </span>
        <span style="color:#c5ccda">${escapeHtml(skill.name)}</span>
      </div>

      <header class="wh-panel" style="padding:12px;margin:0">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <span class="wh-chip wh-chip-live">paldb</span>
          <span class="text-xs text-pal-muted">${escapeHtml(kindLabel)}</span>
        </div>
        <h1 class="wh-h1" style="margin-bottom:8px">${escapeHtml(skill.name)}</h1>
        ${elems ? '<div class="flex flex-wrap gap-1 mb-2">' + elems + "</div>" : ""}
        <p class="text-sm text-pal-muted leading-relaxed">${escapeHtml(skill.description || "No description in extract.")}</p>
        ${
          skill.source_url
            ? '<p class="mt-3 text-xs"><a class="text-pal-accent underline underline-offset-2" href="' +
              escapeHtml(skill.source_url) +
              '" target="_blank" rel="noopener noreferrer">View on paldb.cc</a></p>'
            : ""
        }
      </header>

      <section>
        <h2 class="text-sm font-semibold mb-2">Details</h2>
        <div class="stat-grid">${stats}</div>
      </section>

      ${fruit}
      ${ownersSection}

      <p class="text-xs text-pal-muted">
        <a class="text-pal-accent underline underline-offset-2" href="${escapeHtml(prefix + listPath)}">← Back to ${escapeHtml(kindLabel.toLowerCase())} list</a>
      </p>
    </div>
  </main>`;

  return shell({
    title: skill.name + " — Palhead",
    description: (skill.description || skill.name || "").slice(0, 160),
    activeNav: "skills",
    body,
    prefix,
    siteMeta,
  });
}

module.exports = { skillDetailPage };
