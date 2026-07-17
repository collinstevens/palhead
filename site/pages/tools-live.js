const { escapeHtml } = require("../escape");
const { shell } = require("../shell");
const { depthPrefix } = require("../paths");
const { hubPage } = require("./catalog");

function toolsHubPage({ siteMeta }) {
  return hubPage({
    title: "Tools",
    blurb: "Calculators and browsers on the same normalized data as the encyclopedia.",
    path: "/tools/",
    activeNav: "tools",
    siteMeta,
    crumbs: [{ label: "Tools" }],
    cards: [
      {
        label: "Work suitability",
        blurb: "Filter pals by work levels and elements.",
        path: "/tools/work-suitability/",
        count: siteMeta.counts?.pals_dex,
      },
      {
        label: "Breeding calculator",
        blurb: "CombiRank heuristic — not a full parent matrix.",
        path: "/tools/breeding/",
        count: siteMeta.counts?.breeding_pals,
      },
      {
        label: "Team builder",
        blurb: "Party of 5 — element and work coverage.",
        path: "/tools/team-builder/",
        count: siteMeta.counts?.pals_dex,
      },
      {
        label: "Drop finder",
        blurb: "Where does item X drop? Paginated farm browser.",
        path: "/tools/drop-finder/",
        count: siteMeta.counts?.drop_rows,
      },
    ],
  });
}

function breedingPage({ siteMeta, breeding }) {
  const path = "/tools/breeding/";
  const prefix = depthPrefix(path);
  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}tools/">Tools</a>
      <span> / </span>
      <span style="color:#c5ccda">Breeding</span>
    </div>
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="wh-h1">Breeding calculator</h1>
        <p class="wh-lede">Approximate child suggestions from CombiRank. <strong>No full parent×parent matrix</strong> in offline paldb data — treat results as heuristics, not exact game outcomes.</p>
      </div>
      <span class="wh-chip wh-chip-live">limited</span>
    </div>
    <section class="wh-panel" style="margin:0">
      <div class="wh-panel-head"><h2>Parents</h2></div>
      <div class="wh-panel-body">
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Parent A</label>
            <input id="parentA" list="palList" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" placeholder="Search pal…" />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Parent B</label>
            <input id="parentB" list="palList" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" placeholder="Search pal…" />
          </div>
        </div>
        <datalist id="palList"></datalist>
        <p class="text-xs text-pal-muted mt-2" id="rankNote">Select two breedable pals to estimate nearby CombiRank children.</p>
      </div>
    </section>
    <section class="wh-panel" style="margin:0">
      <div class="wh-panel-head"><h2>Possible children (approx.)</h2><span class="wh-panel-meta" id="resultMeta">0</span></div>
      <div class="wh-panel-body">
        <div class="overflow-auto max-h-[28rem]">
          <table class="w-full text-sm"><thead><tr>
            <th class="px-2 py-1 text-left text-[10px] uppercase text-pal-muted">Pal</th>
            <th class="px-2 py-1 text-center text-[10px] uppercase text-pal-muted">CombiRank</th>
            <th class="px-2 py-1 text-center text-[10px] uppercase text-pal-muted">Δ rank</th>
            <th class="px-2 py-1 text-left text-[10px] uppercase text-pal-muted">Elements</th>
          </tr></thead><tbody id="tbody"></tbody></table>
        </div>
      </div>
    </section>
  </main>`;

  const script = `
