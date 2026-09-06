/* Dragon + cave scene for the TV. Layered SVG (CSS-animated) with a particle canvas on top. 1600x900 logical. */
(function (global) {
  'use strict';
  const W = 1600, H = 900;
  const D = {};
  const S = { stage: 0, meter: 0, eye: 0, fire: 0, lookAt: null, twitch: 0, sneeze: 0, lootLeft: 1, awake: false, tint: 0, crown: false };
  const parts = [];
  let svg, fx, fctx, lastT = 0, lastStage = -1, twitchUntil = 0;
  const zzz = [];
  const NOSE = { x: 372, y: 596 }, MOUTH = { x: 360, y: 648 }, EYE = { x: 560, y: 528 };

  const rnd = (a, b) => a + Math.random() * (b - a);

  function coinsSvg() {
    let s = '';
    const cols = ['#ffe27a', '#f7c94a', '#e0a92a', '#ffd35c'];
    for (let i = 0; i < 90; i++) {
      const x = rnd(560, 1440), y = rnd(700, 830), r = rnd(9, 16);
      const inside = ((x - 1000) / 440) ** 2 + ((y - 790) / 110) ** 2 < 1;
      if (!inside) continue;
      s += `<g class="coin" data-o="${(i / 90).toFixed(2)}"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.55}" fill="${cols[i % 4]}" stroke="#9a6a10" stroke-width="2"/><ellipse cx="${x}" cy="${y - 1}" rx="${r * 0.55}" ry="${r * 0.28}" fill="none" stroke="#b8891c" stroke-width="1.5"/></g>`;
    }
    const gems = [['#5fd3ff', 700, 770], ['#ff5f9e', 1240, 745], ['#9cff7a', 890, 815], ['#c48bff', 1330, 800], ['#ff9f43', 640, 810], ['#5fd3ff', 1120, 825]];
    for (const [c, x, y] of gems) s += `<g class="coin" data-o="${Math.random().toFixed(2)}"><path d="M${x} ${y - 16} L${x + 16} ${y} L${x} ${y + 16} L${x - 16} ${y} Z" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M${x - 5} ${y - 9} L${x + 1} ${y - 12} L${x + 4} ${y - 4} Z" fill="rgba(255,255,255,.7)"/></g>`;
    return s;
  }

  function sceneSvg() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" id="dragonsvg">
<defs>
  <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0b24"/><stop offset=".6" stop-color="#1c1238"/><stop offset="1" stop-color="#2a1a3f"/></linearGradient>
  <radialGradient id="gGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8fd8ff" stop-opacity=".55"/><stop offset="1" stop-color="#8fd8ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="gGlowP" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d59bff" stop-opacity=".5"/><stop offset="1" stop-color="#d59bff" stop-opacity="0"/></radialGradient>
  <radialGradient id="gFire" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9a2e" stop-opacity=".75"/><stop offset="1" stop-color="#ff3d00" stop-opacity="0"/></radialGradient>
  <linearGradient id="gBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdc72"/><stop offset=".55" stop-color="#4fae53"/><stop offset="1" stop-color="#2c6f3b"/></linearGradient>
  <linearGradient id="gBodyR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8f6b"/><stop offset=".55" stop-color="#e0483a"/><stop offset="1" stop-color="#7a1f2a"/></linearGradient>
  <linearGradient id="gDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8f47"/><stop offset="1" stop-color="#1f4d2b"/></linearGradient>
  <linearGradient id="gBelly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset="1" stop-color="#e2c27d"/></linearGradient>
  <linearGradient id="gHorn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8e4"/><stop offset="1" stop-color="#cfae6a"/></linearGradient>
  <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe89a"/><stop offset=".5" stop-color="#f2c23e"/><stop offset="1" stop-color="#b8841a"/></linearGradient>
  <linearGradient id="gWing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c8a48"/><stop offset="1" stop-color="#1e4a2c"/></linearGradient>
  <radialGradient id="gEye" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff9e6"/><stop offset="1" stop-color="#e8d9a8"/></radialGradient>
  <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".45"/></filter>
  <clipPath id="eyeClip"><ellipse cx="0" cy="0" rx="42" ry="36"/></clipPath>
  <pattern id="scales" width="26" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><path d="M0 22 A13 13 0 0 1 26 22" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="2"/><path d="M-13 11 A13 13 0 0 1 13 11 M13 11 A13 13 0 0 1 39 11" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="2"/></pattern>
</defs>

<rect width="${W}" height="${H}" fill="url(#gSky)"/>
<g id="cave">
  <g opacity=".9" fill="#120c26">
    ${Array.from({ length: 16 }, (_, i) => { const x = i * 105 + 20 + (i % 3) * 12, h = 70 + ((i * 53) % 110), w = 34 + (i % 4) * 8; return `<path d="M${x - w} 0 L${x + w} 0 Q${x + w * 0.4} ${h * 0.5} ${x} ${h} Q${x - w * 0.4} ${h * 0.5} ${x - w} 0Z"/>`; }).join('')}
  </g>
  <g id="crystals">
    <circle cx="150" cy="560" r="120" fill="url(#gGlow)"/><path d="M120 620 L150 480 L185 620Z M100 630 L118 560 L136 630Z" fill="#8fd8ff" opacity=".8"/>
    <circle cx="1480" cy="520" r="130" fill="url(#gGlowP)"/><path d="M1450 600 L1480 430 L1515 600Z M1510 610 L1530 540 L1552 610Z" fill="#d59bff" opacity=".8"/>
    <circle cx="300" cy="300" r="4" fill="#fff" class="tw"/><circle cx="1200" cy="180" r="3" fill="#fff" class="tw"/><circle cx="820" cy="240" r="3" fill="#fff" class="tw"/><circle cx="1400" cy="300" r="4" fill="#fff" class="tw"/><circle cx="500" cy="200" r="3" fill="#fff" class="tw"/>
  </g>
  <ellipse cx="800" cy="890" rx="1100" ry="120" fill="#1a1230"/>
  <circle id="fireglow" cx="380" cy="600" r="520" fill="url(#gFire)" opacity="0"/>
</g>

<g id="treasure" filter="url(#shadow)">
  <path d="M520 810 Q600 690 800 660 Q1000 630 1220 660 Q1420 690 1470 800 Q1490 850 1420 860 L570 860 Q490 850 520 810Z" fill="url(#gGold)"/>
  <path d="M600 760 Q800 690 1000 700 Q1200 700 1380 770" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="10" stroke-linecap="round"/>
  <g id="coins">${coinsSvg()}</g>
  <g id="sword" transform="translate(1385 690) rotate(18)"><rect x="-5" y="-150" width="10" height="150" fill="#dfe6ee" stroke="#8b96a3" stroke-width="2"/><rect x="-28" y="-6" width="56" height="12" rx="4" fill="url(#gGold)"/><rect x="-6" y="6" width="12" height="40" fill="#5a3a1a"/><circle cx="0" cy="52" r="9" fill="url(#gGold)"/></g>
  <g id="goblet" transform="translate(640 745)"><path d="M-22 -40 Q-26 -5 0 0 Q26 -5 22 -40Z" fill="url(#gGold)"/><rect x="-4" y="0" width="8" height="18" fill="#c9931a"/><ellipse cx="0" cy="20" rx="16" ry="5" fill="url(#gGold)"/><circle cx="-8" cy="-26" r="4" fill="#ff5f9e"/><circle cx="8" cy="-26" r="4" fill="#5fd3ff"/></g>
</g>

<g id="dragon" filter="url(#shadow)">
  <g id="tail">
    <path id="tailpath" d="M1230 610 C1420 620 1540 690 1520 790 C1505 860 1400 880 1330 830 C1380 855 1450 840 1458 785 C1465 720 1380 690 1230 700Z" fill="url(#gBody)"/>
    <path d="M1270 655 C1420 660 1500 720 1490 790" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="6"/>
    <g transform="translate(1330 830)"><g id="tailtip"><path d="M0 0 L-40 -30 L-70 0 L-40 30Z" fill="url(#gDark)"/><path d="M-8 0 L-40 -22 L-62 0 L-40 22Z" fill="url(#gBody)"/></g></g>
  </g>
  <g id="wing"><path d="M930 440 Q980 300 1120 290 Q1265 300 1275 470 Q1180 405 1060 435 Q990 450 930 440Z" fill="url(#gWing)"/>
    <path d="M950 435 Q1010 330 1120 300 M1000 440 Q1080 340 1180 320 M1080 445 Q1180 380 1250 380" fill="none" stroke="#173a22" stroke-width="5" stroke-linecap="round"/>
    <path d="M1120 290 Q1140 260 1170 262 Q1150 280 1150 305Z" fill="#173a22"/></g>
  <g id="body">
    <path id="bodyshape" d="M700 520 C760 400 1000 360 1180 420 C1330 470 1360 600 1290 690 C1220 760 900 780 760 720 C660 680 650 580 700 520Z" fill="url(#gBody)"/>
    <path d="M700 520 C760 400 1000 360 1180 420 C1330 470 1360 600 1290 690 C1220 760 900 780 760 720 C660 680 650 580 700 520Z" fill="url(#scales)" opacity=".9"/>
    <g id="spikes" fill="url(#gHorn)" stroke="#a88a4a" stroke-width="2">
      <path d="M790 470 L805 415 L830 458Z"/><path d="M870 430 L890 372 L915 420Z"/><path d="M955 405 L975 345 L1000 398Z"/><path d="M1040 395 L1060 338 L1085 392Z"/><path d="M1125 405 L1150 352 L1170 404Z"/><path d="M1210 428 L1240 385 L1250 435Z"/>
    </g>
    <ellipse cx="985" cy="650" rx="235" ry="92" fill="url(#gBelly)"/>
    <g fill="none" stroke="rgba(120,80,20,.28)" stroke-width="4"><path d="M775 640 Q985 595 1195 640"/><path d="M780 672 Q985 632 1190 672"/><path d="M800 704 Q985 668 1170 704"/><path d="M840 732 Q985 702 1130 732"/></g>
    <ellipse cx="1150" cy="690" rx="80" ry="38" fill="url(#gBody)"/>
    <ellipse cx="1150" cy="700" rx="60" ry="22" fill="url(#gBelly)" opacity=".8"/>
    <g fill="#fff4d6" stroke="#a88a4a" stroke-width="2"><path d="M1090 712 L1078 740 L1102 724Z"/><path d="M1140 726 L1132 756 L1156 736Z"/><path d="M1190 720 L1190 748 L1210 728Z"/></g>
  </g>
  <g id="neck"><path d="M735 525 C700 470 640 470 600 520 C620 600 680 640 760 690 C700 630 700 570 735 525Z" fill="url(#gBody)"/></g>
  <g transform="translate(600 560)"><g id="head">
    <path d="M110 -40 L205 -100 L200 -15 Z" fill="url(#gDark)"/><path d="M125 -42 L185 -80 L182 -25 Z" fill="#ff9e8e" opacity=".55"/>
    <path id="horn2" d="M-20 -100 C-10 -175 40 -195 75 -165 C45 -150 22 -120 15 -88Z" fill="url(#gHorn)" stroke="#a88a4a" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="150" ry="108" fill="url(#gBody)"/>
    <ellipse cx="0" cy="0" rx="150" ry="108" fill="url(#scales)" opacity=".8"/>
    <path id="horn1" d="M40 -95 C60 -175 125 -205 160 -172 C125 -160 95 -125 82 -78Z" fill="url(#gHorn)" stroke="#a88a4a" stroke-width="2"/>
    <ellipse cx="-125" cy="42" rx="112" ry="70" fill="url(#gBody)"/>
    <ellipse cx="-120" cy="82" rx="100" ry="38" fill="url(#gBelly)"/>
    <ellipse cx="-58" cy="52" rx="30" ry="16" fill="#ff8aa0" opacity=".45"/>
    <ellipse cx="-215" cy="30" rx="12" ry="8" fill="#1f4d2b"/><ellipse cx="-198" cy="60" rx="12" ry="8" fill="#1f4d2b"/>
    <g id="mouthgrp"><path id="mouth" d="M-232 78 Q-140 106 -40 92" fill="none" stroke="#1f4d2b" stroke-width="7" stroke-linecap="round"/>
      <path id="mouthopen" d="M-232 78 Q-140 150 -40 92 Q-140 100 -232 78Z" fill="#6b1f2a" opacity="0"/>
      <path d="M-186 82 L-178 100 L-170 82Z M-96 90 L-88 106 L-80 88Z" fill="#fff"/></g>
    <path d="M60 -46 Q88 -66 118 -48" fill="none" stroke="#1f4d2b" stroke-width="6" stroke-linecap="round"/>
    <g id="eye" transform="translate(-40 -30)">
      <g clip-path="url(#eyeClip)">
        <ellipse cx="0" cy="0" rx="42" ry="36" fill="url(#gEye)"/>
        <g id="pupil"><circle cx="0" cy="2" r="22" fill="#e0a92a"/><circle cx="0" cy="2" r="22" fill="none" stroke="#a86f10" stroke-width="3"/><ellipse id="slit" cx="0" cy="2" rx="7" ry="20" fill="#120c1a"/><circle cx="-8" cy="-9" r="6" fill="#fff" opacity=".9"/></g>
        <rect id="lid" x="-50" y="-40" width="100" height="80" fill="#4fae53" transform="translate(0 0)"/>
      </g>
      <ellipse cx="0" cy="0" rx="42" ry="36" fill="none" stroke="#1f4d2b" stroke-width="5" id="eyerim" opacity="0"/>
      <path id="closed" d="M-42 0 Q0 26 42 0" fill="none" stroke="#1f4d2b" stroke-width="7" stroke-linecap="round"/>
      <path d="M-48 8 L-58 14 M-38 20 L-46 30 M-28 26 L-32 38" stroke="#1f4d2b" stroke-width="4" stroke-linecap="round" id="lashes"/>
    </g>
    <path id="brow" d="M-100 -78 L-5 -56" fill="none" stroke="#1f4d2b" stroke-width="9" stroke-linecap="round" opacity="0"/>
    <path id="sweat" d="M112 -70 q10 14 0 22 q-10 -8 0 -22z" fill="#8fd8ff" opacity="0"/>
    <g id="crowngrp" opacity="0" transform="translate(70 -150) rotate(12)"><path d="M-50 20 L-50 -25 L-25 0 L0 -35 L25 0 L50 -25 L50 20Z" fill="url(#gGold)" stroke="#9a6a10" stroke-width="3"/><circle cx="0" cy="-34" r="7" fill="#ff5f9e"/><circle cx="-50" cy="-26" r="6" fill="#5fd3ff"/><circle cx="50" cy="-26" r="6" fill="#9cff7a"/><rect x="-50" y="12" width="100" height="10" fill="#c9931a"/></g>
  </g></g>
  <g id="paws">
    <ellipse cx="640" cy="705" rx="88" ry="40" fill="url(#gBody)"/><g fill="url(#gBelly)"><circle cx="575" cy="720" r="15"/><circle cx="605" cy="732" r="15"/><circle cx="640" cy="736" r="15"/></g><g fill="#fff4d6" stroke="#a88a4a" stroke-width="2"><path d="M565 730 L552 752 L578 738Z"/><path d="M596 742 L588 766 L612 748Z"/><path d="M632 746 L630 770 L650 752Z"/></g>
    <ellipse cx="520" cy="690" rx="82" ry="38" fill="url(#gBody)"/><g fill="url(#gBelly)"><circle cx="465" cy="706" r="14"/><circle cx="492" cy="716" r="14"/><circle cx="522" cy="720" r="14"/></g><g fill="#fff4d6" stroke="#a88a4a" stroke-width="2"><path d="M455 716 L442 738 L468 724Z"/><path d="M484 726 L476 750 L500 732Z"/><path d="M516 730 L514 754 L534 736Z"/></g>
  </g>
  <g id="fire" opacity="0" transform="translate(${MOUTH.x} ${MOUTH.y})">
    <path class="fl fl1" d="M0 0 C-90 -80 -260 -110 -420 -30 C-300 -20 -300 0 -420 40 C-260 90 -90 60 0 0Z" fill="#ff4d1a" opacity=".9"/>
    <path class="fl fl2" d="M0 0 C-70 -55 -200 -75 -330 -20 C-230 -14 -230 0 -330 30 C-200 65 -70 45 0 0Z" fill="#ffb02e"/>
    <path class="fl fl3" d="M0 0 C-50 -35 -140 -45 -230 -12 C-160 -8 -160 0 -230 20 C-140 40 -50 30 0 0Z" fill="#fff3a0"/>
  </g>
  <g id="smoke"></g>
</g>
<rect id="tintrect" width="${W}" height="${H}" fill="#ff2d1a" opacity="0" style="mix-blend-mode:multiply"/>
</svg>`;
  }

  const CSS = `
#dragonsvg { position:absolute; inset:0; width:1600px; height:900px; --breath:3.6s; }
#dragonsvg .tw { animation: twinkle 2.4s ease-in-out infinite alternate; }
#dragonsvg .tw:nth-child(odd) { animation-delay: -1.2s; }
@keyframes twinkle { from { opacity:.2 } to { opacity:1 } }
#dragonsvg #body, #dragonsvg #wing { transform-box: fill-box; transform-origin: 50% 100%; animation: breathe var(--breath) ease-in-out infinite; }
#dragonsvg #wing { animation-name: wingbreathe; }
#dragonsvg #head, #dragonsvg #neck { transform-box: fill-box; transform-origin: 80% 100%; animation: headbob var(--breath) ease-in-out infinite; }
@keyframes breathe { 0%,100% { transform: scale(1,1) } 50% { transform: scale(1.012,1.035) } }
@keyframes wingbreathe { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
@keyframes headbob { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-5px) rotate(-.4deg) } }
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
    if (o.crown != null) D.$('crowngrp').setAttribute('opacity', o.crown ? 1 : 0);
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
    // stage classes
    if (S.stage !== lastStage) { svg.classList.remove('s0', 's1', 's2', 's3', 's4'); svg.classList.add('s' + S.stage); svg.style.setProperty('--breath', ['3.6s', '2.6s', '1.9s', '1.3s', '1s'][S.stage]); lastStage = S.stage; }
    svg.classList.toggle('awake', !!S.awake);
    // eye
    const targetEye = S.awake ? 1 : (S.stage === 3 ? 0.7 : 0);
    S.eye = ease(S.eye, targetEye, S.awake ? 14 : 4, dt);
    D.$('lid').setAttribute('transform', `translate(0 ${-78 * S.eye})`);
    D.$('closed').setAttribute('opacity', S.eye < 0.15 ? 1 : 0); D.$('lashes').setAttribute('opacity', S.eye < 0.15 ? 1 : 0);
    D.$('eyerim').setAttribute('opacity', S.eye > 0.15 ? 1 : 0);
    D.$('brow').setAttribute('opacity', S.awake ? 1 : 0);
    D.$('sweat').setAttribute('opacity', S.stage === 3 && !S.awake ? 1 : 0);
    let px = 0, py = 0;
    if (S.lookAt) { const dx = S.lookAt.x - EYE.x, dy = S.lookAt.y - EYE.y; const m = Math.hypot(dx, dy) || 1; px = dx / m * 14; py = dy / m * 8; }
    D.$('pupil').setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
    D.$('slit').setAttribute('rx', S.awake ? 4 : 7 + 4 * (1 - S.eye));
    // tint & fire
    S.tint = ease(S.tint, S.awake ? 0.45 : S.stage * 0.07, 2, dt);
    D.$('tintrect').setAttribute('opacity', S.tint.toFixed(3));
    D.$('fire').setAttribute('opacity', S.fire > 0.05 ? 1 : 0);
    D.$('fireglow').setAttribute('opacity', (S.fire * 0.9).toFixed(2));
    D.$('mouthopen').setAttribute('opacity', S.fire > 0.05 || S.awake ? 1 : (S.stage === 2 ? 0.5 + 0.5 * Math.sin(now / 120) : 0));
    // smoke
    if (S.stage >= 2 && !S.awake && Math.random() < 0.02 + S.stage * 0.02) puff();
    // zzz
    if (S.stage <= 1 && !S.awake && Math.random() < (S.stage === 0 ? 0.03 : 0.015)) zzz.push({ x: 470, y: 470, life: 0, size: rnd(26, 52), dx: rnd(-1.4, -0.5) });
    // particles
    fctx.clearRect(0, 0, W, H);
    fctx.textAlign = 'center';
    for (let i = zzz.length - 1; i >= 0; i--) { const z = zzz[i]; z.life += dt; z.x += z.dx * 60 * dt; z.y -= 55 * dt; fctx.globalAlpha = Math.max(0, 1 - z.life / 3); fctx.fillStyle = '#dbe9ff'; fctx.font = `bold ${z.size}px "Fredoka", "Arial Rounded MT Bold", sans-serif`; fctx.fillText('z', z.x + Math.sin(z.life * 2) * 12, z.y); if (z.life > 3) zzz.splice(i, 1); }
    fctx.globalAlpha = 1;
    if (Math.random() < 0.12) parts.push({ x: rnd(600, 1400), y: rnd(690, 830), vx: 0, vy: -0.3, life: 0, max: 40, kind: 'sparkle', size: 4 });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life += 60 * dt; const k = p.life / p.max; if (k >= 1) { parts.splice(i, 1); continue; }
      p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt;
      if (p.kind === 'sparkle') { fctx.globalAlpha = Math.sin(k * Math.PI); fctx.fillStyle = '#fff'; fctx.font = '18px sans-serif'; fctx.fillText('✦', p.x, p.y); }
      else if (p.kind === 'coin') { p.vy += 0.35; fctx.globalAlpha = 1 - k; fctx.fillStyle = '#f6c945'; fctx.strokeStyle = '#9a6a10'; fctx.lineWidth = 2; fctx.beginPath(); fctx.ellipse(p.x, p.y, p.size, p.size * 0.6, 0, 0, 7); fctx.fill(); fctx.stroke(); }
      else if (p.kind === 'confetti') { p.vy += 0.1; fctx.globalAlpha = 1 - k; fctx.fillStyle = ['#ff5f9e', '#5fd3ff', '#9cff7a', '#f6c945'][p.size % 4]; fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.life / 8); fctx.fillRect(-6, -4, 12, 8); fctx.restore(); }
      else if (p.kind === 'heart') { p.vy = -1.5; fctx.globalAlpha = 1 - k; fctx.font = '30px sans-serif'; fctx.fillText('💤', p.x, p.y); }
    }
    fctx.globalAlpha = 1;
  };

  global.DragonView = D;
})(window);
