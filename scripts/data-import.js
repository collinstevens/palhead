const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const vendorDir = path.join(root, "data", "vendor");

const DEFAULT_PUBLISH_ROOT = path.join(
  "C:",
  "projects",
  "collinstevens",
  "paldb-cc-exports",
  "data",
  "publish"
);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function isPublishBundle(dir) {
  return fs.existsSync(path.join(dir, "catalog.json"));
}

function catalogGeneratedAt(dir) {
  try {
    const catalog = JSON.parse(
      fs.readFileSync(path.join(dir, "catalog.json"), "utf8")
    );
    if (catalog.generated_at) {
      const t = Date.parse(catalog.generated_at);
      if (!Number.isNaN(t)) return t;
    }
  } catch {
    /* ignore */
  }
  try {
    return fs.statSync(path.join(dir, "catalog.json")).mtimeMs;
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

  entries.sort((a, b) => catalogGeneratedAt(b) - catalogGeneratedAt(a));
  return entries[0];
}

function resolveSource() {
  if (process.env.PALDB_PUBLISH_DIR) {
    return {
      source: path.resolve(process.env.PALDB_PUBLISH_DIR),
      how: "PALDB_PUBLISH_DIR",
    };
  }
  if (process.argv[2]) {
    return {
      source: path.resolve(process.argv[2]),
      how: "cli arg",
    };
  }

  const publishRoot = process.env.PALDB_PUBLISH_ROOT
    ? path.resolve(process.env.PALDB_PUBLISH_ROOT)
    : DEFAULT_PUBLISH_ROOT;

  const latest = resolveLatestPublish(publishRoot);
  if (latest) {
    return {
      source: latest,
      how: "latest under " + publishRoot,
    };
  }

  return {
    source: path.join(publishRoot, "paldb-data-demo"),
    how: "fallback demo path",
  };
}

const { source, how } = resolveSource();

if (!fs.existsSync(source)) {
  fail(
    "Import source not found: " +
      source +
      "\nSet PALDB_PUBLISH_DIR, pass a path, or ensure paldb-cc-exports publish bundles exist under:\n  " +
      DEFAULT_PUBLISH_ROOT
  );
}

if (!isPublishBundle(source)) {
  fail("No catalog.json in " + source);
}

fs.rmSync(vendorDir, { recursive: true, force: true });
fs.mkdirSync(vendorDir, { recursive: true });
fs.writeFileSync(path.join(vendorDir, ".gitkeep"), "");

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

copyTree(source, vendorDir);

const catalog = JSON.parse(
  fs.readFileSync(path.join(vendorDir, "catalog.json"), "utf8")
);
const meta = {
  imported_at: new Date().toISOString(),
  source_path: path.resolve(source),
  source_resolution: how,
  source_name: path.basename(source),
  generated_at: catalog.generated_at || null,
  tool_version: catalog.tool_version || null,
  table_count: catalog.table_count ?? (catalog.tables || []).length,
};

fs.writeFileSync(
  path.join(vendorDir, "import-meta.json"),
  JSON.stringify(meta, null, 2) + "\n"
);

console.log("Imported vendor data from", path.resolve(source));
console.log("resolved via:", how);
console.log("→", vendorDir);
console.log(
  "tables:",
  meta.table_count,
  "generated_at:",
  meta.generated_at || "—"
);
