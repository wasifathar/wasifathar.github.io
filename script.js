const SYMBOLS = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"];
const $ = (q) => document.querySelector(q);
const safeJSON = (t) => { try { return JSON.parse(t); } catch { return null; } };

// ---------- Helpers ----------
function fadeOutAndHide(el, duration = 600) {
  if (!el) return Promise.resolve();
  el.classList.add("fade");
  el.style.opacity = "0";
  el.style.pointerEvents = "none"; // <-- critical: stop intercepting clicks during fade
  return new Promise((res) => setTimeout(() => {
    el.classList.add("hidden");
    res();
  }, duration));
}

function fadeIn(el) {
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("fade");
  el.style.pointerEvents = ""; // allow clicks
  requestAnimationFrame(() => el.classList.add("show"));
}

function showSite() {
  ["#siteHeader", "#hero", "#main", "#footer"].forEach(sel => {
    const el = $(sel);
    if (el) {
      el.classList.remove("hidden");
      el.classList.add("fade");
      requestAnimationFrame(() => el.classList.add("show"));
    }
  });
}

// ---------- Opening sequence ----------
function runIntro() {
  const intro = $("#intro");
  const welcome = $("#welcome");
  const seen = localStorage.getItem("seenIntro") === "1";

  // Skip → fade intro, then show welcome
  $("#skipIntro")?.addEventListener("click", async () => {
    localStorage.setItem("seenIntro", "1");
    await fadeOutAndHide(intro);
    fadeIn(welcome);
  });

// Enter → instantly hide welcome and show site
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#enterSite");
  if (!btn) return;

  localStorage.setItem("seenIntro", "1");

  // instantly hide welcome so it can't block clicks
  const welcome = document.getElementById("welcome");
  if (welcome) {
    welcome.classList.add("hidden");
    welcome.style.display = "none";
  }

  // now reveal the site
  showSite();
}, { passive: true });

if (seen) {
  // Skip intro/welcome entirely
  intro?.classList.add("hidden");
  welcome?.classList.add("hidden");
  showSite();
  return;
}

// Auto progress intro → welcome
setTimeout(async () => {
  await fadeOutAndHide(intro);
  fadeIn(welcome);
}, 3600);
}

// ---------- Live stock quotes ----------
async function fetchStooq(symbols) {
  const map = (s) => s.toLowerCase().replace(/[.=]/g, "");
  const url = `https://stooq.com/q/l/?s=${symbols.map(map).join(",")}&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Stooq HTTP " + res.status);
  const text = await res.text();
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const H = header.split(",");
  const idx = Object.fromEntries(H.map((k,i)=>[k,i]));
  return rows.map(line => {
    const c = line.split(",");
    return {
      symbol: c[idx["Symbol"]]?.toUpperCase(),
      regularMarketPrice: Number(c[idx["Close"]] || 0),
      regularMarketChange: 0,
      regularMarketChangePercent: 0
    };
  });
}

async function fetchYahoo(symbols) {
  const y = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const tries = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(y)}`,
    `https://r.jina.ai/https/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    `https://r.jina.ai/http/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
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

async function fetchQuotes(symbols){
  try { const s = await fetchStooq(symbols); if (s?.length) return s; } catch {}
  try { const y = await fetchYahoo(symbols); if (y?.length) return y; } catch {}
  return [];
}

async function renderStockTicker() {
  const el = $("#stock-ticker"); if (!el) return;
  el.innerHTML = `<div class="muted">Loading live quotes…</div>`;
  const list = await fetchQuotes(SYMBOLS);
  if (!list.length) {
    el.innerHTML = `<div class="muted">Couldn’t load quotes (provider/CORS). Try refresh.</div>`;
    return;
  }
  el.innerHTML = list.map(s=>{
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

// ---------- Projects ----------
async function loadProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;
  try {
    const r = await fetch("./projects.json", { cache: "no-store" });
    if (!r.ok) throw new Error(`projects.json HTTP ${r.status}`);
    const items = JSON.parse(await r.text());
    grid.innerHTML = items.map(p => `
      <div class="project-card">
        <h4>${p.title}</h4>
        <p class="muted">${p.description ?? ""}</p>
        <div class="tags">${(p.tags ?? []).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        ${p.link ? `<a class="btn btn-ghost" target="_blank" rel="noreferrer" href="${p.link}">Open</a>` : ""}
      </div>
    `).join("");
  } catch (e) {
    grid.innerHTML = `<div class="muted">Couldn’t read ./projects.json.</div>`;
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  runIntro();
  const boot = () => { renderStockTicker(); loadProjects(); setInterval(renderStockTicker, 60000); };
  if (localStorage.getItem("seenIntro")==="1") boot();
  else setTimeout(boot, 3800);
});
