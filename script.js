// script.js - Modern Interactive Finance Dashboard (GitHub Pages friendly)

// ---- Yahoo fetch (CORS safe via r.jina.ai passthrough) -----------------
async function fetchStockData(symbols) {
  const yUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const corsSafe = `https://r.jina.ai/http://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  try {
    // use the CORS-safe proxy (static read-through). It returns JSON text directly.
    const res = await fetch(corsSafe, { cache: "no-store" });
    const data = await res.json(); // r.jina.ai forwards JSON
    return (data && data.quoteResponse && data.quoteResponse.result) ? data.quoteResponse.result : [];
  } catch (e) {
    console.error("Yahoo fetch failed, trying direct (may be blocked by CORS):", e);
    try {
      const res2 = await fetch(yUrl, { cache: "no-store" });
      const data2 = await res2.json();
      return (data2 && data2.quoteResponse && data2.quoteResponse.result) ? data2.quoteResponse.result : [];
    } catch (e2) {
      console.error("Direct Yahoo fetch failed:", e2);
      return [];
    }
  }
}

// ---- Render ticker ------------------------------------------------------
async function renderStockTicker() {
  const el = document.getElementById("stock-ticker");
  if (!el) return;

  const symbols = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"];
  const stocks = await fetchStockData(symbols);

  if (!stocks.length) {
    el.innerHTML = `<div class="muted">Couldn’t load quotes right now. Please refresh.</div>`;
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

// ---- Load projects (relative path) --------------------------------------
async function loadProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  try {
    const res = await fetch("./projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.statusText);
    const projects = await res.json();

    if (!projects.length) {
      grid.innerHTML = `<div class="muted">Add items to <code>projects.json</code> to populate this section.</div>`;
      return;
    }

    grid.innerHTML = projects.map(p => `
      <div class="project-card">
        <h3>${p.title}</h3>
        <p>${p.description || ""}</p>
        <div class="tags">
          ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
        ${p.link ? `<a href="${p.link}" target="_blank" class="cta-button" style="margin-top:.6rem;display:inline-block">View Project</a>` : ""}
      </div>
    `).join("");
  } catch (err) {
    console.error("projects.json not found / invalid:", err);
    grid.innerHTML = `<div class="muted">Couldn’t read <code>projects.json</code>. Make sure it sits next to <code>index.html</code>.</div>`;
  }
}

// ---- Init ---------------------------------------------------------------
function init() {
  renderStockTicker();
  loadProjects();
  // refresh stocks every 60s
  setInterval(renderStockTicker, 60000);
}

document.addEventListener("DOMContentLoaded", init);
