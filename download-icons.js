const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const OUT_DIR = path.join(__dirname, "icons");
const data = require("./pals_data.json");

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "Palhead/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchText(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`GET ${url} -> ${res.statusCode}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    lib
      .get(url, { headers: { "User-Agent": "Palhead/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(dest, () => {});
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`GET ${url} -> ${res.statusCode}`));
          res.resume();
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

function headOk(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.request(
      url,
      { method: "HEAD", headers: { "User-Agent": "Palhead/1.0" } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return headOk(res.headers.location).then(resolve);
        }
        resolve(res.statusCode === 200);
        res.resume();
      }
    );
    req.on("error", () => resolve(false));
    req.end();
  });
}

function iconCandidates(id) {
  const base = id;
  const variants = new Set([
    base,
    base.replace(/^./, (c) => c.toUpperCase()),
  ]);

  // Sheepball -> SheepBall style: capital after lowercase runs before capitals? better heuristics:
  // Insert capital before each capital and known suffixes already have underscores.
  // Common: SheepBall from Sheepball
  if (/^[A-Z][a-z]+[A-Z]?[a-z]*$/.test(base) || true) {
    // Try converting trailing word segments
    // Sheepball -> SheepBall by capitalizing known second parts... use camelCase from lower
  }

  // Known case fixes from paldb naming (Unreal T_ prefix + original asset name)
  // Build: capitalize first letter of each "word" where words split on _ and also try
  // capitalizing internal transitions for compound names without underscore.

  const parts = base.split("_");
  const titleParts = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  variants.add(titleParts.join("_"));

  // Sheepball -> SheepBall: capitalize every letter after a lowercase letter sequence at end
  // Heuristic: if all after first capital is lowercase (Sheepball), try SheepBall by finding animal-like suffixes
  // Better approach: also try the id as-is and PascalCase with internal caps from common paldb pattern.

  // Additional: CamelCase from Snake: already have underscores
  // For Sheepball specifically: try capitalizing mid-word using dictionary of second halves is hard.

  // Generate: capitalize first letter, and try capitalizing first letter of second "syllable" by
  // looking for known endings: Ball, Cat, Pal, Fox, etc. — too fragile.

  // From paldb HTML scrape we should get exact names — candidates used as fallback only.
  variants.add(base);

  // Sheepball -> SheepBall via: find transition points where a capital could go
  // Capitalize each letter position after char 1 that starts a likely word
  for (let i = 2; i < base.length - 1; i++) {
    if (base[i] === base[i].toLowerCase() && /[a-z]/.test(base[i])) {
      const v = base.slice(0, i) + base[i].toUpperCase() + base.slice(i + 1);
      variants.add(v);
    }
  }

  return [...variants];
}

function cdnUrl(assetName) {
  return `https://cdn.paldb.cc/image/Pal/Texture/PalIcon/Normal/${assetName}`;
}

async function scrapePaldbIcons() {
  console.log("Fetching paldb pals page...");
  const html = await fetchText("https://paldb.cc/en/Pals");
  fs.writeFileSync(path.join(__dirname, "pals_page.html"), html);

  // Map display name / link slug -> icon asset
  // Pattern: .../T_SheepBall_icon_normal.webp ... #1 [Lamball](Lamball)
  const icons = [...html.matchAll(/T_[A-Za-z0-9_]+_icon_normal\.webp/g)].map((m) => m[0]);
  const uniqueIcons = [...new Set(icons)];
  console.log("Found icon refs on page:", uniqueIcons.length);

  // Build map from internal-ish name (without T_ and _icon_normal.webp) to filename
  const byInternal = new Map();
  for (const icon of uniqueIcons) {
    const internal = icon.replace(/^T_/, "").replace(/_icon_normal\.webp$/, "");
    byInternal.set(internal.toLowerCase(), icon);
    byInternal.set(internal, icon);
  }

  // Also parse pairs near links if possible
  // e.g. T_SheepBall_icon_normal.webp ... Lamball
  const pairs = [];
  const re = /T_([A-Za-z0-9_]+)_icon_normal\.webp[\s\S]{0,400}?\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(html))) {
    pairs.push({ internal: m[1], name: m[2], slug: m[3], icon: `T_${m[1]}_icon_normal.webp` });
  }
  console.log("Name-icon pairs:", pairs.length);
  return { uniqueIcons, byInternal, pairs };
}

async function resolveIconForPal(pal, scrape) {
  // 1) match by display name from pairs
  const byName = scrape.pairs.find(
    (p) => p.name.toLowerCase() === pal.n.toLowerCase() || p.slug.replace(/_/g, " ").toLowerCase() === pal.n.toLowerCase()
  );
  if (byName) return byName.icon;

  // 2) match by internal id case-insensitive
  const key = pal.id;
  if (scrape.byInternal.has(key)) return scrape.byInternal.get(key);
  if (scrape.byInternal.has(key.toLowerCase())) return scrape.byInternal.get(key.toLowerCase());

  // 3) try candidates against known scrape set
  for (const c of iconCandidates(key)) {
    const icon = `T_${c}_icon_normal.webp`;
    if (scrape.uniqueIcons.includes(icon)) return icon;
    const hit = scrape.byInternal.get(c) || scrape.byInternal.get(c.toLowerCase());
    if (hit) return hit;
  }

  // 4) HEAD request candidates
  for (const c of iconCandidates(key)) {
    const icon = `T_${c}_icon_normal.webp`;
    const url = cdnUrl(icon);
    if (await headOk(url)) return icon;
  }

  return null;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const scrape = await scrapePaldbIcons();

  const mapping = {};
  const missing = [];
  let i = 0;

  for (const pal of data.pals) {
    i++;
    process.stdout.write(`\rResolve ${i}/${data.pals.length}: ${pal.n}          `);
    const icon = await resolveIconForPal(pal, scrape);
    if (!icon) {
      missing.push(pal);
      mapping[pal.id] = null;
      continue;
    }
    mapping[pal.id] = icon;
  }
  console.log("\nResolved:", Object.values(mapping).filter(Boolean).length, "Missing:", missing.length);
  if (missing.length) {
    console.log(
      "Missing sample:",
      missing.slice(0, 20).map((p) => p.id + " " + p.n)
    );
  }

  // Download unique icons
  const unique = [...new Set(Object.values(mapping).filter(Boolean))];
  console.log("Downloading", unique.length, "unique icons...");
  let ok = 0;
  let fail = 0;
  for (const icon of unique) {
    const dest = path.join(OUT_DIR, icon);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      ok++;
      continue;
    }
    try {
      await download(cdnUrl(icon), dest);
      ok++;
      process.stdout.write(`\rDownloaded ${ok}/${unique.length}`);
    } catch (e) {
      fail++;
      console.error("\nFail", icon, e.message);
    }
  }
  console.log("\nDownload done. ok=", ok, "fail=", fail);

  // Attach icon filename to pals data
  const next = {
    ...data,
    pals: data.pals.map((p) => ({
      ...p,
      img: mapping[p.id] || null,
    })),
  };
  fs.writeFileSync(path.join(__dirname, "pals_data.json"), JSON.stringify(next));
  fs.writeFileSync(path.join(__dirname, "icon_map.json"), JSON.stringify(mapping, null, 2));
  console.log("Updated pals_data.json with img fields");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
