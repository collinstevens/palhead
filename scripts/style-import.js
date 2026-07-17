const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const styleVendorDir = path.join(root, "data", "style-vendor");

const DEFAULT_PUBLISH_ROOT = path.join(
  "C:",
  "projects",
  "collinstevens",
  "wowhead-com-exports",
  "data",
  "publish"
);

const DEFAULT_DISTILLED = path.join(
  "C:",
  "projects",
  "collinstevens",
  "wowhead-com-exports",
  "data",
  "distilled"
);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function isPublishBundle(dir) {
  return (
    fs.existsSync(path.join(dir, "catalog.json")) ||
    fs.existsSync(path.join(dir, "homepage.json")) ||
    fs.existsSync(path.join(dir, "sample_index.json"))
  );
}

function generatedAt(dir) {
  for (const name of ["catalog.json", "sample_index.json", "homepage.json"]) {
    const p = path.join(dir, name);
    if (!fs.existsSync(p)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      if (j.generated_at) {
        const t = Date.parse(j.generated_at);
        if (!Number.isNaN(t)) return t;
      }
    } catch {
      /* ignore */
    }
    try {
      return fs.statSync(p).mtimeMs;
    } catch {
      /* ignore */
    }
  }
  try {
    return fs.statSync(dir).mtimeMs;
  } catch {
    return 0;
  }
}

function resolveLatestPublish(publishRoot) {
  if (!fs.existsSync(publishRoot)) return null;
  const entries = fs
    .readdirSync(publishRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(publishRoot, e.name))
    .filter(isPublishBundle);
  if (!entries.length) return null;
  entries.sort((a, b) => generatedAt(b) - generatedAt(a));
  return entries[0];
}

function resolveSource() {
  if (process.env.WOWHEAD_STYLE_DIR) {
    return {
      source: path.resolve(process.env.WOWHEAD_STYLE_DIR),
      how: "WOWHEAD_STYLE_DIR",
    };
  }
  if (process.argv[2]) {
    return {
      source: path.resolve(process.argv[2]),
      how: "cli arg",
    };
  }

  const publishRoot = process.env.WOWHEAD_PUBLISH_ROOT
    ? path.resolve(process.env.WOWHEAD_PUBLISH_ROOT)
    : DEFAULT_PUBLISH_ROOT;

  const latest = resolveLatestPublish(publishRoot);
  if (latest) {
    return {
      source: latest,
      how: "latest publish under " + publishRoot,
    };
  }

  if (fs.existsSync(DEFAULT_DISTILLED) && isPublishBundle(DEFAULT_DISTILLED)) {
    return {
      source: DEFAULT_DISTILLED,
      how: "fallback distilled",
    };
  }

  return { source: null, how: "none" };
}

const { source, how } = resolveSource();
const allowMissing =
  process.env.ALLOW_MISSING_STYLE === "1" ||
  process.env.ALLOW_MISSING_STYLE === "true" ||
  process.env.CI === "true";

if (!source || !fs.existsSync(source)) {
  if (allowMissing) {
    console.warn(
      "Wowhead style source not found — skipping (style is UX reference only, not required for SSG)."
    );
    console.warn(
      "Set WOWHEAD_STYLE_DIR or place a publish bundle under:\n  " +
        DEFAULT_PUBLISH_ROOT
    );
    process.exit(0);
  }
  fail(
    "Wowhead style source not found.\n" +
      "Expected a publish bundle under:\n  " +
      DEFAULT_PUBLISH_ROOT +
      "\nor distilled sample data at:\n  " +
      DEFAULT_DISTILLED +
      "\nSet WOWHEAD_STYLE_DIR or pass a path. This is UX/style reference only — not Palworld game data.\n" +
      "In CI, style import is skipped automatically (ALLOW_MISSING_STYLE / CI)."
  );
}

if (!isPublishBundle(source)) {
  fail(
    "No wowhead sample JSON in " +
      source +
      " (need catalog.json, homepage.json, or sample_index.json)"
  );
}

fs.rmSync(styleVendorDir, { recursive: true, force: true });
fs.mkdirSync(styleVendorDir, { recursive: true });
fs.writeFileSync(path.join(styleVendorDir, ".gitkeep"), "");

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

copyTree(source, styleVendorDir);

let generatedAtIso = null;
let tableHints = [];
for (const name of ["catalog.json", "sample_index.json", "homepage.json"]) {
  const p = path.join(styleVendorDir, name);
  if (!fs.existsSync(p)) continue;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!generatedAtIso && j.generated_at) generatedAtIso = j.generated_at;
  } catch {
    /* ignore */
  }
}

const files = fs
  .readdirSync(styleVendorDir)
  .filter((f) => f.endsWith(".json"));
tableHints = files;

const meta = {
  kind: "wowhead_style_reference",
  purpose:
    "UX / layout / writing-style sample from wowhead.com for Palhead design. Never use as Palworld game facts.",
  imported_at: new Date().toISOString(),
  source_path: path.resolve(source),
  source_resolution: how,
  source_name: path.basename(source),
  generated_at: generatedAtIso,
  files,
  upstream_repo: "C:\\projects\\collinstevens\\wowhead-com-exports",
  upstream_site: "https://www.wowhead.com/",
};

fs.writeFileSync(
  path.join(styleVendorDir, "import-meta.json"),
  JSON.stringify(meta, null, 2) + "\n"
);

console.log("Imported Wowhead style reference from", path.resolve(source));
console.log("resolved via:", how);
console.log("→", styleVendorDir);
console.log("json files:", files.length, "generated_at:", generatedAtIso || "—");
console.log(
  "NOTE: style reference only — game data remains paldb-cc-exports / data/vendor/"
);
