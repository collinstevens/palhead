const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const vendorDir = path.join(root, "data", "vendor");
const iconsDir = path.join(root, "icons");
const manifestPath = path.join(root, "data", "icon-manifest.json");
const cdnIndexPath = path.join(root, "data", "icon-cdn-index.json");

const CDN = "https://cdn.paldb.cc/image/";
const PAL_PREFIX = "Pal/Texture/PalIcon/Normal/";
const ITEM_PREFIX = "Others/InventoryItemIcon/Texture/";
const BUILD_PREFIX = "Pal/Texture/BuildObject/PNG/";

const DEFAULT_EXPORTS = path.resolve(
  root,
  "..",
  "paldb-cc-exports",
  "data",
  "raw",
  "exports",
  "en"
);

const ITEM_VENDORS = [
  { file: "materials.json", listKey: "materials" },
  { file: "weapons.json", listKey: "weapons" },
  { file: "armor.json", listKey: "armor" },
  { file: "accessories.json", listKey: "accessories" },
  { file: "consumables.json", listKey: "consumables" },
  { file: "ammo.json", listKey: "ammo" },
  { file: "ingredients.json", listKey: "ingredients" },
  { file: "spheres.json", listKey: "spheres" },
  { file: "sphere_modules.json", listKey: "sphere_modules" },
  { file: "schematics.json", listKey: "schematics" },
  { file: "key_items.json", listKey: "key_items" },
  { file: "saddles.json", listKey: "saddles" },
  { file: "skill_fruits.json", listKey: "skill_fruits" },
];

const TYPE_ALIASES = {
  Material: ["Material"],
  Weapon: ["Weapon"],
  Armor: ["Armor"],
  Accessory: ["Accessory"],
  Consume: ["Consume", "Food"],
  Consumable: ["Consume", "Food"],
  Ammo: ["Ammo"],
  Food: ["Food", "Consume"],
  Ingredient: ["Food", "Consume"],
  SpecialWeapon: ["PalSphere", "SpecialWeapon"],
  Sphere: ["PalSphere", "SpecialWeapon"],
  CaptureItemModifier: ["SphereModule"],
  "Sphere Module": ["SphereModule"],
  Blueprint: ["Blueprint", "Material"],
  Schematic: ["Blueprint", "Material"],
  Essential: ["Essential"],
  "Key Items": ["Essential"],
  "Pal Gear": ["Essential"],
  Glider: ["Glider"],
  Salvage: ["Salvage"],
  QuestItem: ["QuestItem"],
  Relic: ["Relic"],
  Jewelry: ["Jewelry"],
  PalAwakening: ["PalAwakening"],
};

