# Design notes — Don't Wake the Dragon

## The one sentence
A cooperative "everybody freeze" game where the phones are the sensors, the TV is the judge, and the dragon is a slightly rude sleeping roommate.

## Where the laughs are (in order of confidence)
1. **Blame by name.** The TV names the wobbler with a spotlight and a line ("Was that a giggle, Dad?"). Kids get to see a parent get shushed by a cartoon. The `Most Shushed` award keeps score.
2. **The held breath.** When the eye opens it stays open for at least 3 seconds and noise counts nearly double. Everyone freezes mid-motion. Then the sigh. That release is the loop the game is built around.
3. **Failure is funnier than success.** Fire, screen shake, then a memorial card with an epitaph for the culprit. The 6-year-old should want to be roasted at least once.
4. **Sleep-talk.** The dragon mutters in its sleep (spoken aloud, slow and low), and the lines get more pointed as it stirs: "...I smell... Ellie..." It makes the dragon a character, not a meter.
5. **The Thief's clang.** Dropping the marble is not a private failure: it spikes the meter for everyone. So the Thief is in it with the Lookouts.

## What I changed from the brief
- **Sleep stages are sticky at the top.** Without the hold, the eye would flicker open and shut and never feel dangerous.
- **Thief's phone is excluded from the meter** (it has to move) but the Thief's mistakes are noisy events. Same tension, no unfair double-jeopardy.
- **Age tiers are dressed up as ranks** (Hatchling / Squire / Knight / Old Wizard) so scaling is invisible to the kids.
- **A nap timer** (moon → sunrise) gives every heist a hard end at 80–100 s. Heists stay short; the dragon slowly gets restless over the heist anyway ("creep") so stalling is never the right play.
- **Captain phone.** The first grown-up to join can start heists from their phone so nobody has to run to the laptop.
- **Calibration each heist.** Two seconds, per phone, learns that phone's resting wobble. The 6-year-old's hands are shakier; that's baseline, not noise.
- **Touch fallback.** A phone with no sensors becomes a "thumb on the egg" Lookout and a drag-task Thief.

## Cut or deferred
- **Mic meter by default:** cut. Motion-only is more reliable and less creepy. Mic is a twist, later.
- **Whispered password / lullaby:** deferred to Stage 3 (needs mic permission + level calibration and a room that isn't already loud with laughing).
- **Traitor rounds:** Stage 2, and as a toggle. A 6-year-old cannot keep a secret; the goblin will be picked only among players who opted in ("Squire" and up by default).
- **Double-thief:** Stage 2. Cheap to add once the loop is tuned.
- **Crown vote:** Stage 2. Heist 6 is already the crown; the "risk it all" vote is a re-run of heist 6 at Hardcore hearing with all banked loot on the line.

## Pacing numbers (tunable in `js/tv.js` and `js/shared.js`)
- Meter 0–100. Stages enter at 28 / 52 / 76 / 100 with 9 points of hysteresis on the way down.
- Rise: 50 points/second at combined noise 1.0. A giggle is roughly 0.4–0.6. A shake is 1.5+.
- Decay: 9 → 6 points/second across the ladder. Creep: 0.8 → 2.2 points/second.
- Eye hold: 3.2 s. Noise ×1.7 while the eye is open.
- Heist length: 80–100 s cap; target 45–70 s for a competent family.

## Open questions for the playtest
See the end of the first delivery message.
