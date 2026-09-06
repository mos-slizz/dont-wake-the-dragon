/* Thief mini-games that run on the phone. Each task: new Task(container, params, cb) with
   cb.onProgress(0..1), cb.onItem(), cb.onDrop(kind), and task.motion({beta,gamma}) for tilt input. */
(function (global) {
  'use strict';
  const T = {};

  // Difficulty params by age tier (quietly applied) and heist number.
  T.paramsFor = (type, tier, heistN) => {
    const k = { hatch: 0, squire: 1, knight: 2, wizard: 3 }[tier] ?? 1;
    const h = (heistN - 1) / 5; // 0..1
    if (type === 'marble') return {
      ring: [0.34, 0.26, 0.19, 0.16][k] * (1 - h * 0.25),
      grav: [0.55, 0.8, 1.05, 1.2][k] * (1 + h * 0.3),
      need: [2.2, 2.8, 3.4, 3.8][k] * (1 + h * 0.2),
      drift: [0, 0.15, 0.35, 0.5][k] * (1 + h),
    };
    if (type === 'gem') return {
      width: [0.15, 0.11, 0.08, 0.065][k] * (1 - h * 0.2),
      wiggle: [0.25, 0.45, 0.7, 0.9][k] * (1 + h * 0.4),
      segs: [4, 5, 7, 8][k],
    };
    if (type === 'pour') return {
      band: [0.22, 0.16, 0.11, 0.09][k] * (1 - h * 0.2),
      rate: [0.28, 0.36, 0.45, 0.5][k] * (1 + h * 0.3),
    };
    if (type === 'lock') return {
      pins: [3, 4, 5, 6][k] + Math.round(h * 2),
      window: [0.3, 0.22, 0.16, 0.13][k] * (1 - h * 0.2),
    };
    return {};
  };

  function mkCanvas(container) {
    container.innerHTML = '';
    const c = document.createElement('canvas');
    c.style.width = '100%'; c.style.height = '100%'; c.style.touchAction = 'none'; c.style.display = 'block';
    container.appendChild(c);
    const fit = () => { const r = container.getBoundingClientRect(); const w = Math.floor(r.width * devicePixelRatio), h = Math.floor(r.height * devicePixelRatio); if (w === c.width && h === c.height) return false; c.width = w; c.height = h; return true; };
    fit(); window.addEventListener('resize', fit);
    return { c, ctx: c.getContext('2d'), fit, off: () => window.removeEventListener('resize', fit) };
  }

  // ---------- MARBLE (tilt) ----------
  class Marble {
    constructor(container, p, cb) {
      this.p = p; this.cb = cb; this.k = mkCanvas(container);
      this.tilt = { x: 0, y: 0 }; this.zero = null; this.zeroSamples = [];
      this.pos = { x: 0, y: 0 }; this.vel = { x: 0, y: 0 };
      this.ring = { x: 0, y: 0, vx: 0, vy: 0 }; this.newRing(true);
      this.inTime = 0; this.done = false; this.last = performance.now(); this.flash = 0; this.dropAnim = 0;
      this.raf = requestAnimationFrame(this.loop.bind(this));
      this.touchFallback = false; this.touch = null;
      const c = this.k.c;
      c.addEventListener('pointerdown', e => { this.touch = { x: e.clientX, y: e.clientY }; });
      c.addEventListener('pointermove', e => { if (this.touch) this.touch = { x: e.clientX, y: e.clientY }; });
      c.addEventListener('pointerup', () => { this.touch = null; });
      c.addEventListener('pointercancel', () => { this.touch = null; });
    }
    setTouchFallback(v) { this.touchFallback = v; }
    newRing(first) { const a = Math.random() * Math.PI * 2, r = first ? 0 : 0.35 + Math.random() * 0.25; this.ring.x = Math.cos(a) * r; this.ring.y = Math.sin(a) * r; const b = Math.random() * 6.28; this.ring.vx = Math.cos(b) * this.p.drift * 0.15; this.ring.vy = Math.sin(b) * this.p.drift * 0.15; }
    motion(o) { // o.beta (front/back), o.gamma (left/right), degrees
      if (!o) return;
      if (this.zeroSamples.length < 20) { this.zeroSamples.push([o.gamma, o.beta]); if (this.zeroSamples.length === 20) { this.zero = { g: this.zeroSamples.reduce((s, v) => s + v[0], 0) / 20, b: this.zeroSamples.reduce((s, v) => s + v[1], 0) / 20 }; } return; }
      const g = o.gamma - this.zero.g, b = o.beta - this.zero.b;
      this.tilt.x = Math.max(-1, Math.min(1, g / 25)); this.tilt.y = Math.max(-1, Math.min(1, b / 25));
    }
    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      this.k.fit();
      const { ctx, c } = this.k; const W = c.width, H = c.height; const R = Math.min(W, H) * 0.42; const cx = W / 2, cy = H / 2 - H * 0.04;
      if (!W || !H) { this.raf = requestAnimationFrame(this.loop.bind(this)); return; }
      if (this.touchFallback && this.touch) { const rect = c.getBoundingClientRect(); const tx = (this.touch.x - rect.left) * devicePixelRatio, ty = (this.touch.y - rect.top) * devicePixelRatio; this.tilt.x = Math.max(-1, Math.min(1, (tx - cx) / R)); this.tilt.y = Math.max(-1, Math.min(1, (ty - cy) / R)); }
      else if (this.touchFallback) { this.tilt.x *= 0.9; this.tilt.y *= 0.9; }
      // physics in unit bowl coords
      const g = this.p.grav * 2.2;
      this.vel.x += this.tilt.x * g * dt; this.vel.y += this.tilt.y * g * dt;
      this.vel.x *= (1 - 0.9 * dt); this.vel.y *= (1 - 0.9 * dt);
      this.pos.x += this.vel.x * dt; this.pos.y += this.vel.y * dt;
      const d = Math.hypot(this.pos.x, this.pos.y);
      if (d > 1.0 && !this.done) { this.cb.onDrop('drop'); this.pos = { x: 0, y: 0 }; this.vel = { x: 0, y: 0 }; this.inTime = Math.max(0, this.inTime - this.p.need * 0.5); this.dropAnim = 1; if (navigator.vibrate) navigator.vibrate(200); }
      // ring drift
      this.ring.x += this.ring.vx * dt; this.ring.y += this.ring.vy * dt;
      if (Math.hypot(this.ring.x, this.ring.y) > 0.62) { this.ring.vx *= -1; this.ring.vy *= -1; }
      const inRing = Math.hypot(this.pos.x - this.ring.x, this.pos.y - this.ring.y) < this.p.ring;
      if (inRing && !this.done) this.inTime += dt; else if (!this.done) this.inTime = Math.max(0, this.inTime - dt * 0.4);
      const prog = Math.min(1, this.inTime / this.p.need);
      this.cb.onProgress(prog);
      if (prog >= 1 && !this.done) { this.done = true; this.flash = 1; this.cb.onItem(); setTimeout(() => { this.done = false; this.inTime = 0; this.newRing(false); }, 900); }
      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1a1230'; ctx.fillRect(0, 0, W, H);
      // bowl
      const grad = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R); grad.addColorStop(0, '#3b2d5e'); grad.addColorStop(1, '#17102b');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.strokeStyle = this.dropAnim > 0 ? `rgba(255,80,80,${this.dropAnim})` : '#7d6bb3'; ctx.lineWidth = 8 * devicePixelRatio; ctx.stroke();
      this.dropAnim = Math.max(0, this.dropAnim - dt * 2);
      // ring target
      const rx = cx + this.ring.x * R, ry = cy + this.ring.y * R;
      ctx.beginPath(); ctx.arc(rx, ry, this.p.ring * R, 0, 7); ctx.fillStyle = inRing ? 'rgba(120,255,160,.25)' : 'rgba(255,215,90,.12)'; ctx.fill();
      ctx.strokeStyle = inRing ? '#7dffa0' : '#ffd75a'; ctx.lineWidth = 4 * devicePixelRatio; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]);
      // progress arc around ring
      ctx.beginPath(); ctx.arc(rx, ry, this.p.ring * R + 10 * devicePixelRatio, -Math.PI / 2, -Math.PI / 2 + prog * 6.283); ctx.strokeStyle = '#7dffa0'; ctx.lineWidth = 6 * devicePixelRatio; ctx.stroke();
      // marble
      const mx = cx + this.pos.x * R, my = cy + this.pos.y * R; const mr = R * 0.09;
      const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr); mg.addColorStop(0, '#fff'); mg.addColorStop(0.3, '#8fe3ff'); mg.addColorStop(1, '#1f7fb0');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
      if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.6})`; ctx.fillRect(0, 0, W, H); this.flash -= dt * 2; }
      // hint text
      ctx.fillStyle = '#c9bfe6'; ctx.font = `${18 * devicePixelRatio}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(this.touchFallback ? 'Touch & drag to tilt the bowl. Keep the marble in the ring.' : (this.zero ? 'Tilt gently. Keep the marble in the ring.' : 'Hold the phone flat...'), cx, H - 30 * devicePixelRatio);
      this.raf = requestAnimationFrame(this.loop.bind(this));
    }
    destroy() { cancelAnimationFrame(this.raf); this.k.off(); }
  }

  // ---------- GEM THREAD (drag along wiggly path) ----------
  class Gem {
    constructor(container, p, cb) {
      this.p = p; this.cb = cb; this.k = mkCanvas(container);
      this.newPath(); this.drag = false; this.flash = 0; this.slipAnim = 0; this.last = performance.now();
      const c = this.k.c;
      const pt = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * devicePixelRatio, y: (e.clientY - r.top) * devicePixelRatio }; };
      c.addEventListener('pointerdown', e => { const q = pt(e); const g = this.gemPos(); if (Math.hypot(q.x - g.x, q.y - g.y) < this.wpx() * 1.6) { this.drag = true; c.setPointerCapture(e.pointerId); } });
      c.addEventListener('pointermove', e => { if (this.drag) this.move(pt(e)); });
      const up = () => { this.drag = false; };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      this.raf = requestAnimationFrame(this.loop.bind(this));
    }
    wpx() { return this.p.width * Math.min(this.k.c.width, this.k.c.height); }
    newPath() {
      const W = this.k.c.width, H = this.k.c.height; const n = this.p.segs; const pts = [];
      const m = 0.16 * W; let dir = Math.random() < 0.5 ? 1 : -1;
      for (let i = 0; i <= n; i++) { const y = H * 0.85 - (H * 0.7) * (i / n); const x = i === 0 ? W / 2 : W / 2 + dir * (0.5 + Math.random() * 0.5) * (W / 2 - m) * this.p.wiggle; pts.push({ x, y }); dir *= -1; }
      // Catmull-Rom sample to dense polyline
      const dense = [];
      for (let i = 0; i < n; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)]; for (let s = 0; s < 24; s++) { const t = s / 24, t2 = t * t, t3 = t2 * t; dense.push({ x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3), y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) }); } }
      dense.push(pts[n]);
      this.path = dense; this.idx = 0; this.check = 0; this.done = false;
    }
    gemPos() { return this.path[this.idx]; }
    move(q) {
      if (this.done) return;
      // find nearest point within a look-ahead window
      let best = -1, bd = 1e9;
      for (let i = Math.max(0, this.idx - 6); i < Math.min(this.path.length, this.idx + 14); i++) { const p = this.path[i]; const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < bd) { bd = d; best = i; } }
      if (bd > this.wpx() * 0.55) { // slipped off
        this.drag = false; this.cb.onDrop('slip'); this.slipAnim = 1; this.idx = this.check; if (navigator.vibrate) navigator.vibrate(120);
        this.cb.onProgress(this.idx / (this.path.length - 1)); return;
      }
      if (best > this.idx) this.idx = best;
      const prog = this.idx / (this.path.length - 1);
      if (prog > 0.5 && this.check < Math.floor(this.path.length * 0.5)) this.check = Math.floor(this.path.length * 0.5);
      if (prog > 0.75 && this.check < Math.floor(this.path.length * 0.75)) this.check = Math.floor(this.path.length * 0.75);
      this.cb.onProgress(prog);
      if (this.idx >= this.path.length - 2) { this.done = true; this.drag = false; this.flash = 1; this.cb.onItem(); setTimeout(() => this.newPath(), 900); }
    }
    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (this.k.fit() || this.path.length < 3) this.newPath();
      const { ctx, c } = this.k; const W = c.width, H = c.height;
      if (!W || !H) { this.raf = requestAnimationFrame(this.loop.bind(this)); return; }
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#1a1230'; ctx.fillRect(0, 0, W, H);
      // path
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); this.path.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = this.slipAnim > 0 ? `rgba(255,80,80,${0.4 + this.slipAnim * 0.5})` : '#4b3a7a'; ctx.lineWidth = this.wpx(); ctx.stroke();
      ctx.strokeStyle = '#8f7fd1'; ctx.lineWidth = 3 * devicePixelRatio; ctx.setLineDash([8, 10]); ctx.stroke(); ctx.setLineDash([]);
      this.slipAnim = Math.max(0, this.slipAnim - dt * 2);
      // done part
      ctx.beginPath(); for (let i = 0; i <= this.idx; i++) { const p = this.path[i]; i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.strokeStyle = 'rgba(125,255,160,.45)'; ctx.lineWidth = this.wpx(); ctx.stroke();
      // checkpoint & end
      const end = this.path[this.path.length - 1], st = this.path[0], u = devicePixelRatio;
      // start: a dark hole; end: a coin pile
      ctx.fillStyle = '#0b0716'; ctx.beginPath(); ctx.ellipse(st.x, st.y, 22 * u, 12 * u, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#3b2d5e'; ctx.lineWidth = 3 * u; ctx.stroke();
      [[-14, 6], [0, 8], [14, 6], [-7, 0], [7, 0], [0, -7]].forEach(([dx, dy]) => { ctx.fillStyle = '#a87a18'; ctx.beginPath(); ctx.ellipse(end.x + dx * u, end.y + dy * u + 2 * u, 11 * u, 6 * u, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f6c945'; ctx.beginPath(); ctx.ellipse(end.x + dx * u, end.y + dy * u, 11 * u, 6 * u, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#a87a18'; ctx.lineWidth = 1.5 * u; ctx.stroke(); });
      // gem
      const g = this.gemPos(); const r = this.wpx() * 0.42;
      ctx.beginPath(); ctx.moveTo(g.x, g.y - r); ctx.lineTo(g.x + r, g.y); ctx.lineTo(g.x, g.y + r); ctx.lineTo(g.x - r, g.y); ctx.closePath();
      ctx.fillStyle = this.drag ? '#ff8fd0' : '#ff5f9e'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * devicePixelRatio; ctx.stroke();
      if (!this.drag && !this.done) { ctx.fillStyle = '#c9bfe6'; ctx.font = `${18 * devicePixelRatio}px sans-serif`; ctx.fillText('Press the gem and slide it along the path. Stay inside!', W / 2, H - 30 * devicePixelRatio); }
      if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.6})`; ctx.fillRect(0, 0, W, H); this.flash -= dt * 2; }
      this.raf = requestAnimationFrame(this.loop.bind(this));
    }
    motion() {}
    destroy() { cancelAnimationFrame(this.raf); this.k.off(); }
  }

  T.create = (type, container, p, cb) => {
    if (type === 'marble') return new Marble(container, p, cb);
    return new Gem(container, p, cb);
  };
  global.Tasks = T;
})(window);