const FALLBACK_TYPES = [
  "Material",
  "Weapon",
  "Armor",
  "Accessory",
  "Consume",
  "Food",
  "Ammo",
  "Essential",
  "Blueprint",
  "PalSphere",
  "SphereModule",
  "Glider",
  "Salvage",
  "QuestItem",
  "Relic",
  "Jewelry",
  "PalAwakening",
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipScrape = args.includes("--no-scrape");
const concurrency = Math.max(
  1,
  Math.min(
    16,
    Number(
      (args.find((a) => a.startsWith("--concurrency=")) || "").split("=")[1] ||
        6
    ) || 6
  )
);
const exportsDirArg = (
  args.find((a) => a.startsWith("--exports=")) || ""
).split("=")[1];
const exportsDir = exportsDirArg
  ? path.resolve(exportsDirArg)
  : process.env.PALDB_EXPORTS_EN || DEFAULT_EXPORTS;

function log(...parts) {
  console.log(...parts);
}

function loadVendor(name) {
  const p = path.join(vendorDir, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function isNonEmptyFile(file) {
  try {
    return fs.statSync(file).size > 0;
  } catch {
    return false;
  }
}

function safeFileStem(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 180);
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function typeCandidates(typeA, wide) {
  const mapped = TYPE_ALIASES[typeA] || [];
  if (wide) return unique([typeA, ...mapped, ...FALLBACK_TYPES]);
  return unique([typeA, ...mapped]);
}

function itemBasenameCandidates(iconName, code, typeA, wide) {
  const names = unique([iconName, code]);
  const types = typeCandidates(typeA, wide);
  const out = [];
  for (const n of names) {
    out.push("T_itemicon_" + n);
    for (const t of types) {
      if (!t) continue;
      if (n === t || n.startsWith(t + "_")) {
        out.push("T_itemicon_" + n);
      } else {
        out.push("T_itemicon_" + t + "_" + n);
      }
    }
  }
  return unique(out);
}

function scrapeCdnIndex(dir) {
  const items = {};
  const structures = {};
  const pals = {};
  if (!fs.existsSync(dir)) {
    log("exports dir missing, skip scrape:", dir);
    return { items, structures, pals, files: 0 };
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
  log("scraping CDN icon paths from", files.length, "HTML files…");
  let n = 0;
  for (const f of files) {
    n += 1;
    if (n % 500 === 0) log("  scrape progress", n + "/" + files.length);
    const html = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of html.matchAll(
      /cdn\.paldb\.cc\/image\/(Others\/InventoryItemIcon\/Texture\/T_itemicon_[A-Za-z0-9_]+\.webp)/g
    )) {
      const rel = m[1];
      const base = path.posix.basename(rel, ".webp");
      if (!items[base]) items[base] = CDN + rel;
    }
    for (const m of html.matchAll(
      /cdn\.paldb\.cc\/image\/(Pal\/Texture\/BuildObject\/PNG\/T_icon_buildObject_[A-Za-z0-9_]+\.webp)/g
    )) {
      const rel = m[1];
      const base = path.posix.basename(rel, ".webp");
      if (!structures[base]) structures[base] = CDN + rel;
    }
    for (const m of html.matchAll(
      /cdn\.paldb\.cc\/image\/(Pal\/Texture\/PalIcon\/Normal\/T_[A-Za-z0-9_]+_icon_normal\.webp)/g
    )) {
      const rel = m[1];
      const base = path.posix.basename(rel, ".webp");
      if (!pals[base]) pals[base] = CDN + rel;
    }
  }
  log(
    "scrape done:",
    Object.keys(items).length,
    "item,",
    Object.keys(structures).length,
    "structure,",
    Object.keys(pals).length,
    "pal icons"
  );
  return { items, structures, pals, files: files.length };
}

function loadOrBuildCdnIndex() {
  if (skipScrape && fs.existsSync(cdnIndexPath)) {
    log("loading cached CDN index", cdnIndexPath);
    return JSON.parse(fs.readFileSync(cdnIndexPath, "utf8"));
  }
  if (!skipScrape && fs.existsSync(exportsDir)) {
    const idx = scrapeCdnIndex(exportsDir);
    ensureDir(path.dirname(cdnIndexPath));
    fs.writeFileSync(
      cdnIndexPath,
      JSON.stringify(
        {
          built_at: new Date().toISOString(),
          exports_dir: exportsDir,
          counts: {
            items: Object.keys(idx.items).length,
            structures: Object.keys(idx.structures).length,
            pals: Object.keys(idx.pals).length,
            files: idx.files,
          },
          items: idx.items,
          structures: idx.structures,
          pals: idx.pals,
        },
        null,
        2
      ) + "\n"
    );
    return {
      items: idx.items,
      structures: idx.structures,
      pals: idx.pals,
    };
  }
  if (fs.existsSync(cdnIndexPath)) {
    log("exports missing; loading cached CDN index");
    return JSON.parse(fs.readFileSync(cdnIndexPath, "utf8"));
  }
  log("no CDN index available — using template URLs only");
  return { items: {}, structures: {}, pals: {} };
}

function nameVariants(value) {
  if (!value) return [];
  const s = String(value);
  return unique([
    s,
    s.replace(/_/g, ""),
    s.replace(/__/g, "_"),
  ]);
}

function matchItemUrls(iconName, code, typeA, itemIndex) {
  const narrow = itemBasenameCandidates(iconName, code, typeA, false);
  const scraped = [];
  for (const base of narrow) {
    if (itemIndex[base]) scraped.push(itemIndex[base]);
  }
  const suffixes = unique([
    ...nameVariants(iconName),
    ...nameVariants(code),
  ]);
  for (const s of suffixes) {
    if (!s) continue;
    const needle = s.toLowerCase();
    for (const [base, url] of Object.entries(itemIndex)) {
      const b = base.toLowerCase();
      if (
        b === ("t_itemicon_" + needle) ||
        b.endsWith("_" + needle) ||
        b.replace(/_/g, "") === ("titemicon" + needle.replace(/_/g, ""))
      ) {
        scraped.push(url);
      }
    }
  }
  const scrapedUniq = unique(scraped);
  if (scrapedUniq.length) return scrapedUniq;

  const wide = itemBasenameCandidates(iconName, code, typeA, true);
  return unique(wide.map((base) => CDN + ITEM_PREFIX + base + ".webp"));
}

function matchStructureUrls(code, id, structureIndex) {
  const keys = unique([...nameVariants(code), ...nameVariants(id)]);
  const urls = [];
  for (const k of keys) {
    const base = "T_icon_buildObject_" + k;
    if (structureIndex[base]) urls.push(structureIndex[base]);
    const needle = String(k).toLowerCase();
    for (const [b, url] of Object.entries(structureIndex)) {
      if (
        b.toLowerCase() === base.toLowerCase() ||
        b.toLowerCase().endsWith("_" + needle)
      ) {
        urls.push(url);
      }
    }
    urls.push(CDN + BUILD_PREFIX + base + ".webp");
  }
  return unique(urls);
}

function matchPalUrls(code, slug, palIndex) {
  const stripped = [];
  if (code) {
    stripped.push(String(code).replace(/^BOSS_/, "").replace(/^GYM_/, ""));
  }
  const keys = unique([
    code,
    ...stripped,
    ...stripped.map((k) => k.replace(/_/g, "")),
  ]);
  const urls = [];
  for (const k of keys) {
    if (!k || /[&:]/.test(k)) continue;
    const base = "T_" + k + "_icon_normal";
    if (palIndex[base]) urls.push(palIndex[base]);
    for (const [b, url] of Object.entries(palIndex)) {
      if (b.toLowerCase() === base.toLowerCase()) urls.push(url);
    }
    urls.push(CDN + PAL_PREFIX + base + ".webp");
  }
  return unique(urls);
}

function localItemFile(iconName, code, sourceUrl) {
  let stem = safeFileStem(iconName || code);
  if (!stem && sourceUrl) {
    const base = path.posix.basename(sourceUrl, ".webp");
    stem = safeFileStem(base.replace(/^T_itemicon_/, ""));
  }
  if (!stem) stem = "unknown";
  return path.join("icons", "items", stem + ".webp");
}

function localStructureFile(code, id) {
  const stem = safeFileStem(code || id || "unknown");
  return path.join("icons", "structures", stem + ".webp");
}

function localPalFile(code) {
  return path.join("icons", "T_" + safeFileStem(code) + "_icon_normal.webp");
}

function buildPlan(cdnIndex) {
  const plan = [];
  const seenLocal = new Map();

  function addJob(job) {
    const key = job.localFile.replace(/\\/g, "/");
    if (seenLocal.has(key)) {
      const prev = seenLocal.get(key);
      prev.entities.push({
        kind: job.kind,
        code: job.code,
        icon_name: job.icon_name,
        id: job.id,
        slug: job.slug,
      });
      prev.remoteUrls = unique([...prev.remoteUrls, ...job.remoteUrls]);
      return;
    }
    const entry = {
      kind: job.kind,
      key: job.key,
      code: job.code || null,
      icon_name: job.icon_name || null,
      id: job.id || null,
      slug: job.slug || null,
      localFile: key,
      remoteUrls: job.remoteUrls || [],
      entities: [
        {
          kind: job.kind,
          code: job.code,
          icon_name: job.icon_name,
          id: job.id,
          slug: job.slug,
        },
      ],
    };
    seenLocal.set(key, entry);
    plan.push(entry);
  }

  const palsDoc = loadVendor("pals.json");
  for (const raw of palsDoc?.pals || []) {
    const code = raw.identity?.Code || raw.id || null;
    if (!code) continue;
    const slug = raw.slug || raw.id || null;
    addJob({
      kind: "pal",
      key: code,
      code,
      id: raw.id || code,
      slug,
      localFile: localPalFile(code),
      remoteUrls: matchPalUrls(code, slug, cdnIndex.pals || {}),
    });
  }

  for (const v of ITEM_VENDORS) {
    const doc = loadVendor(v.file);
    const list = doc?.[v.listKey] || [];
    for (const raw of list) {
      const iconName = raw.icon_name || null;
      const code = raw.code || raw.id || null;
      if (!iconName && !code) continue;
      const localFile = localItemFile(iconName, code, null);
      addJob({
        kind: "item",
        key: code || iconName,
        code,
        icon_name: iconName,
        id: raw.id || code,
        slug: raw.slug || null,
        localFile,
        remoteUrls: matchItemUrls(
          iconName,
          code,
          raw.type_a || null,
          cdnIndex.items || {}
        ),
      });
    }
  }

  const structuresDoc = loadVendor("structures.json");
  for (const raw of structuresDoc?.structures || []) {
    const code = raw.code || raw.id || null;
    if (!code) continue;
    addJob({
      kind: "structure",
      key: code,
      code,
      id: raw.id || code,
      slug: raw.slug || null,
      localFile: localStructureFile(code, raw.id),
      remoteUrls: matchStructureUrls(code, raw.id, cdnIndex.structures || {}),
    });
  }

  return plan;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadOne(url, destAbs) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "palhead-icon-pipeline/1.0 (+local offline-capable site)",
      Accept: "image/webp,image/*,*/*",
    },
  });
  if (!res.ok) {
    const err = new Error("HTTP " + res.status);
    err.status = res.status;
    throw err;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("empty body");
  ensureDir(path.dirname(destAbs));
  const tmp = destAbs + ".part";
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, destAbs);
  return buf.length;
}

