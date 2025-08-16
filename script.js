// SAP Fiori–style portfolio dashboard (Wasif Athar)
const SYMBOLS = ["AAPL","MSFT","GOOG","AMZN","TSLA","JPM"];
const $ = (q)=>document.querySelector(q);
const $$ = (q)=>Array.from(document.querySelectorAll(q));
const safeJSON = (t)=>{ try { return JSON.parse(t); } catch { return null; } };

// ---------- Router ----------
const ROUTES = ["personal","experience","education","projects","publications","certificates","recommendations"];
function navTo(route){
  if(!ROUTES.includes(route)) route="personal";
  window.location.hash = route;
  render(route);
}
window.addEventListener("hashchange", ()=> render(location.hash.replace("#","") || "personal"));

// ---------- Live ticker ----------
async function fetchStooq(symbols){
  const map=s=>s.toLowerCase().replace(/[.=]/g,"");
  const url=`https://stooq.com/q/l/?s=${symbols.map(map).join(",")}&f=sd2t2ohlcv&h&e=csv`;
  const r=await fetch(url,{cache:"no-store"}); if(!r.ok) throw new Error("Stooq "+r.status);
  const text=await r.text();
  const [head,...rows]=text.trim().split(/\r?\n/); const H=head.split(","); const idx=Object.fromEntries(H.map((k,i)=>[k,i]));
  return rows.map(line=>{
    const c=line.split(",");
    return { symbol:c[idx.Symbol]?.toUpperCase(), price:Number(c[idx.Close]||0), ch:null, chp:null };
  });
}
async function fetchYahoo(symbols){
  const y=`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
  const tries=[
    `https://api.allorigins.win/raw?url=${encodeURIComponent(y)}`,
    `https://r.jina.ai/https/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`,
    `https://r.jina.ai/http/query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`
  ];
  for(const url of tries){
    try{
      const r=await fetch(url,{cache:"no-store"}); if(!r.ok) continue;
      const j=safeJSON(await r.text()); const out=j?.quoteResponse?.result;
      if(Array.isArray(out) && out.length) return out.map(s=>({
        symbol:s.symbol, price:+(s.regularMarketPrice??0),
        ch:+(s.regularMarketChange??0), chp:+(s.regularMarketChangePercent??0)
      }));
    }catch{}
  }
  return [];
}
async function loadTicker(){
  const el=$("#ticker"); if(!el) return;
  el.innerHTML=`<span class="muted">Loading live quotes…</span>`;
  let list=[];
  try{ list=await fetchStooq(SYMBOLS); }catch{}
  if(!list.length){ try{ list=await fetchYahoo(SYMBOLS); }catch{} }
  if(!list.length){ el.innerHTML=`<span class="muted">Quotes unavailable</span>`; return; }

  const items = (arr)=>arr.map(s=>{
    const cls = (s.ch??0)>=0 ? "up":"down";
    const chg = (s.ch==null && s.chp==null) ? "" : ` <span class="chg ${cls}">${s.ch.toFixed?.(2) ?? s.ch} (${s.chp?.toFixed?.(2) ?? s.chp}%)</span>`;
    return `<span class="ticker-item"><span class="sym">${s.symbol}</span> <span class="px">${s.price.toFixed?.(2) ?? s.price}</span>${chg}</span>`;
  }).join(" • ");
  el.innerHTML = items(list) + " • " + items(list);
}

