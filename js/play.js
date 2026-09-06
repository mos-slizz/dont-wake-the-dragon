/* Phone client. Joins a room, streams calibrated wobble to the TV, runs Thief tasks, shows the tiptoe level. */
(function () {
  'use strict';
  const { clamp, pick, fmt } = DWTD;
  const $ = (s) => document.querySelector(s);
  const screens = {};
  const P = { room: null, pid: null, name: '', em: 'fox', tier: 'squire', relay: null, state: null, calibFor: 0, calib: null, mode: 'motion', task: null, taskType: null, sendTimer: null, hbTimer: null, lastEvTs: 0, touch: { down: false, x: 0, y: 0, moved: 0 }, phaseShown: null, thiefFor: 0, lastLine: 0, resultFor: null, ttFor: null, blameUntil: 0 };

  // ---------- Sensors ----------
  const Sensors = {
    samples: [], tilt: { beta: 0, gamma: 0 }, got: false, gotOrient: false, prevA: null, prevO: null, started: false,
    async start() {
      if (this.started) return; this.started = true;
      try { if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') { const r = await DeviceMotionEvent.requestPermission(); if (r !== 'granted') return; } } catch (e) { /* ignore */ }
      try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch (e) { }
      window.addEventListener('devicemotion', (e) => {
        const a = e.accelerationIncludingGravity && e.accelerationIncludingGravity.x != null ? e.accelerationIncludingGravity : e.acceleration;
        if (!a || a.x == null) return;
        const now = performance.now();
        let s = 0;
        if (this.prevA) s += Math.hypot(a.x - this.prevA.x, a.y - this.prevA.y, a.z - this.prevA.z);
        this.prevA = { x: a.x, y: a.y, z: a.z };
        const r = e.rotationRate; if (r && r.alpha != null) s += Math.hypot(r.alpha, r.beta, r.gamma) / 25;
        this.samples.push([now, s]); if (this.samples.length > 60) this.samples.shift();
        this.got = true;
      });
      window.addEventListener('deviceorientation', (e) => {
        if (e.beta == null) return;
        this.tilt = { beta: e.beta, gamma: e.gamma }; this.gotOrient = true;
        if (!this.got) { // orientation-only fallback: wobble from angle deltas
          const now = performance.now();
          if (this.prevO) { const s = (Math.abs(e.beta - this.prevO.b) + Math.abs(e.gamma - this.prevO.g)) * 0.3; this.samples.push([now, s]); if (this.samples.length > 60) this.samples.shift(); }
          this.prevO = { b: e.beta, g: e.gamma };
        }
      });
    },
    raw() { const now = performance.now(); const w = this.samples.filter(s => now - s[0] < 160); if (!w.length) return 0; return w.reduce((a, s) => a + s[1], 0) / w.length; },
    available() { return this.got || this.gotOrient; },
  };

  // ---------- boot ----------
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('section[data-screen]').forEach(s => screens[s.dataset.screen] = s);
    P.room = (new URLSearchParams(location.search).get('r') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    const saved = JSON.parse(localStorage.getItem('dwtd_me') || 'null');
    if (saved) { P.name = saved.name; P.em = ART.AVATARS[saved.em] ? saved.em : 'fox'; P.tier = saved.tier; }
    P.pid = sessionStorage.getItem('dwtd_pid') || DWTD.uid(8); sessionStorage.setItem('dwtd_pid', P.pid);
    buildJoin();
    show('join');
    $('#joinbtn').addEventListener('click', onJoin);
    $('#roomcode').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
    document.querySelectorAll('.capbtn').forEach(b => b.addEventListener('click', () => { P.relay && P.relay.publish('p/' + P.pid, { t: 'next' }); b.disabled = true; setTimeout(() => b.disabled = false, 1500); }));
    setupTouchEgg();
    $('#ttslider').addEventListener('input', () => { });
  });
  function show(name) { for (const k in screens) screens[k].hidden = k !== name; P.phaseShown = name; }

  function buildJoin() {
    $('#roomcode').value = P.room; $('#roomwrap').hidden = !!P.room;
    $('#name').value = P.name;
    const av = $('#avatars'); av.innerHTML = DWTD.AVATARS.map(e => `<button type="button" class="${e === P.em ? 'sel' : ''}" data-em="${e}" aria-label="${ART.avatarName(e)}">${ART.avatar(e)}</button>`).join('');
    av.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; P.em = b.dataset.em; av.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); });
    const tw = $('#tiers'); tw.innerHTML = DWTD.TIERS.map(t => `<button type="button" class="${t.key === P.tier ? 'sel' : ''}" data-tier="${t.key}">${ART.icon(t.icon)}<b>${t.label}</b><small>${t.sub}</small></button>`).join('');
    tw.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; P.tier = b.dataset.tier; tw.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); });
  }

  async function onJoin() {
    const name = $('#name').value.trim(); if (!name) { $('#name').focus(); return; }
    P.room = $('#roomcode').value.trim().toUpperCase(); if (P.room.length !== 4) { $('#roomcode').focus(); return; }
    P.name = name; localStorage.setItem('dwtd_me', JSON.stringify({ name, em: P.em, tier: P.tier }));
    $('#joinbtn').disabled = true; $('#joinbtn').textContent = 'Waking sensors…';
    await Sensors.start(); // must be inside the tap
    try { if (navigator.wakeLock) await navigator.wakeLock.request('screen'); } catch (e) { }
    document.addEventListener('visibilitychange', async () => { if (!document.hidden) { try { navigator.wakeLock && await navigator.wakeLock.request('screen'); } catch (e) { } } });
    show('wait'); $('#waitmsg').textContent = 'Connecting to the relay…';
    P.relay = new DWTD.Relay(P.room, (st) => { $('#conn').dataset.st = st; $('#conn').textContent = st === 'connected' ? '● linked' : '● ' + st; });
    P.relay.subscribe('tv');
    P.relay.onMessage(onMsg);
    await P.relay.connect();
    sendJoin();
    $('#waitmsg').textContent = 'Looking for the TV… (is the room code right?)';
    setTimeout(() => { if (!P.state) $('#waitmsg').innerHTML = 'Still looking. Check the code on the TV is <b>' + P.room + '</b>, then <a href="javascript:location.reload()">try again</a>.'; }, 8000);
    P.hbTimer = setInterval(() => P.relay.publish('p/' + P.pid, { t: 'hb' }), 3000);
    P.sendTimer = setInterval(sendSamples, 160);
    setTimeout(() => { P.mode = Sensors.available() ? 'motion' : 'touch'; sendJoin(); }, 2500);
  }
  window.__dwtd = { P, Sensors, send: (o) => P.relay && P.relay.publish('p/' + P.pid, o) };
  function sendJoin() { P.relay.publish('p/' + P.pid, { t: 'join', name: P.name, em: P.em, tier: P.tier, sens: P.mode }); }
  function send(o) { P.relay.publish('p/' + P.pid, o); }

  // ---------- incoming ----------
  function onMsg(topic, m) {
    if (m.ev) { onEvent(m); return; }
    if (!m.ph) return;
    if (m.ts && P.state && m.ts < P.state.ts - 3000) return; // ignore a stale retained snapshot
    P.state = m; render();
  }
  function me() { return P.state && P.state.pl.find(p => p.id === P.pid); }
  function onEvent(m) {
    const my = me(); if (!my) return;
    if (m.ev === 'blame' && m.pid === P.pid) { vib([120, 60, 240]); P.blameUntil = Date.now() + 1800; flash('#ff5f5f'); }
    if (m.ev === 'eye' && my.role === 'lookout') { vib([40, 40, 40]); }
    if (m.ev === 'clang') { if (my.role === 'lookout') flash('#ffd75a'); }
    if (m.ev === 'phew') { vib(30); }
    if (m.ev === 'fail') { vib([300, 100, 300, 100, 600]); flash('#ff3d1a', 900); }
    if (m.ev === 'win') { vib([60, 40, 60, 40, 200]); }
    if (m.ev === 'step') { vib(50); }
  }
  function vib(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }
  function flash(color, ms = 350) { const f = $('#flash'); f.style.background = color; f.hidden = false; f.style.opacity = '.85'; setTimeout(() => { f.style.opacity = '0'; setTimeout(() => f.hidden = true, 300); }, ms); }

  // ---------- calibration & sampling ----------
  function noise() {
    if (P.mode === 'touch' && P.state && P.state.ph === 'tiptoe') { const v = +$('#ttslider').value; const d = Math.abs(v - (P.lastSlider == null ? v : P.lastSlider)); P.lastSlider = v; return clamp(d / 25, 0, 3); }
    if (P.mode === 'touch') { const t = P.touch; if (!t.down) return 1.2; const n = t.moved / 40; t.moved *= 0.5; return clamp(n, 0, 3); }
    const raw = Sensors.raw(); const c = P.calib || { base: 0.08, sd: 0.03 };
    return clamp((raw - c.base - 1.2 * c.sd - 0.01) / 0.3, 0, 3);
  }
  function startCalib(n) {
    P.calibFor = n; P.calib = null;
    if (P.mode === 'touch') { send({ t: 'calib', ok: true, sens: 'touch' }); return; }
    const vals = []; const t0 = Date.now();
    const iv = setInterval(() => {
      vals.push(Sensors.raw());
      const pct = clamp((Date.now() - t0) / 2200, 0, 1); $('#calibfill').style.width = pct * 100 + '%';
      if (Date.now() - t0 >= 2200) {
        clearInterval(iv);
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
        P.calib = { base: Math.min(mean, 0.25), sd: clamp(sd, 0.012, 0.08) };
        $('#calibmsg').textContent = pick(['Got it. You\'re a rock.', 'Locked in. Don\'t breathe weird.', 'Perfect. Now… don\'t.', 'Calibrated. The dragon knows your wobble now.']);
        send({ t: 'calib', ok: true, sens: 'motion', base: +mean.toFixed(3), sd: +sd.toFixed(3) });
      }
    }, 50);
  }
  function sendSamples() {
    const s = P.state; if (!s) return; const my = me(); if (!my) return;
    const inTiptoe = s.ph === 'tiptoe';
    const isLookout = s.ph === 'heist' && my.role === 'lookout';
    if (!(inTiptoe || isLookout || s.ph === 'calib')) return;
    const msg = { t: 'w', n: +noise().toFixed(3) };
    if (inTiptoe) msg.a = P.mode === 'touch' ? +$('#ttslider').value : Math.round(Sensors.tilt.gamma || 0);
    send(msg);
    P.lastN = msg.n;
  }

  function setupTouchEgg() {
    const egg = $('#egg'); const t = P.touch;
    const dn = e => { t.down = true; t.x = e.clientX; t.y = e.clientY; egg.classList.add('held'); };
    const mv = e => { if (!t.down) return; t.moved += Math.hypot(e.clientX - t.x, e.clientY - t.y); t.x = e.clientX; t.y = e.clientY; };
    const up = () => { t.down = false; egg.classList.remove('held'); };
    egg.addEventListener('pointerdown', dn); egg.addEventListener('pointermove', mv); egg.addEventListener('pointerup', up); egg.addEventListener('pointercancel', up); egg.addEventListener('pointerleave', up);
  }

  // ---------- render ----------
  function render() {
    const s = P.state; const my = me();
    if (!my) { show('wait'); $('#waitmsg').textContent = 'Joining…'; sendJoin(); return; }
    document.querySelectorAll('.capbtn').forEach(b => b.hidden = !my.cap);
    $('#meterfill').style.width = s.m + '%'; $('#face').dataset.s = s.st; $('#stagename').textContent = DWTD.STAGES[s.st].label;
    if (s.ph === 'lobby') {
      show('lobby'); $('#lobbywho').innerHTML = `${ART.avatar(my.em)}<span>${my.name}</span>`; $('#lobbydragon').textContent = s.dn;
      $('#lobbysens').textContent = P.mode === 'touch' ? 'No motion sensors found on this phone, so you\'ll play in touch mode: keep a thumb on the egg.' : 'Motion sensors: ready.';
      $('#lobbycount').textContent = `${s.pl.filter(p => p.on).length} sneak${s.pl.length === 1 ? '' : 's'} in the room`;
      if (P.task) { P.task.destroy(); P.task = null; }
      return;
    }
    if (s.ph === 'calib') {
      show('calib'); $('#calibrole').innerHTML = my.role === 'thief' ? `${ART.icon('mask', 'gold')} You're the THIEF this time. Job: ${s.task && s.task.type === 'marble' ? 'balance the marble' : 'thread the gem'}.` : `${ART.icon('eye')} You're a LOOKOUT. Job: be furniture.`;
      if (s.h && P.calibFor !== s.h.n) { $('#calibfill').style.width = '0%'; $('#calibmsg').textContent = P.mode === 'touch' ? 'Touch mode: keep a thumb on the egg during heists.' : 'Hold still… measuring your wobble.'; startCalib(s.h.n); }
      return;
    }
    if (s.ph === 'countdown') { show('countdown'); $('#cd').textContent = s.cd > 0 ? s.cd : 'shh'; return; }
    if (s.ph === 'heist') {
      if (my.role === 'thief') renderThief(s); else renderLookout(s);
      return;
    }
    if (s.ph === 'tiptoe') { renderTiptoe(s); return; }
    if (s.ph === 'result' || s.ph === 'gameover') { renderResult(s, my); return; }
  }

  function setItems(el, s) { if (!s.h) return; const k = s.h.got + '/' + s.h.items; if (el.dataset.k === k) return; el.dataset.k = k; el.innerHTML = Array.from({ length: s.h.items }, (_, i) => ART.icon(i < s.h.got ? 'bag' : 'slot', i < s.h.got ? 'gold' : 'dim')).join(''); }
  function renderLookout(s) {
    if (P.phaseShown !== 'lookout') { show('lookout'); if (P.task) { P.task.destroy(); P.task = null; } }
    $('#egg').hidden = P.mode !== 'touch'; $('#stillring').hidden = P.mode === 'touch';
    const n = P.lastN || 0; const band = n < 0.08 ? 0 : n < 0.25 ? 1 : n < 0.5 ? 2 : n < 1 ? 3 : 4;
    const ring = $('#stillring'); ring.style.setProperty('--n', clamp(n, 0, 1)); ring.dataset.band = band;
    const now = Date.now();
    if (now < P.blameUntil) $('#stillline').textContent = pick(['THE TV IS LOOKING AT YOU.', 'That was you. Everyone knows.', 'Shh!!']);
    else if (now - P.lastLine > 2200) { P.lastLine = now; $('#stillline').textContent = pick(DWTD.STILL_LINES[band]); }
    setItems($('#lkitems'), s);
    const thief = s.pl.find(p => p.id === s.h.tid); const tk = thief ? thief.id : ''; if ($('#lkthief').dataset.k !== tk) { $('#lkthief').dataset.k = tk; $('#lkthief').innerHTML = thief ? `${ART.avatar(thief.em)} ${thief.name} is stealing…` : ''; }
    document.body.dataset.stage = s.st;
  }
  function renderThief(s) {
    if (P.phaseShown !== 'thief' || P.thiefFor !== s.h.n) {
      show('thief'); P.thiefFor = s.h.n;
      if (P.task) P.task.destroy();
      const type = s.task.type;
      P.task = Tasks.create(type, $('#taskwrap'), s.task.p, {
        onProgress: (p) => { $('#taskprog').style.width = p * 100 + '%'; },
        onItem: () => { send({ t: 'task', ev: 'item' }); vib(80); },
        onDrop: (k) => { send({ t: 'task', ev: k }); },
      });
      if (type === 'marble' && P.task.setTouchFallback) P.task.setTouchFallback(!Sensors.gotOrient);
      $('#taskname').innerHTML = type === 'marble' ? ART.icon('marble') + ' Balance the marble in the ring' : ART.icon('gem') + ' Thread the gem along the path';
      P.tiltTimer && clearInterval(P.tiltTimer);
      P.tiltTimer = setInterval(() => { if (P.task && P.task.motion) P.task.motion(Sensors.tilt); }, 33);
    }
    setItems($('#thitems'), s);
    $('#thnap').innerHTML = s.h ? `${ART.icon('moon')} ${s.h.nap}s` : '';
  }
  function renderTiptoe(s) {
    if (P.phaseShown !== 'tiptoe') { show('tiptoe'); if (P.task) { P.task.destroy(); P.task = null; } clearInterval(P.tiltTimer); if (P.mode === 'touch') $('#ttslider').value = 0; }
    const tt = s.tt; if (!tt) return;
    const dir = tt.target === 0 ? ART.icon('flat') + ' Hold FLAT' : tt.target < 0 ? `${ART.icon('left')} Lean LEFT ${-tt.target}°` : `${ART.icon('right')} Lean RIGHT ${tt.target}°`; if ($('#ttdir').dataset.k !== dir) { $('#ttdir').dataset.k = dir; $('#ttdir').innerHTML = dir; }
    $('#ttstep').textContent = `Step ${tt.step + 1} of ${tt.steps}`;
    const a = P.mode === 'touch' ? +$('#ttslider').value : (Sensors.tilt.gamma || 0);
    const ok = tt.ok.includes(P.pid);
    const bub = $('#bubble'); bub.style.left = clamp(50 + a / 90 * 50, 2, 98) + '%'; bub.dataset.ok = ok ? '1' : '0';
    $('#tttarget').style.left = clamp(50 + tt.target / 90 * 50, 2, 98) + '%';
    $('#ttmsg').textContent = ok ? pick(['Hold it…', 'Perfect. Freeze.', 'Yes. Like that.']) : (Math.abs(a) < Math.abs(tt.target) - 13 ? 'More…' : Math.abs(a) > Math.abs(tt.target) + 13 ? 'Too far! Back a bit.' : 'Get to the target');
    $('#tthold').style.width = tt.hold * 100 + '%';
    $('#ttwho').textContent = `${tt.ok.length} / ${s.pl.filter(p => p.on).length} in position`;
    $('#ttslider').hidden = P.mode !== 'touch';
  }
  function renderResult(s, my) {
    const r = s.res; if (!r) return;
    const key = s.ph + ':' + (s.h ? s.h.n : 0) + ':' + r.win;
    if (P.resultFor === key) return; P.resultFor = key;
    show('result'); if (P.task) { P.task.destroy(); P.task = null; } clearInterval(P.tiltTimer);
    const awards = (r.awards || []).filter(a => a.pid === P.pid).map(a => { const aw = DWTD.AWARDS[a.k]; return `<div class="aw">${ART.icon(aw.icon, 'gold')} <b>${aw.title}</b><br><small>${aw.blurb}</small></div>`; }).join('');
    let h = '';
    if (r.gameover) h = `<h2>${ART.icon('trophy', 'gold')} Final loot: ${r.loot}</h2><p>${r.text}</p>${awards ? '<h3>Your Hall of Fame</h3>' + awards : ''}`;
    else if (r.win) h = `<h2>${ART.icon('bag', 'gold')} Banked +${r.lootWon}!</h2><p>${r.text}</p>${awards || '<p class="dim">No award this time. Steady on.</p>'}`;
    else if (r.culprit === P.pid) h = `<div class="roast">${ART.avatar(my.em)}${ART.icon('fire')}</div><h2>It was YOU.</h2><p>${r.text}</p>${awards}`;
    else h = `<h2>${ART.icon('fire')} ${s.dn} woke up</h2><p>${r.text}</p><p class="dim">Not your fault. Probably.</p>${awards}`;
    $('#resbody').innerHTML = h;
    $('#resnext').textContent = r.gameover ? 'Play again ▶' : (r.last ? 'Final tally ▶' : 'Next heist ▶');
  }
})();