<script>
const ASSET_PREFIX = ${JSON.stringify(prefix)};
const PALS = ${JSON.stringify(breeding.pals || [])};
const byName = new Map(PALS.map(p => [p.name.toLowerCase(), p]));
const list = document.getElementById("palList");
list.innerHTML = PALS.map(p => '<option value="' + p.name.replace(/"/g,'&quot;') + '"></option>').join("");
function resolve(input){ return byName.get(String(input||"").trim().toLowerCase()) || null; }
function esc(s){ return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c])); }
function render(){
  const a = resolve(document.getElementById("parentA").value);
  const b = resolve(document.getElementById("parentB").value);
  const tbody = document.getElementById("tbody");
  const note = document.getElementById("rankNote");
  if (!a || !b) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-pal-muted">Pick two parents.</td></tr>';
    document.getElementById("resultMeta").textContent = "0";
    return;
  }
  const target = Math.round((Number(a.combi_rank)+Number(b.combi_rank))/2);
  note.textContent = a.name + " (" + a.combi_rank + ") × " + b.name + " (" + b.combi_rank + ") → mid rank ~" + target + ". Showing nearest breedable pals by CombiRank.";
  const ranked = PALS
    .filter(p => p.slug !== a.slug && p.slug !== b.slug)
    .map(p => ({...p, delta: Math.abs(Number(p.combi_rank)-target)}))
    .sort((x,y)=>x.delta-y.delta || x.combi_rank-y.combi_rank)
    .slice(0, 25);
  document.getElementById("resultMeta").textContent = String(ranked.length);
  tbody.innerHTML = ranked.map(p => {
    const href = p.path ? ASSET_PREFIX + p.path.replace(/^\\//,"") : null;
    const name = href ? '<a href="'+esc(href)+'">'+esc(p.name)+'</a>' : esc(p.name);
    const els = (p.elements||[]).map(e=>'<span class="elem elem-'+esc(e)+'">'+esc(e)+'</span>').join(" ");
    return '<tr class="border-t border-pal-border/40"><td class="px-2 py-1.5 font-semibold">'+name+'</td><td class="px-2 py-1.5 text-center tabular-nums">'+esc(p.combi_rank)+'</td><td class="px-2 py-1.5 text-center tabular-nums text-pal-muted">'+esc(p.delta)+'</td><td class="px-2 py-1.5">'+els+'</td></tr>';
  }).join("");
}
document.getElementById("parentA").addEventListener("input", render);
document.getElementById("parentB").addEventListener("input", render);
render();
</script>`;

  return shell({
    title: "Breeding calculator — Palhead",
    description: "CombiRank-based breeding heuristic for Palworld.",
    activeNav: "tools",
    body,
    prefix,
    siteMeta,
    bodyScripts: script,
  });
}

function teamBuilderPage({ siteMeta, pals }) {
  const path = "/tools/team-builder/";
  const prefix = depthPrefix(path);
  const dex = (pals || []).filter((p) => p.is_dex);
  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}tools/">Tools</a>
      <span> / </span>
      <span style="color:#c5ccda">Team builder</span>
    </div>
    <h1 class="wh-h1">Team builder</h1>
    <p class="wh-lede">Pick up to 5 pals. See element coverage and total work levels.</p>
    <section class="wh-panel" style="margin:0">
      <div class="wh-panel-head"><h2>Add pal</h2></div>
      <div class="wh-panel-body flex flex-wrap gap-2 items-end">
        <div class="flex-1 min-w-[12rem]">
          <input id="pick" list="dexList" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" placeholder="Dex pal name…" />
          <datalist id="dexList"></datalist>
        </div>
        <button type="button" id="addBtn" class="wh-btn wh-btn-primary">Add</button>
        <button type="button" id="clearBtn" class="wh-btn wh-btn-ghost">Clear</button>
      </div>
    </section>
    <section class="wh-panel" style="margin:0">
      <div class="wh-panel-head"><h2>Party</h2><span class="wh-panel-meta" id="partyCount">0 / 5</span></div>
      <div class="wh-panel-body" id="party"></div>
    </section>
    <section class="wh-panel" style="margin:0">
      <div class="wh-panel-head"><h2>Coverage</h2></div>
      <div class="wh-panel-body">
        <div class="mb-2" id="elements"></div>
        <div id="work" class="text-sm"></div>
      </div>
    </section>
  </main>`;

  const script = `
<script>
const ASSET_PREFIX = ${JSON.stringify(prefix)};
const PALS = ${JSON.stringify(dex.map(p=>({name:p.name,slug:p.path_segment||p.slug,path:p.path,elements:p.elements,work:p.work,icon:p.icon})))};
const byName = new Map(PALS.map(p=>[p.name.toLowerCase(),p]));
document.getElementById("dexList").innerHTML = PALS.map(p=>'<option value="'+p.name.replace(/"/g,'&quot;')+'"></option>').join("");
const party = [];
function esc(s){ return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c])); }
function render(){
  document.getElementById("partyCount").textContent = party.length + " / 5";
  document.getElementById("party").innerHTML = party.length ? party.map((p,i)=>
    '<div class="flex items-center gap-2 py-1 border-b border-pal-border/40">'+
    (p.icon?'<img src="'+esc(ASSET_PREFIX+'icons/'+p.icon)+'" width="28" height="28" alt="" style="border-radius:2px"/>':'')+
    '<a class="font-semibold" href="'+esc(ASSET_PREFIX+p.path.replace(/^\\//,""))+'">'+esc(p.name)+'</a>'+
    '<span class="text-xs">'+(p.elements||[]).map(e=>'<span class="elem elem-'+esc(e)+'">'+esc(e)+'</span>').join(" ")+'</span>'+
    '<button type="button" data-i="'+i+'" class="rm wh-btn wh-btn-ghost ml-auto" style="padding:2px 8px">Remove</button></div>'
  ).join("") : '<p class="text-sm text-pal-muted">No pals in party yet.</p>';
  document.querySelectorAll(".rm").forEach(b=>b.addEventListener("click",()=>{ party.splice(+b.getAttribute("data-i"),1); render(); }));
  const els = new Set();
  const work = {};
  for (const p of party) {
    for (const e of p.elements||[]) els.add(e);
    for (const [k,v] of Object.entries(p.work||{})) work[k]=(work[k]||0)+Number(v||0);
  }
  document.getElementById("elements").innerHTML = els.size
    ? [...els].map(e=>'<span class="elem elem-'+esc(e)+'">'+esc(e)+'</span>').join(" ")
    : '<span class="text-pal-muted text-sm">No elements yet</span>';
  document.getElementById("work").innerHTML = Object.keys(work).length
    ? Object.entries(work).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="flex justify-between border-b border-pal-border/30 py-0.5"><span>'+esc(k)+'</span><span class="tabular-nums font-semibold">'+v+'</span></div>').join("")
    : '<span class="text-pal-muted">No work totals yet</span>';
}
document.getElementById("addBtn").addEventListener("click", ()=>{
  if (party.length>=5) return;
  const p = byName.get(document.getElementById("pick").value.trim().toLowerCase());
  if (!p) return;
  if (party.some(x=>x.slug===p.slug)) return;
  party.push(p);
  document.getElementById("pick").value="";
  render();
});
document.getElementById("clearBtn").addEventListener("click", ()=>{ party.length=0; render(); });
render();
</script>`;

  return shell({
    title: "Team builder — Palhead",
    description: "Build a party of 5 pals and review coverage.",
    activeNav: "tools",
    body,
    prefix,
    siteMeta,
    bodyScripts: script,
  });
}

