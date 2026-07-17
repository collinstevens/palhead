const { escapeHtml } = require("./escape");

function emptyState({
  icon = "—",
  title = "Nothing here yet",
  body = "",
  ctaHref = null,
  ctaLabel = null,
  compact = false,
}) {
  const pad = compact ? "py-6 px-4" : "py-10 px-6";
  const cta =
    ctaHref && ctaLabel
      ? '<a class="wh-btn wh-btn-ghost mt-3 inline-flex" href="' +
        escapeHtml(ctaHref) +
        '">' +
        escapeHtml(ctaLabel) +
        "</a>"
      : "";
  return (
    '<div class="wh-empty ' +
    pad +
    '">' +
    '<div class="wh-empty-icon" aria-hidden="true">' +
    escapeHtml(icon) +
    "</div>" +
    '<div class="wh-empty-title">' +
    escapeHtml(title) +
    "</div>" +
    (body
      ? '<p class="wh-empty-body">' + escapeHtml(body) + "</p>"
      : "") +
    cta +
    "</div>"
  );
}

function emptyFeedRows(n = 3) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push(
      '<li class="wh-feed-item is-empty">' +
        '<div class="wh-feed-thumb">—</div>' +
        '<div class="min-w-0 flex-1">' +
        '<div class="wh-feed-cat">Coming soon</div>' +
        '<div class="wh-feed-title">Reserved slot</div>' +
        '<div class="wh-feed-desc">This row will hold a headline, blurb, and date when content ships.</div>' +
        "</div></li>"
    );
  }
  return '<ul class="wh-feed-list">' + rows.join("") + "</ul>";
}

function panel({ title, meta, body, id = null }) {
  return (
    '<section class="wh-panel"' +
    (id ? ' id="' + escapeHtml(id) + '"' : "") +
    ">" +
    '<div class="wh-panel-head">' +
    "<h2>" +
    escapeHtml(title) +
    "</h2>" +
    (meta ? '<span class="wh-panel-meta">' + escapeHtml(meta) + "</span>" : "") +
    "</div>" +
    '<div class="wh-panel-body">' +
    body +
    "</div></section>"
  );
}

module.exports = { emptyState, emptyFeedRows, panel };