function expandJobFiles(job, status, source, extra = {}) {
  const rel = job.localFile.replace(/\\/g, "/");
  const entities =
    job.entities && job.entities.length
      ? job.entities
      : [
          {
            kind: job.kind,
            code: job.code,
            icon_name: job.icon_name,
            id: job.id,
            slug: job.slug,
          },
        ];
  return entities.map((e) => ({
    kind: e.kind || job.kind,
    code: e.code || null,
    icon_name: e.icon_name || null,
    id: e.id || null,
    slug: e.slug || null,
    file: rel,
    source: source || null,
    status,
    ...extra,
  }));
}

async function processPlan(plan) {
  const summary = {
    attempted: 0,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    byKind: { pal: 0, item: 0, structure: 0 },
  };
  const files = [];
  const failed = [];
  let cursor = 0;

  async function worker() {
    while (cursor < plan.length) {
      const idx = cursor++;
      const job = plan[idx];
      const abs = path.join(root, job.localFile);
      summary.attempted += 1;

      if (isNonEmptyFile(abs)) {
        summary.skipped += 1;
        if (summary.byKind[job.kind] != null) summary.byKind[job.kind] += 1;
        files.push(...expandJobFiles(job, "skipped", null));
        continue;
      }

      if (dryRun) {
        files.push(
          ...expandJobFiles(job, "planned", job.remoteUrls[0] || null, {
            urls: job.remoteUrls.length,
          })
        );
        continue;
      }

      let ok = false;
      let used = null;
      let lastErr = null;
      for (const url of job.remoteUrls) {
        try {
          await downloadOne(url, abs);
          ok = true;
          used = url;
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (ok) {
        summary.downloaded += 1;
        if (summary.byKind[job.kind] != null) summary.byKind[job.kind] += 1;
        files.push(...expandJobFiles(job, "downloaded", used));
      } else {
        summary.failed += 1;
        failed.push({
          kind: job.kind,
          code: job.code,
          icon_name: job.icon_name,
          file: job.localFile.replace(/\\/g, "/"),
          tried: job.remoteUrls.slice(0, 8),
          error: lastErr ? String(lastErr.message || lastErr) : "unknown",
        });
        files.push(...expandJobFiles(job, "failed", null));
      }

      await delay(40);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, plan.length)) },
    () => worker()
  );
  await Promise.all(workers);
  return { summary, files, failed };
}

