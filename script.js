// script.js — GitHub Pages friendly, robust CORS + parsing

const SYMBOLS = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"];

function safeJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// --- Yahoo Finance via CORS-safe fallbacks ---
async function fetchStockData(symbols) {
  const yahoo = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const tries = [
    // 1) AllOrigins raw proxy
    `https://api.allorigins.win/raw?url=${encodeURIComponent(yahoo)}`,
    // 2) r.jina.ai passthrough (read-only mirror)
    `https://r.jina.ai/https/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    // 3) direct (will usually fail on CORS but worth a try locally)
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
      console.warn("Unexpected response shape from:", url, data ?? text.slice(0,200));
    } catch (e) {
      console.warn("Fetch attempt failed:", url, e);
    }
  }
  return [];
}

// --- Render ticker ---
async function renderStockTicker() {
  const el = document.getElementById("stock-ticker");
  if (!el) return;
  el.innerHTML = `<div class="muted">Loading live quotes…</div>`;

  const stocks = await fetchStockData(SYMBOLS);
  if (!stocks.length) {
    el.innerHTML = `<div class="muted">Couldn’t load quotes (CORS or network). Check console logs.</div>`;
    return;
  }

  el.innerHTML = stocks.map(s => {
    const price = Number(s.regularMarketPrice ?? 0);
    const ch = Number(s.regularMarketChange ?? 0);
    const chPct = Number(s.regularMarketChangePercent ?? 0);
    const cls = ch >= 0 ? "positive" : "negative";
    return `
      <div class="stock-item ${cls}">
        <span class="symbol">${s.symbol}</span>
        <span class="price">${price.toFixed(2)}</span>
        <span class="change">${ch.toFixed(2)} (${chPct.toFixed(2)}%)</span>
      </div>
    `;
  }).join("");
}

// --- Load projects (must be next to index.html as ./projects.json) ---
async function loadProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  try {
    const res = await fetch("./projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`projects.json HTTP ${res.status}`);
    const text = await res.text();
    const projects = safeJSON(text);
    if (!Array.isArray(projects) || !projects.length) {
      grid.innerHTML = `<div class="muted">Add items to <code>projects.json</code> to populate this section.</div>`;
      return;
    }

    grid.innerHTML = projects.map(p => `
      <div class="project-card">
        <h3>${p.title}</h3>
        <p>${p.description ?? ""}</p>
        <div class="tags">${(p.tags ?? []).map(t => `<span class="tag">${t}</span>`).join("")}</div>
        ${p.link ? `<a class="cta-button" style="margin-top:.6rem;display:inline-block" target="_blank" href="${p.link}">View Project</a>` : ""}
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="muted">Couldn’t read <code>./projects.json</code>. Ensure the file exists and is valid JSON.</div>`;
  }
}

// --- Ensure logo
