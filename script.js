// script.js — robust live quotes + dynamic projects, Pages-friendly

const SYMBOLS = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"];
const ALPHA_KEY = ""; // <-- optional: put your Alpha Vantage key here if you have one

const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const safeJSON = (t) => { try { return JSON.parse(t); } catch { return null; } };

// --------- Stooq (CSV) ----------
async function fetchStooq(symbols) {
  // Stooq uses lower-case tickers without punctuation for US (e.g., "aapl,msft,amzn")
  const map = (s) => s.toLowerCase().replace(/[.=]/g, "");
  const url = `https://stooq.com/q/l/?s=${symbols.map(map).join(",")}&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Stooq HTTP " + res.status);
  const text = await res.text();
  // Parse CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
  const lines = text.trim().split(/\r?\n/);
  const head = lines.shift().split(",");
  const S = (k) => head.indexOf(k);
  return lines.map(line => {
    const c = line.split(",");
    return {
      symbol: c[S("Symbol")].toUpperCase(),
      regularMarketPrice: Number(c[S("Close")] || 0),
      regularMarketChange: 0,               // Stooq has no delta in this endpoint
      regularMarketChangePercent: 0
    };
  });
}

// --------- Yahoo (mirrors) ----------
async function fetchYahoo(symbols) {
  const y = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const tries = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(y)}`,
    `https://r.jina.ai/https/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    `https://r.jina.ai/http/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`
  ];
  for (const url of tries) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const j = safeJSON(await r.text());
      const out = j?.quoteResponse?.result;
      if (Array.isArray(out) && out.length) return out;
    } catch (_) {}
  }
  return [];
}

// --------- Alpha Vantage (optional key) ----------
async function fetchAlphaVantage(symbol) {
  if (!ALPHA_KEY) return null;
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) return null;
  const j = safeJSON(await r.text());
  const g = j?.["Global Quote"];
  if (!g) return null;
  return {
    symbol,
    regularMarketPrice: Number(g["05. price"] || 0),
    regularMarketChange: Number(g["09. change"] || 0),
    regularMarketChangePercent: Number(g["10. change percent"]?.replace("%","") || 0)
  };
}

// --------- Unified fetch ----------
async function fetchQuotes(symbols) {
  // 1) Try Stooq first
  try {
    const s = await fetchStooq(symbols);
    if (s?.length) return s;
  } catch (e) { console.warn("Stooq fail:", e.message); }
  // 2) Try Yahoo mirrors
  try {
    const y = await fetchYahoo(symbols);
    if (y?.length) return y;
  } catch (e) { console.warn("Yahoo fail:", e.message); }
  // 3) Try Alpha Vantage (symbol by symbol)
  if (ALPHA_KEY) {
    const parts = await Promise.all(symbols.map(fetchAlphaVantage));
    const ok = parts.filter(Boolean);
    if (ok.length) return ok;
  }
  return [];
}

// --------- Render ticker ----------
async function renderStockTicker() {
  const el = $("#stock-ticker");
  if (!el) return;
  el.innerHTML = `<div class="muted">Loading live quotes…</div>`;
  const list = await fetchQuotes(SYMBOLS);
  if (!list.length) {
    el.innerHTML = `<div class="muted">Couldn’t load quotes right now (provider/CORS). Try refresh.</div>`;
    return;
  }
  el.innerHTML = list.map(s => {
    const price = Number(s.regularMarketPrice ?? 0);
    const ch = Number(s.regularMarketChange ?? 0);
    const chPct = Number(s.regularMarketChangePercent ?? 0);
    const cls = ch >= 0 ? "positive" : "negative";
    const changeStr = (ch || chPct) ? `${ch.toFixed(2)} (${chPct.toFixed(2)}%)` : "—";
    return `<div class="stock-item ${cls}">
      <span class="symbol">${s.symbol}</span>
      <span class="price">${price.toFixed(2)}</span>
      <span class="change">${changeStr}</span>
    </div>`;
  }).join("");
}

// --------- Projects (shared by index.html & projects.html) ----------
async function loadProjects(intoSelector = "#projects-grid") {
  const grid = document.querySelector(intoSelector);
  if (!grid) return;
  try {
    const r = await fetch("./projects.json", { cache: "no-store" });
    if (!r.ok) throw new Error(`projects.json HTTP ${r.status}`);
    const items = JSON.parse(await r.text());
    if (!Array.isArray(items) || !items.length) {
      grid.innerHTML = `<div class="muted">Add items to <code>projects.json</code>.</div>`;
      return;
    }
    grid.innerHTML = items.map(p => `
      <div class="project-card">
        <h4 style="margin:.2rem 0 .4rem;font-size:1.06rem">${p.title}</h4>
        <p class="muted" style="margin:.25rem 0 .6rem">${p.description ?? ""}</p>
        <div class="tags">${(p.tags ?? []).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        ${p.link ? `<a class="btn btn-ghost" style="margin-top:.7rem;display:inline-block" target="_blank" rel="noreferrer" href="${p.link}">Open</a>` : ""}
      </div>
    `).join("");
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="muted">Couldn’t read <code>./projects.json</code>.</div>`;
  }
}

// --------- Page init ----------
function init() {
  // If the ticker exists on this page, render and refresh it:
  if ($("#stock-ticker")) {
    renderStockTicker();
    setInterval(renderStockTicker, 60000);
  }
  // If a projects grid exists, fill it:
  if ($("#projects-grid")) loadProjects("#projects-grid");

  // On projects.html, enhance filters if present
  if ($("#projects-search")) {
    loadProjects("#projects-results").then(() => {
      const input = $("#projects-search");
      const cards = $$("#projects-results .project-card");
      input.addEventListener("input", () => {
        const q = input.value.toLowerCase();
        cards.forEach(c => {
          const txt = c.textContent.toLowerCase();
          c.style.display = txt.includes(q) ? "" : "none";
        });
      });
    });
  }
}
document.addEventListener("DOMContentLoaded", init);
