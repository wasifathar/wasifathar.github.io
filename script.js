// script.js — GitHub Pages–friendly

// --- Yahoo Finance via CORS-safe passthrough (read-only proxy) ---
async function fetchStockData(symbols) {
  const base = "http://query1.finance.yahoo.com/v7/finance/quote?symbols=" + symbols.join(",");
  const cors = "https://r.jina.ai/http/" + encodeURIComponent(base);  // returns JSON transparently
  try {
    const res = await fetch(cors, { cache: "no-store" });
    if (!res.ok) throw new Error(`Yahoo proxy HTTP ${res.status}`);
    const data = await res.json();
    const out = (data && data.quoteResponse && data.quoteResponse.result) ? data.quoteResponse.result : [];
    if (!out.length) console.warn("Yahoo returned no results:", data);
    return out;
  } catch (e) {
    console.error("CORS-safe Yahoo fetch failed:", e);
    return [];
  }
}

// --- Render ticker ---
async function renderStockTicker() {
  const el = document.getElementById("stock-ticker");
  if (!el) return;
  el.innerHTML = `<div class="muted">Loading live quotes…</div>`;

  const symbols = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"];
  const stocks = await fetchStockData(symbols);

  if (!stocks.length) {
    el.innerHTML = `<div class="muted">Couldn’t load quotes. Check console for details.</div>`;
    return;
  }

  el.innerHTML = stocks.map(s => {
    const ch = Number(s.regularMarketChange || 0);
    const chPct = Number(s.regularMarketChangePercent || 0);
    const cls = ch >= 0 ? "positive" : "negative";
    return `
      <div class="stock-item ${cls}">
        <span class="symbol">${s.symbol}</span>
        <span class="price">${Number(s.regularMarketPrice || 0).toFixed(2)}</span>
        <span class="change">${ch.toFixed(2)} (${chPct.toFixed(2)}%)</span>
      </div>
    `;
  }).join("");
}

// --- Load projects.json (must sit next to index.html) ---
async function loadProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  try {
    const res = await fetch("./projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`projects.json HTTP ${res.status}`);
    const projects = await res.json();

    if (!projects.length) {
      grid.innerHTML = `<div class="muted">Add items to <code>projects.json</code> to populate this section.</div>`;
      return;
    }

    grid.innerHTML = projects.map(p => `
      <div class="project-card">
        <h3>${p.title}</h3>
        <p>${p.description || ""}</p>
        <div class="tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}</div>
        ${p.link ? `<a href="${p.link}" target="_blank" class="cta-button" style="margin-top:.6rem;display:inline-block">View Project</a>` : ""}
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="muted">Couldn’t read <code>projects.json</code>. Ensure it’s at <code>./projects.json</code>.</div>`;
  }
}

// --- Init ---
function init() {
  renderStockTicker();
  loadProjects();
  setInterval(renderStockTicker, 60000);
}
document.addEventListener("DOMContentLoaded", init);
