const { escapeHtml } = require("./escape");

const SHARED_STYLES = `
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  .elem {
    display: inline-block; font-size: 10px; font-weight: 600; padding: 0.1rem 0.4rem;
    border-radius: 999px; line-height: 1.4; color: #fff;
  }
  .elem-Neutral { background: #6b7280; }
  .elem-Fire { background: #dc2626; }
  .elem-Water { background: #2563eb; }
  .elem-Grass { background: #16a34a; }
  .elem-Electric { background: #ca8a04; color: #111; }
  .elem-Ice { background: #0ea5e9; }
  .elem-Ground { background: #a16207; }
  .elem-Dark { background: #4c1d95; }
  .elem-Dragon { background: #7c3aed; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: 0.5rem; }
  .stat-card { background: #0c0e12; border: 1px solid #252a33; border-radius: 0.5rem; padding: 0.6rem 0.75rem; }
  .stat-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #8b919a; }
  .stat-card .value { font-size: 0.95rem; font-weight: 600; margin-top: 0.15rem; }
`;

function tailwindConfigScript() {
  return `<script>
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
  </script>`;
}

function renderNav(prefix, active) {
  const link = (href, label, id) => {
    const abs = prefix + href.replace(/^\//, "");
    const cls =
      active === id
        ? "text-pal-text border-b-2 border-pal-accent"
        : "text-pal-muted hover:text-pal-text";
    return (
      '<a class="px-2 py-3 text-sm ' +
      cls +
      '" href="' +
      escapeHtml(abs) +
      '">' +
      escapeHtml(label) +
      "</a>"
    );
  };
  return (
    '<nav class="flex flex-wrap items-stretch gap-1" aria-label="Primary">' +
    link("index.html", "Home", "home") +
    link("pal/anubis/", "Sample pal", "pal") +
    "</nav>"
  );
}

function renderFooter(siteMeta, prefix) {
  const v = siteMeta || {};
  const version = v.data_version || "unknown";
  const validation = v.validation_status || "unknown";
  const imported = v.imported_at ? String(v.imported_at).slice(0, 19).replace("T", " ") + "Z" : "—";
  return (
    '<footer class="border-t border-pal-border mt-auto">' +
    '<div class="px-4 py-4 text-xs text-pal-muted flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">' +
    "<div>" +
    'Game data: <a class="text-pal-accent underline underline-offset-2" href="https://paldb.cc" target="_blank" rel="noopener noreferrer">paldb.cc</a>' +
    " · Not affiliated with Pocketpair" +
    "</div>" +
    '<div class="text-pal-muted/90">' +
    "Data <span class=\"text-pal-text\">" +
    escapeHtml(version) +
    "</span>" +
    " · validate <span class=\"text-pal-text\">" +
    escapeHtml(validation) +
    "</span>" +
    " · imported <span class=\"text-pal-text\">" +
    escapeHtml(imported) +
    "</span>" +
    "</div>" +
    "</div></footer>"
  );
}

function shell({
  title,
  description,
  activeNav,
  body,
  prefix = "",
  siteMeta = null,
  headExtra = "",
}) {
  const desc = description
    ? '<meta name="description" content="' + escapeHtml(description) + '" />'
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  ${desc}
  <script src="https://cdn.tailwindcss.com"></script>
  ${tailwindConfigScript()}
  <style>${SHARED_STYLES}</style>
  ${headExtra}
</head>
<body class="min-h-screen bg-pal-bg text-pal-text antialiased flex flex-col">
  <header class="border-b border-pal-border bg-pal-panel sticky top-0 z-20">
    <div class="px-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-0 min-h-[3rem]">
      <a href="${escapeHtml(prefix)}index.html" class="font-bold tracking-tight text-lg py-2">Palhead</a>
      ${renderNav(prefix, activeNav)}
    </div>
  </header>
  ${body}
  ${renderFooter(siteMeta, prefix)}
</body>
</html>
`;
}

module.exports = { shell, SHARED_STYLES };
