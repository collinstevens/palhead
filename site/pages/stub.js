const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");
const { emptyState, emptyFeedRows, panel } = require("../empty");

function stubPage({
  title,
  heading,
  path,
  activeNav,
  siteMeta,
  crumbs = [],
  body = "",
  feed = false,
  related = [],
}) {
  const href = path.endsWith("/") ? path : path + "/";
  const prefix = depthPrefix(href);

  const crumbHtml =
    '<div class="wh-breadcrumb">' +
    '<a href="' +
    escapeHtml(prefix + "index.html") +
    '">Home</a>' +
    crumbs
      .map((c) => {
        if (c.href) {
          return (
            ' <span>/</span> <a href="' +
            escapeHtml(prefix + c.href.replace(/^\//, "")) +
            '">' +
            escapeHtml(c.label) +
            "</a>"
          );
        }
        return (
          ' <span>/</span> <span style="color:#c5ccda">' +
          escapeHtml(c.label) +
          "</span>"
        );
      })
      .join("") +
    "</div>";

  const relatedHtml =
    related.length > 0
      ? panel({
          title: "Related",
          meta: "Live or reserved",
          body:
            '<ul class="wh-quick-list">' +
            related
              .map((r) => {
                if (r.soon) {
                  return (
                    '<li><span class="soon-row"><span class="dot muted"></span>' +
                    escapeHtml(r.label) +
                    '<span class="tag">soon</span></span></li>'
                  );
                }
                return (
                  "<li><a href=\"" +
                  escapeHtml(prefix + r.href.replace(/^\//, "")) +
                  '"><span class="dot"></span>' +
                  escapeHtml(r.label) +
                  (r.tag
                    ? '<span class="tag">' + escapeHtml(r.tag) + "</span>"
                    : "") +
                  "</a></li>"
                );
              })
              .join("") +
            "</ul>",
        })
      : "";

  const mainBody =
    body ||
    emptyState({
      icon: "…",
      title: heading + " — coming soon",
      body: "This section is reserved. Layout and navigation are live so the site can grow like a full game database. No placeholder game data.",
      ctaHref: prefix + "index.html",
      ctaLabel: "Back to home",
    });

  const pageBody = `
  <main class="wh-page wh-page-pad">
    <div class="wh-stack">
    ${crumbHtml}
    <h1 class="wh-h1">${escapeHtml(heading)}</h1>
    <p class="wh-lede">${escapeHtml(
      title !== heading
        ? title
        : "Empty hub — structure only. Content ships in a later phase."
    )}</p>
        ${panel({
          title: heading,
          meta: "Empty state",
          body: mainBody,
        })}
        ${
          feed
            ? panel({
                title: "Feed",
                meta: "Reserved rows",
                body:
                  '<div class="wh-section-grid-2">' +
                  '<div class="wh-split">' +
                  emptyFeedRows(3) +
                  '</div><div class="wh-split">' +
                  emptyFeedRows(3) +
                  "</div></div>",
              })
            : ""
        }
        ${relatedHtml}
        ${panel({
          title: "Status",
          meta: "IA only",
          body:
            '<p style="font-size:12px;color:var(--wh-muted);margin:0 0 8px">This page is an intentional empty shell. Live databases: Pals, Skills, Work suitability.</p>' +
            '<a class="wh-btn wh-btn-primary" href="' +
            escapeHtml(prefix + "pals/") +
            '">Open Pals</a>',
        })}
    </div>
  </main>`;

  return shell({
    title: heading + " — Palhead",
    description: heading + " on Palhead (coming soon).",
    activeNav,
    body: pageBody,
    prefix,
    siteMeta,
  });
}

module.exports = { stubPage };
