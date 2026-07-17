const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error(
    "dist/index.html missing. Run: npm run data:normalize && node build.js"
  );
  process.exit(1);
}

const iconsSrc = path.join(root, "icons");
const iconsDest = path.join(dist, "icons");
if (fs.existsSync(iconsSrc)) {
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const from = path.join(src, entry.name);
      const to = path.join(dest, entry.name);
      if (entry.isDirectory()) copyDir(from, to);
      else fs.copyFileSync(from, to);
    }
  }
  copyDir(iconsSrc, iconsDest);
}

console.log("prepared dist/ (icons ensured)");
