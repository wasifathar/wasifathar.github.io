/* ——— Honeycomb: toned down & efficient ——— */
(() => {
  const canvas = document.getElementById('honeycomb');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let W, H, centers = [];
  const DPR = Math.min(window.devicePixelRatio || 1, 2);  // crisp but not heavy
  const HEX_R = 20;                                       // smaller cells
  const HHEX = Math.sin(Math.PI/3) * HEX_R;

  function resize(){
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    buildGrid();
  }

  function buildGrid(){
    centers.length = 0;
    const cols = Math.ceil((W / DPR) / (HEX_R * 1.5)) + 2;
    const rows = Math.ceil((H / DPR) / (HHEX * 1.7)) + 2;
    for (let r=0; r<rows; r++){
      for (let c=0; c<cols; c++){
        const offset = (r % 2) ? HEX_R * .75 : 0;
        const x = (c * HEX_R * 1.5 + offset) * DPR;
        const y = (r * HHEX * 1.7) * DPR;
        centers.push({x,y,glow:0});
      }
    }
  }

  const cursor = { x:-9999, y:-9999, down:false };
  window.addEventListener('mousemove', e => { cursor.x = e.clientX * DPR; cursor.y = e.clientY * DPR; });
  window.addEventListener('mouseleave', ()=>{ cursor.x = -9999; cursor.y = -9999; });
  window.addEventListener('mousedown', ()=> cursor.down = true);
  window.addEventListener('mouseup',   ()=> cursor.down = false);
  window.addEventListener('resize', resize);

  function drawHex(cx, cy, r, glow){
    ctx.beginPath();
    for (let i=0;i<6;i++){
      const a = Math.PI/3*i + Math.PI/6;
      const x = cx + r*Math.cos(a);
      const y = cy + r*Math.sin(a);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    // subtle edge + soft fill
    ctx.lineWidth = .9 * DPR;
    ctx.strokeStyle = `rgba(120,210,255,${0.12 + 0.38*glow})`;
    ctx.fillStyle   = `rgba(30,120,210,${0.05 + 0.22*glow})`;
    ctx.fill(); ctx.stroke();
  }

  let last = 0;
  function frame(t){
    if (t - last < 1000/45) { requestAnimationFrame(frame); return; } // ~45fps cap
    last = t;

    ctx.clearRect(0,0,W,H);
    const R = (cursor.down ? 180 : 120) * DPR;

    for (const cell of centers){
      const dx = cell.x - cursor.x, dy = cell.y - cursor.y;
      const d = Math.hypot(dx,dy);
      const influence = Math.max(0, 1 - d/R);
      cell.glow = Math.max(0, cell.glow*.93);
      cell.glow = Math.max(cell.glow, influence);
      drawHex(cell.x, cell.y, HEX_R*DPR - 2*DPR, cell.glow);
    }
    requestAnimationFrame(frame);
  }

  // Disable on very small screens for polish
  const isSmall = () => window.matchMedia("(max-width: 640px)").matches;
  if (isSmall()) { canvas.style.display = "none"; }
  else { resize(); requestAnimationFrame(frame); }
})();
 
/* ——— Chat bubble: default CLOSED ——— */
(() => {
  const toggle = document.getElementById('chat-toggle');
  const panel  = document.getElementById('chat-panel');
  const close  = document.getElementById('chat-close');
  if (!toggle || !panel) return;
  panel.hidden = true;                     // start closed
  toggle.addEventListener('click', ()=> panel.hidden = !panel.hidden);
  close?.addEventListener('click', ()=> panel.hidden = true);
})();
