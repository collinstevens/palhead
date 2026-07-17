const fs = require("fs");
const path = require("path");
const { hrefToFs } = require("../site/paths");
const {
  listPage,
  hubPage,
  detailPage,
  materialsHtml,
  dropsHtml,
} = require("../site/pages/catalog");
const {
  toolsHubPage,
  breedingPage,
  teamBuilderPage,
  dropFinderPage,
} = require("../site/pages/tools-live");
const {
  guidesHubPage,
  baseTipsPage,
  statusEffectsPage,
  sanPage,
  newsPage,
  workSuitRefPage,
} = require("../site/pages/guides-live");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeFile(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function buildRest({ root, distDir, normalizedDir, siteMeta, palsList }) {
  const n = (name) => path.join(normalizedDir, name);
  const exists = (name) => fs.existsSync(n(name));

  let pages = 0;

  const structures = exists("structures.json") ? readJson(n("structures.json")) : { structures: [] };
  const structuresBySlug = exists("structures-by-slug.json")
    ? readJson(n("structures-by-slug.json"))
    : {};
  const technologies = exists("technologies.json")
    ? readJson(n("technologies.json"))
    : { technologies: [] };
  const technologiesBySlug = exists("technologies-by-slug.json")
    ? readJson(n("technologies-by-slug.json"))
    : {};
  const worldHub = exists("world-hub.json") ? readJson(n("world-hub.json")) : { sections: [] };
  const breeding = exists("breeding.json") ? readJson(n("breeding.json")) : { pals: [] };
  const baseTips = exists("base-tips.json") ? readJson(n("base-tips.json")) : { tips: [] };
  const san = exists("san.json") ? readJson(n("san.json")) : null;
  const news = exists("news.json") ? readJson(n("news.json")) : { items: [] };
  const status = exists("status-effects.json") ? readJson(n("status-effects.json")) : null;
  const workSuit = exists("work-suitabilities.json")
    ? readJson(n("work-suitabilities.json"))
    : { work_suitabilities: [] };

  writeFile(
    hrefToFs("/structures/", distDir),
    listPage({
      title: "Structures",
      blurb: "Base buildings by category. Materials link to items when known.",
      path: "/structures/",
      activeNav: "structures",
      siteMeta,
      crumbs: [
        { href: "database/", label: "Database" },
        { label: "Structures" },
      ],
      rows: structures.structures || [],
      filterFields: [{ field: "category", label: "Category" }],
      columns: [
        { field: "name", label: "Name", render: "link" },
        { field: "category", label: "Category" },
        { field: "worker_max", label: "Workers", className: "text-center" },
        { field: "hp", label: "HP", className: "text-center" },
      ],
      pageSize: 120,
    })
  );
  pages += 1;

  for (const s of Object.values(structuresBySlug)) {
    const prefix = require("../site/paths").depthPrefix(s.path);
    writeFile(
      hrefToFs(s.path, distDir),
      detailPage({
        title: s.name,
        kindLabel: "Structure",
        path: s.path,
        activeNav: "structures",
        siteMeta,
        crumbs: [
          { href: "database/", label: "Database" },
          { href: "structures/", label: "Structures" },
          { label: s.name },
        ],
        stats: [
          { label: "Category", value: s.category },
          { label: "Workers", value: s.worker_max },
          { label: "HP", value: s.hp },
          { label: "Defense", value: s.defense },
          { label: "Code", value: s.code },
        ],
        subtitle: s.description,
        sections: [
          s.materials && s.materials.length
            ? {
                title: "Build materials",
                body: materialsHtml(prefix, s.materials),
              }
            : null,
          s.build_times && s.build_times.length
            ? {
                title: "Build times",
                body:
                  '<div class="flex flex-wrap gap-1">' +
                  s.build_times
                    .map(
                      (t) =>
                        '<span class="wh-chip">Lv ' +
                        String(t.level ?? "?") +
                        ": " +
                        String(t.time ?? "—") +
                        "</span>"
                    )
                    .join("") +
                  "</div>",
              }
            : null,
        ],
      })
    );
    pages += 1;
  }

  writeFile(
    hrefToFs("/tech/", distDir),
    listPage({
      title: "Technology",
      blurb: "Technology unlocks by player level and points.",
      path: "/tech/",
      activeNav: "database",
      siteMeta,
      crumbs: [
        { href: "database/", label: "Database" },
        { label: "Technology" },
      ],
      rows: technologies.technologies || [],
      filterFields: [{ field: "category", label: "Category" }],
      columns: [
        { field: "name", label: "Technology", render: "link" },
        { field: "level", label: "Level", className: "text-center" },
        { field: "points", label: "Points", className: "text-center" },
        { field: "category", label: "Category" },
      ],
      defaultSort: "level",
      pageSize: 120,
    })
  );
  pages += 1;

  for (const t of Object.values(technologiesBySlug)) {
    writeFile(
      hrefToFs(t.path, distDir),
      detailPage({
        title: t.name,
        kindLabel: "Technology",
        path: t.path,
        activeNav: "database",
        siteMeta,
        crumbs: [
          { href: "database/", label: "Database" },
          { href: "tech/", label: "Technology" },
          { label: t.name },
        ],
        stats: [
          { label: "Level", value: t.level },
          { label: "Points", value: t.points },
          { label: "Category", value: t.category },
        ],
      })
    );
    pages += 1;
  }

  writeFile(
    hrefToFs("/world/", distDir),
    hubPage({
      title: "World",
      blurb: "Alphas, bosses, drops, merchants, eggs, fishing, maps — list-first.",
      path: "/world/",
      activeNav: "world",
      siteMeta,
      crumbs: [
        { href: "database/", label: "Database" },
        { label: "World" },
      ],
      cards: (worldHub.sections || []).map((s) => ({
        label: s.label,
        blurb: s.blurb,
        path: s.path,
        count: s.count,
      })),
    })
  );
  pages += 1;

  for (const sec of worldHub.sections || []) {
    const listDoc = readJson(n("world-" + sec.key + ".json"));
    const bySlug = readJson(n("world-" + sec.key + "-by-slug.json"));
    writeFile(
      hrefToFs(sec.path, distDir),
      listPage({
        title: sec.label,
        blurb: sec.blurb,
        path: sec.path,
        activeNav: "world",
        siteMeta,
        crumbs: [
          { href: "database/", label: "Database" },
          { href: "world/", label: "World" },
          { label: sec.label },
        ],
        rows: listDoc.entities || [],
        columns: [
          { field: "name", label: "Name", render: "link" },
          { field: "elements", label: "Elements", render: "elements" },
          { field: "level", label: "Level", className: "text-center" },
          { field: "drop_count", label: "Drops", className: "text-center" },
          { field: "location", label: "Location" },
        ],
        pageSize: sec.key === "treasure" ? 80 : 100,
      })
    );
    pages += 1;

    for (const ent of Object.values(bySlug)) {
      const prefix = require("../site/paths").depthPrefix(ent.path);
      const sections = [];
      if (ent.description) {
        /* noop */
      }
      if (ent.drops && ent.drops.length) {
        sections.push({
          title: "Drops",
          meta: ent.drops.length,
          body: dropsHtml(prefix, ent.drops),
        });
      }
      if (ent.inventory && ent.inventory.length) {
        sections.push({
          title: "Inventory",
          meta: ent.inventory.length,
          body:
            '<ul class="text-sm space-y-1">' +
            ent.inventory
              .map((row) => {
                const name = row.path
                  ? '<a href="' +
                    prefix +
                    row.path.replace(/^\//, "") +
                    '">' +
                    row.name +
                    "</a>"
                  : row.name;
                return (
                  "<li>" +
                  name +
                  (row.price != null
                    ? ' <span class="text-pal-muted">' + row.price + "</span>"
                    : "") +
                  "</li>"
                );
              })
              .join("") +
            "</ul>",
        });
      }
      if (ent.pals && ent.pals.length) {
        sections.push({
          title: "Pals",
          meta: ent.pals.length,
          body:
            '<ul class="text-sm space-y-1">' +
            ent.pals
              .map((p) => {
                const name = p.path
                  ? '<a href="' +
                    prefix +
                    p.path.replace(/^\//, "") +
                    '">' +
                    p.name +
                    "</a>"
                  : p.name;
                return (
                  "<li>" +
                  name +
                  (p.weight != null
                    ? ' <span class="text-pal-muted">w' + p.weight + "</span>"
                    : "") +
                  "</li>"
                );
              })
              .join("") +
            "</ul>",
        });
      }
      if (ent.layer_counts && ent.layer_counts.length) {
        sections.push({
          title: "Layers / POIs",
          body:
            '<ul class="text-sm space-y-1">' +
            ent.layer_counts
              .map(
                (l) =>
                  "<li>" +
                  (l.name || "—") +
                  ': <span class="tabular-nums">' +
                  (l.count ?? "—") +
                  "</span></li>"
              )
              .join("") +
            "</ul>",
        });
      }
      if (ent.comment) {
        sections.push({
          title: "Notes",
          body: '<p class="text-sm">' + String(ent.comment) + "</p>",
        });
      }

      writeFile(
        hrefToFs(ent.path, distDir),
        detailPage({
          title: ent.name,
          kindLabel: sec.label,
          path: ent.path,
          activeNav: "world",
          siteMeta,
          crumbs: [
            { href: "world/", label: "World" },
            { href: sec.path.replace(/^\//, ""), label: sec.label },
            { label: ent.name },
          ],
          stats: [
            { label: "Level", value: ent.level },
            { label: "HP", value: ent.hp },
            { label: "Location", value: ent.location },
            {
              label: "Elements",
              value: (ent.elements || []).join(", ") || null,
            },
          ],
          sections,
        })
      );
      pages += 1;
    }
  }

  writeFile(hrefToFs("/tools/", distDir), toolsHubPage({ siteMeta }));
  writeFile(
    hrefToFs("/tools/breeding/", distDir),
    breedingPage({ siteMeta, breeding })
  );
  writeFile(
    hrefToFs("/tools/team-builder/", distDir),
    teamBuilderPage({ siteMeta, pals: palsList.pals || [] })
  );
  writeFile(hrefToFs("/tools/drop-finder/", distDir), dropFinderPage({ siteMeta }));
  pages += 4;

  writeFile(hrefToFs("/guides/", distDir), guidesHubPage({ siteMeta }));
  writeFile(
    hrefToFs("/guides/base-tips/", distDir),
    baseTipsPage({ siteMeta, tips: baseTips })
  );
  writeFile(
    hrefToFs("/guides/status-effects/", distDir),
    statusEffectsPage({ siteMeta, status })
  );
  writeFile(hrefToFs("/guides/san/", distDir), sanPage({ siteMeta, san }));
  writeFile(
    hrefToFs("/guides/work-power/", distDir),
    workSuitRefPage({ siteMeta, work: workSuit })
  );
  writeFile(hrefToFs("/news/", distDir), newsPage({ siteMeta, news }));
  pages += 6;

  writeFile(
    hrefToFs("/database/", distDir),
    hubPage({
      title: "Database",
      blurb: "All encyclopedia sections.",
      path: "/database/",
      activeNav: "database",
      siteMeta,
      crumbs: [{ label: "Database" }],
      cards: [
        { label: "Pals", blurb: "Dex and entities", path: "/pals/", count: siteMeta.counts?.pals },
        { label: "Skills", blurb: "Partner, passive, active", path: "/skills/", count: (siteMeta.counts?.skill_partner || 0) + (siteMeta.counts?.skill_passive || 0) + (siteMeta.counts?.skill_active || 0) },
        { label: "Items", blurb: "Gear and materials", path: "/items/", count: siteMeta.counts?.items },
        { label: "Recipes", blurb: "Crafting browser", path: "/recipes/", count: siteMeta.counts?.recipes },
        { label: "Structures", blurb: "Base buildings", path: "/structures/", count: siteMeta.counts?.structure },
        { label: "Technology", blurb: "Unlock tree", path: "/tech/", count: siteMeta.counts?.tech },
        { label: "World", blurb: "Alphas, drops, maps", path: "/world/", count: worldHub.sections?.length },
      ],
    })
  );
  pages += 1;

  const searchEntries = exists("search-index.json")
    ? readJson(n("search-index.json")).entries || []
    : [];
  const baseUrl = "https://palhead.pages.dev";
  const urls = new Set(["/", "/pals/", "/skills/", "/items/", "/recipes/", "/structures/", "/tech/", "/world/", "/tools/", "/guides/", "/news/", "/database/"]);
  for (const e of searchEntries) {
    if (e.path) urls.add(e.path.endsWith("/") ? e.path : e.path + "/");
  }
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [...urls]
      .map(
        (u) =>
          "  <url><loc>" +
          baseUrl +
          u +
          "</loc></url>"
      )
      .join("\n") +
    "\n</urlset>\n";
  writeFile(path.join(distDir, "sitemap.xml"), sitemap);
  writeFile(
    path.join(distDir, "robots.txt"),
    "User-agent: *\nAllow: /\nSitemap: " + baseUrl + "/sitemap.xml\n"
  );

  return pages;
}

module.exports = { buildRest };
