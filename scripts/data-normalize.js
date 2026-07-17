const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const vendorDir = path.join(root, "data", "vendor");
const outDir = path.join(root, "data", "normalized");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(path.join(vendorDir, "catalog.json"))) {
  fail(
    "No vendor data. Run: npm run data:import\nExpected data/vendor/catalog.json from a paldb publish bundle."
  );
}

const catalog = JSON.parse(
  fs.readFileSync(path.join(vendorDir, "catalog.json"), "utf8")
);

let importMeta = null;
const importMetaPath = path.join(vendorDir, "import-meta.json");
if (fs.existsSync(importMetaPath)) {
  importMeta = JSON.parse(fs.readFileSync(importMetaPath, "utf8"));
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const tables = (catalog.tables || []).map((t) => ({
  file: t.file,
  count: t.count,
  bytes: t.bytes,
}));

const manifest = {
  built_at: new Date().toISOString(),
  source: {
    generated_at: catalog.generated_at || importMeta?.generated_at || null,
    tool_version: catalog.tool_version || importMeta?.tool_version || null,
    table_count: catalog.table_count ?? tables.length,
    import_meta: importMeta,
  },
  tables,
  note: "Phase 0 stub. Entity/relation/search-index normalize lands next.",
};

const searchIndex = {
  built_at: manifest.built_at,
  schema: {
    fields: ["name", "type", "slug", "path", "elements", "icon", "rank"],
  },
  entries: [],
};

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(outDir, "search-index.json"),
  JSON.stringify(searchIndex, null, 2) + "\n"
);

console.log("Wrote", path.join(outDir, "manifest.json"));
console.log("Wrote", path.join(outDir, "search-index.json"), "(empty stub)");
console.log("vendor tables:", tables.length);
