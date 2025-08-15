// Portfolio script — Muhammad Wasif Athar
const SYMBOLS = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"];
const $ = (q)=>document.querySelector(q);
const safeJSON = (t)=>{ try { return JSON.parse(t); } catch { return null; } };

// ------- Live Stocks (CORS-safe fallbacks) -------
async function fetchStockData(symbols) {
  const yahoo = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const tries = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(yahoo)}`,
    `https://r.jina.ai/https/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    `https://r.jina.ai/http/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    yahoo
  ];
  for (const url of tries) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const data = safeJSON(text);
      const list = data?.quoteResponse?.result;
      if (Array.isArray(list)) return list;
    } catch (e) {
      console.warn("Stock fetch failed:", url, e.message);
    }
  }
  return [];
}

async function renderStockTicker() {
  const el = $("#stock-ticker");
  if (!el) return;
  el.innerHTML = `<div class="muted">Loading live quotes…</div>`;
  const stocks = await fetchStockData(SYMBOLS);
  if (!stocks.length) {
    el.innerHTML = `<div class="muted">Couldn’t load quotes (CORS/network). Try refresh.</div>`;
    return;
  }
  el.innerHTML = stocks.map(s=>{
    const price = Number(s.regularMarketPrice ?? 0);
    const ch = Number(s.regularMarketChange ?? 0);
    const chPct = Number(s.regularMarketChangePercent ?? 0);
    const cls = ch >= 0 ? "positive" : "negative";
    return `<div class="stock-item ${cls}">
      <span class="symbol">${s.symbol}</span>
      <span class="price">${price.toFixed(2)}</span>
      <span class="change">${ch.toFixed(2)} (${chPct.toFixed(2)}%)</span>
    </div>`;
  }).join("");
}

// ------- Projects from JSON -------
async function loadProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;
  try {
    const res = await fetch("./projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`projects.json HTTP ${res.status}`);
    const text = await res.text();
    const items = safeJSON(text);
    if (!Array.isArray(items) || !items.length) {
      grid.innerHTML = `<div class="muted">Add items to <code>projects.json</code> to populate this section.</div>`;
      return;
    }
    grid.innerHTML = items.map(p=>`
      <div class="project-card">
        <h4 style="margin:.2rem 0 .4rem;font-size:1.05rem">${p.title}</h4>
        <p class="muted" style="margin:.25rem 0 .6rem">${p.description ?? ""}</p>
        <div class="tags">${(p.tags ?? []).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        ${p.link ? `<a class="btn btn-ghost" style="margin-top:.7rem;display:inline-block" target="_blank" rel="noreferrer" href="${p.link}">Open</a>` : ""}
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="muted">Couldn’t read <code>./projects.json</code>. Ensure it exists and is valid JSON.</div>`;
  }
}

// ------- Init -------
function init(){
  renderStockTicker();
  loadProjects();
  setInterval(renderStockTicker, 60000);
}
document.addEventListener("DOMContentLoaded", init);
