/* Dragon + cave scene for the TV. Layered SVG (CSS-animated) with a particle canvas on top. 1600x900 logical. */
(function (global) {
  'use strict';
  const W = 1600, H = 900;
  const D = {};
  const S = { stage: 0, meter: 0, eye: 0, fire: 0, lookAt: null, twitch: 0, sneeze: 0, lootLeft: 1, awake: false, tint: 0, crown: false };
  const parts = [];
  let svg, fx, fctx, lastT = 0, lastStage = -1;
  const zzz = [];
  const NOSE = { x: 378, y: 594 }, MOUTH = { x: 362, y: 648 }, EYE = { x: 560, y: 530 };
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- little SVG builders ----
  const coin = (x, y, r, i) => { const c = ['#ffe89a', '#f7c94a', '#e9b132'][i % 3]; return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.5}" fill="#9a6a10"/><ellipse cx="${x}" cy="${y - 2.5}" rx="${r}" ry="${r * 0.5}" fill="${c}" stroke="#a87a18" stroke-width="1.5"/><ellipse cx="${x}" cy="${y - 2.5}" rx="${r * 0.55}" ry="${r * 0.26}" fill="none" stroke="#b8891c" stroke-width="1.5"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.28}" rx="${r * 0.28}" ry="${r * 0.1}" fill="#fff8d6" opacity=".7"/>`; };
  const stack = (x, y, r, n, i) => { let s = ''; for (let k = 0; k < n; k++) s += coin(x + (k % 2) * 1.5, y - k * 5, r, i + k); return s; };
  const gem = (x, y, s, c, dark) => `<path d="M${x - s} ${y} L${x - s * 0.55} ${y - s * 0.75} L${x + s * 0.55} ${y - s * 0.75} L${x + s} ${y} L${x} ${y + s * 1.1}Z" fill="${c}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/><path d="M${x - s * 0.55} ${y - s * 0.75} L${x - s * 0.15} ${y} L${x + s * 0.55} ${y - s * 0.75}Z" fill="#fff" opacity=".45"/><path d="M${x - s} ${y} L${x - s * 0.15} ${y} L${x} ${y + s * 1.1}Z" fill="${dark}" opacity=".35"/>`;
  const crystal = (x, y, h, w, c, cl) => `<path d="M${x - w} ${y} L${x} ${y - h} L${x + w} ${y}Z" fill="${c}"/><path d="M${x - w} ${y} L${x} ${y - h} L${x - w * 0.05} ${y}Z" fill="${cl}" opacity=".8"/>`;
  const spike = (x, y, h, w, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-w} 0 L0 ${-h} L${w} 0Z" fill="url(#gHorn)" stroke="#8f7442" stroke-width="2" stroke-linejoin="round"/><path d="M0 ${-h} L${w} 0 L0 0Z" fill="#8f7442" opacity=".28"/></g>`;
  const claw = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-9 0 Q0 -4 9 0 Q4 16 0 26 Q-4 16 -9 0Z" fill="url(#gHorn)" stroke="#8f7442" stroke-width="1.6"/></g>`;
  const stal = (x, w, h, fill) => `<path d="M${x - w} 0 L${x + w} 0 Q${x + w * 0.35} ${h * 0.55} ${x} ${h} Q${x - w * 0.35} ${h * 0.55} ${x - w} 0Z" fill="${fill}"/>`;

  function coinsSvg() {
    let s = '';
    for (let i = 0; i < 110; i++) {
      const x = rnd(560, 1440), y = rnd(690, 835), r = rnd(10, 17);
      if (((x - 1000) / 450) ** 2 + ((y - 795) / 115) ** 2 >= 1) continue;
      s += `<g class="coin" data-o="${(i / 110).toFixed(2)}">${coin(x, y, r, i)}</g>`;
    }
    [[700, 800, 12, 4], [1060, 815, 13, 5], [1250, 790, 11, 3], [860, 830, 12, 3], [1360, 815, 10, 4]].forEach(([x, y, r, n], i) => { s += `<g class="coin" data-o="${(0.3 + i * 0.12).toFixed(2)}">${stack(x, y, r, n, i)}</g>`; });
    const gems = [['#5fd3ff', '#1c7ea8', 760, 775, 16], ['#ff5f9e', '#9e2a5c', 1200, 750, 15], ['#9cff7a', '#3e9a34', 930, 812, 14], ['#c48bff', '#6a3fb0', 1320, 770, 13], ['#ffb347', '#b8620e', 640, 805, 13], ['#5fd3ff', '#1c7ea8', 1130, 826, 12], ['#ff5f9e', '#9e2a5c', 980, 760, 11]];
    for (const [c, d, x, y, sz] of gems) s += `<g class="coin" data-o="${Math.random().toFixed(2)}">${gem(x, y, sz, c, d)}</g>`;
    return s;
  }

  function sceneSvg() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" id="dragonsvg">
<defs>
  <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0718"/><stop offset=".55" stop-color="#1a1236"/><stop offset="1" stop-color="#2b1b42"/></linearGradient>
  <linearGradient id="gRockFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1438"/><stop offset="1" stop-color="#120c26"/></linearGradient>
  <linearGradient id="gRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a5c"/><stop offset="1" stop-color="#1b1330"/></linearGradient>
  <linearGradient id="gStal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d2d60"/><stop offset="1" stop-color="#170f2c"/></linearGradient>
  <radialGradient id="gGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8fd8ff" stop-opacity=".5"/><stop offset="1" stop-color="#8fd8ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="gGlowP" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d59bff" stop-opacity=".5"/><stop offset="1" stop-color="#d59bff" stop-opacity="0"/></radialGradient>
  <radialGradient id="gTorch" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb24a" stop-opacity=".45"/><stop offset=".5" stop-color="#ff8a2a" stop-opacity=".12"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
  <radialGradient id="gFire" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9a2e" stop-opacity=".8"/><stop offset="1" stop-color="#ff3d00" stop-opacity="0"/></radialGradient>
  <radialGradient id="gPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd76a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient>
  <linearGradient id="gBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be27c"/><stop offset=".5" stop-color="#4fae53"/><stop offset="1" stop-color="#24603a"/></linearGradient>
  <linearGradient id="gBodyH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8f5a5"/><stop offset="1" stop-color="#c8f5a5" stop-opacity="0"/></linearGradient>
  <linearGradient id="gDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8f47"/><stop offset="1" stop-color="#173d24"/></linearGradient>
  <linearGradient id="gBelly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d2"/><stop offset="1" stop-color="#dcb96e"/></linearGradient>
  <linearGradient id="gHorn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#c8a35e"/></linearGradient>
  <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffec9e"/><stop offset=".5" stop-color="#f2c23e"/><stop offset="1" stop-color="#a8741a"/></linearGradient>
  <linearGradient id="gWing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4e9c52"/><stop offset="1" stop-color="#173c26"/></linearGradient>
  <linearGradient id="gWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b5a2b"/><stop offset=".5" stop-color="#5e3a1a"/><stop offset="1" stop-color="#3e2510"/></linearGradient>
  <radialGradient id="gEye" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fffbea"/><stop offset="1" stop-color="#e5d3a0"/></radialGradient>
  <filter id="blur10"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#000" flood-opacity=".5"/></filter>
  <clipPath id="eyeClip"><ellipse cx="0" cy="0" rx="42" ry="36"/></clipPath>
  <clipPath id="bodyClip"><path d="M700 520 C760 400 1000 360 1180 420 C1330 470 1360 600 1290 690 C1220 760 900 780 760 720 C660 680 650 580 700 520Z"/></clipPath>
  <pattern id="scales" width="22" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><path d="M0 18 A11 11 0 0 1 22 18" fill="none" stroke="rgba(0,0,0,.16)" stroke-width="2"/><path d="M-11 9 A11 11 0 0 1 11 9 M11 9 A11 11 0 0 1 33 9" fill="none" stroke="rgba(0,0,0,.16)" stroke-width="2"/><path d="M2 16 A9 9 0 0 1 20 16" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1.5"/></pattern>
</defs>

<rect width="${W}" height="${H}" fill="url(#gSky)"/>
<g id="cave">
  <path d="M0 260 Q120 200 260 250 T520 230 T800 270 T1080 220 T1360 260 T1600 230 L1600 0 L0 0Z" fill="#0d0920" opacity=".9"/>
  <path d="M0 900 L0 300 Q60 360 130 330 Q190 420 170 520 Q240 560 220 660 Q300 720 240 900Z" fill="url(#gRockFar)"/>
  <path d="M1600 900 L1600 280 Q1540 350 1470 330 Q1420 430 1440 520 Q1370 580 1400 680 Q1320 760 1380 900Z" fill="url(#gRockFar)"/>
  <path d="M0 900 L0 420 Q40 470 90 450 Q130 540 100 620 Q160 700 120 900Z" fill="url(#gRock)"/>
  <path d="M1600 900 L1600 400 Q1560 460 1510 440 Q1480 540 1500 620 Q1450 700 1480 900Z" fill="url(#gRock)"/>
  <g fill="none" stroke="rgba(255,255,255,.06)" stroke-width="4"><path d="M10 520 q40 -10 80 20 M0 600 q50 -20 100 10 M1600 520 q-40 -10 -80 20 M1600 600 q-50 -20 -100 10"/></g>
  <g>${[60, 170, 300, 430, 560, 700, 830, 960, 1100, 1230, 1360, 1500].map((x, i) => stal(x + (i % 2) * 20, 22 + (i % 3) * 8, 60 + ((i * 47) % 70), '#150e2a')).join('')}</g>
  <g>${[110, 260, 400, 640, 780, 900, 1030, 1180, 1330, 1470].map((x, i) => stal(x, 36 + (i % 3) * 10, 110 + ((i * 61) % 120), 'url(#gStal)')).join('')}</g>
  <g fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3" stroke-linecap="round">${[110, 260, 400, 640, 780, 900, 1030, 1180, 1330, 1470].map((x, i) => `<path d="M${x - 14} 10 Q${x - 10} ${40 + (i % 3) * 20} ${x - 4} ${70 + ((i * 61) % 120) * 0.5}"/>`).join('')}</g>
  <g id="crystals">
    <circle cx="165" cy="600" r="150" fill="url(#gGlow)"/>${crystal(165, 660, 190, 34, '#6fc6f5', '#c9efff')}${crystal(122, 665, 110, 22, '#5bb2e6', '#bfe8ff')}${crystal(205, 668, 95, 20, '#8fd8ff', '#e6f8ff')}
    <circle cx="1440" cy="560" r="150" fill="url(#gGlowP)"/>${crystal(1440, 640, 200, 34, '#b98cf0', '#ead8ff')}${crystal(1400, 645, 100, 20, '#a878e6', '#e2ccff')}${crystal(1484, 650, 120, 24, '#d0aaff', '#f3e8ff')}
  </g>
  <g id="torches">
    <g transform="translate(300 330)"><circle cx="0" cy="-20" r="230" fill="url(#gTorch)" class="tglow"/><path d="M-10 90 L-6 0 L6 0 L10 90Z" fill="url(#gWood)"/><path d="M-22 96 L22 96 L16 110 L-16 110Z" fill="#2b1d10"/><ellipse cx="0" cy="0" rx="14" ry="8" fill="#2b1d10"/>
      <g class="flame"><path d="M0 -60 C18 -40 20 -18 8 0 C0 -6 -4 -12 -6 -20 C-12 -14 -18 -4 -16 6 C-20 0 -22 -14 -14 -26 C-18 -40 -8 -52 0 -60Z" fill="#ff7a1a"/><path d="M0 -40 C10 -28 12 -14 4 0 C0 -4 -2 -8 -4 -14 C-8 -10 -12 -2 -10 4 C-14 -4 -12 -18 -4 -26 C-6 -32 -2 -36 0 -40Z" fill="#ffc04a"/><path d="M0 -24 C6 -16 6 -8 2 0 C-4 -4 -6 -12 -2 -18Z" fill="#fff5c0"/></g></g>
    <g transform="translate(1310 300)"><circle cx="0" cy="-20" r="230" fill="url(#gTorch)" class="tglow"/><path d="M-10 90 L-6 0 L6 0 L10 90Z" fill="url(#gWood)"/><path d="M-22 96 L22 96 L16 110 L-16 110Z" fill="#2b1d10"/><ellipse cx="0" cy="0" rx="14" ry="8" fill="#2b1d10"/>
      <g class="flame f2"><path d="M0 -60 C18 -40 20 -18 8 0 C0 -6 -4 -12 -6 -20 C-12 -14 -18 -4 -16 6 C-20 0 -22 -14 -14 -26 C-18 -40 -8 -52 0 -60Z" fill="#ff7a1a"/><path d="M0 -40 C10 -28 12 -14 4 0 C0 -4 -2 -8 -4 -14 C-8 -10 -12 -2 -10 4 C-14 -4 -12 -18 -4 -26 C-6 -32 -2 -36 0 -40Z" fill="#ffc04a"/><path d="M0 -24 C6 -16 6 -8 2 0 C-4 -4 -6 -12 -2 -18Z" fill="#fff5c0"/></g></g>
  </g>
  <g id="motes" fill="#fff">${Array.from({ length: 14 }, (_, i) => `<circle class="mote" style="animation-delay:${-i * 1.7}s" cx="${200 + i * 95}" cy="${250 + (i * 137) % 400}" r="${2 + (i % 3)}"/>`).join('')}</g>
  <ellipse cx="800" cy="890" rx="1100" ry="120" fill="#120c22"/>
  <ellipse cx="1000" cy="800" rx="620" ry="180" fill="url(#gPool)"/>
  <circle id="fireglow" cx="380" cy="600" r="560" fill="url(#gFire)" opacity="0"/>
</g>

<g id="treasure">
  <ellipse cx="1000" cy="850" rx="560" ry="40" fill="#000" opacity=".35" filter="url(#blur10)"/>
  <path d="M500 820 Q580 690 800 655 Q1000 625 1230 655 Q1430 690 1490 810 Q1510 860 1430 868 L560 868 Q480 860 500 820Z" fill="#7a5210"/>
  <path d="M510 815 Q590 690 800 660 Q1000 632 1220 660 Q1420 692 1478 805 Q1496 848 1420 850 L570 850 Q490 848 510 815Z" fill="url(#gGold)"/>
  <path d="M600 760 Q800 690 1000 700 Q1200 700 1390 775" fill="none" stroke="#fff3b0" stroke-width="10" stroke-linecap="round" opacity=".5"/>
  <g id="coins">${coinsSvg()}</g>
  <g id="chest" transform="translate(1290 700)"><path d="M-70 10 L70 10 L64 70 L-64 70Z" fill="#5a3416"/><rect x="-66" y="10" width="132" height="14" fill="#7d4a20"/><path d="M-70 10 Q-70 -30 0 -30 Q70 -30 70 10Z" fill="#6b3f1b" transform="rotate(-38 -70 10)"/><path d="M-70 10 Q-70 -30 0 -30 Q70 -30 70 10Z" fill="none" stroke="url(#gGold)" stroke-width="6" transform="rotate(-38 -70 10)"/><rect x="-20" y="10" width="40" height="18" rx="4" fill="url(#gGold)"/><rect x="-66" y="40" width="132" height="8" fill="url(#gGold)" opacity=".8"/><ellipse cx="0" cy="12" rx="60" ry="12" fill="#f2c23e"/><g>${stack(-30, 14, 10, 3, 1)}${stack(10, 12, 10, 4, 2)}${stack(40, 14, 9, 2, 0)}</g></g>
  <g id="sword" transform="translate(1400 705) rotate(20)"><path d="M-6 -160 L6 -160 L5 0 L-5 0Z" fill="#e7edf3" stroke="#8b96a3" stroke-width="2"/><path d="M0 -160 L0 0" stroke="#b9c3cf" stroke-width="2"/><rect x="-30" y="-4" width="60" height="12" rx="5" fill="url(#gGold)"/><rect x="-7" y="8" width="14" height="42" rx="3" fill="#4a2c14"/><circle cx="0" cy="56" r="10" fill="url(#gGold)"/></g>
  <g id="goblet" transform="translate(630 745)"><path d="M-24 -44 Q-28 -4 0 0 Q28 -4 24 -44Z" fill="url(#gGold)"/><path d="M-22 -40 Q-20 -10 0 -6" fill="none" stroke="#fff3b0" stroke-width="4" opacity=".6"/><rect x="-4" y="0" width="8" height="20" fill="#c9931a"/><ellipse cx="0" cy="22" rx="18" ry="6" fill="url(#gGold)"/>${gem(-8, -26, 6, '#ff5f9e', '#9e2a5c')}${gem(8, -26, 6, '#5fd3ff', '#1c7ea8')}</g>
  <g id="shield" transform="translate(720 790) rotate(-12)"><path d="M-36 -40 L36 -40 L36 0 Q36 36 0 50 Q-36 36 -36 0Z" fill="#8e3b3b" stroke="url(#gGold)" stroke-width="6"/><path d="M0 -34 L0 44 M-30 4 L30 4" stroke="url(#gGold)" stroke-width="6"/></g>
  <g id="pilecrown" transform="translate(1110 700)"><path d="M-40 18 L-40 -20 L-20 0 L0 -30 L20 0 L40 -20 L40 18Z" fill="url(#gGold)" stroke="#9a6a10" stroke-width="3" stroke-linejoin="round"/><rect x="-40" y="12" width="80" height="10" fill="#c9931a"/>${gem(0, -30, 6, '#ff5f9e', '#9e2a5c')}${gem(-40, -20, 5, '#5fd3ff', '#1c7ea8')}${gem(40, -20, 5, '#9cff7a', '#3e9a34')}</g>
  <g fill="#fff8f0" stroke="#c8b8a8">${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${850 + i * 14}" cy="${842 - Math.sin(i / 2) * 6}" r="6"/>`).join('')}</g>
</g>

<ellipse cx="960" cy="745" rx="440" ry="48" fill="#000" opacity=".4" filter="url(#blur10)"/>
<g id="dragon">
  <g id="tail">
    <path d="M1230 610 C1420 620 1540 690 1520 790 C1505 860 1400 880 1330 830 C1380 855 1450 840 1458 785 C1465 720 1380 690 1230 700Z" fill="url(#gBody)"/>
    <path d="M1240 690 C1380 685 1460 715 1462 780 C1455 830 1400 850 1345 830 C1380 850 1440 835 1450 790 C1450 730 1380 705 1240 700Z" fill="#1c4d2d" opacity=".55"/>
    <path d="M1250 625 C1400 632 1500 690 1500 760" fill="none" stroke="#c8f5a5" stroke-width="6" stroke-linecap="round" opacity=".45"/>
    ${spike(1300, 622, 26, 11, 6)}${spike(1370, 640, 28, 12, 14)}${spike(1435, 672, 28, 12, 28)}${spike(1483, 720, 26, 11, 48)}${spike(1500, 775, 22, 10, 80)}
    <g transform="translate(1330 830)"><g id="tailtip"><path d="M4 0 L-44 -34 L-78 0 L-44 34Z" fill="url(#gDark)" stroke="#12331c" stroke-width="2"/><path d="M-8 0 L-42 -22 L-64 0 L-42 22Z" fill="url(#gBody)"/><path d="M-8 0 L-42 -22 L-42 0Z" fill="#c8f5a5" opacity=".35"/></g></g>
  </g>
  <g id="wing"><path d="M930 440 Q980 300 1120 290 Q1265 300 1275 470 Q1180 405 1060 435 Q990 450 930 440Z" fill="url(#gWing)"/>
    <path d="M960 432 Q1010 340 1115 305 Q1180 330 1250 440 Q1160 400 1060 430Z" fill="#7fd07a" opacity=".18"/>
    <path d="M950 435 Q1010 330 1120 300 M1000 440 Q1080 340 1180 320 M1080 445 Q1180 380 1250 380" fill="none" stroke="#123420" stroke-width="7" stroke-linecap="round"/>
    <path d="M950 435 Q1010 330 1120 300 M1000 440 Q1080 340 1180 320" fill="none" stroke="#5cb562" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
    ${claw(1120, 292, -140)}</g>
  <g id="body">
    <path d="M700 520 C760 400 1000 360 1180 420 C1330 470 1360 600 1290 690 C1220 760 900 780 760 720 C660 680 650 580 700 520Z" fill="url(#gBody)"/>
    <path d="M700 520 C760 400 1000 360 1180 420 C1330 470 1360 600 1290 690 C1220 760 900 780 760 720 C660 680 650 580 700 520Z" fill="url(#scales)"/>
    <g clip-path="url(#bodyClip)"><path d="M720 440 C800 380 1000 350 1180 410 C1250 440 1300 480 1320 540 C1240 470 1100 430 950 440 C850 445 780 470 720 520Z" fill="url(#gBodyH)" opacity=".55" filter="url(#blur4)"/>
      <path d="M660 700 C760 760 1000 800 1300 720 L1340 800 L640 800Z" fill="#0f2e1c" opacity=".55" filter="url(#blur10)"/></g>
    <g id="spikes">${spike(806, 462, 58, 22, -18)}${spike(888, 425, 62, 24, -10)}${spike(973, 402, 66, 25, -4)}${spike(1058, 396, 66, 25, 3)}${spike(1145, 407, 60, 23, 10)}${spike(1225, 432, 52, 20, 22)}</g>
    <g id="belly">
      ${[[625, 240, 34], [658, 236, 32], [690, 228, 30], [720, 214, 28], [748, 192, 26]].map(([y, rx, ry]) => `<ellipse cx="985" cy="${y}" rx="${rx}" ry="${ry}" fill="#b8944a" opacity=".55"/><ellipse cx="985" cy="${y - 5}" rx="${rx}" ry="${ry}" fill="url(#gBelly)"/>`).join('')}
    </g>
    <ellipse cx="1150" cy="690" rx="80" ry="38" fill="url(#gBody)"/><ellipse cx="1150" cy="690" rx="80" ry="38" fill="url(#scales)"/>
    <ellipse cx="1150" cy="702" rx="58" ry="20" fill="url(#gBelly)" opacity=".9"/>
    ${claw(1090, 712, 20)}${claw(1140, 724, 6)}${claw(1190, 720, -14)}
  </g>
  <g id="neck"><path d="M735 525 C700 470 640 470 600 520 C620 600 680 640 760 690 C700 630 700 570 735 525Z" fill="url(#gBody)"/><path d="M735 525 C700 470 640 470 600 520 C620 600 680 640 760 690 C700 630 700 570 735 525Z" fill="url(#scales)"/></g>
  <g transform="translate(600 560)"><g id="head">
    <path d="M110 -40 L210 -105 L200 -12 Z" fill="url(#gDark)"/><path d="M128 -42 L190 -84 L186 -24 Z" fill="#ffa08e" opacity=".55"/><path d="M128 -42 L190 -84 M150 -50 L186 -24" stroke="#123420" stroke-width="3"/>
    <path d="M-20 -100 C-10 -175 40 -195 75 -165 C45 -150 22 -120 15 -88Z" fill="url(#gHorn)" stroke="#8f7442" stroke-width="2"/><path d="M-8 -130 q20 -8 34 4 M-2 -150 q18 -8 30 2" fill="none" stroke="#8f7442" stroke-width="2.5" opacity=".6"/>
    <ellipse cx="0" cy="0" rx="150" ry="108" fill="url(#gBody)"/><ellipse cx="0" cy="0" rx="150" ry="108" fill="url(#scales)"/>
    <ellipse cx="-30" cy="-50" rx="90" ry="40" fill="url(#gBodyH)" opacity=".45" filter="url(#blur4)"/>
    <path d="M40 -95 C60 -175 125 -205 160 -172 C125 -160 95 -125 82 -78Z" fill="url(#gHorn)" stroke="#8f7442" stroke-width="2"/><path d="M62 -130 q26 -10 44 4 M72 -152 q24 -10 40 0 M84 -170 q20 -8 34 2" fill="none" stroke="#8f7442" stroke-width="2.5" opacity=".6"/>
    <path d="M-110 -40 C-70 -80 -10 -80 20 -60" fill="none" stroke="#2a6b3a" stroke-width="10" stroke-linecap="round" opacity=".5"/>
    <ellipse cx="-125" cy="42" rx="112" ry="70" fill="url(#gBody)"/><ellipse cx="-125" cy="42" rx="112" ry="70" fill="url(#scales)"/>
    <ellipse cx="-150" cy="10" rx="60" ry="22" fill="url(#gBodyH)" opacity=".4" filter="url(#blur4)"/>
    <ellipse cx="-120" cy="82" rx="100" ry="38" fill="url(#gBelly)"/><path d="M-210 84 Q-120 118 -30 88" fill="none" stroke="#b8944a" stroke-width="3" opacity=".5"/>
    <ellipse cx="-58" cy="52" rx="30" ry="16" fill="#ff8aa0" opacity=".45"/>
    <ellipse cx="-215" cy="30" rx="13" ry="9" fill="#173d24"/><ellipse cx="-198" cy="60" rx="13" ry="9" fill="#173d24"/><ellipse cx="-219" cy="26" rx="5" ry="3" fill="#8fdc72" opacity=".6"/>
    <circle id="snot" cx="-222" cy="36" r="16" fill="#c6f0a2" opacity=".85"/><circle id="snoths" cx="-228" cy="30" r="5" fill="#fff" opacity=".7"/>
    <g id="mouthgrp"><path id="mouth" d="M-232 78 Q-140 106 -40 92" fill="none" stroke="#173d24" stroke-width="7" stroke-linecap="round"/>
      <path id="mouthopen" d="M-232 78 Q-140 150 -40 92 Q-140 100 -232 78Z" fill="#6b1f2a" opacity="0"/>
      <path d="M-186 82 L-178 100 L-170 82Z M-96 90 L-88 106 L-80 88Z" fill="#fff" stroke="#cfc4b0" stroke-width="1"/></g>
    <path d="M60 -46 Q88 -66 118 -48" fill="none" stroke="#173d24" stroke-width="6" stroke-linecap="round"/>
    <g id="eye" transform="translate(-40 -30)">
      <g clip-path="url(#eyeClip)">
        <ellipse cx="0" cy="0" rx="42" ry="36" fill="url(#gEye)"/>
        <g id="pupil"><circle cx="0" cy="2" r="22" fill="#e0a92a"/><circle cx="0" cy="2" r="22" fill="none" stroke="#a86f10" stroke-width="3"/><ellipse id="slit" cx="0" cy="2" rx="7" ry="20" fill="#120c1a"/><circle cx="-8" cy="-9" r="6" fill="#fff" opacity=".9"/></g>
        <rect id="lid" x="-50" y="-40" width="100" height="80" fill="#4fae53" transform="translate(0 0)"/>
      </g>
      <ellipse cx="0" cy="0" rx="42" ry="36" fill="none" stroke="#173d24" stroke-width="5" id="eyerim" opacity="0"/>
      <path id="closed" d="M-42 0 Q0 26 42 0" fill="none" stroke="#173d24" stroke-width="7" stroke-linecap="round"/>
      <path d="M-40 -6 Q0 14 40 -6" fill="none" stroke="#2a6b3a" stroke-width="3" opacity=".6" id="crease"/>
      <path d="M-48 8 L-58 14 M-38 20 L-46 30 M-28 26 L-32 38" stroke="#173d24" stroke-width="4" stroke-linecap="round" id="lashes"/>
    </g>
    <path id="brow" d="M-100 -78 L-5 -56" fill="none" stroke="#173d24" stroke-width="9" stroke-linecap="round" opacity="0"/>
    <path id="sweat" d="M112 -70 q10 14 0 22 q-10 -8 0 -22z" fill="#8fd8ff" opacity="0"/>
    <g id="crowngrp" opacity="0" transform="translate(70 -150) rotate(12)"><path d="M-50 20 L-50 -25 L-25 0 L0 -35 L25 0 L50 -25 L50 20Z" fill="url(#gGold)" stroke="#9a6a10" stroke-width="3" stroke-linejoin="round"/><rect x="-50" y="12" width="100" height="10" fill="#c9931a"/>${gem(0, -35, 7, '#ff5f9e', '#9e2a5c')}${gem(-50, -25, 6, '#5fd3ff', '#1c7ea8')}${gem(50, -25, 6, '#9cff7a', '#3e9a34')}</g>
  </g></g>
  <g id="paws">
    <ellipse cx="640" cy="705" rx="88" ry="40" fill="url(#gBody)"/><ellipse cx="640" cy="705" rx="88" ry="40" fill="url(#scales)"/><ellipse cx="640" cy="692" rx="60" ry="14" fill="url(#gBodyH)" opacity=".4"/>
    <g fill="url(#gBelly)"><circle cx="575" cy="720" r="15"/><circle cx="605" cy="732" r="15"/><circle cx="640" cy="736" r="15"/></g>${claw(565, 730, 24)}${claw(598, 744, 8)}${claw(634, 748, -6)}
    <ellipse cx="520" cy="690" rx="82" ry="38" fill="url(#gBody)"/><ellipse cx="520" cy="690" rx="82" ry="38" fill="url(#scales)"/><ellipse cx="520" cy="678" rx="56" ry="13" fill="url(#gBodyH)" opacity=".4"/>
    <g fill="url(#gBelly)"><circle cx="465" cy="706" r="14"/><circle cx="492" cy="716" r="14"/><circle cx="522" cy="720" r="14"/></g>${claw(455, 716, 24)}${claw(486, 728, 8)}${claw(518, 732, -6)}
  </g>
  <g id="fire" opacity="0" transform="translate(${MOUTH.x} ${MOUTH.y})">
    <path class="fl fl1" d="M0 0 C-90 -90 -260 -130 -460 -40 C-330 -30 -330 0 -460 50 C-260 110 -90 70 0 0Z" fill="#ff4d1a" opacity=".9"/>
    <path class="fl fl2" d="M0 0 C-70 -60 -200 -85 -360 -25 C-250 -18 -250 0 -360 34 C-200 70 -70 50 0 0Z" fill="#ffb02e"/>
    <path class="fl fl3" d="M0 0 C-50 -38 -140 -50 -250 -14 C-170 -10 -170 0 -250 22 C-140 44 -50 32 0 0Z" fill="#fff3a0"/>
  </g>
  <g id="smoke"></g>
</g>
<rect id="tintrect" width="${W}" height="${H}" fill="#ff2d1a" opacity="0" style="mix-blend-mode:multiply"/>
</svg>`;
  }

  const CSS = `
#dragonsvg { position:absolute; inset:0; width:1600px; height:900px; --breath:3.6s; }
#dragonsvg .mote { animation: mote 9s ease-in-out infinite; opacity:.35; }
@keyframes mote { 0%,100% { transform: translate(0,0); opacity:.15 } 50% { transform: translate(18px,-40px); opacity:.5 } }
#dragonsvg .flame { transform-box: fill-box; transform-origin: 50% 100%; animation: flame .22s ease-in-out infinite alternate; }
#dragonsvg .flame.f2 { animation-duration: .27s; animation-delay:-.1s; }
@keyframes flame { from { transform: scale(1,1) skewX(-3deg) } to { transform: scale(1.08,.9) skewX(4deg) } }
#dragonsvg .tglow { animation: tglow 1.3s ease-in-out infinite alternate; }
@keyframes tglow { from { opacity:.8 } to { opacity:1 } }
#dragonsvg #body, #dragonsvg #wing { transform-box: fill-box; transform-origin: 50% 100%; animation: breathe var(--breath) ease-in-out infinite; }
#dragonsvg #wing { animation-name: wingbreathe; }
#dragonsvg #head, #dragonsvg #neck { transform-box: fill-box; transform-origin: 80% 100%; animation: headbob var(--breath) ease-in-out infinite; }
@keyframes breathe { 0%,100% { transform: scale(1,1) } 50% { transform: scale(1.012,1.035) } }
@keyframes wingbreathe { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
@keyframes headbob { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-5px) rotate(-.4deg) } }
#dragonsvg #snot, #dragonsvg #snoths { transform-box: fill-box; transform-origin: 100% 0%; animation: snot var(--breath) ease-in-out infinite; }
@keyframes snot { 0%,100% { transform: scale(.25) } 55% { transform: scale(1.25) } 70% { transform: scale(1.1) } }
#dragonsvg.s2 #snot, #dragonsvg.s3 #snot, #dragonsvg.s4 #snot, #dragonsvg.awake #snot, #dragonsvg.s2 #snoths, #dragonsvg.s3 #snoths, #dragonsvg.s4 #snoths, #dragonsvg.awake #snoths { display:none; }
#dragonsvg #tailtip { transform-box: fill-box; transform-origin: 100% 50%; animation: tailflick 5s ease-in-out infinite; }
@keyframes tailflick { 0%,80%,100% { transform: rotate(0deg) } 88% { transform: rotate(-14deg) } 94% { transform: rotate(8deg) } }
#dragonsvg.s1 #tailtip, #dragonsvg.s2 #tailtip { animation-duration: 1.6s; }
#dragonsvg.s2 #head, #dragonsvg.s2 #neck { animation-name: mumble; animation-duration: 1.1s; }
@keyframes mumble { 0%,100% { transform: translateY(0) rotate(0) } 30% { transform: translateY(-3px) rotate(-.8deg) } 60% { transform: translateY(2px) rotate(.6deg) } }
#dragonsvg #sweat { animation: drip 1.4s ease-in infinite; }
@keyframes drip { 0% { transform: translateY(0); opacity:0 } 15% { opacity:1 } 100% { transform: translateY(70px); opacity:0 } }
#dragonsvg #dragon.twitch { animation: twitch .45s steps(3) 2; }
@keyframes twitch { 0% { transform: translate(0,0) } 33% { transform: translate(-6px,3px) } 66% { transform: translate(5px,-3px) } 100% { transform: translate(0,0) } }
#dragonsvg .fl { transform-box: fill-box; transform-origin: 100% 50%; animation: flick .18s ease-in-out infinite alternate; }
#dragonsvg .fl2 { animation-duration: .13s; } #dragonsvg .fl3 { animation-duration: .1s; }
@keyframes flick { from { transform: scale(1,1) } to { transform: scale(1.12,.86) } }
#dragonsvg.awake { animation: quake .12s linear infinite; }
@keyframes quake { 0% { transform: translate(0,0) } 25% { transform: translate(6px,-4px) } 50% { transform: translate(-5px,5px) } 75% { transform: translate(4px,3px) } 100% { transform: translate(-3px,-4px) } }
#dragonsvg .puff { animation: puff 2.6s ease-out forwards; transform-box: fill-box; transform-origin: 50% 50%; }
@keyframes puff { 0% { opacity:.55; transform: translate(0,0) scale(.5) } 100% { opacity:0; transform: translate(-90px,-110px) scale(2.2) } }
#dragonsvg.sneeze #head, #dragonsvg.sneeze #neck { animation: sneeze 1.4s ease-in-out 1; }
@keyframes sneeze { 0% { transform: translateY(0) } 45% { transform: translateY(-40px) rotate(-6deg) } 60% { transform: translateY(30px) rotate(5deg) } 100% { transform: translateY(0) } }
`;

  D.init = (sceneEl, fxCanvas) => {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    sceneEl.innerHTML = sceneSvg();
    svg = sceneEl.querySelector('#dragonsvg');
    fx = fxCanvas; fx.width = W; fx.height = H; fctx = fx.getContext('2d');
    D.$ = (id) => svg.getElementById(id);
  };
  D.set = (o) => {
    Object.assign(S, o);
    if (o.twitch >= 0.5) { const d = D.$('dragon'); d.classList.remove('twitch'); void d.getBoundingClientRect(); d.classList.add('twitch'); }
    if (o.sneeze) { svg.classList.remove('sneeze'); void svg.getBoundingClientRect(); svg.classList.add('sneeze'); setTimeout(() => svg.classList.remove('sneeze'), 1500); }
    if (o.lootLeft != null) { const keep = Math.max(0.12, o.lootLeft); svg.querySelectorAll('#coins .coin').forEach(c => { c.style.opacity = +c.dataset.o <= keep ? 1 : 0; }); }
    if (o.crown != null) { D.$('crowngrp').setAttribute('opacity', o.crown ? 1 : 0); D.$('pilecrown').setAttribute('opacity', o.crown ? 0 : 1); }
  };
  D.get = () => S;
  D.burst = (kind, n, x, y) => { for (let i = 0; i < n; i++) parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(-8, -2), life: 0, max: rnd(40, 80), kind, size: rnd(6, 16) }); };
  D.confetti = () => { for (let i = 0; i < 160; i++) parts.push({ x: Math.random() * W, y: -20, vx: rnd(-2, 2), vy: rnd(2, 6), life: 0, max: rnd(90, 150), kind: 'confetti', size: Math.floor(Math.random() * 4) }); };
  D.coins = (n) => { for (let i = 0; i < n; i++) parts.push({ x: 1000 + rnd(-300, 300), y: 700, vx: rnd(-5, 5), vy: rnd(-14, -8), life: 0, max: 60, kind: 'coin', size: rnd(8, 14) }); };
  function puff() {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', NOSE.x + rnd(-6, 6)); c.setAttribute('cy', NOSE.y); c.setAttribute('r', rnd(10, 18)); c.setAttribute('fill', '#b8c0cc'); c.setAttribute('class', 'puff');
    D.$('smoke').appendChild(c); setTimeout(() => c.remove(), 2700);
  }
  function ease(v, target, k, dt) { return v + (target - v) * Math.min(1, k * dt); }

  D.frame = (now) => {
    if (!svg) return;
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016); lastT = now;
    if (S.stage !== lastStage) {
      if (lastStage >= 0 && lastStage <= 1 && S.stage >= 2) for (let i = 0; i < 10; i++) parts.push({ x: NOSE.x, y: NOSE.y, vx: rnd(-5, 2), vy: rnd(-6, -1), life: 0, max: 40, kind: 'snot', size: rnd(3, 7) });
      svg.classList.remove('s0', 's1', 's2', 's3', 's4'); svg.classList.add('s' + S.stage); svg.style.setProperty('--breath', ['3.6s', '2.6s', '1.9s', '1.3s', '1s'][S.stage]); lastStage = S.stage;
    }
    svg.classList.toggle('awake', !!S.awake);
    const targetEye = S.awake ? 1 : (S.stage === 3 ? 0.7 : 0);
    S.eye = ease(S.eye, targetEye, S.awake ? 14 : 4, dt);
    D.$('lid').setAttribute('transform', `translate(0 ${-78 * S.eye})`);
    const closed = S.eye < 0.15 ? 1 : 0;
    D.$('closed').setAttribute('opacity', closed); D.$('lashes').setAttribute('opacity', closed); D.$('crease').setAttribute('opacity', closed ? 0.6 : 0);
    D.$('eyerim').setAttribute('opacity', 1 - closed);
    D.$('brow').setAttribute('opacity', S.awake ? 1 : 0);
    D.$('sweat').setAttribute('opacity', S.stage === 3 && !S.awake ? 1 : 0);
    let px = 0, py = 0;
    if (S.lookAt) { const dx = S.lookAt.x - EYE.x, dy = S.lookAt.y - EYE.y; const m = Math.hypot(dx, dy) || 1; px = dx / m * 14; py = dy / m * 8; }
    D.$('pupil').setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
    D.$('slit').setAttribute('rx', S.awake ? 4 : 7 + 4 * (1 - S.eye));
    S.tint = ease(S.tint, S.awake ? 0.45 : S.stage * 0.07, 2, dt);
    D.$('tintrect').setAttribute('opacity', S.tint.toFixed(3));
    D.$('fire').setAttribute('opacity', S.fire > 0.05 ? 1 : 0);
    D.$('fireglow').setAttribute('opacity', (S.fire * 0.9).toFixed(2));
    D.$('mouthopen').setAttribute('opacity', S.fire > 0.05 || S.awake ? 1 : (S.stage === 2 ? 0.5 + 0.5 * Math.sin(now / 120) : 0));
    if (S.stage >= 2 && !S.awake && Math.random() < 0.02 + S.stage * 0.02) puff();
    if (S.stage <= 1 && !S.awake && Math.random() < (S.stage === 0 ? 0.03 : 0.015)) zzz.push({ x: 470, y: 470, life: 0, size: rnd(26, 52), dx: rnd(-1.4, -0.5) });
    fctx.clearRect(0, 0, W, H);
    fctx.textAlign = 'center';
    for (let i = zzz.length - 1; i >= 0; i--) { const z = zzz[i]; z.life += dt; z.x += z.dx * 60 * dt; z.y -= 55 * dt; fctx.globalAlpha = Math.max(0, 1 - z.life / 3); fctx.fillStyle = '#dbe9ff'; fctx.font = `bold ${z.size}px "Fredoka", "Arial Rounded MT Bold", sans-serif`; fctx.fillText('z', z.x + Math.sin(z.life * 2) * 12, z.y); if (z.life > 3) zzz.splice(i, 1); }
    fctx.globalAlpha = 1;
    if (Math.random() < 0.12) parts.push({ x: rnd(600, 1400), y: rnd(690, 830), vx: 0, vy: -0.3, life: 0, max: 40, kind: 'sparkle', size: 4 });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life += 60 * dt; const k = p.life / p.max; if (k >= 1) { parts.splice(i, 1); continue; }
      p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt;
      if (p.kind === 'sparkle') { fctx.globalAlpha = Math.sin(k * Math.PI); fctx.strokeStyle = '#fff'; fctx.lineWidth = 2; fctx.beginPath(); fctx.moveTo(p.x - 6, p.y); fctx.lineTo(p.x + 6, p.y); fctx.moveTo(p.x, p.y - 6); fctx.lineTo(p.x, p.y + 6); fctx.stroke(); }
      else if (p.kind === 'coin') { p.vy += 0.35; fctx.globalAlpha = 1 - k; fctx.fillStyle = '#f6c945'; fctx.strokeStyle = '#9a6a10'; fctx.lineWidth = 2; fctx.beginPath(); fctx.ellipse(p.x, p.y, p.size, p.size * 0.6, 0, 0, 7); fctx.fill(); fctx.stroke(); }
      else if (p.kind === 'confetti') { p.vy += 0.1; fctx.globalAlpha = 1 - k; fctx.fillStyle = ['#ff5f9e', '#5fd3ff', '#9cff7a', '#f6c945'][p.size % 4]; fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.life / 8); fctx.fillRect(-6, -4, 12, 8); fctx.restore(); }
      else if (p.kind === 'snot') { p.vy += 0.3; fctx.globalAlpha = 1 - k; fctx.fillStyle = '#c6f0a2'; fctx.beginPath(); fctx.arc(p.x, p.y, p.size, 0, 7); fctx.fill(); }
      else if (p.kind === 'heart') { p.vy = -1.2; fctx.globalAlpha = 1 - k; fctx.fillStyle = '#dbe9ff'; fctx.font = 'bold 34px "Fredoka", sans-serif'; fctx.fillText('z', p.x, p.y); }
    }
    fctx.globalAlpha = 1;
  };

  global.DragonView = D;
})(window);
