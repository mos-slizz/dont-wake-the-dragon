/* Drawn avatars and icons (inline SVG). No emoji anywhere. */
(function (global) {
  'use strict';
  const ART = {};

  const eyes = (lx, rx, y, r = 7, pr = 3.2, look = { x: 0, y: 0.6 }) => `
    <circle cx="${lx}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${rx}" cy="${y}" r="${r}" fill="#fff"/>
    <circle cx="${lx + look.x}" cy="${y + look.y}" r="${pr}" fill="#1b1430"/><circle cx="${rx + look.x}" cy="${y + look.y}" r="${pr}" fill="#1b1430"/>
    <circle cx="${lx + look.x - 1.2}" cy="${y + look.y - 1.2}" r="1.1" fill="#fff"/><circle cx="${rx + look.x - 1.2}" cy="${y + look.y - 1.2}" r="1.1" fill="#fff"/>`;
  const blush = (lx, rx, y) => `<ellipse cx="${lx}" cy="${y}" rx="6" ry="3.5" fill="#ff7f9a" opacity=".45"/><ellipse cx="${rx}" cy="${y}" rx="6" ry="3.5" fill="#ff7f9a" opacity=".45"/>`;
  const smile = (x, y, w = 10) => `<path d="M${x - w} ${y} q${w} ${w * 0.9} ${w * 2} 0" fill="none" stroke="#1b1430" stroke-width="2.6" stroke-linecap="round"/>`;

  // Each avatar: { name, bg, svg } drawn in a 100x100 box.
  ART.AVATARS = {
    fox: { name: 'Fox', bg: '#3b2352', svg: `
      <path d="M24 44 L16 12 L44 34Z" fill="#ec7a2b"/><path d="M76 44 L84 12 L56 34Z" fill="#ec7a2b"/>
      <path d="M26 40 L21 20 L40 35Z" fill="#3b2352" opacity=".5"/><path d="M74 40 L79 20 L60 35Z" fill="#3b2352" opacity=".5"/>
      <ellipse cx="50" cy="58" rx="31" ry="27" fill="#ec7a2b"/>
      <path d="M50 88 C30 88 22 76 26 66 C34 74 44 74 50 66 C56 74 66 74 74 66 C78 76 70 88 50 88Z" fill="#fff3e3"/>
      ${eyes(40, 60, 54)}<path d="M46 71 q4 5 8 0 q-4 -3 -8 0z" fill="#1b1430"/>${smile(50, 74, 6)}${blush(31, 69, 63)}` },
    frog: { name: 'Frog', bg: '#173a2b', svg: `
      <circle cx="35" cy="36" r="13" fill="#5cc46a"/><circle cx="65" cy="36" r="13" fill="#5cc46a"/>
      <ellipse cx="50" cy="62" rx="34" ry="26" fill="#5cc46a"/><ellipse cx="50" cy="72" rx="24" ry="12" fill="#b7ec9c" opacity=".7"/>
      ${eyes(35, 65, 37, 9, 4)}<path d="M32 66 q18 16 36 0" fill="none" stroke="#1b1430" stroke-width="3" stroke-linecap="round"/>${blush(28, 72, 60)}` },
    cat: { name: 'Cat', bg: '#2c2a45', svg: `
      <path d="M22 50 L18 14 L46 32Z" fill="#9aa2b8"/><path d="M78 50 L82 14 L54 32Z" fill="#9aa2b8"/>
      <path d="M26 44 L24 24 L42 35Z" fill="#f4a7c0"/><path d="M74 44 L76 24 L58 35Z" fill="#f4a7c0"/>
      <ellipse cx="50" cy="58" rx="32" ry="28" fill="#9aa2b8"/>
      ${eyes(39, 61, 54, 7, 3)}<path d="M46 66 L54 66 L50 71Z" fill="#f4a7c0"/>
      <path d="M50 71 q-5 6 -10 2 M50 71 q5 6 10 2" fill="none" stroke="#1b1430" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M18 62 L36 66 M18 70 L36 69 M82 62 L64 66 M82 70 L64 69" stroke="#dfe4ef" stroke-width="2" stroke-linecap="round"/>` },
    panda: { name: 'Panda', bg: '#2f4d3a', svg: `
      <circle cx="26" cy="30" r="13" fill="#1b1430"/><circle cx="74" cy="30" r="13" fill="#1b1430"/>
      <ellipse cx="50" cy="58" rx="34" ry="30" fill="#fbfbff"/>
      <ellipse cx="38" cy="54" rx="11" ry="13" fill="#1b1430" transform="rotate(-18 38 54)"/><ellipse cx="62" cy="54" rx="11" ry="13" fill="#1b1430" transform="rotate(18 62 54)"/>
      ${eyes(39, 61, 55, 5, 2.6)}<ellipse cx="50" cy="70" rx="6" ry="4" fill="#1b1430"/>${smile(50, 75, 5)}${blush(27, 73, 66)}` },
    owl: { name: 'Owl', bg: '#3d2a1f', svg: `
      <path d="M22 34 L18 14 L36 26Z M78 34 L82 14 L64 26Z" fill="#8c5a33"/>
      <ellipse cx="50" cy="58" rx="34" ry="32" fill="#a5713f"/>
      <path d="M50 90 C34 90 26 80 28 70 L72 70 C74 80 66 90 50 90Z" fill="#e6c99a"/>
      <path d="M40 76 l5 6 l5 -6 M50 76 l5 6 l5 -6 M45 84 l5 6 l5 -6" fill="none" stroke="#a5713f" stroke-width="2"/>
      <circle cx="36" cy="50" r="15" fill="#f6ead0"/><circle cx="64" cy="50" r="15" fill="#f6ead0"/>
      <circle cx="36" cy="50" r="9" fill="#e9a03b"/><circle cx="64" cy="50" r="9" fill="#e9a03b"/>
      <circle cx="36" cy="50" r="4.5" fill="#1b1430"/><circle cx="64" cy="50" r="4.5" fill="#1b1430"/><circle cx="34" cy="48" r="1.5" fill="#fff"/><circle cx="62" cy="48" r="1.5" fill="#fff"/>
      <path d="M45 62 L55 62 L50 72Z" fill="#f08a2e"/>` },
    bunny: { name: 'Bunny', bg: '#4a2a4f', svg: `
      <ellipse cx="36" cy="26" rx="10" ry="24" fill="#fbf4f4"/><ellipse cx="64" cy="26" rx="10" ry="24" fill="#fbf4f4"/>
      <ellipse cx="36" cy="27" rx="5" ry="17" fill="#f6b6c8"/><ellipse cx="64" cy="27" rx="5" ry="17" fill="#f6b6c8"/>
      <ellipse cx="50" cy="62" rx="32" ry="28" fill="#fbf4f4"/>
      ${eyes(39, 61, 58, 6.5, 3)}<ellipse cx="50" cy="70" rx="4.5" ry="3" fill="#f48fa8"/>
      <path d="M50 73 q-4 5 -8 1 M50 73 q4 5 8 1" fill="none" stroke="#1b1430" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="45" y="76" width="4.5" height="7" rx="1" fill="#fff" stroke="#c9bdc4"/><rect x="50.5" y="76" width="4.5" height="7" rx="1" fill="#fff" stroke="#c9bdc4"/>${blush(29, 71, 67)}` },
    bear: { name: 'Bear', bg: '#2b2338', svg: `
      <circle cx="26" cy="32" r="13" fill="#8a5a3b"/><circle cx="74" cy="32" r="13" fill="#8a5a3b"/><circle cx="26" cy="32" r="7" fill="#c9946a"/><circle cx="74" cy="32" r="7" fill="#c9946a"/>
      <ellipse cx="50" cy="60" rx="34" ry="30" fill="#8a5a3b"/><ellipse cx="50" cy="72" rx="16" ry="11" fill="#c9946a"/>
      ${eyes(39, 61, 54, 6, 3)}<ellipse cx="50" cy="68" rx="6" ry="4.5" fill="#1b1430"/>${smile(50, 76, 5)}` },
    wolf: { name: 'Wolf', bg: '#1f2a44', svg: `
      <path d="M20 48 L16 12 L44 32Z" fill="#6e7ea3"/><path d="M80 48 L84 12 L56 32Z" fill="#6e7ea3"/>
      <path d="M25 42 L23 22 L40 34Z" fill="#c9d3ec"/><path d="M75 42 L77 22 L60 34Z" fill="#c9d3ec"/>
      <ellipse cx="50" cy="58" rx="32" ry="28" fill="#6e7ea3"/>
      <path d="M50 88 C32 88 26 74 30 64 C38 72 46 70 50 64 C54 70 62 72 70 64 C74 74 68 88 50 88Z" fill="#dfe6f7"/>
      ${eyes(39, 61, 53, 6.5, 3)}<path d="M31 45 l10 4 M69 45 l-10 4" stroke="#3b4666" stroke-width="3" stroke-linecap="round"/>
      <path d="M45 71 q5 6 10 0 q-5 -4 -10 0z" fill="#1b1430"/>${smile(50, 75, 5)}` },
    raccoon: { name: 'Raccoon', bg: '#3a3348', svg: `
      <path d="M22 48 L16 16 L44 32Z" fill="#7d7f8f"/><path d="M78 48 L84 16 L56 32Z" fill="#7d7f8f"/>
      <ellipse cx="50" cy="58" rx="32" ry="28" fill="#9b9dad"/>
      <path d="M18 54 C28 42 40 44 50 52 C60 44 72 42 82 54 C74 66 60 68 50 60 C40 68 26 66 18 54Z" fill="#2b2536"/>
      ${eyes(39, 61, 55, 6.5, 3)}<path d="M50 84 C36 84 32 74 36 68 L64 68 C68 74 64 84 50 84Z" fill="#e6e6ef"/>
      <ellipse cx="50" cy="70" rx="5.5" ry="4" fill="#1b1430"/>${smile(50, 77, 5)}` },
    penguin: { name: 'Penguin', bg: '#1a3a55', svg: `
      <ellipse cx="50" cy="56" rx="34" ry="34" fill="#1f2340"/>
      <path d="M50 88 C28 88 22 66 30 50 C38 44 44 48 50 44 C56 48 62 44 70 50 C78 66 72 88 50 88Z" fill="#f7f7ff"/>
      ${eyes(40, 60, 54, 6, 3)}<path d="M42 66 L58 66 L50 76Z" fill="#f4a531"/>${blush(31, 69, 66)}` },
    mouse: { name: 'Mouse', bg: '#4b3550', svg: `
      <circle cx="22" cy="34" r="17" fill="#b9b3c9"/><circle cx="78" cy="34" r="17" fill="#b9b3c9"/><circle cx="22" cy="34" r="10" fill="#f4b6cc"/><circle cx="78" cy="34" r="10" fill="#f4b6cc"/>
      <ellipse cx="50" cy="60" rx="30" ry="27" fill="#b9b3c9"/>
      ${eyes(40, 60, 56, 6, 3)}<ellipse cx="50" cy="71" rx="4.5" ry="3.2" fill="#f48fa8"/>
      <path d="M22 68 L42 71 M22 76 L42 74 M78 68 L58 71 M78 76 L58 74" stroke="#e9e4f0" stroke-width="2" stroke-linecap="round"/>${smile(50, 76, 4)}` },
    lion: { name: 'Lion', bg: '#4a2e1a', svg: `
      <path d="M50 12 L60 24 L74 18 L76 34 L92 36 L84 50 L94 62 L80 68 L84 84 L68 82 L62 96 L50 86 L38 96 L32 82 L16 84 L20 68 L6 62 L16 50 L8 36 L24 34 L26 18 L40 24Z" fill="#c9721f"/>
      <ellipse cx="50" cy="56" rx="28" ry="26" fill="#f0b256"/>
      <path d="M50 82 C34 82 30 70 34 64 L66 64 C70 70 66 82 50 82Z" fill="#f9dfae"/>
      ${eyes(40, 60, 52, 6, 3)}<path d="M45 66 L55 66 L50 72Z" fill="#7a3b12"/>${smile(50, 74, 5)}
      <circle cx="38" cy="70" r="1.5" fill="#7a3b12"/><circle cx="34" cy="74" r="1.5" fill="#7a3b12"/><circle cx="62" cy="70" r="1.5" fill="#7a3b12"/><circle cx="66" cy="74" r="1.5" fill="#7a3b12"/>` },
    hatchling: { name: 'Hatchling', bg: '#1f3d4a', svg: `
      <path d="M50 14 L54 26 L46 26Z" fill="#8fdc72"/>
      <path d="M22 44 C16 28 30 20 38 30Z M78 44 C84 28 70 20 62 30Z" fill="#8fdc72"/>
      <ellipse cx="50" cy="58" rx="32" ry="28" fill="#8fdc72"/><ellipse cx="50" cy="72" rx="20" ry="11" fill="#fff3c9"/>
      <path d="M36 32 L40 20 L48 30Z M64 32 L60 20 L52 30Z" fill="#fff3c9" stroke="#b39a5a" stroke-width="1.5"/>
      ${eyes(40, 60, 54, 7, 3.2)}<circle cx="44" cy="66" r="2" fill="#2c6f3b"/><circle cx="56" cy="66" r="2" fill="#2c6f3b"/>
      <path d="M40 76 q10 8 20 0" fill="none" stroke="#2c6f3b" stroke-width="2.6" stroke-linecap="round"/><path d="M46 76 l2 4 l2 -4 M54 76 l-2 4 l-2 -4" fill="#fff"/>${blush(30, 70, 64)}` },
  };
  ART.AVATAR_KEYS = Object.keys(ART.AVATARS);
  ART.avatar = (key, cls = '') => { const a = ART.AVATARS[key] || ART.AVATARS.fox; return `<svg class="av ${cls}" viewBox="0 0 100 100" aria-label="${a.name}"><circle cx="50" cy="50" r="49" fill="${a.bg}"/>${a.svg}</svg>`; };
  ART.avatarName = (key) => (ART.AVATARS[key] || ART.AVATARS.fox).name;

  // Icons: 24x24, stroke = currentColor unless noted.
  const I = {
    mask: '<path d="M3 8c0-2 3-3 9-3s9 1 9 3v4c0 4-3 8-9 8s-9-4-9-8Z" fill="currentColor"/><ellipse cx="8.5" cy="11.5" rx="2.6" ry="1.8" fill="#fff"/><ellipse cx="15.5" cy="11.5" rx="2.6" ry="1.8" fill="#fff"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/>',
    check: '<path d="M4 12.5l5 5L20 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    star: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8Z" fill="currentColor"/>',
    hand: '<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5V4a1.5 1.5 0 0 1 3 0v7m0-5.5a1.5 1.5 0 0 1 3 0V12m0-2a1.5 1.5 0 0 1 3 0v5a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L4 14a1.6 1.6 0 0 1 2.6-1.8L8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="currentColor"/>',
    sun: '<circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    coin: '<circle cx="12" cy="12" r="9.5" fill="currentColor"/><circle cx="12" cy="12" r="6" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/><path d="M12 8.5v7M10 10.5h3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h3" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1.6" stroke-linecap="round"/>',
    slot: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/>',
    fire: '<path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2 .8-3.3 1.8-4.4.2 1.4.9 2.4 2.2 2.6C10.5 8 9.5 5 12 2Z" fill="currentColor"/>',
    crown: '<path d="M3 18h18l1-11-5.5 4L12 4l-4.5 7L2 7Z" fill="currentColor"/><rect x="3" y="18" width="18" height="3" fill="currentColor" opacity=".7"/>',
    left: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    right: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    flat: '<rect x="3" y="9" width="18" height="6" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18.5" r="1.2" fill="currentColor"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9Z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9Z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    speech: '<path d="M4 5h16v11H10l-5 4v-4H4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 9h8M8 12.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    trophy: '<path d="M7 3h10v5a5 5 0 0 1-10 0Z" fill="currentColor"/><path d="M7 5H3a3 3 0 0 0 3 5M17 5h4a3 3 0 0 1-3 5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="13" width="4" height="4" fill="currentColor"/><rect x="7" y="17" width="10" height="3" rx="1" fill="currentColor"/>',
    hush: '<path d="M12 3c-3 0-4 2-4 4v5H6.5a1.5 1.5 0 0 0 0 3H8v1a5 5 0 0 0 10 0V8c0-3-3-5-6-5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    rock: '<path d="M4 17l3-8 5-4 6 3 3 6-2 4H6Z" fill="currentColor"/>',
    glove: '<path d="M7 12V6a1.5 1.5 0 0 1 3 0v5m0-6V4a1.5 1.5 0 0 1 3 0v7m0-6a1.5 1.5 0 0 1 3 0v6m0-3a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-2Z" fill="currentColor"/>',
    butter: '<path d="M3 10l6-4h12v8l-6 4H3Z" fill="currentColor"/><path d="M3 10h12v8M15 10l6-4" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>',
    shoe: '<path d="M4 16c0-2 2-3 4-3h3l3-4 2 1-2 3h2c2 0 4 1 4 3v2H4Z" fill="currentColor"/>',
    skull: '<path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6v3h10v-3c1.5-1 3-3 3-6a8 8 0 0 0-8-8Z" fill="currentColor"/><circle cx="9" cy="10" r="2" fill="#1b1430"/><circle cx="15" cy="10" r="2" fill="#1b1430"/><path d="M11 14h2v2h-2Z" fill="#1b1430"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5Z" fill="currentColor"/><path d="M12 6v12M8 11h8" stroke="rgba(0,0,0,.35)" stroke-width="2"/>',
    sword: '<path d="M14 3l7 7-9 9-2-2 7-7-5-5Z" fill="currentColor"/><path d="M4 20l4-4M6 14l4 4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    wand: '<path d="M3 21l11-11 2 2L5 23Z" fill="currentColor"/><path d="M17 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="currentColor"/><path d="M9 5l.6 1.6L11 7l-1.4.5L9 9l-.6-1.5L7 7l1.4-.4Z" fill="currentColor"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    dragon: '<path d="M3 13c2-5 6-7 10-7 3 0 5 1 7 3l1 3-3 1-2-2c-1 2-1 4 0 6l-2 1c-2-2-3-4-3-6-2 1-4 3-5 6l-3-1c0-2 0-3 0-4Z" fill="currentColor"/><circle cx="16.5" cy="10" r="1.2" fill="#1b1430"/>',
    egg: '<path d="M12 2c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11Z" fill="currentColor"/>',
    gem: '<path d="M6 3h12l4 6-10 13L2 9Z" fill="currentColor"/><path d="M2 9h20M6 3l6 19M18 3l-6 19" stroke="rgba(0,0,0,.3)" stroke-width="1.2" fill="none"/>',
    marble: '<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="9" cy="9" r="3" fill="#fff" opacity=".8"/>',
    bag: '<path d="M9 4h6l2 4H7Z" fill="currentColor"/><path d="M6 8h12c2 4 3 8 2 12H4c-1-4 0-8 2-12Z" fill="currentColor"/><path d="M12 11v6M10 12.5h3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h3" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="1.4" stroke-linecap="round"/>',
  };
  ART.icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || ''}</svg>`;
  ART.ICONS = I;

  global.ART = ART;
})(window);
