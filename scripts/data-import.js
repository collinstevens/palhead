const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const vendorDir = path.join(root, "data", "vendor");
const defaultSource = path.join(
  "C:",
  "projects",
  "collinstevens",
  "paldb-cc-exports",
  "data",
  "publish",
  "paldb-data-demo"
);

const source = process.env.PALDB_PUBLISH_DIR || process.argv[2] || defaultSource;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(source)) {
  fail(
    "Import source not found: " +
      source +
      "\nPass a path or set PALDB_PUBLISH_DIR. Expected a paldb publish bundle (catalog.json + *.json)."
  );
}

const catalogPath = path.join(source, "catalog.json");
if (!fs.existsSync(catalogPath)) {
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

const catalog = JSON.parse(fs.readFileSync(path.join(vendorDir, "catalog.json"), "utf8"));
const meta = {
  imported_at: new Date().toISOString(),
  source_path: path.resolve(source),
  generated_at: catalog.generated_at || null,
  tool_version: catalog.tool_version || null,
  table_count: catalog.table_count ?? (catalog.tables || []).length,
};

fs.writeFileSync(
  path.join(vendorDir, "import-meta.json"),
  JSON.stringify(meta, null, 2) + "\n"
);

console.log("Imported vendor data from", path.resolve(source));
console.log("→", vendorDir);
console.log(
  "tables:",
  meta.table_count,
  "generated_at:",
  meta.generated_at || "—"
);
