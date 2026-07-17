function globalSearchScript(prefix) {
  return `
(function(){
  const ASSET_PREFIX = ${JSON.stringify(prefix)};
  let entries = null;
  let loaded = false;
  const box = document.getElementById("globalSearch");
  const input = document.getElementById("globalSearchInput");
  const results = document.getElementById("globalSearchResults");
  if (!box || !input || !results) return;

  function esc(s){ return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c])); }

  function ensureLoaded(){
    if (loaded) return Promise.resolve();
    loaded = true;
    return fetch(ASSET_PREFIX + "data/search-index.json")
      .then(r => r.json())
      .then(data => { entries = data.entries || []; })
      .catch(() => { entries = []; });
  }

  function render(q){
    if (!q || q.length < 2) {
      results.innerHTML = "";
      results.hidden = true;
      return;
    }
    const qq = q.toLowerCase();
    const hits = (entries || []).filter(e => (e.name||"").toLowerCase().includes(qq)).slice(0, 12);
    if (!hits.length) {
      results.innerHTML = '<div class="wh-search-empty">No matches</div>';
      results.hidden = false;
      return;
    }
    results.innerHTML = hits.map(e => {
      const href = ASSET_PREFIX + String(e.path||"").replace(/^\\//,"");
      const type = (e.type||"").replace(/^item_/, "item · ").replace(/^skill_/, "skill · ").replace(/^world_/, "world · ");
      return '<a class="wh-search-hit" href="'+esc(href)+'"><span class="wh-search-hit-name">'+esc(e.name)+'</span><span class="wh-search-hit-type">'+esc(type)+'</span></a>';
    }).join("");
    results.hidden = false;
  }

  let t = null;
  input.addEventListener("focus", () => ensureLoaded());
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => ensureLoaded().then(() => render(input.value.trim())), 80);
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
      input.select();
      ensureLoaded();
    }
    if (e.key === "Escape") {
      results.hidden = true;
      input.blur();
    }
  });
  document.addEventListener("click", (e) => {
    if (!box.contains(e.target)) results.hidden = true;
  });
})();
`;
}

module.exports = { globalSearchScript };
