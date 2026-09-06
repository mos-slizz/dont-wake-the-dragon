# Don't Wake the Dragon 🐉

A family party game. The TV is the stage, every player joins on their own phone by scanning a QR code, and the phones are used as **physical objects**: hold yours perfectly still or the dragon hears you.

- **No accounts, no logins, no server.** It's a static site (GitHub Pages) talking over a public MQTT-over-WebSockets relay.
- One player is the 🥷 **Thief** and does a fine-motor job on their phone. Everyone else is a 👀 **Lookout** whose only job is to be furniture.
- Every wobble from every phone feeds the dragon's wake meter, **with the wobbler's name on it**.

## Playing (Stage 1)

**TV / host** — open the site's main page on a laptop plugged into the TV (Chrome or Safari). Turn the TV volume up. A room code and QR code appear.

**Phones** — scan the QR (or open `play.html?r=CODE`). Enter a name, pick a face, pick who you are (Hatchling 5–7 / Squire 8–10 / Knight 11–14 / Old Wizard). Tap **Join & wake up my sensors**, then tap **Allow** on the motion prompt.

Then press **Start** on the TV (or the captain's phone; the captain is the first grown-up to join).

**Dragon hearing.** The lobby has a Chill / Normal / Sharp / Hardcore selector, and during play you can press `[` or `]` on the TV keyboard to nudge it in steps of 0.2. It is remembered between sessions. If the family kept the dragon asleep too easily, go up one notch.

Each heist:
1. **Calibration** — "Hold still…" for two seconds. Every phone learns its own resting wobble, so a 6-year-old's normal hand shake isn't punished.
2. **Countdown** — 3, 2, 1, shh.
3. **Heist** — the Thief works their task; Lookouts freeze. The meter climbs with noise and decays with silence. Sleep stages: 😴 snore → 😬 twitch → 😖 mumble → 👁️ one eye open → 🔥 AWAKE.
4. **Tiptoe out** — when the loot bar fills, everyone leans their phone to the target angle together and holds it.
5. **Result** — loot banked (win) or the culprit gets roasted (fail). Awards. Next heist.

Six heists in a ladder. The Thief rotates every heist.

## Playtest script for Stage 1

Do these in order and note what felt wrong:

1. **Join flow.** Every phone gets to "You're in! Look at the TV". If a phone says "No motion sensors found", it plays in touch mode (thumb on the egg). Note which phone/browser that was.
2. **Calibration.** Everyone holds still. Does the TV move to the countdown within ~7 s?
3. **Silence test.** During the heist, everyone genuinely holds still for 15 s. The meter should sit near the bottom. If it creeps up on its own, press `[` on the TV to lower the dragon's hearing.
4. **Giggle test.** One Lookout does a small giggle-shake. The TV should call them out by name within a second and the meter should jump about a third of the way. A real shake should wake the dragon in about two seconds.
5. **Eye test.** Get the meter into 👁️ territory and then freeze. The eye stays open for ~3 s no matter what, then the dragon sighs and everyone breathes. That's the moment the game is built around: does it land?
6. **Thief tasks.** Marble (tilt) and Gem thread (drag). Is the Hatchling version doable for the 6-year-old? Is the Knight version hard enough for the 12-year-old?
7. **Tiptoe.** Can everyone find the angle? Is the tolerance too tight or too loose?
8. **Fail screen.** Is the roast funny or mean? (It should be funny.)
9. **"One more?"** After heist 2 or 3, ask. That's the real metric.

Keys on the TV: `space`/`enter` = Next, `[` / `]` = dragon hearing down / up, `d` = fake a noisy lookout for one tick.

## Tech notes

- Static files only. `index.html` is the TV, `play.html` is the phone.
- Realtime relay: `wss://broker.emqx.io:8084/mqtt` with HiveMQ and Mosquitto as fallbacks (see `js/shared.js`). Rooms are namespaced by a random 4-letter code. Anyone with the code could join, which is fine for a living room.
- Motion: `devicemotion` (jerk + rotation rate) with `deviceorientation` for tilt. iOS needs the permission prompt to be triggered by a tap, on HTTPS. If someone denied it, close the tab and scan again.
- The phone keeps the screen awake with the Wake Lock API where supported.
- Sound is all synthesized with Web Audio; the dragon's sleep-talk uses the browser's speech synthesis (toggle on the lobby).
- Tuning knobs: `TUNE` at the top of `js/tv.js`, the heist ladder in `js/shared.js`, task difficulty in `Tasks.paramsFor`.

## Roadmap

- **Stage 1:** core loop, 2 Thief tasks, 6-heist ladder, awards.
- **Stage 1.5 (this):** drawn avatars and icons instead of emoji, layered cave and hoard art, harder and adjustable difficulty.
- **Stage 2:** the sneeze twist, the goblin traitor round, double-thief, "risk it all for the crown" vote, slow-pour and lockpick tasks, end-of-game hall of fame with the family's best heist.
- **Stage 3:** microphone twists (whispered password, lullaby), optional mic meter.
