/* TV / host logic. The TV is the single source of truth; phones are sensors + task screens. */
(function () {
  'use strict';
  const { pick, clamp, fmt, HEISTS, STAGES } = DWTD;
  const A = TVAudio, DV = DragonView;

  // ---- tuning (playtest knobs) ----
  const TUNE = {
    rise: 45,          // meter points per second at combined noise 1.0
    quiet: 0.03,       // combined noise below this = "quiet", meter decays
    blameLoud: 0.35,   // a single phone above this gets shouted at
    blameCooldown: 3500,
    talkEvery: [9000, 15000],
    tiptoeTol: 13,     // degrees
    tiptoeHold: 1300,  // ms everyone must hold the angle
    tiptoeSens: 0.35,  // wobble counts less while tiptoeing (you're supposed to move a bit)
    stale: 1200,       // ms before a phone's last sample is considered gone
  };
  const $ = (s) => document.querySelector(s);
  const el = {};

  const G = {
    relay: null, room: null, dragon: '', phase: 'boot', players: new Map(), order: [],
    heistIdx: 0, heist: null, thiefId: null, task: null,
    meter: 0, stage: 0, eyeHoldUntil: 0, loud: null, lastBlame: 0, lastTalk: 0, nextTalkIn: 10000,
    got: 0, napEnd: 0, loot: 0, lootThisHeist: 0, awake: false,
    tiptoe: null, result: null, stats: {}, gameStats: {}, hearing: +(localStorage.getItem('dwtd_hearing') || 1), lastPub: 0, lastSnap: 0,
    calibDeadline: 0, countdownEnd: 0, speech: null, toastT: 0, drops: 0, stageHoldMs: 0, thiefCursor: -1,
  };

  // ---------- boot ----------
  window.addEventListener('DOMContentLoaded', () => {
    ['lobby', 'stagewrap', 'qr', 'code', 'url', 'players', 'start', 'status', 'hud', 'meterfill', 'meterlabel', 'title', 'flavor', 'loot', 'nap', 'napfill',
      'row', 'toast', 'speech', 'overlay', 'lootbar', 'sens', 'mute', 'tts', 'scene', 'fx', 'stagelist', 'tvbtn', 'version', 'hearing', 'hearingtag'].forEach(id => el[id] = document.getElementById(id));
    DV.init(el.scene, el.fx);
    el.version.textContent = 'v' + DWTD.VERSION;
    fitStage(); window.addEventListener('resize', fitStage);
    requestAnimationFrame(loop);
    el.sens.innerHTML = DWTD.HEARING.map(([l, v]) => `<option value="${v}">${l}</option>`).join('');
    el.sens.addEventListener('change', () => setHearing(+el.sens.value));
    setHearing(G.hearing);
    el.mute.addEventListener('click', () => { const m = el.mute.dataset.on !== '1'; el.mute.dataset.on = m ? '1' : '0'; el.mute.innerHTML = ART.icon(m ? 'mute' : 'volume') + (m ? ' Muted' : ' Sound'); A.setMuted(m); });
    el.tts.addEventListener('click', () => { const on = el.tts.dataset.on !== '1'; el.tts.dataset.on = on ? '1' : '0'; el.tts.innerHTML = ART.icon('speech') + (on ? ' Sleep-talk on' : ' Sleep-talk off'); A.setTTS(on); });
    el.start.addEventListener('click', () => { A.unlock(); A.start(); startHeist(); });
    el.tvbtn.addEventListener('click', () => onNextButton());
    document.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { A.unlock(); onNextButton(); } if (e.key === 'd') debugNoise(); if (e.key === ']' || e.key === '+' || e.key === '=') setHearing(G.hearing + 0.2); if (e.key === '[' || e.key === '-') setHearing(G.hearing - 0.2); });
    createRoom();
  });

  let lastFit = '';
  function setHearing(v) {
    G.hearing = Math.round(clamp(v, 0.4, 3) * 10) / 10; localStorage.setItem('dwtd_hearing', G.hearing);
    const near = [...DWTD.HEARING].sort((a, b) => Math.abs(a[1] - G.hearing) - Math.abs(b[1] - G.hearing))[0];
    if (Math.abs(near[1] - G.hearing) < 0.01) el.sens.value = String(near[1]);
    el.hearing.textContent = `Dragon hearing is ×${G.hearing.toFixed(1)}. Press [ or ] on the keyboard any time to adjust.`;
    el.hearingtag.textContent = `hearing ×${G.hearing.toFixed(1)}`;
    if (G.phase !== 'lobby' && G.phase !== 'boot') toast(`Dragon hearing ×${G.hearing.toFixed(1)}`, 1200);
  }
  function fitStage() { const key = innerWidth + 'x' + innerHeight; if (key === lastFit) return; lastFit = key; const s = Math.min(innerWidth / 1600, innerHeight / 900); el.stagewrap.style.transform = `translate(-50%,-50%) scale(${s})`; }

  async function createRoom() {
    G.room = sessionStorage.getItem('dwtd_room') || DWTD.roomCode();
    sessionStorage.setItem('dwtd_room', G.room);
    G.dragon = pick(DWTD.DRAGON_NAMES);
    el.code.textContent = G.room;
    const url = DWTD.playUrl(G.room);
    el.url.textContent = url.replace(/^https?:\/\//, '');
    const q = qrcode(0, 'M'); q.addData(url); q.make();
    el.qr.innerHTML = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    $('#dragonname').textContent = G.dragon;
    G.relay = new DWTD.Relay(G.room, (st, url) => { el.status.textContent = st === 'connected' ? `relay: ${url.replace('wss://', '').split('/')[0]}` : `relay ${st}…`; el.status.dataset.st = st; });
    G.relay.subscribe('p/+');
    G.relay.onMessage(onMsg);
    await G.relay.connect();
    setPhase('lobby');
  }

  // ---------- messaging ----------
  function onMsg(topic, m) {
    const pid = topic.split('/').pop();
    if (!m || !m.t) return;
    const now = Date.now();
    if (m.t === 'join') {
      let p = G.players.get(pid);
      if (!p) { p = { id: pid, name: '', em: 'fox', tier: 'squire', sens: 'motion', on: true, last: now, ok: false, n: 0, nAt: 0, tilt: 0, tiltAt: 0, role: 'lookout' }; G.players.set(pid, p); G.order.push(pid); }
      p.name = String(m.name || 'Someone').slice(0, 14); p.em = m.em || p.em; p.tier = m.tier || p.tier; p.sens = m.sens || p.sens; p.on = true; p.last = now;
      if (!G.stats[pid]) G.stats[pid] = freshStats();
      if (!G.gameStats[pid]) G.gameStats[pid] = freshStats();
      renderLobby(); publish(true); A.tick();
      return;
    }
    const p = G.players.get(pid); if (!p) return;
    p.last = now; p.on = true;
    if (m.t === 'hb') return;
    if (m.t === 'calib') { p.ok = true; p.sens = m.sens || p.sens; return; }
    if (m.t === 'w') { p.n = clamp(+m.n || 0, 0, 3); p.nAt = now; if (m.a != null) { p.tilt = +m.a; p.tiltAt = now; } return; }
    if (m.t === 'task') { onTaskMsg(p, m); return; }
    if (m.t === 'next') { onNextButton(); return; }
  }
  function freshStats() { return { nSum: 0, nCount: 0, blames: 0, drops: 0, items: 0, tiptoeFirst: 0, thiefWins: 0 }; }

  function snapshot() {
    const pl = G.order.map(id => { const p = G.players.get(id); return { id, name: p.name, em: p.em, tier: p.tier, role: p.role, on: p.on, ok: p.ok, cap: id === captainId() }; });
    const s = { ph: G.phase, dn: G.dragon, pl, m: Math.round(G.meter), st: G.stage, loud: G.loud, loot: G.loot, ts: Date.now() };
    if (G.heist) s.h = { n: G.heist.n, title: fmt(G.heist.title, { dragon: G.dragon }), items: G.heist.items, got: G.got, nap: Math.max(0, Math.round((G.napEnd - Date.now()) / 1000)), napSec: G.heist.napSec, loot: G.heist.loot, tid: G.thiefId };
    if (G.task) s.task = G.task;
    if (G.tiptoe) s.tt = { step: G.tiptoe.step, steps: G.tiptoe.steps.length, target: G.tiptoe.steps[G.tiptoe.step], ok: G.tiptoe.okIds, hold: G.tiptoe.holdStart ? clamp((Date.now() - G.tiptoe.holdStart) / TUNE.tiptoeHold, 0, 1) : 0 };
    if (G.result) s.res = G.result;
    if (G.phase === 'countdown') s.cd = Math.max(0, Math.ceil((G.countdownEnd - Date.now()) / 1000));
    return s;
  }
  function publish(retain) {
    const s = snapshot();
    G.relay.publish('tv', s, false);
    if (retain) G.relay.publish('tv', s, true);
  }
  function event(k, extra) { G.relay.publish('tv', Object.assign({ ev: k, ts: Date.now() }, extra || {}), false); }

  function captainId() {
    const wiz = G.order.find(id => G.players.get(id).tier === 'wizard');
    return wiz || G.order[0] || null;
  }

  // ---------- phases ----------
  function setPhase(ph) {
    G.phase = ph;
    document.body.dataset.phase = ph;
    el.lobby.hidden = ph !== 'lobby';
    el.hud.hidden = !(ph === 'heist' || ph === 'tiptoe' || ph === 'calib' || ph === 'countdown' || ph === 'result');
    renderOverlay();
    publish(true);
  }
  function onNextButton() {
    if (G.phase === 'lobby') { if (G.order.length) { A.start(); startHeist(); } return; }
    if (G.phase === 'result') { if (G.heistIdx >= HEISTS.length - 1) endGame(); else { G.heistIdx++; startHeist(); } return; }
    if (G.phase === 'gameover') { G.heistIdx = 0; G.loot = 0; for (const id in G.gameStats) G.gameStats[id] = freshStats(); setPhase('lobby'); return; }
  }

  function onlinePlayers() { return G.order.map(id => G.players.get(id)).filter(p => p.on); }
  function lookouts() { return onlinePlayers().filter(p => p.role === 'lookout'); }

  function startHeist() {
    const online = onlinePlayers(); if (!online.length) return;
    G.heist = HEISTS[G.heistIdx];
    G.result = null; G.tiptoe = null; G.awake = false; G.got = 0; G.meter = 0; G.stage = 0; G.loud = null; G.drops = 0; G.eyeHoldUntil = 0;
    G.lootThisHeist = 0; G.stats = {}; for (const id of G.order) G.stats[id] = freshStats();
    // rotate the thief through players, skipping offline ones
    for (let i = 0; i < G.order.length; i++) { G.thiefCursor = (G.thiefCursor + 1) % G.order.length; if (G.players.get(G.order[G.thiefCursor]).on) break; }
    G.thiefId = G.order[G.thiefCursor];
    for (const p of G.players.values()) { p.role = p.id === G.thiefId ? 'thief' : 'lookout'; p.ok = false; p.n = 0; }
    const thief = G.players.get(G.thiefId);
    const type = (thief.sens === 'motion' && Math.random() < 0.55) ? 'marble' : 'gem';
    G.task = { type, p: Tasks.paramsFor(type, thief.tier, G.heist.n) };
    DV.set({ lootLeft: 1, awake: false, fire: 0, stage: 0, lookAt: null, crown: G.heist.n === 6 });
    el.title.textContent = `Heist ${G.heist.n}: ${fmt(G.heist.title, { dragon: G.dragon })}`;
    el.flavor.textContent = fmt(G.heist.flavor, { dragon: G.dragon });
    // calibration
    G.calibDeadline = Date.now() + 7000;
    setPhase('calib');
    A.yawn();
    renderRow();
  }
  function beginCountdown() {
    G.countdownEnd = Date.now() + 3600; G._cdLast = 4;
    setPhase('countdown');
  }
  function beginHeist() {
    G.napEnd = Date.now() + G.heist.napSec * 1000;
    G.lastTalk = Date.now(); G.nextTalkIn = 6000;
    setPhase('heist');
    A.setStage(0);
    toast('Shh… go.', 1200);
  }
  function beginTiptoe() {
    const n = G.heist.tiptoe;
    const all = [-30, 30, 0, -45, 45];
    const steps = []; let last = 999;
    while (steps.length < n) { const a = pick(all); if (a !== last) { steps.push(a); last = a; } }
    G.tiptoe = { step: 0, steps, holdStart: 0, okIds: [], firstId: null };
    G.task = null;
    for (const p of G.players.values()) p.n = 0;
    setPhase('tiptoe');
    A.whoosh(); A.say('mmm... footsteps...', { rate: 0.6 });
    toast('TIPTOE OUT! Everyone lean together… slowly.', 2500, null, 'shoe');
  }

  function failHeist(cause, culpritId) {
    if (G.phase === 'result') return;
    G.awake = true; G.stage = 4;
    A.setStage(4); A.hush(); A.roar(); setTimeout(() => A.fire(), 500);
    DV.set({ awake: true, fire: 1, stage: 4 });
    const culprit = culpritId ? G.players.get(culpritId) : null;
    let text;
    if (cause === 'sun') text = pick(DWTD.TIMEOUT_LINES);
    else if (cause === 'thief') text = fmt(pick(DWTD.THIEF_EPITAPHS), { name: culprit ? culprit.name : 'the thief' });
    else text = fmt(pick(DWTD.EPITAPHS), { name: culprit ? culprit.name : 'somebody' });
    G.result = { win: false, cause, culprit: culpritId, text, awards: computeAwards(false), lootLost: G.heist.loot, loot: G.loot, last: G.heistIdx >= HEISTS.length - 1 };
    event('fail', { culprit: culpritId });
    setTimeout(() => { DV.set({ fire: 0 }); setPhase('result'); A.stop(); A.sad(); }, 2600);
    publish(true);
  }
  function winHeist() {
    if (G.awake || G.result) return;
    G.loot += G.heist.loot; G.stage = 0; A.setStage(0); DV.set({ stage: 0, lookAt: null });
    A.fanfare(); DV.confetti(); DV.coins(30);
    G.result = { win: true, text: pick(DWTD.WIN_LINES), awards: computeAwards(true), lootWon: G.heist.loot, loot: G.loot, last: G.heistIdx >= HEISTS.length - 1 };
    for (const id in G.stats) { const s = G.stats[id], g = G.gameStats[id]; if (g) { g.nSum += s.nSum; g.nCount += s.nCount; g.blames += s.blames; g.drops += s.drops; g.items += s.items; g.tiptoeFirst += s.tiptoeFirst; } }
    if (G.gameStats[G.thiefId]) G.gameStats[G.thiefId].thiefWins++;
    event('win');
    setPhase('result'); A.stop();
    setTimeout(() => A.say('zzz... where did my ' + fmt(G.heist.title, { dragon: G.dragon }).toLowerCase().replace('the ', '') + ' go... zzz', { rate: 0.65 }), 1500);
  }
  function computeAwards(win) {
    const out = [];
    const lk = G.order.filter(id => G.players.get(id).role === 'lookout' && G.stats[id] && G.stats[id].nCount >= 10);
    if (lk.length >= 2) { lk.sort((a, b) => (G.stats[a].nSum / G.stats[a].nCount) - (G.stats[b].nSum / G.stats[b].nCount)); out.push({ k: 'steady', pid: lk[0] }); }
    const shushed = G.order.filter(id => G.stats[id] && G.stats[id].blames > 0).sort((a, b) => G.stats[b].blames - G.stats[a].blames)[0];
    if (shushed && !(out[0] && out[0].pid === shushed)) out.push({ k: 'shushed', pid: shushed });
    if (G.thiefId && G.stats[G.thiefId]) { if (win && G.stats[G.thiefId].drops === 0) out.push({ k: 'clutch', pid: G.thiefId }); else if (G.stats[G.thiefId].drops >= 3) out.push({ k: 'butter', pid: G.thiefId }); }
    if (win && G.tiptoe && G.tiptoe.firstId) out.push({ k: 'tiptoe', pid: G.tiptoe.firstId });
    return out.slice(0, 3);
  }
  function endGame() {
    const ids = G.order.filter(id => G.gameStats[id]);
    const avg = id => G.gameStats[id].nCount ? G.gameStats[id].nSum / G.gameStats[id].nCount : 9;
    const hall = [];
    const st = ids.filter(id => G.gameStats[id].nCount >= 20).sort((a, b) => avg(a) - avg(b))[0]; if (st) hall.push({ k: 'steady', pid: st });
    const sh = ids.sort((a, b) => G.gameStats[b].blames - G.gameStats[a].blames)[0]; if (sh && G.gameStats[sh].blames > 0) hall.push({ k: 'shushed', pid: sh });
    const bt = ids.sort((a, b) => G.gameStats[b].drops - G.gameStats[a].drops)[0]; if (bt && G.gameStats[bt].drops >= 2) hall.push({ k: 'butter', pid: bt });
    G.result = { win: G.loot > 0, text: G.loot >= 1500 ? 'The dragon woke up broke. You monsters. You beautiful monsters.' : G.loot > 0 ? 'Not bad for a family that giggles this much.' : 'The dragon is fine. The dragon is well-fed. The dragon says thanks.', awards: hall, loot: G.loot, gameover: true };
    setPhase('gameover'); A.fanfare(); DV.confetti();
  }

  // ---------- thief task messages ----------
  function onTaskMsg(p, m) {
    if (p.id !== G.thiefId || G.phase !== 'heist') return;
    if (m.ev === 'drop') { G.meter = clamp(G.meter + 22, 0, 100); G.drops++; G.stats[p.id].drops++; A.clang(); toast('CLANG!!', 1200); DV.set({ twitch: 1 }); event('clang'); G.lastThiefNoise = Date.now(); }
    else if (m.ev === 'slip') { G.meter = clamp(G.meter + 12, 0, 100); G.drops++; G.stats[p.id].drops++; A.clink(); toast('clink…', 900); DV.set({ twitch: 0.5 }); G.lastThiefNoise = Date.now(); }
    else if (m.ev === 'item') { G.got++; G.stats[p.id].items++; A.item(); DV.coins(8); DV.set({ lootLeft: 1 - G.got / G.heist.items }); toast(pick(['Got one!', 'Sneaky!', 'Ooh, shiny.', 'Pocketed.']), 1000, null, 'bag'); event('item'); if (G.got >= G.heist.items) setTimeout(beginTiptoe, 700); }
    if (m.prog != null) G.taskProg = +m.prog;
  }

  // ---------- main loop ----------
  // Game logic ticks on a timer (keeps running if the tab is briefly hidden); drawing happens in rAF.
  let lastTick = 0;
  setInterval(tick, 33);
  function tick() {
    const now = performance.now();
    const dt = Math.min(0.06, lastTick ? (now - lastTick) / 1000 : 0.016); lastTick = now;
    const t = Date.now();
    for (const p of G.players.values()) { const wasOn = p.on; p.on = t - p.last < 10000; if (wasOn !== p.on) { renderLobby(); renderRow(); } }
    if (G.phase === 'calib') {
      const on = onlinePlayers();
      if ((on.length && on.every(p => p.ok)) || t > G.calibDeadline) beginCountdown();
    } else if (G.phase === 'countdown') {
      const left = Math.ceil((G.countdownEnd - t) / 1000);
      if (left !== G._cdLast) { G._cdLast = left; A.countdown(left); renderOverlay(); }
      if (t >= G.countdownEnd) beginHeist();
    } else if (G.phase === 'heist' || G.phase === 'tiptoe') {
      tickMeter(dt, t);
      if (G.phase === 'heist' && t > G.napEnd && !G.awake) failHeist('sun', null);
      if (G.phase === 'tiptoe' && !G.awake) tickTiptoe(t);
      if (G.phase === 'heist' && t - G.lastTalk > G.nextTalkIn && !G.awake) { G.lastTalk = t; G.nextTalkIn = TUNE.talkEvery[0] + Math.random() * (TUNE.talkEvery[1] - TUNE.talkEvery[0]); sleepTalk(); }
    }
    // publish cadence
    const rate = (G.phase === 'heist' || G.phase === 'tiptoe' || G.phase === 'countdown' || G.phase === 'calib') ? 120 : 1000;
    if (G.relay && G.relay.connected && t - G.lastPub > rate) { G.lastPub = t; publish(false); }
    if (G.relay && t - G.lastSnap > 4000) { G.lastSnap = t; publish(true); }
    if (now - lastRaf > 400) { renderHud(); DV.frame(now); }
  }
  let lastRaf = 0;
  function loop(now) { lastRaf = now; fitStage(); renderHud(); DV.frame(now); requestAnimationFrame(loop); }

  function tickMeter(dt, t) {
    if (G.awake) return;
    const eyeOpen = G.stage === 3;
    let maxN = 0, sum = 0, loudId = null;
    const preset = G.hearing * G.heist.sens * (G.phase === 'tiptoe' ? TUNE.tiptoeSens : 1);
    for (const p of G.players.values()) {
      if (!p.on) continue;
      if (G.phase === 'heist' && p.role === 'thief') continue; // thief's phone is supposed to move
      const n = (t - p.nAt < TUNE.stale) ? p.n : 0;
      if (G.stats[p.id] && p.role === 'lookout') { G.stats[p.id].nSum += n; G.stats[p.id].nCount++; }
      sum += n; if (n > maxN) { maxN = n; loudId = p.id; }
    }
    const N = (maxN + 0.35 * (sum - maxN)) * preset;
    if (N > TUNE.quiet) G.meter += N * TUNE.rise * (eyeOpen ? DWTD.EYE_SENS : 1) * dt;
    else G.meter -= G.heist.decay * dt;
    G.meter += G.heist.creep * dt;
    G.meter = clamp(G.meter, 0, 100);
    G.loud = maxN > 0.18 ? loudId : null;
    // blame shout
    if (G.loud && maxN * preset > TUNE.blameLoud && t - G.lastBlame > TUNE.blameCooldown) blame(G.loud, false);
    // stage logic with hysteresis + held breath
    let s = G.stage;
    while (s < 4 && G.meter >= STAGES[s + 1].enter) s++;
    while (s > 0 && G.meter < STAGES[s].enter - DWTD.STAGE_HYST && !(s === 3 && t < G.eyeHoldUntil)) s--;
    if (s !== G.stage) changeStage(s, t);
    DV.set({ stage: G.stage, meter: G.meter, lookAt: G.loud ? avatarPos(G.loud) : null });
  }
  function changeStage(s, t) {
    const was = G.stage; G.stage = s;
    A.setStage(s);
    if (s > was) {
      if (s === 1) { DV.set({ twitch: 1 }); A.snort(); }
      if (s === 2) { A.snort(); }
      if (s === 3) { G.eyeHoldUntil = t + DWTD.EYE_HOLD_MS; A.hush(); A.say(pick(DWTD.SLEEP_TALK.eye), { rate: 0.55, pitch: 0.35 }); toast('NOBODY MOVE', 2200, null, 'eye'); event('eye'); }
      if (s === 4) failHeist(G.lastThiefNoise && t - G.lastThiefNoise < 1600 ? 'thief' : 'wobble', G.lastThiefNoise && t - G.lastThiefNoise < 1600 ? G.thiefId : (G.loud || G.lastBlamed || null));
      if (s >= 1 && s < 4 && G.loud) blame(G.loud, true);
    } else {
      if (was === 3) { A.sigh(); toast('…phew.', 1500); event('phew'); DV.burst('heart', 3, 560, 420); }
    }
    event('stage', { s });
  }
  function blame(pid, force) {
    const p = G.players.get(pid); if (!p) return;
    G.lastBlame = Date.now(); G.lastBlamed = pid;
    if (G.stats[pid]) G.stats[pid].blames++;
    A.blame();
    toast(fmt(pick(DWTD.BLAME_LINES), { name: p.name }), 1800, p.em);
    event('blame', { pid });
  }
  function sleepTalk() {
    const key = ['deep', 'twitch', 'mumble', 'eye'][Math.min(3, G.stage)];
    const on = onlinePlayers();
    const line = fmt(pick(DWTD.SLEEP_TALK[key]), { name: on.length ? pick(on).name : 'someone' });
    speech(line, 4200); A.say(line);
  }
  function tickTiptoe(t) {
    const tt = G.tiptoe; const target = tt.steps[tt.step];
    const ps = onlinePlayers(); const ok = [];
    for (const p of ps) { const a = (t - p.tiltAt < 1500) ? p.tilt : 999; if (Math.abs(a - target) <= TUNE.tiptoeTol) ok.push(p.id); }
    tt.okIds = ok;
    if (ok.length && !tt.firstId && tt.step === 0) tt.firstId = ok[0];
    if (ps.length && ok.length === ps.length) {
      if (!tt.holdStart) tt.holdStart = t;
      else if (t - tt.holdStart > TUNE.tiptoeHold) {
        A.step(); tt.step++; tt.holdStart = 0; tt.okIds = []; event('step');
        if (tt.step >= tt.steps.length) { if (G.stats[tt.firstId]) G.stats[tt.firstId].tiptoeFirst++; winHeist(); }
        else { toast(pick(['step…', 'sneak…', 'tiptoe…', 'shhh…']), 900); renderOverlay(); }
      }
    } else tt.holdStart = 0;
  }

  // ---------- rendering (DOM) ----------
  function renderLobby() {
    el.players.innerHTML = G.order.map(id => { const p = G.players.get(id); return `<div class="pl ${p.on ? '' : 'off'}">${ART.avatar(p.em)}<span class="nm">${esc(p.name)}</span><span class="tier">${ART.icon(tierIcon(p.tier))}${p.sens === 'touch' ? ART.icon('hand') : ''}${id === captainId() ? ART.icon('star', 'gold') : ''}</span></div>`; }).join('') || '<div class="hint">Nobody yet. Scan the code!</div>';
    el.start.disabled = !G.order.some(id => G.players.get(id).on);
    el.start.textContent = G.order.length ? `Start the heist (${G.order.filter(id => G.players.get(id).on).length} sneaks)` : 'Waiting for sneaks…';
  }
  function tierIcon(t) { return (DWTD.TIERS.find(x => x.key === t) || {}).icon || 'shield'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function renderRow() {
    el.row.innerHTML = G.order.map(id => { const p = G.players.get(id); return `<div class="pv ${p.on ? '' : 'off'}" data-id="${id}"><div class="avwrap">${ART.avatar(p.em)}<span class="role ${p.role === 'thief' ? 'mask' : 'eye'}" data-k="${p.role === 'thief' ? 'mask' : 'eye'}">${ART.icon(p.role === 'thief' ? 'mask' : 'eye')}</span></div><div class="nm">${esc(p.name)}</div><div class="wob"><i></i></div></div>`; }).join('');
  }
  function avatarPos(id) {
    const d = el.row.querySelector(`.pv[data-id="${id}"]`); if (!d) return null;
    const r = d.getBoundingClientRect(), s = el.stagewrap.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - s.left) / s.width * 1600, y: (r.top - s.top) / s.height * 900 };
  }
  function renderHud() {
    if (el.hud.hidden) return;
    const t = Date.now();
    el.meterfill.style.height = G.meter + '%';
    el.meterlabel.textContent = STAGES[G.stage].label;
    el.meterlabel.dataset.s = G.stage;
    [...el.stagelist.children].forEach((li, i) => li.classList.toggle('on', i === G.stage));
    el.loot.innerHTML = `${ART.icon('coin', 'gold')} ${G.loot} banked`;
    if (G.heist) {
      const frac = clamp((G.napEnd - t) / (G.heist.napSec * 1000), 0, 1);
      el.napfill.style.width = (G.phase === 'heist' ? frac * 100 : 100) + '%';
      el.nap.dataset.low = frac < 0.25 ? '1' : '0';
      const lb = Array.from({ length: G.heist.items }, (_, i) => ART.icon(i < G.got ? 'bag' : 'slot', i < G.got ? 'gold' : 'dim')).join('') + ` <b>+${G.heist.loot}</b>`; if (el.lootbar.dataset.k !== lb) { el.lootbar.dataset.k = lb; el.lootbar.innerHTML = lb; }
    }
    for (const d of el.row.children) {
      const p = G.players.get(d.dataset.id); if (!p) continue;
      const n = (t - p.nAt < TUNE.stale) ? p.n : 0;
      const bar = d.querySelector('.wob i'); bar.style.width = clamp(n * 100, 0, 100) + '%'; bar.style.background = n < 0.2 ? '#7dffa0' : n < 0.5 ? '#ffd75a' : '#ff5f5f';
      d.classList.toggle('loud', G.loud === p.id && p.role === 'lookout');
      d.classList.toggle('off', !p.on);
      const roleEl = d.querySelector('.role'); const want = p.role === 'thief' ? 'mask' : (G.phase === 'tiptoe' && G.tiptoe && G.tiptoe.okIds.includes(p.id) ? 'check' : 'eye'); if (roleEl.dataset.k !== want) { roleEl.dataset.k = want; roleEl.className = 'role ' + want; roleEl.innerHTML = ART.icon(want); }
    }
    if (G.toastT && t > G.toastT) { el.toast.hidden = true; G.toastT = 0; }
    if (G.speechT && t > G.speechT) { el.speech.hidden = true; G.speechT = 0; }
    if (G.phase === 'tiptoe' && G.tiptoe) { const h = $('#tthold'); if (h) h.style.width = (G.tiptoe.holdStart ? clamp((t - G.tiptoe.holdStart) / TUNE.tiptoeHold, 0, 1) * 100 : 0) + '%'; const c = $('#ttcount'); if (c) c.textContent = `${G.tiptoe.okIds.length} / ${onlinePlayers().length} in position`; }
    if (G.phase === 'calib') { const c = $('#calibcount'); const h = onlinePlayers().map(p => `<span class="cp ${p.ok ? 'ok' : ''}">${ART.avatar(p.em)}${p.ok ? ART.icon('check') : ''}</span>`).join(''); if (c && c.dataset.k !== h) { c.dataset.k = h; c.innerHTML = h; } }
  }
  function toast(text, ms, em, icon) { el.toast.innerHTML = (em ? `<span class="tem">${ART.avatar(em)}</span>` : '') + (icon ? ART.icon(icon, 'big') + ' ' : '') + esc(text); el.toast.hidden = false; el.toast.classList.remove('pop'); void el.toast.offsetWidth; el.toast.classList.add('pop'); G.toastT = Date.now() + ms; }
  function speech(text, ms) { el.speech.textContent = text; el.speech.hidden = false; G.speechT = Date.now() + ms; }
  function playerName(id) { const p = G.players.get(id); return p ? `<span class="pn">${ART.avatar(p.em)} ${esc(p.name)}</span>` : '?'; }

  function renderOverlay() {
    const o = el.overlay; o.hidden = false; o.className = 'ov ' + G.phase;
    const thief = G.players.get(G.thiefId);
    if (G.phase === 'calib') {
      o.innerHTML = `<div class="card"><h2>Everyone hold still…</h2><p class="big">${ART.icon('phone', 'big')} Hold your phone like it's a sleeping baby.</p><p>${G.dragon} is listening.</p><div id="calibcount" class="calib"></div><p class="small">Thief this heist: <b>${thief ? playerName(thief.id) : ''}</b> ${ART.icon('mask')}</p></div>`;
    } else if (G.phase === 'countdown') {
      const n = Math.max(0, Math.ceil((G.countdownEnd - Date.now()) / 1000));
      o.innerHTML = `<div class="cd">${n > 0 ? n : 'shh'}</div>`;
    } else if (G.phase === 'heist') {
      o.hidden = true;
    } else if (G.phase === 'tiptoe') {
      const tt = G.tiptoe; const a = tt.steps[tt.step];
      o.innerHTML = `<div class="tt"><h2>${ART.icon('shoe')} TIPTOE OUT</h2><div class="dir">${a === 0 ? ART.icon('flat', 'big') + ' Hold it FLAT' : a < 0 ? ART.icon('left', 'big') + ' Lean LEFT ' + (-a) + '°' : ART.icon('right', 'big') + ' Lean RIGHT ' + a + '°'}</div><p>Everybody together. Slowly. Step ${tt.step + 1} of ${tt.steps.length}</p><div class="hold"><i id="tthold"></i></div><div id="ttcount"></div></div>`;
    } else if (G.phase === 'result' || G.phase === 'gameover') {
      const r = G.result; if (!r) { o.hidden = true; return; }
      const awards = (r.awards || []).map(a => { const aw = DWTD.AWARDS[a.k]; return `<div class="aw"><span class="aem">${ART.icon(aw.icon)}</span><div><b>${aw.title}</b> — ${playerName(a.pid)}<br><small>${aw.blurb}</small></div></div>`; }).join('');
      if (G.phase === 'gameover') {
        o.innerHTML = `<div class="card res win"><h1>${ART.icon('trophy', 'gold big')} The Great Dragon Heist</h1><p class="big">Family loot: <b>${r.loot}</b> ${ART.icon('coin', 'gold')}</p><p>${esc(r.text)}</p><div class="awards"><h3>Hall of Fame</h3>${awards || '<p>Nobody did anything notable. Suspicious.</p>'}</div><p class="small">Press Next on the TV or the captain's phone to play again.</p></div>`;
      } else if (r.win) {
        o.innerHTML = `<div class="card res win"><h1>${ART.icon('bag', 'gold big')} LOOT BANKED!</h1><p class="big">+${r.lootWon} ${ART.icon('coin', 'gold')} &nbsp; (family total ${r.loot})</p><p>${esc(r.text)}</p><div class="awards">${awards}</div><p class="small">${r.last ? 'That was the last heist! Press Next for the final tally.' : 'Next heist: press Next on the TV or the captain\'s phone.'}</p></div>`;
      } else {
        const c = r.culprit ? G.players.get(r.culprit) : null;
        o.innerHTML = `<div class="card res lose"><h1>${ART.icon('fire', 'big')} ${G.dragon.toUpperCase()} IS AWAKE</h1>${c ? `<div class="roast">${ART.avatar(c.em)}<span>${ART.icon('fire')}</span></div>` : `<div class="roast">${ART.icon('sun', 'gold')}</div>`}<p class="big">${esc(r.text)}</p><p>Lost this heist's loot (${r.lootLost}). Banked loot is safe: ${r.loot} ${ART.icon('coin', 'gold')}</p><div class="awards">${awards}</div><p class="small">${r.last ? 'That was the last heist! Press Next for the final tally.' : 'Try again? Press Next on the TV or the captain\'s phone.'}</p></div>`;
      }
    } else o.hidden = true;
  }

  window.__tv = { G, TUNE, failHeist, winHeist, beginTiptoe };
  // debug: press "d" on the TV to fake a noisy lookout
  function debugNoise() { const lk = lookouts()[0]; if (lk) { lk.n = 0.8; lk.nAt = Date.now(); } }
})();
