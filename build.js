const fs = require("fs");
const path = require("path");

const root = __dirname;
const vendorMetaPath = path.join(root, "data", "vendor", "catalog.json");

function readVendorMeta() {
  try {
    if (!fs.existsSync(vendorMetaPath)) return null;
    return JSON.parse(fs.readFileSync(vendorMetaPath, "utf8"));
  } catch {
    return null;
  }
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function dataVersionLabel(meta) {
  if (!meta) return "no vendor data yet";
  const when = meta.generated_at || meta.generatedAt || null;
  const tables = meta.table_count ?? meta.tableCount ?? null;
  const parts = [];
  if (when) parts.push(String(when).slice(0, 10));
  if (tables != null) parts.push(tables + " tables");
  return parts.length ? parts.join(" · ") : "vendor present";
}

const meta = readVendorMeta();
const versionText = dataVersionLabel(meta);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Palhead — rebuild in progress</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            pal: {
              bg: "#0c0e12",
              panel: "#14181f",
              border: "#252a33",
              text: "#e8eaed",
              muted: "#8b919a",
              accent: "#5b9fd4",
            },
          },
        },
      },
    };
  </script>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  </style>
</head>
<body class="min-h-screen bg-pal-bg text-pal-text antialiased flex flex-col">
  <header class="border-b border-pal-border bg-pal-panel">
    <div class="px-4 py-3 flex items-center justify-between gap-4">
      <a href="index.html" class="font-bold tracking-tight text-lg">Palhead</a>
      <span class="text-xs text-pal-muted">Phase 0 · foundations</span>
    </div>
  </header>
  <main class="flex-1 px-4 py-10 max-w-2xl">
    <h1 class="text-2xl font-semibold mb-3">Site rebuild in progress</h1>
    <p class="text-pal-muted text-sm leading-relaxed mb-6">
      Palhead is being rebuilt as a multi-page static database (SSG + vanilla JS),
      with <a class="text-pal-accent underline underline-offset-2" href="https://paldb.cc" target="_blank" rel="noopener noreferrer">paldb.cc</a>
      as the game-data source of truth. No React/Next/SPA.
    </p>
    <ul class="text-sm space-y-2 text-pal-muted mb-8">
      <li><span class="text-pal-text">Data:</span> import from <code class="text-xs bg-pal-panel px-1 rounded">paldb-cc-exports</code> → <code class="text-xs bg-pal-panel px-1 rounded">data/vendor/</code></li>
      <li><span class="text-pal-text">Normalize:</span> <code class="text-xs bg-pal-panel px-1 rounded">data/normalized/</code></li>
      <li><span class="text-pal-text">Plan:</span> <code class="text-xs bg-pal-panel px-1 rounded">docs/SITE-REBUILD.md</code></li>
    </ul>
    <p class="text-xs text-pal-muted">Vendor data: <span class="text-pal-text">${escapeHtml(versionText)}</span></p>
  </main>
  <footer class="border-t border-pal-border px-4 py-4 text-xs text-pal-muted">
    Game data source of truth:
    <a class="text-pal-accent underline underline-offset-2" href="https://paldb.cc" target="_blank" rel="noopener noreferrer">paldb.cc</a>
    · Not affiliated with Pocketpair
  </footer>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "index.html"), html);
console.log("wrote index.html", fs.statSync(path.join(root, "index.html")).size, "bytes");
console.log("vendor:", versionText);
