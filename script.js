const SYMBOLS = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"];
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const safeJSON = (t)=>{ try { return JSON.parse(t); } catch { return null; } };

/* ---------- helpers ---------- */
function fadeOutAndHide(el, duration = 600){
  if(!el) return Promise.resolve();
  el.classList.add("fade");
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  return new Promise(res => setTimeout(()=>{ el.classList.add("hidden"); res(); }, duration));
}
function fadeIn(el){
  if(!el) return;
  el.classList.remove("hidden");
  el.classList.add("fade");
  el.style.pointerEvents = "";
  requestAnimationFrame(()=> el.classList.add("show"));
}
function showMainSite(){
  ["#siteHeader","#hero","#main","#footer"].forEach(sel=>{
    const el = $(sel);
    if(el){ el.classList.remove("hidden"); el.classList.add("fade"); requestAnimationFrame(()=>el.classList.add("show")); }
  });
}

/* ---------- intro flow ---------- */
function runFlow(){
  const intro = $("#intro");
  const welcome = $("#welcome");
  const stageA = $("#stageA");
  const stageB = $("#stageB");
  const overlay = $("#detailOverlay");
  const seen = localStorage.getItem("seenIntro")==="1";

  // Skip → Welcome
  $("#skipIntro")?.addEventListener("click", async ()=>{
    localStorage.setItem("seenIntro","1");
    await fadeOutAndHide(intro);
    fadeIn(welcome);
  });

  // Enter → Stage A
  document.addEventListener("click", async (e)=>{
    if(!e.target.closest("#enterSite")) return;
    localStorage.setItem("seenIntro","1");
    await fadeOutAndHide(welcome);
    fadeIn(stageA);
  });

  // Stage A → Stage B (click anywhere)
  stageA?.addEventListener("click", async ()=>{
    await fadeOutAndHide(stageA);
    fadeIn(stageB);
  });

  // Open detail from tile
  stageB?.addEventListener("click",(e)=>{
    const btn = e.target.closest(".tile"); if(!btn) return;
    const key = btn.getAttribute("data-open");
    openDetail(key);
  });
  $("#closeDetail")?.addEventListener("click", ()=> overlay?.classList.add("hidden"));
  $("#goToSite")?.addEventListener("click", async ()=>{
    await fadeOutAndHide(stageB);
    showMainSite();
  });

  if(seen){
    // Go straight to Stage A on repeat visits for speed
    intro?.classList.add("hidden");
    welcome?.classList.add("hidden");
    fadeIn(stageA);
  }else{
    // auto: Intro -> Welcome
    setTimeout(async ()=>{ await fadeOutAndHide(intro); fadeIn(welcome); }, 3600);
  }
}

/* ---------- detail content ---------- */
const detailTemplates = {
  personal: `
    <p><strong>Name:</strong> Muhammad Wasif Athar</p>
    <p><strong>Tagline:</strong> Math, Markets, and a Bit of Magic</p>
    <p><strong>Location:</strong> Pisa, Italy (willing to relocate)</p>
    <p><strong>Focus:</strong> Valuation, Reporting, ML-assisted analytics</p>
  `,
  experience: `
    <ul>
      <li><strong>Financial Analyst</strong> — Pricing & reporting automation; BI dashboards; variance analysis.</li>
      <li><strong>Research/Project Work</strong> — Equity models, factor screens, and portfolio reporting.</li>
    </ul>
  `,
  education: `
    <ul>
      <li><strong>MSc Economics &amp; Finance</strong> — University of Pisa</li>
      <li><strong>CFA Level I Candidate</strong></li>
      <li>Selected: AI Finance, PE & VC (Bocconi), Business & Financial Modeling (Wharton)</li>
    </ul>
  `,
  projects: `
    <p>See highlighted projects below or open the full list.</p>
    <p><a class="btn btn-ghost" href="./projects.html">Open Projects →</a></p>
  `,
  publications: `
    <p>(Add any articles/notes/LinkedIn posts; we can link PDFs here.)</p>
  `,
  certificates: `
    <ul>
      <li>Wharton: Business & Financial Modeling Specialization (Coursera)</li>
      <li>AI in Finance Specialization</li>
      <li>PE & VC (Bocconi) coursework</li>
    </ul>
  `,
  recommendations: `
    <p>(Paste testimonials or link to LinkedIn Recommendations.)</p>
  `
};
function openDetail(key){
  const overlay = $("#detailOverlay");
  $("#detailTitle").textContent = key.charAt(0).toUpperCase()+key.slice(1).replace(/_/g," ");
  $("#detailBody").innerHTML = detailTemplates[key] || "<p>Coming soon.</p>";
  overlay?.classList.remove("hidden");
}

