/* TV audio: fully synthesized with Web Audio. Snore loop, sneaky music, SFX, and sleep-talk TTS. */
(function (global) {
  'use strict';
  const A = {};
  let ctx = null, master = null, musicGain = null, snoreGain = null, sfxGain = null;
  let noiseBuf = null;
  let stage = 0, running = false, muted = false;
  let musicTimer = null, snoreTimer = null, heartTimer = null;
  let ttsOn = true;

  function ensure() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
    snoreGain = ctx.createGain(); snoreGain.gain.value = 0.8; snoreGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master);
    const len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  A.unlock = () => { ensure(); if (ctx.state === 'suspended') ctx.resume(); };
  A.setMuted = (m) => { muted = m; if (master) master.gain.value = m ? 0 : 0.9; };
  A.setTTS = (on) => { ttsOn = on; };

  // ----- building blocks -----
  function noise(dur, filterType, f0, f1, gain, dest) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const flt = ctx.createBiquadFilter(); flt.type = filterType; flt.Q.value = 1.2;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    flt.frequency.setValueAtTime(f0, t); flt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.05, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(dest || sfxGain);
    src.start(t); src.stop(t + dur + 0.05);
  }
  function tone(freq, dur, type, gain, dest, opts = {}) {
    const o = ctx.createOscillator(); o.type = type || 'sine';
    const g = ctx.createGain();
    const t = ctx.currentTime + (opts.at || 0);
    o.frequency.setValueAtTime(freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + (opts.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  // ----- snore -----
  function snoreOnce() {
    if (!running) return;
    const t = ctx.currentTime;
    // Stage flavours: deep = long honk, twitch = hiccupy, mumble = snorts, eye = silence + heartbeat.
    if (stage <= 2) {
      const len = stage === 0 ? 1.1 : stage === 1 ? 0.7 : 0.45;
      // inhale: rising filtered noise
      noise(len, 'bandpass', 180, 700, 0.5, snoreGain);
      // honk: low saw with wobble
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      const base = stage === 0 ? 62 : stage === 1 ? 75 : 92;
      o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base * 1.25, t + len);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 11;
      const lg = ctx.createGain(); lg.gain.value = 12; lfo.connect(lg); lg.connect(o.frequency);
      const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 420;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.55, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(flt); flt.connect(g); g.connect(snoreGain); lfo.start(t); o.start(t); o.stop(t + len + 0.1); lfo.stop(t + len + 0.1);
      // exhale: soft pfff
      setTimeout(() => { if (running && ctx) noise(stage === 0 ? 1.4 : 0.8, 'lowpass', 900, 200, 0.25, snoreGain); }, len * 1000 + 80);
      if (stage === 2 && Math.random() < 0.5) setTimeout(() => running && A.snort(), 300);
    }
    const gap = stage === 0 ? 3600 : stage === 1 ? 2400 + Math.random() * 900 : 1700 + Math.random() * 700;
    snoreTimer = setTimeout(snoreOnce, gap);
  }
  function heartbeat() {
    if (!running || stage !== 3) return;
    tone(55, 0.18, 'sine', 0.7, snoreGain); tone(50, 0.16, 'sine', 0.5, snoreGain, { at: 0.22 });
    heartTimer = setTimeout(heartbeat, 900);
  }
  A.snort = () => { ensure(); noise(0.18, 'bandpass', 400, 900, 0.7, snoreGain); tone(140, 0.2, 'sawtooth', 0.25, snoreGain, { to: 90 }); };

  // ----- music: sneaky pizzicato line -----
  const SCALE = [0, 2, 3, 5, 7, 8, 10]; // natural minor
  const ROOT = 110; // A2
  let beat = 0;
  const RIFF = [0, 0, 3, 0, 5, 0, 3, 2, 0, 0, 3, 0, 7, 5, 3, 2];
  function musicStep() {
    if (!running) return;
    const bpmByStage = [72, 92, 116, 150, 0];
    const bpm = bpmByStage[Math.min(stage, 4)];
    if (bpm === 0) { musicTimer = setTimeout(musicStep, 300); return; }
    const step = RIFF[beat % RIFF.length];
    const oct = (beat % 32) >= 16 && stage >= 1 ? 2 : 1;
    const f = ROOT * oct * Math.pow(2, SCALE[step % 7] / 12) * (step >= 7 ? 2 : 1);
    // pluck: short triangle with quick decay through lowpass
    const o = ctx.createOscillator(); o.type = 'triangle';
    const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 900 + stage * 400;
    const g = ctx.createGain(); const t = ctx.currentTime;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(flt); flt.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.3);
    if (beat % 4 === 2 && stage >= 2) noise(0.06, 'highpass', 4000, 6000, 0.12, musicGain); // hi-hat tick
    if (beat % 8 === 0 && stage >= 1) tone(ROOT / 2, 0.3, 'sine', 0.35, musicGain); // thump
    beat++;
    musicTimer = setTimeout(musicStep, 60000 / bpm / 2);
  }

  A.start = () => { ensure(); A.unlock(); if (running) return; running = true; beat = 0; musicStep(); snoreOnce(); };
  A.stop = () => { running = false; clearTimeout(musicTimer); clearTimeout(snoreTimer); clearTimeout(heartTimer); };
  A.setStage = (s) => {
    if (!ctx) return;
    const was = stage; stage = s;
    if (s === 3 && was !== 3) { clearTimeout(snoreTimer); if (running) heartbeat(); }
    if (s !== 3 && was === 3 && running) { clearTimeout(heartTimer); snoreTimer = setTimeout(snoreOnce, 400); }
    if (s === 4) { clearTimeout(snoreTimer); clearTimeout(heartTimer); }
    if (musicGain) musicGain.gain.setTargetAtTime(s === 3 ? 0.12 : 0.35, ctx.currentTime, 0.2);
  };

  // ----- SFX -----
  A.clang = () => { ensure(); [523, 659, 1240, 2100].forEach((f, i) => tone(f, 0.9 - i * 0.15, i % 2 ? 'square' : 'triangle', 0.35 / (i + 1))); noise(0.25, 'highpass', 3000, 8000, 0.4); };
  A.clink = () => { ensure(); tone(1800, 0.25, 'sine', 0.4, null, { to: 1400 }); tone(2400, 0.18, 'triangle', 0.2); };
  A.glug = () => { ensure(); tone(160, 0.25, 'sine', 0.5, null, { to: 90 }); tone(220, 0.2, 'sine', 0.3, null, { at: 0.18, to: 130 }); };
  A.item = () => { ensure(); [0, 0.09, 0.18].forEach((d, i) => tone(660 * Math.pow(1.26, i), 0.35, 'triangle', 0.35, null, { at: d })); };
  A.sigh = () => { ensure(); noise(1.6, 'lowpass', 1200, 250, 0.45, snoreGain); tone(180, 1.4, 'sine', 0.15, snoreGain, { to: 110 }); };
  A.blame = () => { ensure(); tone(880, 0.12, 'square', 0.25); tone(880, 0.12, 'square', 0.25, null, { at: 0.16 }); };
  A.tick = () => { ensure(); tone(1200, 0.06, 'square', 0.15); };
  A.step = () => { ensure(); noise(0.12, 'lowpass', 700, 150, 0.6); tone(120, 0.1, 'sine', 0.4, null, { to: 70 }); };
  A.whoosh = () => { ensure(); noise(0.5, 'bandpass', 300, 3000, 0.5); };
  A.countdown = (n) => { ensure(); tone(n === 0 ? 880 : 440, n === 0 ? 0.5 : 0.15, 'triangle', 0.4); };
  A.roar = () => {
    ensure();
    noise(2.6, 'lowpass', 300, 3500, 1.0);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; const t = ctx.currentTime;
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.6); o.frequency.exponentialRampToValueAtTime(55, t + 2.4);
    const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.setValueAtTime(600, t); flt.frequency.exponentialRampToValueAtTime(2500, t + 0.5); flt.frequency.exponentialRampToValueAtTime(300, t + 2.5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.8, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 28; const lg = ctx.createGain(); lg.gain.value = 25; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(flt); flt.connect(g); g.connect(sfxGain); o.start(t); lfo.start(t); o.stop(t + 2.7); lfo.stop(t + 2.7);
  };
  A.fire = () => { ensure(); noise(2.2, 'bandpass', 500, 1500, 0.8); noise(2.0, 'lowpass', 2500, 400, 0.6); };
  A.fanfare = () => {
    ensure();
    const notes = [523, 659, 784, 1047, 784, 1047];
    const dur = [0.15, 0.15, 0.15, 0.4, 0.15, 0.7];
    let at = 0;
    notes.forEach((f, i) => { tone(f, dur[i], 'square', 0.25, null, { at }); tone(f / 2, dur[i], 'triangle', 0.25, null, { at }); at += dur[i] * 0.85; });
  };
  A.sad = () => { ensure(); [392, 370, 349, 330].forEach((f, i) => tone(f, 0.45, 'triangle', 0.3, null, { at: i * 0.4 })); };
  A.yawn = () => { ensure(); tone(220, 1.6, 'sawtooth', 0.2, snoreGain, { to: 140 }); noise(1.6, 'bandpass', 500, 300, 0.3, snoreGain); };
  A.sneezeBuild = () => { ensure(); tone(300, 0.7, 'sawtooth', 0.2, snoreGain, { to: 700 }); noise(0.7, 'bandpass', 600, 2200, 0.35, snoreGain); };
  A.sneeze = () => { ensure(); noise(0.5, 'bandpass', 1200, 300, 1.0); tone(500, 0.35, 'sawtooth', 0.4, null, { to: 150 }); };

  // ----- Sleep talk (TTS) -----
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return null;
    const prefer = ['Daniel', 'Google UK English Male', 'Fred', 'Alex', 'Microsoft David', 'Rocko', 'Grandpa'];
    for (const p of prefer) { const v = vs.find(x => x.name.includes(p)); if (v) return v; }
    return vs.find(v => v.lang.startsWith('en')) || vs[0];
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
  A.say = (text, opts = {}) => {
    if (!ttsOn || muted || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/z{2,}/gi, 'zzz').replace(/\.\.\./g, ', '));
      if (!voice) voice = pickVoice();
      if (voice) u.voice = voice;
      u.pitch = opts.pitch != null ? opts.pitch : 0.45;
      u.rate = opts.rate != null ? opts.rate : 0.72;
      u.volume = opts.volume != null ? opts.volume : 1;
      speechSynthesis.speak(u);
    } catch (e) {}
  };
  A.hush = () => { try { speechSynthesis.cancel(); } catch (e) {} };

  global.TVAudio = A;
})(window);