// ---------- DATA (pre-filled from your CV & certificates) ----------
const DATA = {
  personal: {
    photo: "./wasif-grad.jpg",
    summary:
      "Finance & economics enthusiast with a research-driven mindset who turns complex data into clear, decision-ready insight. Focus areas: valuation, financial reporting, pricing and ML-assisted analytics.",
    contact: {
      email: "wasifathar@gmail.com",
      location: "Milan, Italy (open to relocate)"
    },
    skills: [
      "Financial Modeling","Valuation (DCF/Comps)","Variance Analysis","Cash-flow Forecasting",
      "Python","Pandas","Excel","Power BI","SQL (basics)","Pricing","Reporting Automation",
      "GAAP/Regulatory Reporting","SOX basics","QuickBooks/Xero/Zoho/Tally","SAP (FICO)"
    ],
    languages: ["English (Fluent)","Urdu (Native)","German (A2)","Chinese (HSK 2)","Italian (A1)"]
  },

  experience: [
    {
      role: "AI-Driven Finance Intern (Remote)",
      org: "Gaddr (Sweden)",
      time: "Oct 2024 – Present",
      bullets: [
        "Developed & refined pricing strategies using AI-driven insights.",
        "Prepared year-end financial statements and automated reporting; reduced manual tasks by 10+ hours/week."
      ]
    },
    {
      role: "Help Desk Operator",
      org: "Cortex A.S., Prague (CZ)",
      time: "Mar 2022 – Jul 2022",
      bullets: [
        "Coordinated logistics for 1M+ Pfizer vaccine doses across 5 countries; 98% on-time delivery.",
        "Managed 200+ shipment queries with 15+ partners; ensured regulatory compliance."
      ]
    },
    {
      role: "Junior Accountant",
      org: "Roshan Packages, Lahore (PK)",
      time: "Sep 2017 – Sep 2018",
      bullets: [
        "Processed AP/AR with 100% recorded accuracy; reconciled GL to improve statement accuracy by ~15%.",
        "Supported quarterly financial reports; reviewed PKR 15M+ in transactions."
      ]
    }
  ],

  education: [
    { program: "MSc Economics & Finance", school: "University of Milan", time: "2025 – Present",
      notes: ["Econometrics, financial analysis, risk management (program in English)"] },
    { program: "BSc Management for Business & Economics (96/110)", school: "University of Pisa", time: "2021 – 2025",
      notes: ["Industrial & Quantitative Economics, Financial Reporting, Corporate Finance, Accounting"] },
    { program: "CFA Level I Candidate", school: "CFA Institute", time: "Jan 2025 – Present",
      notes: ["Ethics, FRA, Equity, Fixed Income, Derivatives"] }
  ],

  certificates: [
    "Wharton – Business & Financial Modeling Specialization (5 courses: Quant Modeling, Spreadsheets, Risk & Realities, Decision-Making & Scenarios, Capstone) — Aug 2025",
    "Oxford Saïd – AI in Financial Services (Foundations through future trends) — Aug 2025",
    "Bocconi – Private Equity & Venture Capital — Aug 2025",
    "IMF (edX) – Public Financial Management (PFMx) — Jun 2025",
    "SAP FICO (Udemy) — 2025"
  ],

  publications: [
    { title: "The Impact of Brain Drain: Assessing Economic Shifts in Pakistan", link: "https://ssrn.com/abstract=5292332" },
    { title: "Does GDP Affect Oil Prices? An Econometric Analysis of Germany and UAE", link: "https://ssrn.com/abstract=5292418" }
  ],

  recommendations: [
    { name: "Francisco Padilla", role: "CEO, Gaddr", note: "Professional reference available upon request." }
  ]
};

// ---------- Renderers ----------
function card(title, sub="", body=""){ return `
  <section class="card">
    <h3>${title}</h3>
    ${sub ? `<div class="sub">${sub}</div>` : ""}
    ${body}
  </section>
`; }

function renderPersonal(){
  const p=DATA.personal;
  const lang = (p.languages||[]).map(x=>`<span class="badge">${x}</span>`).join("");
  return `
    ${card("Profile","Math, Markets, and a Bit of Magic",`
      <div class="grid-6" style="display:grid;grid-template-columns:280px 1fr;gap:16px">
        <div><img src="${p.photo}" alt="Wasif photo" style="width:100%;border-radius:14px;border:1px solid #223047"></div>
        <div>
          <div class="kv"><div>Summary</div><div>${p.summary}</div></div>
          <div class="kv"><div>Email</div><div><a href="mailto:${p.contact.email}">${p.contact.email}</a></div></div>
          <div class="kv"><div>Location</div><div>${p.contact.location}</div></div>
          <div class="kv"><div>Skills</div><div class="badges">${p.skills.map(s=>`<span class="badge">${s}</span>`).join("")}</div></div>
          <div class="kv"><div>Languages</div><div class="badges">${lang}</div></div>
        </div>
      </div>
    `)}
  `;
}

function renderExperience(){
  const rows = DATA.experience.map(e=>`
    <tr>
      <td style="width:26%"><strong>${e.role}</strong><br><span class="muted">${e.org}</span></td>
      <td style="width:16%">${e.time}</td>
      <td>${(e.bullets||[]).map(b=>`• ${b}`).join("<br>")}</td>
    </tr>
  `).join("");
  return `
    ${card("Work Experience","Recent roles & impact",`
      <table class="table">
        <thead><tr><th>Role</th><th>Period</th><th>Highlights</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `)}
  `;
}