function dropFinderPage({ siteMeta }) {
  const path = "/tools/drop-finder/";
  const prefix = depthPrefix(path);
  const body = `
  <main class="wh-page wh-page-pad flex flex-col gap-2">
    <div class="wh-breadcrumb">
      <a href="${escapeHtml(prefix)}index.html">Home</a>
      <span> / </span>
      <a href="${escapeHtml(prefix)}tools/">Tools</a>
      <span> / </span>
      <span style="color:#c5ccda">Drop finder</span>
    </div>
    <h1 class="wh-h1">Drop finder</h1>
    <p class="wh-lede">Search ${escapeHtml(String(siteMeta.counts?.drop_rows || "12k+"))} drop rows by item or source. Paginated for performance.</p>
    <section class="wh-panel" style="margin-bottom:8px">
      <div class="wh-panel-head"><h2>Filters</h2></div>
      <div class="wh-panel-body">
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex-1 min-w-[12rem]">
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Search item / source</label>
            <input id="search" type="search" class="w-full bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wide text-pal-muted mb-1 font-bold">Source type</label>
            <select id="typeFilter" class="bg-pal-bg border border-pal-border rounded-sm px-2 py-1.5 text-sm"><option value="">Any</option></select>
          </div>
          <button type="button" id="resetFilters" class="wh-btn wh-btn-ghost">Reset</button>
        </div>
        <div class="text-xs text-pal-muted mt-2">
          Showing <span id="resultCount" class="font-bold text-pal-text">0</span>
          · Page <span id="pageInfo">1</span>
          <button type="button" id="pagePrev" class="wh-btn wh-btn-ghost" style="padding:2px 8px;margin-left:8px">Prev</button>
          <button type="button" id="pageNext" class="wh-btn wh-btn-ghost" style="padding:2px 8px">Next</button>
          <span id="loadState" class="ml-2">Loading drop data…</span>
        </div>
      </div>
    </section>
    <section class="wh-panel flex-1" style="margin:0">
      <div class="overflow-auto max-h-[calc(100vh-14rem)]">
        <table class="w-full text-sm"><thead class="sticky top-0" style="background:var(--wh-panel)"><tr>
          <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Item</th>
          <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Source</th>
          <th class="px-3 py-2 text-left text-[11px] uppercase text-pal-muted">Type</th>
          <th class="px-3 py-2 text-center text-[11px] uppercase text-pal-muted">Qty</th>
          <th class="px-3 py-2 text-center text-[11px] uppercase text-pal-muted">Rate</th>
        </tr></thead><tbody id="tbody"></tbody></table>
      </div>
    </section>
  </main>`;

  const script = `
<script>
const ASSET_PREFIX = ${JSON.stringify(prefix)};
const state = { search:"", type:"", page:0, pageSize:80, rows:[] };
function esc(s){ return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c])); }
function filtered(){
  const q = state.search.toLowerCase();
  return state.rows.filter(r => {
    if (state.type && r.source_type !== state.type) return false;
    if (!q) return true;
    return (r.item_name+" "+r.source_name+" "+r.source_type).toLowerCase().includes(q);
  });
}
function render(){
  const all = filtered();
  const pages = Math.max(1, Math.ceil(all.length/state.pageSize));
  if (state.page>=pages) state.page=pages-1;
  const slice = all.slice(state.page*state.pageSize, (state.page+1)*state.pageSize);
  document.getElementById("resultCount").textContent = String(all.length);
  document.getElementById("pageInfo").textContent = (state.page+1)+" / "+pages;
  document.getElementById("tbody").innerHTML = slice.map(r=>{
    const item = r.item_path ? '<a href="'+esc(ASSET_PREFIX+r.item_path.replace(/^\\//,""))+'">'+esc(r.item_name)+'</a>' : esc(r.item_name);
    return '<tr class="border-t border-pal-border/40"><td class="px-3 py-1.5">'+item+'</td><td class="px-3 py-1.5 text-sm">'+esc(r.source_name)+'</td><td class="px-3 py-1.5 text-xs text-pal-muted">'+esc(r.source_type)+'</td><td class="px-3 py-1.5 text-center text-xs">'+esc(r.quantity||"—")+'</td><td class="px-3 py-1.5 text-center text-xs">'+(r.rate!=null?esc(r.rate)+"%":"—")+'</td></tr>';
  }).join("") || '<tr><td colspan="5" class="px-4 py-10 text-center text-pal-muted">No drops match.</td></tr>';
}
fetch(ASSET_PREFIX + "data/drops-browser.json").then(r=>r.json()).then(data=>{
  state.rows = data.rows || [];
  const types = [...new Set(state.rows.map(r=>r.source_type).filter(Boolean))].sort();
  document.getElementById("typeFilter").innerHTML = '<option value="">Any</option>'+types.map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join("");
  document.getElementById("loadState").textContent = state.rows.length.toLocaleString()+" rows loaded";
  render();
}).catch(()=>{ document.getElementById("loadState").textContent = "Failed to load drop data"; });
document.getElementById("search").addEventListener("input", e=>{ state.search=e.target.value.trim(); state.page=0; render(); });
document.getElementById("typeFilter").addEventListener("change", e=>{ state.type=e.target.value; state.page=0; render(); });
document.getElementById("resetFilters").addEventListener("click", ()=>{ state.search=""; state.type=""; state.page=0; document.getElementById("search").value=""; document.getElementById("typeFilter").value=""; render(); });
document.getElementById("pagePrev").addEventListener("click", ()=>{ if(state.page>0){state.page--; render();} });
document.getElementById("pageNext").addEventListener("click", ()=>{ state.page++; render(); });
</script>`;

  return shell({
    title: "Drop finder — Palhead",
    description: "Find where items drop in Palworld.",
    activeNav: "tools",
    body,
    prefix,
    siteMeta,
    bodyScripts: script,
  });
}

module.exports = {
  toolsHubPage,
  breedingPage,
  teamBuilderPage,
  dropFinderPage,
};
