const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix, pathSegment } = require("../paths");

function fmtRange(r) {
  if (!r) return "—";
  if (r.raw) return String(r.raw);
  if (r.min != null && r.max != null && r.min !== r.max) {
    return r.min + " – " + r.max;
  }
  if (r.min != null) return String(r.min);
  if (r.max != null) return String(r.max);
  return "—";
}

function statCard(label, value) {
  return (
    '<div class="stat-card"><div class="label">' +
    escapeHtml(label) +
    '</div><div class="value">' +
    escapeHtml(value == null || value === "" ? "—" : String(value)) +
    "</div></div>"
  );
}

function palPage({ pal, siteMeta }) {
  const href = pal.path || "/pal/" + pal.path_segment + "/";
  const prefix = depthPrefix(href);
  const iconSrc = pal.icon
    ? prefix + "icons/" + pal.icon
    : null;

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

  const workRows = Object.entries(pal.work || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(
      ([k, v]) =>
        '<li class="flex justify-between gap-3 border-b border-pal-border/40 py-1.5 text-sm">' +
        '<span class="text-pal-muted">' +
        escapeHtml(k) +
        '</span><span class="font-semibold tabular-nums">' +
        escapeHtml(String(v)) +
        "</span></li>"
    )
    .join("");

  const move = pal.movement || {};
  const partner = pal.partner_skill;

  const body = `
  <main class="flex-1 px-4 py-6 w-full">
    <div class="max-w-4xl mx-auto flex flex-col gap-5">
      <div class="text-xs text-pal-muted">
        <a class="hover:text-pal-text" href="${escapeHtml(prefix)}index.html">Home</a>
        <span class="mx-1">/</span>
        <a class="hover:text-pal-text" href="${escapeHtml(prefix)}pals/">Pals</a>
        <span class="mx-1">/</span>
        <span class="text-pal-text">${escapeHtml(pal.name)}</span>
      </div>

      <header class="flex flex-wrap items-start gap-4 rounded-lg border border-pal-border bg-pal-panel p-4">
        ${
          iconSrc
            ? '<img src="' +
              escapeHtml(iconSrc) +
              '" alt="" width="72" height="72" class="w-[72px] h-[72px] rounded-lg bg-pal-bg" />'
            : '<div class="w-[72px] h-[72px] rounded-lg bg-pal-bg"></div>'
        }
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            ${
              pal.deck != null && pal.deck > 0
                ? '<span class="text-pal-muted font-mono text-sm">#' +
                  escapeHtml(String(pal.deck)) +
                  "</span>"
                : ""
            }
            <h1 class="text-2xl font-semibold">${escapeHtml(pal.name)}</h1>
          </div>
          <div class="flex flex-wrap gap-1 mb-2">${elems || '<span class="text-xs text-pal-muted">No elements</span>'}</div>
          <p class="text-xs text-pal-muted">
            ${escapeHtml(pal.is_dex ? "Dex pal" : "Non-dex / special entity")}
            ${
              pal.identity?.GenusCategory
                ? " · " + escapeHtml(pal.identity.GenusCategory)
                : ""
            }
            ${pal.size ? " · size " + escapeHtml(pal.size) : ""}
            ${pal.food_amount != null ? " · food " + escapeHtml(String(pal.food_amount)) : ""}
            ${
              pal.male_probability != null
                ? " · ♂ " + escapeHtml(String(pal.male_probability)) + "%"
                : ""
            }
            ${pal.code ? " · code " + escapeHtml(pal.code) : ""}
          </p>
          ${
            pal.source_url
              ? '<p class="mt-2 text-xs"><a class="text-pal-accent underline underline-offset-2" href="' +
                escapeHtml(pal.source_url) +
                '" target="_blank" rel="noopener noreferrer">View on paldb.cc</a></p>'
              : ""
          }
        </div>
      </header>

      <section>
        <h2 class="text-sm font-semibold mb-2">Stats</h2>
        <div class="stat-grid">
          ${statCard("Health", fmtRange(pal.stats?.health))}
          ${statCard("Attack", fmtRange(pal.stats?.attack))}
          ${statCard("Defense", fmtRange(pal.stats?.defense))}
          ${statCard("Melee", pal.stats?.melee_attack)}
          ${statCard("Support", pal.stats?.support)}
          ${statCard("Rarity", pal.stats?.rarity)}
          ${statCard("Combi rank", pal.stats?.combi_rank)}
          ${statCard("Work speed", pal.stats?.work_speed)}
        </div>
      </section>

      <div class="grid md:grid-cols-2 gap-4">
        <section class="rounded-lg border border-pal-border bg-pal-panel p-4">
          <h2 class="text-sm font-semibold mb-2">Work suitability</h2>
          ${
            workRows
              ? '<ul>' + workRows + "</ul>"
              : '<p class="text-sm text-pal-muted">None listed.</p>'
          }
        </section>
        <section class="rounded-lg border border-pal-border bg-pal-panel p-4">
          <h2 class="text-sm font-semibold mb-2">Partner skill</h2>
          ${
            partner
              ? '<div class="text-sm font-semibold mb-1"><a class="hover:text-pal-accent" href="' +
                escapeHtml(
                  prefix +
                    "skills/partner/" +
                    pathSegment(partner.name || "") +
                    "/"
                ) +
                '">' +
                escapeHtml(partner.name || "—") +
                "</a></div><p class=\"text-sm text-pal-muted leading-relaxed\">" +
                escapeHtml(partner.description || "—") +
                "</p>"
              : '<p class="text-sm text-pal-muted">None listed.</p>'
          }
        </section>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <section class="rounded-lg border border-pal-border bg-pal-panel p-4">
          <h2 class="text-sm font-semibold mb-2">Movement</h2>
          <div class="stat-grid">
            ${statCard("Walk", move.WalkSpeed)}
            ${statCard("Run", move.RunSpeed)}
            ${statCard("Ride sprint", move.RideSprintSpeed)}
            ${statCard("Transport", move.TransportSpeed)}
            ${statCard("Swim", move.SwimSpeed)}
            ${statCard("Stamina", move.Stamina)}
          </div>
        </section>
        <section class="rounded-lg border border-pal-border bg-pal-panel p-4">
          <h2 class="text-sm font-semibold mb-2">Breeding</h2>
          <div class="stat-grid">
            ${statCard("Combi rank", pal.stats?.combi_rank)}
            ${statCard("Male %", pal.male_probability != null ? pal.male_probability + "%" : null)}
            ${statCard("Capture rate", pal.capture_rate_correct)}
          </div>
        </section>
      </div>

      ${
        Array.isArray(pal.passive_skills) && pal.passive_skills.length
          ? '<section class="rounded-lg border border-pal-border bg-pal-panel p-4"><h2 class="text-sm font-semibold mb-2">Passive skill ids</h2><p class="text-sm text-pal-muted font-mono break-all">' +
            escapeHtml(pal.passive_skills.join(", ")) +
            "</p></section>"
          : ""
      }

      <p class="text-xs text-pal-muted">
        <a class="text-pal-accent underline underline-offset-2" href="${escapeHtml(prefix)}pals/">← Back to pals list</a>
        ·
        <a class="text-pal-accent underline underline-offset-2" href="${escapeHtml(prefix)}tools/work-suitability/">Work suitability tool</a>
      </p>
    </div>
  </main>`;

  return shell({
    title: pal.name + " — Palhead",
    description:
      (pal.name || "Pal") +
      " stats, work suitability, and partner skill from paldb.cc data.",
    activeNav: "pal",
    body,
    prefix,
    siteMeta,
  });
}

module.exports = { palPage };
