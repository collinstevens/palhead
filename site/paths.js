function pathSegment(slug) {
  return String(slug || "unknown")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase() || "unknown";
}

function palHref(slug) {
  return "/pal/" + pathSegment(slug) + "/";
}

function skillPartnerHref(slug) {
  return "/skills/partner/" + pathSegment(slug) + "/";
}

function skillPassiveHref(slug) {
  return "/skills/passive/" + pathSegment(slug) + "/";
}

function skillActiveHref(slug) {
  return "/skills/active/" + pathSegment(slug) + "/";
}

function itemHref(slug) {
  return "/item/" + pathSegment(slug) + "/";
}

function structureHref(slug) {
  return "/structure/" + pathSegment(slug) + "/";
}

function hrefToFs(href, distRoot) {
  const clean = href.replace(/^\//, "").replace(/\/$/, "");
  if (!clean) return require("path").join(distRoot, "index.html");
  return require("path").join(distRoot, clean, "index.html");
}

function depthPrefix(href) {
  const clean = href.replace(/^\//, "").replace(/\/$/, "");
  if (!clean) return "";
  const depth = clean.split("/").length;
  return "../".repeat(depth);
}

module.exports = {
  pathSegment,
  palHref,
  skillPartnerHref,
  skillPassiveHref,
  skillActiveHref,
  itemHref,
  structureHref,
  hrefToFs,
  depthPrefix,
};
