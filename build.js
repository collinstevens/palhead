const fs = require("fs");
const path = require("path");
const { hrefToFs } = require("./site/paths");
const { homePage } = require("./site/pages/home");
const { palPage } = require("./site/pages/pal");

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

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const samplePal =
  palsBySlug.anubis ||
  (palsList.pals || []).find((p) => p.is_dex) ||
  (palsList.pals || [])[0] ||
  null;

const sampleDetail = samplePal
  ? palsBySlug[samplePal.path_segment] || samplePal
  : null;

writeFile(
  path.join(distDir, "index.html"),
  homePage({
    siteMeta,
    pals: palsList.pals || [],
    samplePal: sampleDetail,
  })
);

let palPages = 0;
for (const [seg, pal] of Object.entries(palsBySlug)) {
  const href = pal.path || "/pal/" + seg + "/";
  writeFile(hrefToFs(href, distDir), palPage({ pal, siteMeta }));
  palPages += 1;
}

copyDir(iconsSrc, path.join(distDir, "icons"));

const searchSrc = path.join(normalizedDir, "search-index.json");
const dataOut = path.join(distDir, "data");
fs.mkdirSync(dataOut, { recursive: true });
fs.copyFileSync(searchSrc, path.join(dataOut, "search-index.json"));
fs.copyFileSync(
  path.join(normalizedDir, "site-meta.json"),
  path.join(dataOut, "site-meta.json")
);

writeFile(
  path.join(root, "index.html"),
  homePage({
    siteMeta,
    pals: palsList.pals || [],
    samplePal: sampleDetail,
  })
);

console.log("build complete →", distDir);
console.log("home +", palPages, "pal pages");
console.log(
  "data:",
  siteMeta.data_version,
  "validate:",
  siteMeta.validation_status,
  "search entries:",
  siteMeta.counts?.search_entries
);
