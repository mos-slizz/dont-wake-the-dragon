/* Don't Wake the Dragon — shared constants, content and the realtime relay.
   Loaded by both the TV (index.html) and the phones (play.html). */
(function (global) {
  'use strict';

  const DWTD = {};
  DWTD.VERSION = '0.2.0';
  DWTD.PROTO = 'dwtd1';

  // Public MQTT-over-WebSockets brokers. No backend to run. First one that connects wins.
  DWTD.BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081',
  ];

  // ---------- Content ----------
  DWTD.DRAGON_NAMES = [
    'Barbara', 'Gerald', 'Sir Snorington', 'Doug', 'Princess Toastface', 'Kevin the Unbothered',
    'Grandma Ember', 'Lord Crispy', 'Susan', 'Big Nap', 'Dennis the Menace-ish', 'Auntie Scorch',
    'Wendell', 'Captain Snoozles', 'Mildred', 'The Duke of Drool',
  ];

  // Things the dragon mutters in its sleep. {name} = a random player name.
  DWTD.SLEEP_TALK = {
    deep: [
      'zzz... mmm... crunchy knights...',
      'no... not the tax man...',
      'five more minutes... five more centuries...',
      'mmm... marshmallow village...',
      'zzz... who ate my castle...',
      'I am NOT a lizard...',
      'zzz... the princess said I had nice scales...',
      'mmm... toasty peasants...',
      'buy low... sell gold... zzz...',
      '...and then I ate the moon...',
    ],
    twitch: [
      'hmm? ...a mouse... just a mouse...',
      'mmf... is it Tuesday...',
      'did someone say... snack...',
      '...I smell... {name}...',
      'zzz... the floor is... suspicious...',
      'stop breathing so LOUD...',
    ],
    mumble: [
      'who... whoossat...',
      'if that\'s you, {name}, I swear...',
      'I hear... sneakers...',
      'wiggly... wiggly little... thieves...',
      'the treasure... COUNT the treasure... zzz',
      'mmm... hold still... you look tastier still...',
    ],
    eye: [
      '...I see you.',
      'one... more... noise...',
      'ohhh you are SO lucky I\'m cozy.',
      'is that... a family?',
      'don\'t. move.',
    ],
  };

  // Blame shouts when a lookout wobbles. {name} = culprit.
  DWTD.BLAME_LINES = [
    'SHH, {name}!',
    '{name}, that was YOU.',
    'Statue, {name}. STATUE.',
    'The dragon heard {name}\'s elbow.',
    '{name}. We talked about this.',
    'Was that a giggle, {name}?',
    '{name} is vibrating like a phone in a purse.',
    '{name} sneezed with their whole body.',
    'Nobody move. Especially {name}.',
    'Cool, cool. {name} has jelly arms.',
  ];

  // Roasted culprit epitaphs (shown on the failure screen). {name} = culprit.
  DWTD.EPITAPHS = [
    'Here lies {name}. Wiggled once. It was enough.',
    '{name}: lightly toasted, thoroughly blamed.',
    'In memory of {name}, who had a brave sneeze.',
    '{name} discovered that dragons have EXCELLENT hearing.',
    'RIP {name}. The giggle was worth it. Probably.',
    '{name}: now available in marshmallow form.',
    '{name} moved 0.4 centimeters. Legendary.',
    'The dragon sends its regards to {name}\'s elbows.',
  ];
  DWTD.THIEF_EPITAPHS = [
    '{name} dropped the loot. CLANG heard in three kingdoms.',
    '{name}: butterfingers of the realm.',
    'The thief {name} tripped over the treasure. Classic.',
  ];
  DWTD.TIMEOUT_LINES = [
    'The sun came up. Dragons are morning people, unfortunately.',
    'Nap over. Nobody told the dragon it was a nap.',
    'Dawn. The dragon stretched, yawned, and noticed you all.',
  ];

  DWTD.WIN_LINES = [
    'Ninjas. Absolute ninjas.',
    'The dragon will never know. Until it counts.',
    'Loot secured. Nobody breathed for a full minute.',
    'Smooth. Suspiciously smooth.',
    'The dragon dreams on, poorer and unaware.',
    'You are all very quiet, very rich people now.',
  ];

  // Lookout phone commentary based on stillness (index by band 0=perfect ... 4=chaos).
  DWTD.STILL_LINES = [
    ['Statue mode.', 'Are you even alive?', 'Frozen. Perfect.', 'The dragon thinks you\'re furniture.'],
    ['Tiny wobble.', 'Steady... steady...', 'Nice and boring. Good.'],
    ['Hmm. Jelly arms?', 'That was a wiggle.', 'Breathe SMALLER.'],
    ['Whoa whoa whoa.', 'The dragon heard that.', 'What are you DOING?'],
    ['ARE YOU DANCING?!', 'Earthquake detected.', 'You woke up the neighbours too.'],
  ];

  // The heist ladder. Difficulty escalates. {dragon} = dragon name.
  DWTD.HEISTS = [
    { n: 1, title: 'The Coin Jar', flavor: '{dragon}\'s spare change. Just a warm-up.',
      items: 2, napSec: 70, creep: 1.2, decay: 6, sens: 1.0, tiptoe: 2, loot: 100 },
    { n: 2, title: 'The Golden Goblet', flavor: 'Still has dragon backwash in it. Worth a fortune.',
      items: 3, napSec: 75, creep: 1.6, decay: 5.5, sens: 1.1, tiptoe: 2, loot: 200 },
    { n: 3, title: 'The Goose Egg', flavor: 'A golden egg. Do NOT drop it. It hums.',
      items: 3, napSec: 75, creep: 2.0, decay: 5, sens: 1.2, tiptoe: 3, loot: 300 },
    { n: 4, title: 'The Enchanted Sword', flavor: 'It sings when you touch it. Loudly. Ugh.',
      items: 4, napSec: 80, creep: 2.4, decay: 4.5, sens: 1.3, tiptoe: 3, loot: 450 },
    { n: 5, title: '{dragon}\'s Toothbrush', flavor: 'Solid gold. Slightly used. Deeply personal.',
      items: 4, napSec: 80, creep: 2.8, decay: 4, sens: 1.4, tiptoe: 3, loot: 600 },
    { n: 6, title: 'THE CROWN', flavor: 'It\'s on the dragon\'s head. Yes, really.',
      items: 5, napSec: 90, creep: 3.2, decay: 3.6, sens: 1.5, tiptoe: 4, loot: 1000 },
  ];

  // Sleep stages. Meter thresholds to enter; hysteresis to leave.
  DWTD.STAGES = [
    { key: 'deep',   label: 'Deep snore',  enter: 0,  hint: 'zzz' },
    { key: 'twitch', label: 'Twitching',   enter: 28, hint: 'hmm?' },
    { key: 'mumble', label: 'Mumbling',    enter: 52, hint: 'who...' },
    { key: 'eye',    label: 'ONE EYE OPEN', enter: 76, hint: '...' },
    { key: 'awake',  label: 'AWAKE',       enter: 100, hint: 'RUN' },
  ];
  DWTD.STAGE_HYST = 9;      // meter must fall this far below `enter` to drop a stage
  DWTD.EYE_HOLD_MS = 3200;  // once an eye opens, it stays open at least this long (the held-breath moment)
  DWTD.EYE_SENS = 1.7;      // noise counts this much more while the eye is open

  // Tuning presets chosen on the TV. `sens` multiplies incoming wobble.
  DWTD.HEARING = [['Chill', 0.7], ['Normal', 1.0], ['Sharp', 1.4], ['Hardcore', 2.0]];

  DWTD.TIERS = [
    { key: 'hatch',  label: 'Hatchling', sub: 'ages 5–7',  icon: 'egg' },
    { key: 'squire', label: 'Squire',    sub: 'ages 8–10', icon: 'shield' },
    { key: 'knight', label: 'Knight',    sub: 'ages 11–14', icon: 'sword' },
    { key: 'wizard', label: 'Old Wizard', sub: 'grown-ups', icon: 'wand' },
  ];
  DWTD.AVATARS = (window.ART && ART.AVATAR_KEYS) || ['fox'];

  DWTD.AWARDS = {
    steady: { title: 'Steadiest Hands', icon: 'rock', blurb: 'Basically a rock with a phone.' },
    shushed: { title: 'Most Shushed', icon: 'hush', blurb: 'The dragon knows your name now.' },
    clutch: { title: 'Clutch Thief', icon: 'glove', blurb: 'Fingers of a surgeon. A sneaky surgeon.' },
    butter: { title: 'Butterfingers', icon: 'butter', blurb: 'CLANG. CLANG. CLANG.' },
    tiptoe: { title: 'Ballet Legend', icon: 'shoe', blurb: 'First to nail the tiptoe.' },
  };

  // ---------- helpers ----------
  DWTD.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  DWTD.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  DWTD.lerp = (a, b, t) => a + (b - a) * t;
  DWTD.fmt = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null) ? vars[k] : '');
  DWTD.uid = (n = 8) => {
    const a = 'abcdefghjkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  };
  DWTD.roomCode = () => {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let s = '';
    for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  };
  DWTD.playUrl = (room) => {
    const base = location.href.replace(/[^/]*$/, '');
    return base + 'play.html?r=' + room;
  };

  // ---------- Relay (MQTT over WSS) ----------
  // Topics:  dwtd1/<ROOM>/tv      host -> phones (state snapshots + events)
  //          dwtd1/<ROOM>/p/<pid> phone -> host
  class Relay {
    constructor(room, onStatus) {
      this.room = room;
      this.onStatus = onStatus || (() => {});
      this.client = null;
      this.handlers = [];
      this.brokerIdx = 0;
      this.connected = false;
      this.url = null;
    }
    topic(sub) { return `${DWTD.PROTO}/${this.room}/${sub}`; }
    connect() {
      return new Promise((resolve) => {
        const tryNext = () => {
          if (this.brokerIdx >= DWTD.BROKERS.length) this.brokerIdx = 0;
          const url = DWTD.BROKERS[this.brokerIdx];
          this.url = url;
          this.onStatus('connecting', url);
          let settled = false;
          const c = mqtt.connect(url, {
            clientId: 'dwtd_' + DWTD.uid(10), clean: true, keepalive: 30,
            connectTimeout: 6000, reconnectPeriod: 2000,
          });
          const giveUp = setTimeout(() => {
            if (!settled) { settled = true; try { c.end(true); } catch (e) {} this.brokerIdx++; tryNext(); }
          }, 7000);
          c.on('connect', () => {
            clearTimeout(giveUp);
            this.connected = true;
            this.client = c;
            this.onStatus('connected', url);
            for (const [t] of this.subs) c.subscribe(t, { qos: 0 });
            if (!settled) { settled = true; resolve(url); }
          });
          c.on('reconnect', () => this.onStatus('reconnecting', url));
          c.on('offline', () => { this.connected = false; this.onStatus('offline', url); });
          c.on('close', () => { this.connected = false; });
          c.on('error', () => { /* handled by timeouts */ });
          c.on('message', (t, payload) => {
            let msg; try { msg = JSON.parse(payload.toString()); } catch (e) { return; }
            for (const h of this.handlers) h(t, msg);
          });
        };
        this.subs = this.subs || new Map();
        tryNext();
      });
    }
    subscribe(sub) {
      this.subs = this.subs || new Map();
      const t = this.topic(sub);
      this.subs.set(t, true);
      if (this.client && this.connected) this.client.subscribe(t, { qos: 0 });
    }
    onMessage(fn) { this.handlers.push(fn); }
    publish(sub, obj, retain = false) {
      if (!this.client || !this.connected) return false;
      try { this.client.publish(this.topic(sub), JSON.stringify(obj), { qos: 0, retain }); return true; }
      catch (e) { return false; }
    }
    clearRetained(sub) {
      if (!this.client) return;
      try { this.client.publish(this.topic(sub), '', { qos: 0, retain: true }); } catch (e) {}
    }
  }
  DWTD.Relay = Relay;

  global.DWTD = DWTD;
})(window);
