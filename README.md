# Peony Hanabi

By **PEONY AXION** · package `com.peonyaxion.peonyhanabi` · Expo owner `884-888`.

A chain-reaction fireworks puzzle for Android: strike a match, and every burst lights the next. Light the whole night sky with just the matches you're given.

**How it plays.**
- Tap a shell to see how far its burst will reach. Its reach is outlined, and every shell it would light directly is ringed. Tap it again to strike a match.
- Shell kinds:
  - **Peonies** burst all round.
  - **Comets** shoot one way, lighting every shell along their trail.
  - **Crossettes** split four ways, along a plus or an X.
- Each night gives exactly as many matches as the sky needs. If they run out with shells still dark, the night begins again.
- A hint picks a shell that needs a match of its own, and restarts the night first if too few matches are left. The restart button starts over at any time.
- Stars (chrysanthemums): three for lighting the sky on the first try, two after a retry or two or with a hint.

**Content.**
- 24 nights in three chapters:
  - **Peony Harbour:** peonies small and large over a harbour town.
  - **River of Comets:** comets join the peonies, over a willow-lined river.
  - **Temple Hill:** crossettes too, above a pagoda and torii.
- Every sky is generated and checked: its match count is the true minimum, and no shell stands alone. Within each chapter, skies get harder, meaning less likely to be lit by a player striking shells at random (from about one in four down to about one in a hundred).

**Look and sound.**
- Visuals: painted night skies with stars, moon, thin cloud and lantern-lit silhouettes reflected in the water, and paper-wrapped shells in the colour they will burst. Bursts use a custom spark system with drag and gravity, so peonies bloom and hang, comets streak, and glitter falls and twinkles. Glowing fuses run from each burst to the shells it lights, and a finale fills the sky when it is all lit.
- Sound: crickets, a breathy bamboo flute over a soft taiko heartbeat, the scratch of a match, deep booms that soften when many go off together, long crackles, comet whistles and crossette splits.

## Structure

| Path | What it is |
| --- | --- |
| `web/src/game/sim.ts` | Reach, chains, strongly connected groups, the fewest matches, luck |
| `web/src/game/skies.json` | The 24 generated skies |
| `web/tools/gen.ts` | The sky generator |
| `web/src/game/art.ts` | Night skies, silhouettes and shells |
| `web/src/game/scene.ts` | The Phaser sky and the spark system |
| `web/brand/` | Icon, splash and feature graphic |
| `Delivery/` | Play Store icon, feature graphic and screenshots |
| `src/native/` | Expo WebView shell |

```bash
npm install && npm run web:install
npm run web:test     # 36 tests
npm run build:game && npm run validate:assets && npm run android
```

## Release builds

The Android release is configured for Google Play: target and compile SDK 36, R8 minification and resource shrinking, a non-debuggable release build, no Internet permission, and the game served offline from the app's own assets. Builds run on EAS; `eas.json` has two profiles:

```bash
npm install -g eas-cli && eas login
eas init                     # once: links this folder to your Expo project
npm run eas:apk              # preview profile: a signed APK for testing on devices
npm run eas:aab              # production profile: an AAB for Google Play (versionCode auto-increments)
```
