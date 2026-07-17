const { escapeHtml } = require("./escape");

const SHARED_STYLES = `
  :root {
    /* Closely matched to Wowhead standard theme tokens (global.css) */
    --wh-bg: #000000;
    --wh-page: #101010;
    --wh-panel: #181818;
    --wh-panel-2: #1e1e1e;
    --wh-panel-3: #222222;
    --wh-input: #282828;
    --wh-border: #2a2a2a;
    --wh-border-hi: #444444;
    --wh-text: #e3e0d9;
    --wh-text-bright: #ffffff;
    --wh-muted: #9d9d9d;
    --wh-muted-2: #818181;
    --wh-muted-3: #bbb;
    --wh-link: #0070dd;
    --wh-link-hover: #338dff;
    --wh-accent: #a71a19;
    --wh-accent-loud: #da2020;
    --wh-accent-quiet: #8c1515;
    --wh-header: #121212;
    --wh-subnav: #161616;
    --wh-row-hover: rgba(255,255,255,0.04);
    --wh-gold: #e5cc80;
    --wh-font: "Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif;
    --wh-font-mono: "JetBrains Mono", Consolas, "Bitstream Vera Sans Mono", monospace;
  }
  * { box-sizing: border-box; }
  html { background-color: #000; }
  body {
    font-family: var(--wh-font);
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
    background: var(--wh-bg);
    color: var(--wh-text);
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4, .wh-h1, .wh-panel-head h2, .wh-feed-title, .wh-logo {
    font-family: var(--wh-font);
  }
  code, .font-mono, .wh-mono {
    font-family: var(--wh-font-mono);
  }
  a { color: var(--wh-link); text-decoration: none; }
  a:hover { color: var(--wh-link-hover); text-decoration: underline; }
  .wh-shell {
    width: 100%;
    max-width: 1280px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 16px;
    padding-right: 16px;
  }
  .wh-top {
    background: var(--wh-header);
    border-bottom: 1px solid var(--wh-border);
    position: sticky; top: 0; z-index: 40;
    width: 100%;
  }
  .wh-top-inner {
    display: flex; flex-wrap: wrap; align-items: stretch;
    min-height: 48px; gap: 0 10px;
  }
  .wh-logo {
    display: flex; align-items: center; gap: 8px;
    font-weight: 700; font-size: 18px; letter-spacing: -0.02em;
    color: var(--wh-text) !important; text-decoration: none !important;
    padding: 0 6px 0 2px; margin-right: 4px;
  }
  .wh-logo:hover { color: #fff !important; }
  .wh-logo-mark {
    width: 22px; height: 22px; border-radius: 3px;
    background: linear-gradient(180deg, var(--wh-accent-loud) 0%, var(--wh-accent) 100%);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #fff;
  }
  .wh-nav { display: flex; flex-wrap: wrap; align-items: stretch; flex: 1; min-width: 0; }
  .wh-nav-item { position: relative; display: flex; align-items: stretch; }
  .wh-nav-link {
    display: flex; align-items: center; padding: 0 11px; height: 48px;
    color: var(--wh-muted-3) !important; font-size: 12px; font-weight: 600;
    text-decoration: none !important; border-bottom: 2px solid transparent;
    white-space: nowrap;
  }
  .wh-nav-link:hover { color: var(--wh-text-bright) !important; background: rgba(255,255,255,0.04); }
  .wh-nav-item.is-active .wh-nav-link {
    color: var(--wh-text-bright) !important; border-bottom-color: var(--wh-accent-loud);
  }
  .wh-nav-item.is-soon .wh-nav-link { color: #555 !important; cursor: default; }
  .wh-dd {
    display: none; position: absolute; top: 100%; left: 0; min-width: 200px;
    background: var(--wh-panel-2); border: 1px solid var(--wh-border-hi);
    box-shadow: 0 8px 24px rgba(0,0,0,0.55); z-index: 50; padding: 4px 0;
  }
  .wh-nav-item:hover .wh-dd, .wh-nav-item:focus-within .wh-dd { display: block; }
  .wh-dd a, .wh-dd span {
    display: block; padding: 7px 12px; font-size: 12px; color: var(--wh-text) !important;
    text-decoration: none !important;
  }
  .wh-dd a:hover { background: rgba(167,26,25,0.28); color: #fff !important; }
  .wh-dd .soon { color: #666 !important; cursor: default; }
  .wh-dd .soon em { font-style: normal; font-size: 10px; margin-left: 6px; opacity: 0.8; }
  .wh-dd-sep { height: 1px; background: var(--wh-border); margin: 4px 0; }
  .wh-top-right {
    display: flex; align-items: center; gap: 8px; margin-left: auto;
    font-size: 11px; color: var(--wh-muted); flex: 1; min-width: 200px;
    max-width: 420px; justify-content: flex-end;
  }
  .wh-search-stub {
    display: flex; align-items: center; gap: 8px; width: 100%;
    background: var(--wh-input); border: 1px solid var(--wh-border);
    border-radius: 3px; padding: 7px 10px; color: var(--wh-muted-2);
    font-weight: 600; font-size: 12px;
  }
  .wh-search-stub span:nth-child(2) { flex: 1; }
  .wh-subnav-wrap {
    background: var(--wh-subnav); border-bottom: 1px solid var(--wh-border); width: 100%;
  }
  .wh-subnav {
    display: flex; flex-wrap: wrap; gap: 2px 0; min-height: 32px; align-items: center;
  }
  .wh-subnav a, .wh-subnav span {
    padding: 7px 10px; font-size: 11px; color: var(--wh-muted) !important;
    text-decoration: none !important; border-radius: 2px; font-weight: 600;
  }
  .wh-subnav a:hover { color: var(--wh-text) !important; background: rgba(255,255,255,0.04); }
  .wh-subnav .is-active { color: var(--wh-text-bright) !important; background: rgba(167,26,25,0.2); }
  .wh-subnav .soon { color: #555 !important; cursor: default; }
  .wh-iconrail-wrap {
    background: #0d0d0d; border-bottom: 1px solid var(--wh-border); width: 100%;
  }
  .wh-iconrail {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    gap: 8px;
    padding: 10px 0;
  }
  .wh-iconrail a, .wh-iconrail .wh-iconrail-soon {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 6px; width: 108px; min-height: 72px; padding: 8px 6px; flex: 0 0 108px;
    background: var(--wh-panel); border: 1px solid var(--wh-border);
    border-radius: 3px; text-decoration: none !important; color: var(--wh-text) !important;
    text-align: center;
  }
  .wh-iconrail a:hover {
    border-color: var(--wh-border-hi); background: var(--wh-panel-2);
    text-decoration: none !important; color: #fff !important;
  }
  .wh-iconrail-ico {
    width: 36px; height: 36px; border-radius: 3px;
    background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 1px solid var(--wh-border-hi);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: var(--wh-muted-3);
  }
  .wh-iconrail a .wh-iconrail-ico { color: #fff; border-color: rgba(167,26,25,0.45); }
  .wh-iconrail-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
    line-height: 1.2; color: var(--wh-muted-3);
  }
  .wh-iconrail-soon { opacity: 0.45; cursor: default; }
  .wh-iconrail-soon .wh-iconrail-label { color: #666; }
  .wh-page { flex: 1; width: 100%; }
  .wh-page-pad {
    width: 100%;
    max-width: 1280px;
    margin-left: auto;
    margin-right: auto;
    padding: 12px 16px 28px;
  }
  .wh-breadcrumb {
    font-size: 11px; color: var(--wh-muted); margin-bottom: 8px;
  }
  .wh-breadcrumb a { color: var(--wh-link); }
  .wh-h1 {
    font-size: 20px; font-weight: 700; margin: 0 0 4px; letter-spacing: -0.01em;
  }
  .wh-lede { color: var(--wh-muted); font-size: 12px; margin: 0 0 12px; max-width: 52rem; }
  .wh-panel {
    background: var(--wh-panel); border: 1px solid var(--wh-border);
    border-radius: 2px; margin-bottom: 10px;
  }
  .wh-panel-head {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 7px 10px; border-bottom: 1px solid var(--wh-border);
    background: var(--wh-panel-3);
  }
  .wh-panel-head h2 {
    margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; color: var(--wh-text-bright);
  }
  .wh-panel-meta { font-size: 11px; color: var(--wh-muted); }
  .wh-panel-body { padding: 8px 10px; }
  .wh-panel-body.flush { padding: 0; }
  .wh-empty { text-align: center; color: var(--wh-muted); }
  .wh-empty-icon {
    width: 40px; height: 40px; margin: 0 auto 8px; border-radius: 3px;
    border: 1px dashed var(--wh-border-hi); display: flex; align-items: center;
    justify-content: center; font-size: 14px; color: var(--wh-muted-2);
  }
  .wh-empty-title { font-size: 13px; font-weight: 700; color: var(--wh-muted-3); margin-bottom: 4px; }
  .wh-empty-body { font-size: 12px; max-width: 28rem; margin: 0 auto; line-height: 1.5; }
  .wh-feed-list { list-style: none; margin: 0; padding: 0; }
  .wh-feed-item {
    display: flex; gap: 10px; padding: 8px 0;
    border-bottom: 1px solid var(--wh-border);
  }
  .wh-feed-item:last-child { border-bottom: 0; }
  .wh-feed-item.is-empty { opacity: 0.55; }
  .wh-feed-thumb {
    width: 48px; height: 48px; flex-shrink: 0; border-radius: 2px;
    background: var(--wh-input); border: 1px solid var(--wh-border);
    display: flex; align-items: center; justify-content: center; color: #555;
    font-size: 11px;
  }
  .wh-feed-cat {
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--wh-gold); font-weight: 700; margin-bottom: 2px;
  }
  .wh-feed-title { font-size: 13px; font-weight: 700; color: var(--wh-text); margin-bottom: 2px; }
  .wh-feed-desc { font-size: 11px; color: var(--wh-muted); line-height: 1.4; }
  .wh-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 5px 10px; font-size: 12px; font-weight: 600; border-radius: 2px;
    border: 1px solid var(--wh-border-hi); background: var(--wh-panel-3); color: var(--wh-text) !important;
    text-decoration: none !important; cursor: pointer; font-family: var(--wh-font);
  }
  .wh-btn:hover { background: #2a2a2a; color: #fff !important; text-decoration: none !important; }
  .wh-btn-primary {
    background: var(--wh-accent);
    border-color: var(--wh-accent-quiet); color: #fff !important;
  }
  .wh-btn-primary:hover { background: var(--wh-accent-loud); color: #fff !important; }
  .wh-btn-ghost { background: transparent; }
  .wh-chip {
    display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 2px;
    border: 1px solid var(--wh-border); color: var(--wh-muted); background: var(--wh-input);
    font-weight: 600;
  }
  .wh-chip-live {
    border-color: rgba(0,112,221,0.55); color: #71d5ff;
    background: rgba(0,112,221,0.12);
  }
  .wh-chip-soon {
    border-color: var(--wh-border); color: #666;
  }
  .wh-stack { display: flex; flex-direction: column; gap: 10px; }
  .wh-section-grid-2 {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  }
  .wh-section-grid-2 > .wh-split {
    border-right: 1px solid var(--wh-border);
    padding: 0 10px;
  }
  .wh-section-grid-2 > .wh-split:last-child { border-right: 0; }
  .wh-link-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
  }
  .wh-link-grid a, .wh-link-grid .soon-cell {
    display: block; padding: 6px 8px; font-size: 12px; font-weight: 600;
    border-bottom: 1px solid var(--wh-border); border-right: 1px solid var(--wh-border);
    color: var(--wh-link) !important; text-decoration: none !important;
  }
  .wh-link-grid a:hover { background: var(--wh-row-hover); color: var(--wh-link-hover) !important; }
  .wh-link-grid .soon-cell { color: #666 !important; cursor: default; font-weight: 600; }
  .wh-feat-row {
    display: grid; grid-template-columns: 200px 1fr 1fr 1fr; gap: 0;
    min-height: 120px;
  }
  .wh-feat-media {
    background: var(--wh-input); border-right: 1px solid var(--wh-border);
    display: flex; align-items: center; justify-content: center;
    color: #555; font-size: 12px; font-weight: 700; text-align: center; padding: 12px;
  }
  .wh-feat-col { border-right: 1px solid var(--wh-border); padding: 8px 10px; }
  .wh-feat-col:last-child { border-right: 0; }
  .wh-feat-col h3 {
    margin: 0 0 6px; font-size: 12px; font-weight: 700; color: var(--wh-text-bright);
  }
  .wh-feat-col a {
    display: block; font-size: 12px; font-weight: 600; padding: 2px 0;
    color: var(--wh-link) !important; text-decoration: none !important;
  }
  .wh-feat-col a:hover { color: var(--wh-link-hover) !important; text-decoration: underline !important; }
  .wh-feat-col .soon-line { display: block; font-size: 12px; padding: 2px 0; color: #666; font-weight: 600; }
  .wh-grid-home {
    display: grid; grid-template-columns: 1fr; gap: 10px; align-items: start;
  }
  @media (max-width: 1100px) {
    .wh-feat-row { grid-template-columns: 1fr 1fr; }
    .wh-feat-media { grid-column: 1 / -1; min-height: 80px; border-right: 0; border-bottom: 1px solid var(--wh-border); }
    .wh-link-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 720px) {
    .wh-section-grid-2 { grid-template-columns: 1fr; }
    .wh-section-grid-2 > .wh-split { border-right: 0; border-bottom: 1px solid var(--wh-border); padding: 0; }
    .wh-feat-row { grid-template-columns: 1fr; }
    .wh-top-right { max-width: none; flex: 1 1 100%; order: 3; }
    .wh-iconrail a, .wh-iconrail .wh-iconrail-soon { width: 96px; flex-basis: 96px; }
  }
  .wh-quick-list { list-style: none; margin: 0; padding: 0; }
  .wh-quick-list li { border-bottom: 1px solid var(--wh-border); }
  .wh-quick-list li:last-child { border-bottom: 0; }
  .wh-quick-list a, .wh-quick-list .soon-row {
    display: flex; align-items: center; gap: 8px; padding: 7px 2px;
    color: var(--wh-text) !important; text-decoration: none !important; font-size: 12px;
  }
  .wh-quick-list a:hover { color: var(--wh-link-hover) !important; }
  .wh-quick-list .dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--wh-link); flex-shrink: 0;
  }
  .wh-quick-list .dot.muted { background: #444; }
  .wh-quick-list .tag {
    margin-left: auto; font-size: 10px; color: var(--wh-muted);
    background: var(--wh-input); border: 1px solid var(--wh-border); padding: 1px 5px; border-radius: 2px;
    font-weight: 600;
  }
  .wh-quick-list .soon-row { color: #666 !important; cursor: default; }
  .wh-stat-list { list-style: none; margin: 0; padding: 0; font-size: 12px; }
  .wh-stat-list li {
    display: flex; justify-content: space-between; gap: 10px;
    padding: 5px 0; border-bottom: 1px solid var(--wh-border);
  }
  .wh-stat-list li:last-child { border-bottom: 0; }
  .wh-stat-list .label { color: var(--wh-muted); }
  .wh-stat-list .val { font-weight: 600; color: var(--wh-text); }
  .wh-footer {
    border-top: 1px solid var(--wh-border); background: #181818;
    margin-top: auto; padding: 0; font-size: 12px; color: var(--wh-muted);
    width: 100%;
  }
  .wh-footer-mid {
    border-bottom: 1px solid var(--wh-border);
    padding: 18px 0 8px;
  }
  .wh-footer-mid-row {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 10px 16px; margin-bottom: 18px;
  }
  .wh-footer-mid-nav {
    display: flex; flex-wrap: wrap; gap: 4px 18px; align-items: center;
  }
  .wh-footer-mid-nav a {
    color: var(--wh-text) !important; text-decoration: none !important;
    font-size: 13px; font-weight: 600;
  }
  .wh-footer-mid-nav a:hover { color: #fff !important; text-decoration: underline !important; }
  .wh-footer-mid-nav .soon {
    color: #666; font-size: 13px; font-weight: 600; cursor: default;
  }
  .wh-footer-brand {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    min-width: 120px; flex: 0 0 auto;
  }
  .wh-footer-brand a {
    display: flex; align-items: center; gap: 8px;
    color: #fff !important; text-decoration: none !important;
    font-size: 20px; font-weight: 800; letter-spacing: -0.02em;
  }
  .wh-footer-brand a:hover { color: #fff !important; }
  .wh-footer-brand .wh-logo-mark { width: 28px; height: 28px; font-size: 13px; }
  .wh-footer-cols {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px 24px;
    padding-bottom: 8px;
  }
  .wh-footer-col h4 {
    margin: 0 0 10px; font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.04em; color: var(--wh-accent-loud);
  }
  .wh-footer-col ul { list-style: none; margin: 0; padding: 0; }
  .wh-footer-col li { margin: 0 0 6px; }
  .wh-footer-col a {
    color: var(--wh-text) !important; text-decoration: none !important;
    font-size: 12px; font-weight: 600;
  }
  .wh-footer-col a:hover { color: #fff !important; text-decoration: underline !important; }
  .wh-footer-col .soon {
    color: #666; font-size: 12px; font-weight: 600; cursor: default;
  }
  .wh-footer-bottom {
    border-top: 1px solid var(--wh-border);
    padding: 12px 0 16px;
  }
  .wh-footer-bottom-inner {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 10px 16px;
  }
  .wh-footer-legal {
    display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center;
  }
  .wh-footer-legal a, .wh-footer-legal .soon {
    color: var(--wh-muted) !important; text-decoration: none !important;
    font-size: 11px; font-weight: 600;
  }
  .wh-footer-legal a:hover { color: #fff !important; text-decoration: underline !important; }
  .wh-footer-legal .soon { color: #555 !important; cursor: default; }
  .wh-footer-social {
    display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
  }
  .wh-footer-social span {
    width: 28px; height: 28px; border-radius: 3px;
    background: var(--wh-panel-3); border: 1px solid var(--wh-border);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: #666; cursor: default;
  }
  @media (max-width: 900px) {
    .wh-footer-cols { grid-template-columns: repeat(2, 1fr); }
    .wh-footer-mid-row { justify-content: center; text-align: center; }
    .wh-footer-mid-nav { justify-content: center; }
  }
  @media (max-width: 520px) {
    .wh-footer-cols { grid-template-columns: 1fr; }
  }
  .elem {
    display: inline-block; font-size: 10px; font-weight: 700; padding: 0 5px;
    border-radius: 2px; line-height: 1.5; color: #fff;
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
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr)); gap: 6px; }
  .stat-card {
    background: var(--wh-input); border: 1px solid var(--wh-border); border-radius: 2px; padding: 6px 8px;
  }
  .stat-card .label {
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--wh-muted);
    font-weight: 600;
  }
  .stat-card .value { font-size: 13px; font-weight: 700; margin-top: 2px; color: var(--wh-text-bright); }
  .bg-pal-bg { background: var(--wh-bg); }
  .bg-pal-panel { background: var(--wh-panel); }
  .border-pal-border { border-color: var(--wh-border); }
  .text-pal-text { color: var(--wh-text); }
  .text-pal-muted { color: var(--wh-muted); }
  .text-pal-accent { color: var(--wh-link); }
  .hover\\:text-pal-accent:hover { color: var(--wh-link-hover); }
  .hover\\:border-pal-accent:hover { border-color: var(--wh-link); }
  .bg-pal-accent\\/15 { background: rgba(0,112,221,0.15); }
  .border-pal-accent\\/40 { border-color: rgba(0,112,221,0.4); }
  .focus\\:border-pal-accent:focus { border-color: var(--wh-link); outline: none; }
  input, select, textarea, button {
    font-family: var(--wh-font);
  }
  input[type=search], input[type=text], input[type=number], select {
    background: var(--wh-input) !important;
    color: var(--wh-text);
    border-color: var(--wh-border) !important;
    font-weight: 600;
  }
  table { border-collapse: collapse; }
  th.sortable { cursor: pointer; user-select: none; }
  th.sortable:hover { color: var(--wh-text-bright); }
  th { color: var(--wh-muted); font-weight: 700; }
`;

