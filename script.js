/* Honeycomb background with cursor/light interactions */
(() => {
  const canvas = document.getElementById('honeycomb');
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  // Hex grid settings
  const HEX_R = 22;                 // radius of each hex
  const HEX_H = Math.sin(Math.PI/3) * HEX_R; // vertical component
  const COLS = Math.ceil(W / (HEX_R * 1.5)) + 2;
  const ROWS = Math.ceil(H / (HEX_H * 2)) + 2;

  // Precompute hex centers
  let centers = [];
  function buildGrid() {
    centers = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const offset = (r % 2) ? HEX_R * 0.75 : 0;
        const x = c * HEX_R * 1.5 + offset;
        const y = r * HEX_H * 2 * 0.5 + r * HEX_H * 0.5;
        centers.push({ x, y, glow: 0 });
      }
    }
  }
  buildGrid();

  // Cursor state
  const cursor = { x: -9999, y: -9999, down: false };
  window.addEventListener('mousemove', e => { cursor.x = e.clientX; cursor.y = e.clientY; });
  window.addEventListener('mouseleave', () => { cursor.x = -9999; cursor.y = -9999; });
  window.addEventListener('mousedown', () => cursor.down = true);
  window.addEventListener('mouseup',   () => cursor.down = false);
  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGrid();
  });

  // Light up on hover/click
  function tick() {
    ctx.clearRect(0,0,W,H);

    for (const cell of centers) {
      const dx = cell.x - cursor.x;
      const dy = cell.y - cursor.y;
      const d = Math.hypot(dx, dy);

      // influence radius
      const R = cursor.down ? 210 : 140;
      const intensity = Math.max(0, 1 - d / R);

      // decay + add new light
      cell.glow = Math.max(0, cell.glow * 0.94);
      cell.glow = Math.max(cell.glow, intensity);

      // draw hex
      drawHex(cell.x, cell.y, HEX_R - 1.5, cell.glow);
    }

    requestAnimationFrame(tick);
  }

  function drawHex(cx, cy, r, glow) {
    const a = Math.max(0.15, glow);              // base alpha
    const edge = `rgba(90,208,255,${0.25 + 0.55*glow})`;
    const fill = `rgba(20,110,200,${0.10 + 0.35*glow})`;

    ctx.beginPath();
    for (let i=0;i<6;i++){
      const ang = Math.PI/3 * i + Math.PI/6;
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = edge;
    ctx.stroke();

    // small inner dot glow
    if (glow > 0.02) {
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r*0.9);
      grd.addColorStop(0, `rgba(120,230,255,${0.25 + 0.6*a})`);
      grd.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, r*0.9, 0, Math.PI*2);
      ctx.fill();
    }
  }

  tick();
})();

/* Simple floating chatbot: open/close & ready for your provider embed */
(() => {
  const toggle = document.getElementById('chat-toggle');
  const panel  = document.getElementById('chat-panel');
  const close  = document.getElementById('chat-close');
  toggle?.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });
  close?.addEventListener('click', () => {
    panel.hidden = true;
  });
})();