function printPlanStats(plan) {
  const counts = { pal: 0, item: 0, structure: 0 };
  for (const j of plan) counts[j.kind] = (counts[j.kind] || 0) + 1;
  log("download plan:", {
    total: plan.length,
    ...counts,
    concurrency,
    dryRun,
  });
  const samples = { pal: [], item: [], structure: [] };
  for (const j of plan) {
    if (samples[j.kind] && samples[j.kind].length < 3) {
      samples[j.kind].push({
        code: j.code,
        icon_name: j.icon_name,
        file: j.localFile,
        url0: j.remoteUrls[0],
        urls: j.remoteUrls.length,
      });
    }
  }
  log("samples:", JSON.stringify(samples, null, 2));
}

async function main() {
  if (!fs.existsSync(path.join(vendorDir, "catalog.json"))) {
    console.error(
      "No vendor data. Run: npm run data:import\nExpected data/vendor/catalog.json"
    );
    process.exit(1);
  }

  ensureDir(path.join(iconsDir, "items"));
  ensureDir(path.join(iconsDir, "structures"));

  const cdnIndex = loadOrBuildCdnIndex();
  const plan = buildPlan(cdnIndex);
  printPlanStats(plan);

  const { summary, files, failed } = await processPlan(plan);

  const present = files.filter(
    (f) => f.status === "skipped" || f.status === "downloaded"
  );
  const manifest = {
    built_at: new Date().toISOString(),
    dry_run: dryRun,
    exports_dir: fs.existsSync(exportsDir) ? exportsDir : null,
    counts: {
      pals: present.filter((f) => f.kind === "pal").length,
      items: present.filter((f) => f.kind === "item").length,
      structures: present.filter((f) => f.kind === "structure").length,
      failed: summary.failed,
      planned: plan.length,
      downloaded: summary.downloaded,
      skipped: summary.skipped,
    },
    summary,
    files: present.map((f) => ({
      kind: f.kind,
      code: f.code,
      icon_name: f.icon_name,
      id: f.id,
      slug: f.slug,
      file: f.file,
      source: f.source,
      status: f.status,
    })),
    failed,
  };

  if (!dryRun) {
    ensureDir(path.dirname(manifestPath));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    log("wrote", path.relative(root, manifestPath));
  } else {
    log("dry-run: manifest not written");
  }

  log("summary:", summary);
  if (failed.length) {
    log("failed sample:", JSON.stringify(failed.slice(0, 12), null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