function tailwindConfigScript() {
  return `<script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            pal: {
              bg: "#000000",
              panel: "#181818",
              border: "#2a2a2a",
              text: "#e3e0d9",
              muted: "#9d9d9d",
              accent: "#0070dd",
            },
          },
          fontFamily: {
            sans: ['"Open Sans"', "Arial", '"Helvetica Neue"', "Helvetica", "sans-serif"],
          },
        },
      },
    };
  </script>`;
}

function navHref(prefix, href) {
  if (!href || href === "#") return "#";
  if (href.startsWith("http")) return href;
  return prefix + href.replace(/^\//, "");
}

function renderDropdown(prefix, items) {
  const rows = items
    .map((it) => {
      if (it.sep) return '<div class="wh-dd-sep"></div>';
      if (it.soon) {
        return (
          '<span class="soon">' +
          escapeHtml(it.label) +
          " <em>soon</em></span>"
        );
      }
      return (
        '<a href="' +
        escapeHtml(navHref(prefix, it.href)) +
        '">' +
        escapeHtml(it.label) +
        "</a>"
      );
    })
    .join("");
  return '<div class="wh-dd">' + rows + "</div>";
}

function renderNav(prefix, active) {
  const sections = [
    {
      id: "news",
      label: "News",
      href: "news/",
      items: [
        { href: "news/", label: "All News" },
        { href: "news/", label: "Patch Notes", soon: true },
        { href: "news/", label: "Community", soon: true },
      ],
    },
    {
      id: "guides",
      label: "Guides",
      href: "guides/",
      items: [
        { href: "guides/", label: "All Guides" },
        { href: "guides/status-effects/", label: "Status Effects", soon: true },
        { href: "guides/base-tips/", label: "Base Tips", soon: true },
        { href: "guides/", label: "Breeding", soon: true },
        { href: "guides/", label: "Combat", soon: true },
        { href: "guides/", label: "Bosses", soon: true },
      ],
    },
    {
      id: "database",
      label: "Database",
      href: "database/",
      activeIds: ["database", "pals", "skills", "items", "structures", "world"],
      items: [
        { href: "pals/", label: "Pals" },
        { href: "skills/", label: "Skills hub" },
        { href: "skills/partner/", label: "Partner Skills" },
        { href: "skills/passive/", label: "Passive Skills" },
        { href: "skills/active/", label: "Active Skills" },
        { sep: true },
        { href: "items/", label: "Items" },
        { href: "recipes/", label: "Recipes" },
        { href: "structures/", label: "Structures" },
        { href: "tech/", label: "Technology" },
        { href: "world/", label: "World" },
      ],
    },
    {
      id: "tools",
      label: "Tools",
      href: "tools/",
      activeIds: ["tools", "work"],
      items: [
        { href: "tools/work-suitability/", label: "Work Suitability" },
        { href: "tools/breeding/", label: "Breeding Calculator" },
        { href: "tools/team-builder/", label: "Team Builder" },
        { href: "tools/drop-finder/", label: "Drop Finder" },
      ],
    },
  ];

  return (
    '<nav class="wh-nav" aria-label="Primary">' +
    sections
      .map((sec) => {
        const ids = sec.activeIds || [sec.id];
        const isActive = ids.includes(active);
        return (
          '<div class="wh-nav-item' +
          (isActive ? " is-active" : "") +
          '">' +
          '<a class="wh-nav-link" href="' +
          escapeHtml(navHref(prefix, sec.href)) +
          '">' +
          escapeHtml(sec.label) +
          "</a>" +
          renderDropdown(prefix, sec.items) +
          "</div>"
        );
      })
      .join("") +
    "</nav>"
  );
}

function renderSubnav(prefix, active) {
  const links = [
    { href: "pals/", label: "Pals", id: "pals" },
    { href: "skills/partner/", label: "Partner skills", id: "skills" },
    { href: "skills/passive/", label: "Passives", id: "skills" },
    { href: "skills/active/", label: "Actives", id: "skills" },
    { href: "tools/work-suitability/", label: "Work suitability", id: "work" },
    { href: "items/", label: "Items", id: "items" },
    { href: "recipes/", label: "Recipes", id: "items" },
    { href: "structures/", label: "Structures", soon: true },
    { href: "world/", label: "World", soon: true },
    { href: "tools/breeding/", label: "Breeding", soon: true },
  ];
  return (
    '<div class="wh-subnav-wrap"><div class="wh-shell wh-subnav" aria-label="Quick database">' +
    links
      .map((l) => {
        if (l.soon) {
          return (
            '<span class="soon">' + escapeHtml(l.label) + " · soon</span>"
          );
        }
        const cls = active === l.id ? " is-active" : "";
        return (
          '<a class="' +
          cls.trim() +
          '" href="' +
          escapeHtml(navHref(prefix, l.href)) +
          '">' +
          escapeHtml(l.label) +
          "</a>"
        );
      })
      .join("") +
    "</div></div>"
  );
}

function renderIconRail(prefix) {
  const tiles = [
    { href: "pals/", label: "Pals", ico: "PL" },
    { href: "skills/", label: "Skills", ico: "SK" },
    { href: "tools/work-suitability/", label: "Work", ico: "WK" },
    { href: "skills/partner/", label: "Partner", ico: "PS" },
    { href: "skills/active/", label: "Actives", ico: "AS" },
    { href: "items/", label: "Items", ico: "IT" },
    { href: "recipes/", label: "Recipes", ico: "RC" },
    { href: "structures/", label: "Structures", ico: "ST", soon: true },
    { href: "world/", label: "World", ico: "WD", soon: true },
    { href: "tools/breeding/", label: "Breeding", ico: "BR", soon: true },
  ];
  return (
    '<div class="wh-iconrail-wrap"><div class="wh-shell wh-iconrail" aria-label="Feature shortcuts">' +
    tiles
      .map((t) => {
        if (t.soon) {
          return (
            '<div class="wh-iconrail-soon">' +
            '<div class="wh-iconrail-ico">' +
            escapeHtml(t.ico) +
            '</div><div class="wh-iconrail-label">' +
            escapeHtml(t.label) +
            "</div></div>"
          );
        }
        return (
          '<a href="' +
          escapeHtml(navHref(prefix, t.href)) +
          '">' +
          '<div class="wh-iconrail-ico">' +
          escapeHtml(t.ico) +
          '</div><div class="wh-iconrail-label">' +
          escapeHtml(t.label) +
          "</div></a>"
        );
      })
      .join("") +
    "</div></div>"
  );
}

function footerLink(prefix, href, label, soon) {
  if (soon) {
    return '<li><span class="soon">' + escapeHtml(label) + "</span></li>";
  }
  return (
    "<li><a href=\"" +
    escapeHtml(navHref(prefix, href)) +
    '">' +
    escapeHtml(label) +
    "</a></li>"
  );
}

function footerNavItem(prefix, href, label, soon) {
  if (soon) {
    return '<span class="soon">' + escapeHtml(label) + "</span>";
  }
  return (
    '<a href="' +
    escapeHtml(navHref(prefix, href)) +
    '">' +
    escapeHtml(label) +
    "</a>"
  );
}

function renderFooter(prefix) {
  const cols = [
    {
      title: "Pal database",
      links: [
        { href: "pals/", label: "All Pals" },
        { href: "tools/work-suitability/", label: "Work Suitability" },
        { href: "skills/partner/", label: "Partner Skills" },
        { href: "skills/passive/", label: "Passive Skills" },
        { href: "skills/active/", label: "Active Skills" },
        { href: "items/", label: "Items" },
        { href: "recipes/", label: "Recipes" },
        { href: "structures/", label: "Structures", soon: true },
        { href: "world/", label: "World", soon: true },
      ],
    },
    {
      title: "Guides",
      links: [
        { href: "guides/", label: "All Guides" },
        { href: "guides/base-tips/", label: "Base Tips", soon: true },
        { href: "guides/status-effects/", label: "Status Effects", soon: true },
        { href: "guides/", label: "Breeding", soon: true },
        { href: "guides/", label: "Combat", soon: true },
        { href: "guides/", label: "Bosses", soon: true },
        { href: "guides/", label: "Exploration", soon: true },
      ],
    },
    {
      title: "Tools",
      links: [
        { href: "tools/", label: "Tools Hub" },
        { href: "tools/work-suitability/", label: "Work Suitability" },
        { href: "tools/breeding/", label: "Breeding Calculator", soon: true },
        { href: "tools/team-builder/", label: "Team Builder", soon: true },
        { href: "tools/drop-finder/", label: "Drop Finder", soon: true },
      ],
    },
    {
      title: "News & more",
      links: [
        { href: "news/", label: "All News" },
        { href: "news/", label: "Patch Notes", soon: true },
        { href: "database/", label: "Database Hub" },
        { href: "tech/", label: "Technology", soon: true },
        { href: "index.html", label: "Home" },
      ],
    },
  ];

  const colHtml = cols
    .map((col) => {
      return (
        '<div class="wh-footer-col"><h4>' +
        escapeHtml(col.title) +
        "</h4><ul>" +
        col.links
          .map((l) => footerLink(prefix, l.href, l.label, l.soon))
          .join("") +
        "</ul></div>"
      );
    })
    .join("");

  return (
    '<footer class="wh-footer">' +
    '<div class="wh-footer-mid"><div class="wh-shell">' +
    '<div class="wh-footer-mid-row">' +
    '<div class="wh-footer-mid-nav">' +
    footerNavItem(prefix, "news/", "News") +
    footerNavItem(prefix, "guides/", "Guides") +
    footerNavItem(prefix, "database/", "Database") +
    footerNavItem(prefix, "tools/", "Tools") +
    "</div>" +
    '<div class="wh-footer-brand">' +
    '<a href="' +
    escapeHtml(navHref(prefix, "index.html")) +
    '"><span class="wh-logo-mark">P</span>Palhead</a>' +
    "</div>" +
    '<div class="wh-footer-mid-nav">' +
    footerNavItem(prefix, "tools/work-suitability/", "Work") +
    footerNavItem(prefix, "skills/", "Skills") +
    footerNavItem(prefix, "items/", "Items") +
    footerNavItem(prefix, "world/", "World", true) +
    "</div></div>" +
    '<div class="wh-footer-cols">' +
    colHtml +
    "</div></div></div>" +
    '<div class="wh-footer-bottom"><div class="wh-shell wh-footer-bottom-inner">' +
    '<div class="wh-footer-legal">' +
    footerNavItem(prefix, "index.html", "Home") +
    '<span class="soon">About</span>' +
    '<span class="soon">Privacy</span>' +
    '<span class="soon">Terms</span>' +
    '<span class="soon">Contact</span>' +
    "</div>" +
    '<div class="wh-footer-social" aria-hidden="true">' +
    "<span>X</span><span>f</span><span>yt</span><span>dc</span>" +
    "</div></div></div></footer>"
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
  bodyScripts = "",
  showSubnav = true,
  showIconRail = true,
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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  ${tailwindConfigScript()}
  <style>${SHARED_STYLES}</style>
  ${headExtra}
</head>
<body class="min-h-screen flex flex-col">
  <header class="wh-top">
    <div class="wh-shell wh-top-inner">
      <a class="wh-logo" href="${escapeHtml(prefix)}index.html">
        <span class="wh-logo-mark">P</span>
        Palhead
      </a>
      ${renderNav(prefix, activeNav)}
      <div class="wh-top-right">
        <div class="wh-search-stub" title="Global search — Phase 8">
          <span>⌕</span><span>Search guides, news, database…</span>
          <span class="wh-chip wh-chip-soon">soon</span>
        </div>
      </div>
    </div>
    ${showSubnav ? renderSubnav(prefix, activeNav) : ""}
  </header>
  ${showIconRail ? renderIconRail(prefix) : ""}
  ${body}
  ${renderFooter(prefix)}
  ${bodyScripts}
</body>
</html>
`;
}

module.exports = { shell, SHARED_STYLES, navHref };