function renderEducation(){
  const rows = DATA.education.map(e=>`
    <tr>
      <td style="width:32%"><strong>${e.program}</strong></td>
      <td style="width:28%">${e.school}</td>
      <td style="width:16%">${e.time}</td>
      <td>${(e.notes||[]).join("; ")}</td>
    </tr>
  `).join("");
  return `
    ${card("Education","Degrees & credentials",`
      <table class="table">
        <thead><tr><th>Program</th><th>School</th><th>Period</th><th>Notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `)}
  `;
}

async function renderProjects(){
  let items=[];
  try{ const r=await fetch("./projects.json",{cache:"no-store"}); if(r.ok){ items=await r.json(); } }catch{}
  if(!Array.isArray(items)||!items.length){
    items=[
      {title:"L’Oréal 5-Year Forecast", description:"Integrated statements + DCF triangulation.", tags:["Modeling","DCF","Excel"]},
      {title:"AI-Driven Pricing", description:"Automated pricing insights & reporting.", tags:["AI","Automation"]},
      {title:"Bocconi – PE & VC", description:"Fund mechanics, value creation levers.", tags:["PE","VC","Valuation"]}
    ];
  }
  const cards = items.map(p=>`
    <div class="pcard">
      <h4>${p.title}</h4>
      <div class="muted">${p.description??""}</div>
      <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      ${p.link?`<div style="margin-top:.6rem"><a class="btn btn-ghost" target="_blank" rel="noreferrer" href="${p.link}">Open</a></div>`:""}
    </div>
  `).join("");
  return `${card("Projects","Highlighted work",`<div class="cards">${cards}</div>`)} `;
}

function renderList(title, arr, sub=""){
  const body = Array.isArray(arr) && arr.length
    ? `<ul style="margin:.2rem 0 .2rem 1rem">${arr.map(x=>{
        if(typeof x==="string") return `<li>${x}</li>`;
        if(x.link) return `<li><a target="_blank" rel="noreferrer" href="${x.link}">${x.title||x.link}</a></li>`;
        if(x.name) return `<li><strong>${x.name}</strong> — ${x.role||""} ${x.note?(" · "+x.note):""}</li>`;
        return `<li>${JSON.stringify(x)}</li>`;
      }).join("")}</ul>`
    : `<div class="muted">No entries yet.</div>`;
  return card(title, sub, body);
}

// ---------- Render controller ----------
async function render(route){
  $$(".nav-item").forEach(b=>b.classList.toggle("active", b.dataset.route===route));
  const view=$("#view");
  $("#status").textContent = `Module: ${route}`;
  if(route==="personal"){ view.innerHTML = renderPersonal(); return; }
  if(route==="experience"){ view.innerHTML = renderExperience(); return; }
  if(route==="education"){ view.innerHTML = renderEducation(); return; }
  if(route==="projects"){ view.innerHTML = await renderProjects(); return; }
  if(route==="publications"){ view.innerHTML = renderList("Publications", DATA.publications, "Articles & research"); return; }
  if(route==="certificates"){ view.innerHTML = renderList("Certificates", DATA.certificates); return; }
  if(route==="recommendations"){ view.innerHTML = renderList("Recommendations", DATA.recommendations, "References & testimonials"); return; }
  view.innerHTML = `<section class="card"><h3>Unknown module</h3></section>`;
}

// ---------- Global search ----------
$("#globalSearch")?.addEventListener("focus", e=>e.target.select());
document.addEventListener("keydown", (e)=>{
  if(e.key==="/" && document.activeElement.tagName!=="INPUT"){ e.preventDefault(); $("#globalSearch")?.focus(); }
  if(document.activeElement.tagName==="INPUT") return;
  const i = +e.key; if(i>=1 && i<=7){ navTo(ROUTES[i-1]); }
});
$("#globalSearch")?.addEventListener("input", ()=>{
  const q = $("#globalSearch").value.toLowerCase();
  $$("#view .pcard, #view tbody tr").forEach(el=>{
    el.style.display = el.textContent.toLowerCase().includes(q) ? "" : "none";
  });
});

// ---------- Modal helpers ----------
function openModal(title, html){ $("#modalTitle").textContent=title; $("#modalBody").innerHTML=html; $("#modal").classList.remove("hidden"); }
$("#modalClose")?.addEventListener("click", ()=> $("#modal").classList.add("hidden"));
document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") $("#modal").classList.add("hidden"); });

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async ()=>{
  $$(".nav-item").forEach(b=>b.addEventListener("click", ()=>navTo(b.dataset.route)));
  const start = location.hash.replace("#","") || "personal";
  render(start);
  await loadTicker();
  setInterval(loadTicker, 60000);
});