/* ---------- markets (live quotes) ---------- */
async function fetchStooq(symbols){
  const map = s => s.toLowerCase().replace(/[.=]/g,"");
  const url = `https://stooq.com/q/l/?s=${symbols.map(map).join(",")}&f=sd2t2ohlcv&h&e=csv`;
  const r = await fetch(url,{cache:"no-store"});
  if(!r.ok) throw new Error("Stooq HTTP "+r.status);
  const text = await r.text();
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const H = header.split(","); const idx = Object.fromEntries(H.map((k,i)=>[k,i]));
  return rows.map(line=>{
    const c = line.split(",");
    return {symbol: c[idx.Symbol]?.toUpperCase(), regularMarketPrice: Number(c[idx.Close]||0), regularMarketChange:0, regularMarketChangePercent:0};
  });
}
async function fetchYahoo(symbols){
  const y = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const tries = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(y)}`,
    `https://r.jina.ai/https/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    `https://r.jina.ai/http/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
  ];
  for(const url of tries){
    try{
      const r = await fetch(url,{cache:"no-store"});
      if(!r.ok) continue;
      const j = safeJSON(await r.text());
      const out = j?.quoteResponse?.result;
      if(Array.isArray(out) && out.length) return out;
    }catch(_){}
  }
  return [];
}
async function fetchQuotes(symbols){
  try{const s = await fetchStooq(symbols); if(s?.length) return s;}catch{}
  try{const y = await fetchYahoo(symbols); if(y?.length) return y;}catch{}
  return [];
}
async function renderStockTicker(){
  const el = $("#stock-ticker"); if(!el) return;
  el.innerHTML = `<div class="muted">Loading live quotes…</div>`;
  const list = await fetchQuotes(SYMBOLS);
  if(!list.length){ el.innerHTML = `<div class="muted">Couldn’t load quotes (provider/CORS). Try refresh.</div>`; return; }
  el.innerHTML = list.map(s=>{
    const p = Number(s.regularMarketPrice ?? 0);
    const ch = Number(s.regularMarketChange ?? 0);
    const cp = Number(s.regularMarketChangePercent ?? 0);
    const cls = ch >= 0 ? "positive" : "negative";
    const changeStr = (ch || cp) ? `${ch.toFixed(2)} (${cp.toFixed(2)}%)` : "—";
    return `<div class="stock-item ${cls}">
      <span class="symbol">${s.symbol}</span>
      <span class="price">${p.toFixed(2)}</span>
      <span class="change">${changeStr}</span>
    </div>`;
  }).join("");
}

/* ---------- projects (index) ---------- */
async function loadProjects(){
  const grid = $("#projects-grid"); if(!grid) return;
  try{
    const r = await fetch("./projects.json",{cache:"no-store"});
    if(!r.ok) throw new Error(`projects.json HTTP ${r.status}`);
    const items = safeJSON(await r.text()) || [];
    grid.innerHTML = items.map(p=>`
      <div class="project-card">
        <h4 style="margin:.2rem 0 .4rem;font-size:1.06rem">${p.title}</h4>
        <p class="muted" style="margin:.25rem 0 .6rem">${p.description??""}</p>
        <div class="tags">${(p.tags??[]).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        ${p.link?`<a class="btn btn-ghost" style="margin-top:.7rem;display:inline-block" target="_blank" rel="noreferrer" href="${p.link}">Open</a>`:""}
      </div>`).join("");
  }catch(e){
    grid.innerHTML = `<div class="muted">Couldn’t read ./projects.json.</div>`;
  }
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  runFlow();
  const boot = ()=>{ renderStockTicker(); loadProjects(); setInterval(renderStockTicker, 60000); };
  if(localStorage.getItem("seenIntro")==="1") boot();
  else setTimeout(boot, 4200);
});
