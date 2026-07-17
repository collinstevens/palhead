const fs = require("fs");
const path = require("path");
const { hrefToFs } = require("./site/paths");
const { homePage } = require("./site/pages/home");
const { palPage } = require("./site/pages/pal");
const { palsBrowserPage } = require("./site/pages/pals-list");
const { skillsHubPage, skillsListPage } = require("./site/pages/skills-list");
const { skillDetailPage } = require("./site/pages/skill-detail");
const { stubPage } = require("./site/pages/stub");

const root = __dirname;
const normalizedDir = path.join(root, "data", "normalized");
const distDir = path.join(root, "dist");
const iconsSrc = path.join(root, "icons");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeFile(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

const required = [
  "site-meta.json",
  "pals.json",
  "pals-by-slug.json",
  "search-index.json",
  "skills-partner.json",
  "skills-passive.json",
  "skills-active.json",
  "skills-partner-by-slug.json",
  "skills-passive-by-slug.json",
  "skills-active-by-slug.json",
];
for (const name of required) {
  if (!fs.existsSync(path.join(normalizedDir, name))) {
    fail(
      "Missing data/normalized/" +
        name +
        "\nRun: npm run data:import && npm run data:normalize"
    );
  }
}

const siteMeta = readJson(path.join(normalizedDir, "site-meta.json"));
const palsList = readJson(path.join(normalizedDir, "pals.json"));
const palsBySlug = readJson(path.join(normalizedDir, "pals-by-slug.json"));
const partnerList = readJson(path.join(normalizedDir, "skills-partner.json"));
const passiveList = readJson(path.join(normalizedDir, "skills-passive.json"));
const activeList = readJson(path.join(normalizedDir, "skills-active.json"));
const partnerBySlug = readJson(
  path.join(normalizedDir, "skills-partner-by-slug.json")
);
const passiveBySlug = readJson(
  path.join(normalizedDir, "skills-passive-by-slug.json")
);
const activeBySlug = readJson(
  path.join(normalizedDir, "skills-active-by-slug.json")
);

const palsPayload = {
  count: palsList.count,
  dex_count: palsList.dex_count,
  pals: palsList.pals || [],
};

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

writeFile(
  path.join(distDir, "index.html"),
  homePage({
    siteMeta,
    pals: palsList.pals || [],
  })
);

writeFile(
  hrefToFs("/pals/", distDir),
  palsBrowserPage({
    mode: "database",
    siteMeta,
    palsPayload,
  })
);

writeFile(
  hrefToFs("/tools/work-suitability/", distDir),
  palsBrowserPage({
    mode: "work",
    siteMeta,
    palsPayload,
  })
);

writeFile(
  hrefToFs("/skills/", distDir),
  skillsHubPage({
    siteMeta,
    counts: siteMeta.counts || {},
  })
);

writeFile(
  hrefToFs("/skills/partner/", distDir),
  skillsListPage({
    kind: "partner",
    siteMeta,
    skillsPayload: partnerList,
  })
);

writeFile(
  hrefToFs("/skills/passive/", distDir),
  skillsListPage({
    kind: "passive",
    siteMeta,
    skillsPayload: passiveList,
  })
);

writeFile(
  hrefToFs("/skills/active/", distDir),
  skillsListPage({
    kind: "active",
    siteMeta,
    skillsPayload: activeList,
  })
);

const stubs = [
  {
    path: "/news/",
    heading: "News",
    activeNav: "news",
    feed: true,
    related: [
      { href: "pals/", label: "Pals database", tag: "live" },
      { href: "skills/", label: "Skills", tag: "live" },
    ],
  },
  {
    path: "/guides/",
    heading: "Guides",
    activeNav: "guides",
    related: [
      { href: "guides/base-tips/", label: "Base tips", soon: true },
      { href: "guides/status-effects/", label: "Status effects", soon: true },
      { href: "tools/work-suitability/", label: "Work suitability", tag: "live" },
    ],
  },
  {
    path: "/guides/base-tips/",
    heading: "Base Tips",
    activeNav: "guides",
    crumbs: [{ href: "guides/", label: "Guides" }, { label: "Base Tips" }],
  },
  {
    path: "/guides/status-effects/",
    heading: "Status Effects",
    activeNav: "guides",
    crumbs: [{ href: "guides/", label: "Guides" }, { label: "Status Effects" }],
  },
  {
    path: "/database/",
    heading: "Database",
    activeNav: "database",
    related: [
      { href: "pals/", label: "Pals", tag: "live" },
      { href: "skills/", label: "Skills", tag: "live" },
      { href: "items/", label: "Items", soon: true },
      { href: "structures/", label: "Structures", soon: true },
      { href: "tech/", label: "Technology", soon: true },
      { href: "world/", label: "World", soon: true },
    ],
  },
  {
    path: "/items/",
    heading: "Items",
    activeNav: "items",
    crumbs: [{ href: "database/", label: "Database" }, { label: "Items" }],
    related: [
      { href: "pals/", label: "Pals", tag: "live" },
      { href: "structures/", label: "Structures", soon: true },
    ],
  },
  {
    path: "/structures/",
    heading: "Structures",
    activeNav: "structures",
    crumbs: [{ href: "database/", label: "Database" }, { label: "Structures" }],
  },
  {
    path: "/tech/",
    heading: "Technology",
    activeNav: "database",
    crumbs: [{ href: "database/", label: "Database" }, { label: "Technology" }],
  },
  {
    path: "/world/",
    heading: "World",
    activeNav: "world",
    crumbs: [{ href: "database/", label: "Database" }, { label: "World" }],
    related: [
      { href: "pals/", label: "Pals", tag: "live" },
      { href: "items/", label: "Items", soon: true },
    ],
  },
  {
    path: "/tools/",
    heading: "Tools",
    activeNav: "tools",
    related: [
      { href: "tools/work-suitability/", label: "Work suitability", tag: "live" },
      { href: "tools/breeding/", label: "Breeding calculator", soon: true },
      { href: "tools/team-builder/", label: "Team builder", soon: true },
      { href: "tools/drop-finder/", label: "Drop finder", soon: true },
    ],
  },
  {
    path: "/tools/breeding/",
    heading: "Breeding Calculator",
    activeNav: "tools",
    crumbs: [{ href: "tools/", label: "Tools" }, { label: "Breeding" }],
  },
  {
    path: "/tools/team-builder/",
    heading: "Team Builder",
    activeNav: "tools",
    crumbs: [{ href: "tools/", label: "Tools" }, { label: "Team Builder" }],
  },
  {
    path: "/tools/drop-finder/",
    heading: "Drop Finder",
    activeNav: "tools",
    crumbs: [{ href: "tools/", label: "Tools" }, { label: "Drop Finder" }],
  },
];

let stubPages = 0;
for (const s of stubs) {
  writeFile(
    hrefToFs(s.path, distDir),
    stubPage({
      title: s.heading + " — coming soon",
      heading: s.heading,
      path: s.path,
      activeNav: s.activeNav,
      siteMeta,
      crumbs: s.crumbs || [{ label: s.heading }],
      feed: !!s.feed,
      related: s.related || [],
    })
  );
  stubPages += 1;
}

let palPages = 0;
for (const [seg, pal] of Object.entries(palsBySlug)) {
  const href = pal.path || "/pal/" + seg + "/";
  writeFile(hrefToFs(href, distDir), palPage({ pal, siteMeta }));
  palPages += 1;
}

let skillPages = 0;
for (const skill of Object.values(partnerBySlug)) {
  writeFile(
    hrefToFs(skill.path, distDir),
    skillDetailPage({
      kind: "partner",
      skill,
      siteMeta,
      palsBySlug,
    })
  );
  skillPages += 1;
}
for (const skill of Object.values(passiveBySlug)) {
  writeFile(
    hrefToFs(skill.path, distDir),
    skillDetailPage({
      kind: "passive",
      skill,
      siteMeta,
      palsBySlug,
    })
  );
  skillPages += 1;
}
for (const skill of Object.values(activeBySlug)) {
  writeFile(
    hrefToFs(skill.path, distDir),
    skillDetailPage({
      kind: "active",
      skill,
      siteMeta,
      palsBySlug,
    })
  );
  skillPages += 1;
}

copyDir(iconsSrc, path.join(distDir, "icons"));

const dataOut = path.join(distDir, "data");
fs.mkdirSync(dataOut, { recursive: true });
for (const name of [
  "search-index.json",
  "site-meta.json",
  "pals.json",
  "skills-partner.json",
  "skills-passive.json",
  "skills-active.json",
]) {
  fs.copyFileSync(
    path.join(normalizedDir, name),
    path.join(dataOut, name)
  );
}

writeFile(
  path.join(root, "index.html"),
  homePage({
    siteMeta,
    pals: palsList.pals || [],
  })
);

console.log("build complete →", distDir);
console.log(
  "pal pages:",
  palPages,
  "skill pages:",
  skillPages,
  "stub hubs:",
  stubPages
);
console.log(
  "data:",
  siteMeta.data_version,
  "validate:",
  siteMeta.validation_status
);
