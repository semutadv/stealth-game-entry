# The Lantern Archive — top-down stealth

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/semutadv/stealth-game-entry/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/semutadv/stealth-game-entry/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

An original top-down stealth game, built for the make.fun competition
[Make the best stealth game](https://make.fun/c/best-stealth-game-20261121-1759).
No network requests, no external assets — every file is local, every sound
is synthesised in WebAudio, every font is a system font.

## The story

Wren is the night archivist of a lantern-lit archive. Tonight she must steal
the Ember Seal from the reading room and slip out the east door — without a
single warden ever seeing her. The archive is small enough to learn and deep
enough to master: four wardens, two patrol lanes each, two shadow alcoves,
and one seal worth the whole risk.

## How to play

Open `game/index.html` in a browser (or serve the `game/` folder) and press
Enter.

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift | Sneak — slower, quieter, harder to see |
| Space | Run — fast, but loud; wardens hear you |
| Mouse click | Throw a pebble to distract a warden |
| R | Restart the night |
| M | Mute |

## The stealth model

- **Vision cones.** Each warden sweeps an amber cone. Distance, angle and
  line-of-sight all matter — shelves and walls block sight.
- **Staged detection.** The eye meter climbs in stages: calm, suspicious
  (the warden stops and stares), alert (the warden walks to where it last
  saw you), and caught at a full meter. Lose the warden and it goes back
  to its rounds.
- **Shadow.** The blue pools are dark. Stand in one and a warden cannot see
  you from afar — unless it gets close.
- **Sound.** Running is heard across the room. A thrown pebble pulls a
  warden to investigate the clatter instead of you.
- **The run.** Take the Ember Seal, then reach the east exit. Finish with
  the meter never filling and the screen reads **UNSEEN**.

## Structure

One clear job per file — the game is plain ES modules under `game/src/`:

- `config.js` — every tunable number (speeds, cone, detection rates, palette)
- `level.js` — the archive map, tile queries, line-of-sight, patrol routes
- `input.js` — keyboard + mouse intents, no game logic
- `player.js` — Wren: movement, sneaking, noise, pebbles, the seal
- `guards.js` — warden patrols, vision cones, staged detection
- `render.js` — all canvas drawing, reads state and never changes it
- `audio.js` — synthesised WebAudio sounds, no audio files
- `shots.js` — the four deterministic staged scenes for screenshots
- `main.js` — boot, game loop, state machine (title / playing / caught / won)

`main.ts` (repo root) builds the submission dossier: it copies `game/` and
`screenshots/` into the output directory and writes `dossier.json`.

## Screenshots

The game supports deterministic staged scenes through the URL, so every
screenshot is a reproducible render of the game's own code:

- `?shot=start&seed=1` — the whole archive at a glance
- `?shot=stalk&seed=1` — sneaking behind a shelf as a cone sweeps past
- `?shot=spotted&seed=1` — half a meter full, a suspicious warden, Wren in shadow
- `?shot=escape&seed=1` — seal held, at the open exit, UNSEEN

## License

MIT — see [LICENSE](LICENSE).
