// Portfolio script — Muhammad Wasif Athar
// Works on GitHub Pages (no server), with robust CORS fallbacks.

// ---------- Utilities ----------
const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);
const safeJSON = (t) => { try { return JSON.parse(t); } catch { return null; } };

// Reveal-on-scroll
function setupReveal() {
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  $$(".app-header, .hero-inner, [data-reveal]").forEach(el => io.observe(el));
}

// ---------- Live Stocks ----------
const SYMBOLS = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"]; // tweak anytime

async function fetchStockData(symbols) {
  const yahoo = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const tries = [
    // AllOrigins
    `https://api.allorigins.win/raw?url=${encodeURIComponent(yahoo)}`,
    // r.jina.ai (https passthrough)
    `https://r.jina.ai/https/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    // r.jina.ai (http passthrough as fallback)
    `https://r.jina.ai/http/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    // direct (may be CORS-blocked but fine locally)
    yahoo
  ];
  for (const url of tries) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = await res.text();
      const data = safeJSON(txt);
      const out = data?.quoteResponse?.result;
      if (Array.isArray(out)) return out;
      console.warn("Unexpected Yahoo response shape from", url, data ?? txt.slice(0,200));
    } catch (e) {
      console.warn("Fetch failed:", url, e.message);
    }
  }
  return [];
}

async function renderStockTicker() {
  const el = $("#stock-ticker");
  if (!el) return;
  el.innerHTML = `<div class="muted">Loading live quotes…</div>`;

  const list = await fetchStockData(SYMBOLS);
  if (!list.length) {
    el.innerHTML = `<div class="muted">Couldn’t load quotes (CORS/network). Check console for details.</div>`;
    return;
  }

  el.innerHTML = list.map(s => {
    const price = Number(s.regularMarketPrice ?? 0);
    const ch = Number(s.regularMarketChange ?? 0);
    const chPct = Number(s.regularMarketChangePercent ?? 0);
    const up = ch >= 0;
    return `
      <div class="stock-item ${up ? "positive":"negative"}">
        <span class="symbol">${s.symbol}</span>
        <span class="price">${price.toFixed(2)}</span>
        <span class="change">${ch.toFixed(2)} (${chPct.toFixed(2)}%)</span>
      </div>
    `;
  }).join("");
}

// ---------- Projects ----------
async function loadProjects() {
  const grid = $("#projects-grid");
  if (!grid) return;

  try {
    const res = await fetch("./projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`projects.json HTTP ${res.status}`);
    const txt = await res.text();
    const items = safeJSON(txt);
    if (!Array.isArray(items) || !items.length) {
      grid.innerHTML = `<div class="muted">Add items to <code>projects.json</code> to populate this section.</div>`;
      return;
    }
    grid.innerHTML = items.map(p => `
      <div class="project-card">
        <h4 style="margin:.2rem 0 .4rem;font-size:1.05rem">${p.title}</h4
