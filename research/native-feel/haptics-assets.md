# Haptics and Picture Assets for the Picture-Card Solitaire (iOS Home-Screen Web App)

## Question

The game is a picture version of "Solitaire Associations" for a 4–5-year-old. It runs as a home-screen web app on an iPhone 12 (60 Hz, 3x) with iOS 26 / Safari 26. There is no text and no speech, so motion and sound carry all feedback. This file answers two groups of questions:

1. **Haptics.** Can the game make the phone buzz on lift, snap, and group complete? If so, how, and what happens when it cannot?
2. **Picture assets.** Which open emoji art set should the cards use? What license, formats, sizes, and coverage does each set have? Which file format should the app ship, at what pixel size, and as one atlas or as single files for offline precache?

Earlier research for the smart-games collection already settled the shared web facts. This file builds on it and does not repeat it: install and offline ([pwa-route.md](../../../smart-games/.scratch/minigame-collection/research/pwa-route.md)), drag with a `transform` written in `pointermove` ([web-input-latency.md](../../../smart-games/.scratch/minigame-collection/research/web-input-latency.md), [19-drag-feel-gate.md](../../../smart-games/.scratch/minigame-collection/issues/19-drag-feel-gate.md)), ZzFX sound with one `AudioContext` ([code-synthesised-sfx.md](../../../smart-games/.scratch/minigame-collection/research/code-synthesised-sfx.md)), and Solid + Vite + `vite-plugin-pwa` ([21-stack-policy.md](../../../smart-games/.scratch/minigame-collection/issues/21-stack-policy.md)).

**One correction to that earlier research.** [pwa-route.md](../../../smart-games/.scratch/minigame-collection/research/pwa-route.md) says "Haptic feedback is not available to web apps", based on a secondary source. Section 2 below corrects this from primary sources: a real finger tap on a native `<input type="checkbox" switch>` does make a haptic on iPhone. Since iOS 26.5, script can no longer trigger it.

Labels used in this file: **[INFERENCE]** marks my own reasoning from cited facts. **[MEASURED]** marks numbers I produced on this Mac from the published files. **unverified** marks a claim I could not tie to a sentence.

---

## 1. `navigator.vibrate` on Safari 26 (iOS)

**Answer: not supported, and WebKit has said it will not add it.**

- MDN browser-compat-data 8.1.8 (published 2026-11-02), key `api.Navigator.vibrate`:
  > `"safari_ios": { "version_added": false }`

  — https://unpkg.com/@mdn/browser-compat-data@8.1.8/data.json (rendered at https://developer.mozilla.org/docs/Web/API/Navigator/vibrate)
- WebKit's own feature-status data file lists it as removed:
  > `"name": "Vibration API", "status": { "status": "Removed" }`

  — https://github.com/WebKit/WebKit/blob/a2aadfc4f7a74c029058bac3e4535bd43f938b7b/Source/WebCore/features.json#L928-L931
- WebKit's standards position is **oppose** (issue labels: "position: oppose", "concerns: annoyance", "concerns: integration"). A WebKit standards lead wrote:
  > "they also pointed out that it wouldn't even be possible to support this API on Apple's native platforms (concern: integration)."

  — https://github.com/WebKit/standards-positions/issues/267
- On the Interop 2025 proposal, the same person wrote:
  > "WebKit remain firmly against this API."

  — https://github.com/web-platform-tests/interop/issues/718

So `navigator.vibrate` does not exist in Safari on iOS. Do not plan around it.

---

## 2. The `<input type="checkbox" switch>` haptic

### 2.1 Does toggling a switch make a haptic on iPhone?

**Yes, for a real finger interaction.**

- The switch control shipped in Safari 17.4:
  > "We're very excited to introduce a new HTML form control as part of Safari 17.4: a switch."

  — https://webkit.org/blog/15054/an-html-switch-control/
  BCD agrees: `html.elements.input.switch` → `"safari_ios": { "version_added": "17.4" }`, marked `"experimental": true, "standard_track": false` (https://unpkg.com/@mdn/browser-compat-data@8.1.8/data.json).
- Safari 18 added the haptic:
  > "Added haptic feedback for <input type=checkbox switch> on iOS.  (125474921)"

  — https://developer.apple.com/documentation/safari-release-notes/safari-18-release-notes
- In WebKit source, the iOS haptic is a **light impact**, played by WebKit's iOS page client (the code below is from the tag that matches Safari 26.6):
  > `auto feedbackGenerator = adoptNS([[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight]);`

  — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebKit/UIProcess/ios/PageClientImplIOS.mm#L1159
  > `bool hasSwitchHapticFeedback(SwitchTrigger) const final { return true; }`

  — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/rendering/ios/RenderThemeIOS.h#L102

**When it fires.** The source has two triggers:

- **Click**, which happens when the finger **lifts**, not when it goes down. The switch's own touch handler sends the click on `touchend`:
  > `element->dispatchSimulatedClick(&event, SendNoEvents);`

  — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/CheckboxInputType.cpp#L224
  > `performSwitchVisuallyOnAnimation(SwitchTrigger::Click);`

  — same file, [#L251](https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/CheckboxInputType.cpp#L251)
- **PointerTracking**, which happens when a finger held for 200 ms drags the thumb past its midpoint:
  > `constexpr Seconds switchHeldDelay = 200_ms;`

  — [#L201](https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/CheckboxInputType.cpp#L201)
  > `performSwitchVisuallyOnAnimation(SwitchTrigger::PointerTracking);`

  — [#L495](https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/CheckboxInputType.cpp#L495)

A developer saw the "fires on lift" behaviour in practice:
> "it only actually switches when the user ends the touch."

— https://stackoverflow.com/questions/79739427/is-rising-edge-haptic-feedback-in-javascript-on-safari-possible

**Consequence for this game:** a switch can never make a haptic at the moment the finger touches down. The "lift" moment cannot get a haptic.

### 2.2 Does it work in a home-screen web app?

**Probably yes, but this must be checked on the device.**

- [INFERENCE] The haptic is played inside WebKit's iOS `PageClientImpl` (quoted above), not by the Safari app. Home-screen web apps also run on WebKit, so the same code path should apply.
- A community report (from before the iOS 26.5 change, using the label trick) says:
  > "Safari/iOS fires a light haptic—even in PWAs."

  — https://www.reddit.com/r/PWA/comments/1o69ymd/haptic_feedback_in_pwas_on_ios
- The user can turn all control haptics off:
  > "Play haptics for system controls and interactions: Turn System Haptics on or off."

  — https://support.apple.com/guide/iphone/change-sounds-and-vibrations-iph07c867f28/ios
  [INFERENCE] A haptic played through `UIImpactFeedbackGenerator` follows this setting. That is a further reason haptics can only ever be an extra.

### 2.3 Can a script trigger it?

**On iOS 26.5 and later: no, not even inside a pointer event handler.** Here is the history, from primary sources.

1. **Dec 2024: script without a gesture.** WebKit bug 285120:
   > "Currently, it is possible to exploit this feature and generate vibrations from JavaScript, so haptic feedback should be disabled without *user activation*."

   — https://bugs.webkit.org/show_bug.cgi?id=285120
   The fix, commit 288403@main (PR #38473), says:
   > "It should not be possible to generate haptic feedback from script alone."

   — https://github.com/WebKit/WebKit/pull/38473
   and adds this check:
   > `if (trigger == SwitchTrigger::Click && !UserGestureIndicator::processingUserGesture())`

   — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/CheckboxInputType.cpp#L414
   Its API test calls `document.querySelector('label').click()` from script and fails if a haptic plays.
2. **Mar–May 2026: script inside a gesture (the "label trick").** Libraries then called `label.click()` inside a tap handler. WebKit closed that too, in bug 309082 / commit 313638@main:
   > "calling `click()` on the label, immediately following a user gesture, can allow for haptics to be programmatically triggered."

   > "Fix by specifying `SimulatedClickSource::Bindings` if there is an underlying event and it is untrusted."

   — https://github.com/WebKit/WebKit/commit/fc1ef83eae10068fe468587d959e868041ddfe03 (commit message, "Originally-landed-as: 305413.395@safari-7624-branch (2c99c891b64c)", dated 2026-03-04)
   The resulting code:
   > `return underlyingEvent->isTrusted() ? SimulatedClickSource::UserAgent : SimulatedClickSource::Bindings;`

   — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/dom/Element.cpp#L636
3. **Which iOS got it.** [MEASURED] I checked the WebKit release tags. `WebKit-7624.1.16` still has the old one-line `dispatchSimulatedClick` with no check. `WebKit-7624.2.4` and `WebKit-7624.4.5` have the new check. Apple's release notes give the matching Safari builds:
   > "Released March 24, 2026 — 26.4 (20624.1.16)"

   — https://developer.apple.com/documentation/safari-release-notes/safari-26_4-release-notes
   > "Released May 11, 2026 — 26.5 (20624.2.5)"

   — https://developer.apple.com/documentation/safari-release-notes/safari-26_5-release-notes
   [INFERENCE] From the matching build numbers, the fix shipped in **Safari / iOS 26.5**. Two library authors say the same. The ios-haptics README (commit f5272ef):
   > "apple patched the bug this library used for haptic feedback in ios 26.5. you can no longer trigger haptic feedback programmatically by calling `.click()` on a `<label>` that is `for` an `<input type="checkbox" switch />`. haptic feedback still works when the user directly clicks the checkbox switch themselves, but it can no longer be done programmatically."

   — https://github.com/tijnjh/ios-haptics/commit/f5272ef
   I found no entry about this in the Safari 26.5 release notes.
4. **`input.click()` never worked.** `HTMLElement::click()` always creates an untrusted click:
   > `simulateClick(*this, nullptr, SendNoEvents, DoNotShowPressedLook, SimulatedClickSource::Bindings);`

   — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/HTMLElement.cpp#L718
   and the haptic needs a trusted click:
   > `if (isSwitch() && state.trusted && ...)`

   — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/CheckboxInputType.cpp#L250

**What still works on iOS 26.5+:** a *real* tap that lands on the switch, or on a `<label>` wrapping it. A label forwards a real click with that click as the underlying event:
> `control->dispatchSimulatedClick(&event);`

— https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/HTMLLabelElement.cpp#L181

The forwarded click is trusted only when the original was trusted (Element.cpp#L636 above).

### 2.4 Libraries that use the trick, and their limits

| library | how it fires | status on iOS 26.5+ | limits |
|---|---|---|---|
| **ios-haptics** 3.3.0 (MIT, tijnjh, 141★) | v3 puts a transparent `<label>` over your element, wired to a hidden switch | **works for real taps only** | Tap only, fires on finger lift; no patterns |
| **use-haptic** 1.1.13 (MIT, posaune0423) | hidden `display:none` switch + label; `labelRef.current?.click()` | **broken** (script `label.click()`) | — |
| **web-haptics** 0.0.6 (MIT, lochie) | `this.hapticLabel.click()`, repeated from `requestAnimationFrame` for patterns | **broken** (script `label.click()`) | — |
| **project-fathom** (no license file, m1ckc3s) | a real switch at `opacity: 0` laid over a button | **works for real taps** | demo app, not a library |

Evidence:

- ios-haptics v3 README:
  > "`hapticTrigger` renders a transparent `<label>` on top of your element, wired to a hidden switch. when the user taps the element, the label forwards the tap to the switch as a trusted click, and safari triggers the native haptic feedback"

  — https://github.com/tijnjh/ios-haptics
  Its source (npm `ios-haptics@3.3.0`, `dist/index.js`) gives the overlay `touchAction: 'manipulation'` and `inset: 0`. Its own issue tracker records the scroll conflict this causes:
  > "This current haptics solution breaks scroll on iOS."

  — https://github.com/tijnjh/ios-haptics/issues/11 (fixed 2026-09-22 in PR #13). [INFERENCE] An overlay that takes the touch is just as much in the way of our card drag.
  Rising edge (touch-down) is not possible:
  > "unfortunately, i dont think this is possible due to how apple restricts the HTMLElement.click() method"

  — https://github.com/tijnjh/ios-haptics/issues/2
- use-haptic source, `esm/useHaptic.js` in npm `use-haptic@1.1.13`: `labelRef.current?.click();` — https://github.com/posaune0423/use-haptic
- web-haptics source, `dist/chunk-4NSAIXAB.mjs` in npm `web-haptics@0.0.6`: `this.hapticLabel.click()` inside a `requestAnimationFrame` loop — https://github.com/lochie/web-haptics
- project-fathom README:
  > "The catch: as of iOS 26.5, only a **direct tap** fires the haptic — it can't be triggered from script anymore."

  > "**System tick only** — not custom Core Haptics waveforms."

  > "**Native appearance required** — stripping the control's look disables the haptic."

  — https://github.com/m1ckc3s/project-fathom
  I could not find the "native appearance required" rule in the switch haptic code path (`performSwitchVisuallyOnAnimation` has no appearance check). It may live elsewhere, so treat it as **unverified** but plausible. The GitHub API reports no license for this repo. [INFERENCE] Re-implement the idea; do not copy its code.

### 2.5 What this means for a drag-and-drop game

The game's feedback moments are: **lift** (finger down), **snap** (finger up over the right pile), **wrong drop** (finger up over a wrong pile), and **group complete** (after a snap, no touch involved).

- **Lift:** impossible. The switch fires on lift-off or after a 200 ms hold, never on touch-down (§2.1).
- **Group complete / parade / confetti:** impossible. These happen after the touch, and script triggering is closed (§2.3).
- **Snap:** possible only as an experiment. [INFERENCE from the source] If the card's hit area *is* a transparent native switch, the switch's own `touchend` handler sends a trusted click when the finger lifts (#L224). That would produce one haptic at release, which is the snap moment. But two problems follow from the code:
  - It would fire on **every** release, right or wrong. The handler gives up early only if the control is disabled. The guard is `if (!event.isTrusted() || !isSwitch() || element->isDisabledFormControl() || !element->renderer())` at [#L179](https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/CheckboxInputType.cpp#L179). So setting `input.disabled = true` in our `pointerup` for a wrong drop *might* silence it. That works only if `pointerup` runs before the switch's `touchend` default handler. [INFERENCE] I could not find iOS touch-event dispatch in the open-source tree: the open `EventHandler` touch path is wrapped in `#if ENABLE(TOUCH_EVENTS) && !ENABLE(IOS_TOUCH_EVENTS)` ([EventHandler.cpp#L5344](https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/page/EventHandler.cpp#L5344)). So the ordering **must be measured**.
  - After the 200 ms hold, the switch starts tracking the finger and may fire a mid-drag haptic as the finger crosses the switch's midpoint (#L201, #L495). That could suppress the release haptic (`willDispatchClick`, [#L243–L251](https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/html/CheckboxInputType.cpp#L243-L251)).
- **Taps** (for example, tapping the stock pile to deal, or a menu button) work reliably with a real switch or a label overlay, because a tap is exactly what the control expects.

---

## 3. Haptics recommendation (summary)

The full recipe is in **Recommendations → Haptics** below. In short:

- **Ship without haptics in the drag path.** Motion and sound already carry every moment. Apple's own guidance:
  > "Let people turn off or mute haptics, and make sure people can still enjoy your app or game without them."

  — https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- **Allowed now:** a haptic on **taps only** (the deal/stock tap, the "new game" button). Use a real switch under the finger.
- **Optional 20-minute device experiment:** the "card is a switch" snap haptic from §2.5. Adopt it only if it passes every check in the device list.
- **Fallback:** none. There is no other haptic route on iOS (§1). The sound cue plays at the same moment anyway.

---

## 4. Microsoft Fluent Emoji (`microsoft/fluentui-emoji`)

### License

- The repo license is MIT:
  > "MIT License / Copyright (c) Microsoft Corporation. / Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction..."

  — https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE
- Issue #18, "Wrong licence", has been open since 2022-08-10:
  > "The problem with this is that the MIT license is for Software and its associated documentation. This repository does not contain any of these two things."

  — https://github.com/microsoft/fluentui-emoji/issues/18
  The thread holds six community comments (for example "afaik mit is good for anything", "Considering the graphics artworks a CC license may be best."). None comes from a maintainer, and the license was never changed. [INFERENCE] For a private family app, MIT still grants the use. The only duty is to keep the notice: "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software." Ship the MIT text in a licenses file.

### Formats and sizes

[MEASURED] From the repo tree (GitHub API, `main`, 27,127 entries, not truncated):

- Each emoji is a folder `assets/<Name>/` holding `metadata.json`, `3D/*.png`, `Color/*.svg`, `Flat/*.svg` and `High Contrast/*.svg`.
- **1,595 emoji** (folders with `metadata.json`). There are 3,145 3D PNGs, because people emoji have five skin tones plus a default.
- **3D PNGs are 256 × 256 RGBA.** All 60 of 60 random samples were exactly 256 × 256.
- 3D PNG file sizes: min 5.7 KB, median 34.9 KB, max 84.6 KB; 109.7 MB for all 3,145.
- `Color` SVGs: median 37.2 KB, 90th percentile 79.2 KB, max 561 KB.
- No larger 3D render exists. People have asked:
  > "Would be great if we could at least get the 3D ones in 1024px or a guide to convert them ourselves."

  — https://github.com/microsoft/fluentui-emoji/issues/14 (open). A community answer on #95 points to `Color` as the vector form:
  > "In fact, the SVG format of 3D style is named "Color"."

  — https://github.com/microsoft/fluentui-emoji/issues/95
  [INFERENCE] `Color` is a flatter gradient style, not the same look as the 3D PNG.

### Metadata (machine-readable)

**Yes.** Every emoji has `assets/<Name>/metadata.json`. Example, `assets/Dog face/metadata.json`:

```json
{ "cldr": "dog face", "fromVersion": "0.6", "glyph": "🐶", "group": "Animals & Nature",
  "keywords": ["dog","face","pet"], "mappedToEmoticons": ["smiledog"], "tts": "dog face", "unicode": "1f436" }
```

— https://github.com/microsoft/fluentui-emoji/blob/main/assets/Dog%20face/metadata.json

### Coverage

[MEASURED] I spot-checked folder names (the full category count belongs to the ContentModel research).

- **Present:**
  - Farm, pet and wild animals
  - Sea life: fish, tropical fish, octopus, spouting whale, dolphin, crab, shrimp, squid, shark, seal, jellyfish, coral, lobster, oyster
  - Fruit: red apple, banana, grapes, strawberry, watermelon, blueberries, pear, cherries, peach, coconut
  - Things with wheels: automobile, bus, bicycle, tractor, locomotive, skateboard, kick scooter, manual wheelchair, wheel, fire engine, ambulance, delivery truck, articulated lorry, shopping cart
  - Clothes: T-shirt, jeans, dress, socks, gloves, scarf, coat, billed cap, running shoe, woman's boot, hiking boot, one-piece swimsuit, shorts, briefs
  - Bath: bathtub, shower, soap, sponge, toothbrush, lotion bottle, bubbles, roll of paper
  - Toys: teddy bear, kite, yo-yo, crayon, soccer ball
  - Colours: red heart, red circle, paintbrush, artist palette
- **Missing because Fluent stops at Emoji 15:** none of the Emoji 16–18 additions are present. Absent examples: orca, lighthouse, treasure chest, pickle, monarch butterfly, trombone, shovel, harp, root vegetable, leafless tree.

### Official animated set

**Yes: `microsoft/fluentui-emoji-animated`, MIT.**

- The README says:
  > "Animated PNGs, size 256x256px, for [Fluent Emoji]. Not all emoji are animated, but the ones that are can be found here."

  > "This repository is approximately **~5GB** in size (10GB on your disk)"

  — https://github.com/microsoft/fluentui-emoji-animated
- The LICENSE is "MIT License / Copyright (c) Microsoft Corporation." The last push was 2024-10-17 (GitHub API `pushed_at`).
- [MEASURED] **746 emoji** (folders with `metadata.json`), 2,241 APNG files including skin tones.
- [MEASURED] Sample of 25 APNGs: min 0.90 MB, median 2.13 MB, max 5.46 MB. `Dog face` is 2.76 MB, 72 frames, 42 ms per frame (about 3 s at about 24 fps).
- [MEASURED] Coverage gap: **no fruit, no clothes, no bath items, no bicycle** in the spot check. Sea animals and many vehicles are present.

---

## 5. Google Noto Animated Emoji (and the new Noto 3D static set)

### Noto Animated Emoji

- **License:** CC BY 4.0. From the site's FAQ (rendered by the page's script; the text is in `bundle.js`):
  > "Animated Noto Emoji is licensed under CC BY 4.0. See the full license for all details."

  — https://googlefonts.github.io/noto-emoji-animation/ (the FAQ is shown on the page's "documentation" view, which the page's script renders; a direct request for `/documentation` returns GitHub's 404, so the sentence is verified in https://googlefonts.github.io/noto-emoji-animation/bundle.js)
- **Attribution wording:** the site prescribes none; I found no "please credit as…" text. CC BY 4.0 §3(a)(1) says to "retain the following if it is supplied by the Licensor": the creator, a copyright notice, a license notice, a disclaimer notice and a link. It also requires noting changes:
  > "indicate if You modified the Licensed Material and retain an indication of any previous modifications"

  It also allows a link instead of inline text:
  > "it may be reasonable to satisfy the conditions by providing a URI or hyperlink to a resource that includes the required information."

  — https://creativecommons.org/licenses/by/4.0/legalcode.en
  These duties apply when you "Share", defined as "to provide material to the public by any means..." (same page). [INFERENCE] A public static host counts. A wordless child UI can satisfy them with a credits file reachable by URL.
- **Formats:**
  > ".json and 512x512 .avif, .webp, and .gif are available."

  (same FAQ). The page's script builds per-emoji URLs `https://fonts.gstatic.com/s/e/notoemoji/latest/<codepoint>/{lottie.json,512.webp,512.gif,512.avif,emoji.svg}` (bundle.js). A `256.webp` URL returns 404 [MEASURED].
- **No bulk download:**
  > "Currently, there is no way to download the whole set — the world is not ready for that many simultaneously dancing emoji."

  (same FAQ). A build script must fetch files one codepoint at a time.
- **Counts and metadata:** [MEASURED] `https://googlefonts.github.io/noto-emoji-animation/data/api.json` lists **881 entries**. 611 of them are not skin-tone variants.
  - By category: 502 Smileys and emotions, 118 Animals and nature, 67 Food and drink, 58 Activities and events, 51 Objects, 42 Symbols, 31 Travel and places, 8 People, 4 Flags.
  - Per-emoji fields: `codepoint`, `categories`, `tags`, `popularity`. `tags` averages **1.2 per emoji** (usually one shortcode such as `:dog:`), so it is far thinner than Fluent's keywords.
  - The source repo `googlefonts/noto-emoji-animation` is not public (GitHub API 404).
- [MEASURED] Five samples:

| emoji | lottie.json | 512.webp | 512.gif | 512.avif | emoji.svg |
|---|---|---|---|---|---|
| dog 1f415 | 98 KB | 425 KB | 568 KB | 71 KB | 4.7 KB |
| red apple 1f34e | 17 KB | 188 KB | 193 KB | 38 KB | 2.1 KB |
| automobile 1f697 | 37 KB | 318 KB | 447 KB | 51 KB | 3.7 KB |
| octopus 1f419 | 235 KB | 416 KB | 490 KB | 135 KB | 6.6 KB |
| socks 1f9e6 | 91 KB | 271 KB | 340 KB | 53 KB | 2.8 KB |

  - Dog WebP: lossy with alpha, loop 0, 67 frames of about 30 ms.
  - Dog AVIF: 68 frames, 2.1 s.
  - Dog Lottie: 1024 × 1024 comp at 60 fps, with a marker `"cm": "rest"`. The FAQ explains it:
    > "the static "start" frame is marked in the json file as keyframe 'rest'"
- **Fit as a card set:** **not a good main set.** 57% of entries are smileys, and items such as clothes and bath things are mostly absent. It is fine for celebration extras: it has animated fruit, animals, vehicles and socks.

### Noto 3D static PNGs (new, found during this research)

`googlefonts/noto-emoji` added a 3D set on 2026-09-17 (commit d6a792cb, "Add 3D PNGs").

- [MEASURED] `3D/png/{32,72,128,512}/emoji_u<codepoint>.png`, **4,007 files per size**, 512 × 512 RGBA.
- [MEASURED] 512 px sizes: median 220 KB, max 468 KB.
- [MEASURED] It covers Emoji 16–18. Orca, lighthouse, treasure chest, pickle and shovel are all present, which Fluent lacks.
- The outlines match Noto 2D, which is also the art the Noto *animated* set moves. But the style does not match: the 3D set has light and shade, and the animated set is flat. A swap from a 3D card to its animated twin shows a visible change of style. Colours also change in some pictures: the 3D butterfly is blue, and the animated butterfly is orange in frame 0 and purple in the middle frame. [MEASURED 2026-11-10: `research/content/data/compare-noto3d-vs-animated.png`, rows = 3D still, animated frame 0, animated middle frame.]
- Frame 0 of an animated file is not always the rest pose (butterfly: wings closed). Use the Lottie `rest` marker to find the frame that matches the still.
- **License is ambiguous.** The README says:
  > "Tools and most image resources are under the [Apache license, version 2.0](./LICENSE)."

  — https://github.com/googlefonts/noto-emoji/blob/main/README.md
  But the file it links, `./LICENSE`, now starts:
  > "This Font Software is licensed under the SIL Open Font License, Version 1.1."

  — https://github.com/googlefonts/noto-emoji/blob/main/LICENSE
  `3D/png/` has no license file of its own. `2D/svg/LICENSE` is Apache 2.0. [INFERENCE] Either license allows use in a private app. Ship both texts.
- **No keyword metadata** in the repo. `emoji_annotations.txt` is only an alias list. [INFERENCE] Keywords can be joined from Fluent's `metadata.json` by codepoint. Fluent writes `unicode` space-separated; Noto filenames use `_` and drop `fe0f`.

### Missing from every emoji set

[MEASURED] Unicode emoji-test.txt 18.0 (dated 2026-04-30) has **no** towel, rubber duck, starfish, seahorse, excavator/digger, crane, dump truck, sweater, pyjamas, or pacifier — https://www.unicode.org/Public/emoji/latest/emoji-test.txt. No emoji-based set can supply these. They are candidates for the generated-sprite fallback (covered by another research file).

---

## 6. Formats on Safari 26: WebP, AVIF, animation, Lottie

### Support

BCD 8.1.8, `mediatypes.image.*`, `safari_ios`:

| format | static | animated |
|---|---|---|
| WebP (lossy, lossless, alpha) | 14 | 14 |
| AVIF | 16.1 | 16.1 |
| APNG (`png.animation`) | — | 8 |
| JPEG XL | 17 | not supported ("Animated images are not supported.") |

All are fine on Safari 26. Safari 16.1 release note:
> "Added support for AVIF animated image sequences on macOS Ventura, iPadOS 16, and iOS 16."

— https://developer.apple.com/documentation/safari-release-notes/safari-16_1-release-notes

### Decode cost: what the source says

- WebKit treats an image as "large" by its decoded size, with a much lower bar for animated images:
  > `auto sizeInBytes = size(ImageOrientation::Orientation::None).unclampedArea() * sizeof(uint32_t);`
  > `return sizeInBytes > (isAnimated() ? 100 * KB : 500 * KB);`

  — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/platform/graphics/BitmapImageSource.cpp#L321-L324 (`KB` = 1024)
- Large animated images decode **asynchronously**:
  > `if (bitmapImage->isLargeForDecoding() && settings().animatedImageAsyncDecodingEnabled())`

  — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WebCore/rendering/RenderBoxModelObject.cpp#L357
  The setting is on by default:
  > `AnimatedImageAsyncDecodingEnabled: ... WebKit: default: true`

  — https://github.com/WebKit/WebKit/blob/WebKit-7624.4.5/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml#L507-L512
  [INFERENCE] Any animated sprite larger than 160 × 160 px (102,400 B) decodes its frames away from the main thread. That includes every Noto 512 and Fluent 256 animated file. This is good for drag smoothness, but the CPU cost on the device is still real.
- **Static thresholds** follow from the same formula:
  - 320 × 320 = 409,600 B, under the 512,000 B bar. It counts as "small" and decodes at paint time.
  - 384 × 384 = 589,824 B counts as "large". On its first paint in a new element it can decode asynchronously, which can show one empty frame.
  - Pre-decode with `img.decode()`. BCD: `api.HTMLImageElement.decode` safari_ios "11.3". MDN:
    > "returns a Promise that resolves once the image is decoded and is safe to be appended to the DOM."

    — https://developer.mozilla.org/docs/Web/API/HTMLImageElement/decode
- **AV1 on the iPhone 12.** Apple on the A17 Pro:
  > "A17 Pro includes a dedicated AV1 decoder, enabling more efficient, high-quality video experiences for streaming services."

  — https://www.apple.com/newsroom/2023/09/apple-unveils-iphone-15-pro-and-iphone-15-pro-max/
  [INFERENCE] The iPhone 12's A14 is older, so animated AVIF most likely decodes in software there. Whether WebKit uses a hardware path for AVIF *images* at all is **unverified**. Measure AVIF against WebP CPU on the device.
- **The user can stop animated images.**
  > "Auto-Play Animated Images: Turn off. (When on, rapid animated images and moving elements such as GIFs in Messages and Safari play automatically.)"

  — https://support.apple.com/guide/iphone/stop-or-reduce-onscreen-motion-iph0b691d3ed/ios
  [INFERENCE] A parade built only on animated image files could freeze on a phone with this off. CSS-transform motion does not depend on it.

### Lottie players

- **`@lottiefiles/dotlottie-web`** 0.82.1, MIT.
  - Engine:
    > "a Rust + WASM core powered by ThorVG, with Software, WebGL2, and WebGPU rendering backends"

    — https://github.com/LottieFiles/dotlottie-web
  - Worker mode:
    > "`DotLottieWorker` renders on a Web Worker with `OffscreenCanvas`, keeping your UI buttery-smooth even with dozens of animations."

    (same README)
  - The WASM download, which matters for offline:
    > "The player's WASM engine (~500 KB compressed) is fetched from a CDN when the first player is constructed."

    — https://github.com/LottieFiles/dotlottie-web/blob/main/packages/web/README.md
    An offline app must self-host it: `DotLottieWorker.setWasmUrl('/js/dotlottie/dotlottie-player.wasm')`.
  - BCD: `OffscreenCanvas` 2d context safari_ios "16.4".
- **`lottie-web`** 5.13.0, MIT. It offers `renderer: 'svg' / 'canvas' / 'html'` (README). Its last npm publish was 2025-05-21. Issue #1212, "Render canvas outside of main thread", is still open — https://github.com/airbnb/lottie-web/issues/1212. [INFERENCE] Its rendering runs in page JavaScript on the main thread, the same thread that handles `pointermove`.
- **CPU cost on an iPhone 12:** I found no primary measurement. **Must be measured.**
- **Verdict:** a Lottie runtime buys nothing here. Noto already ships the same animations pre-rendered as WebP/AVIF/GIF. Lottie's real strength is changing colours or properties at runtime, which this game does not need.

### Converting Lottie or APNG to animated WebP

- Not needed for Noto, which already ships `512.webp` and `512.avif`.
- If needed: `lottie_convert.py input_file.json output_file.webp` from the `lottie` Python package (AGPLv3+, an offline build tool) — https://pypi.org/project/lottie/
- [MEASURED] Fluent's dog-face APNG (2.76 MB, 256 px, 72 frames) re-encoded with `img2webp -lossy -q 75 -d 42` → **271 KB** animated WebP.
- [MEASURED] A naive re-encode of Noto's dog to 320 px (`img2webp -lossy -q 75`, and `-min_size -q 70`) came out at 662 KB / 633 KB. That is *larger* than Google's own 512 px file (425 KB). Google's files are already well tuned, so ship them as they are rather than re-encode.

---

## 7. Sizing and packaging

### Pixel size

The card is about 100–130 CSS px wide, and the iPhone 12 draws 3 device px per CSS px.

- [INFERENCE] If the picture fills about 80% of the card, the picture box is 80–104 CSS px, which needs **240–312 device px**.
- Full-bleed art at 130 CSS px needs 390 device px.

| source | native-sharp up to (at 3x) | at a 104 CSS px picture box |
|---|---|---|
| Fluent 3D PNG 256 | 85 CSS px | 1.22x upscale (slightly soft; judge on device) |
| Noto 3D PNG 512 → 320 | 107 CSS px | sharp |
| Noto 3D PNG 512 → 384 | 128 CSS px | sharp |

### File size per sprite

[MEASURED] Encoded with `cwebp -q 85 -alpha_q 100`:

| set (sample) | source PNG avg | WebP avg |
|---|---|---|
| Fluent 3D 256 px (40 random) | 34.0 KB | **5.0 KB** at 256 px (lossless WebP: 20.2 KB) |
| Noto 3D 512 px (30 random) | 207 KB | **13.2 KB** at 320 px, **16.3 KB** at 384 px |

[INFERENCE] 600 Noto 3D sprites at 320 px come to about 7.9 MB. All of about 1,900 non-skin-tone Noto emoji would be about 25 MB.

### One atlas or single files

**Single files.**

- **Decoded memory.** WebKit sizes a decoded bitmap as width × height × 4 (BitmapImageSource.cpp#L321, above). An atlas is one bitmap, so showing any card decodes the whole sheet. 600 sprites at 320 px in one atlas would be 600 × 409,600 B ≈ **246 MB** decoded. Single `<img>` files decode only what is on screen: about 30–50 cards × 0.4 MB. [INFERENCE from the formula]
- **Precache size cap.** Workbox skips large files by default:
  > `"maximumFileSizeToCacheInBytes": { "description": "...prevents you from inadvertently precaching very large files...", "default": 2097152 }`

  — https://unpkg.com/workbox-build@7.4.1/build/schema/GenerateSWOptions.json. A multi-MB atlas would silently drop out of the offline cache unless this is raised. Single 5–16 KB files never come near it.
- **Updates.** With single files, adding one picture changes one precache entry. [INFERENCE]
- **Images are not precached by default** in vite-plugin-pwa:
  > "By default, `globPatterns` will be `**/*.{js,css,html}`"

  — https://github.com/vite-pwa/docs/blob/main/guide/static-assets.md
  So the config must add `webp`.

---

## Recommendations

### Haptics

1. **No haptics in the drag path in v1.** Lift, snap, wrong-drop shake and group complete are carried by motion and ZzFX sound only. Do not add `use-haptic` or `web-haptics`: both rely on script `label.click()`, which iOS 26.5+ ignores.
2. **Tap haptics are allowed** where the child *taps* (the stock/deal pile, any big round button). Recipe, about 15 lines, written by hand. ios-haptics v3 does the same, but its overlay has `touch-action: manipulation`, which fights our drag surface. Steps:
   - Inside the tap target, add `<input type="checkbox" switch aria-hidden="true" tabindex="-1">`.
   - Style it `position:absolute; inset:0; width:100%; height:100%; margin:0; opacity:0; clip-path: inset(0 round <same radius as button>)`, and leave `appearance` at its default `auto`.
   - Handle the tap in the input's `change` event. The haptic arrives on finger lift, the same moment as the visual press-release and the sound.
3. **Optional experiment: "card is a switch", for the correct-snap haptic only.**
   - Give each draggable card a full-size `opacity:0` native switch as its hit area. Keep the drag handlers on the card wrapper.
   - In `pointerup`, set `input.disabled = true` when the drop is wrong, and `false` again on the next `pointerdown`.
   - Adopt it only if every one of these holds on the iPhone 12 in the home-screen app:
     - a haptic arrives on a correct drop;
     - no haptic arrives on a wrong drop;
     - no stray haptic arrives mid-drag;
     - drag feel is unchanged against the approved gate.
   - Otherwise delete it. Do not tune it further.
4. **Fallback when haptics are off or unavailable:** nothing extra. Every haptic moment already has motion plus a sound. `navigator.vibrate` does not exist on iOS, so feature-detect nothing.

### Asset source

5. **Main card art: Noto 3D static PNGs** from `googlefonts/noto-emoji`, path `3D/png/512/emoji_u<codepoint>.png`.
   - Why: 512 px source (sharp at the card size), Emoji 18 coverage (4,007 files), and the same shapes as Noto Animated.
   - **Alternative, if the author prefers the Fluent look** (a taste call worth five minutes on the phone): `microsoft/fluentui-emoji` `assets/<Name>/3D/<name>_3d.png`, 256 px, MIT. It is capped at 256 px and Emoji 15.
6. **Is it "a good set"?**
   - **Yes for static cards.** Both Fluent 3D and Noto 3D cover animals, sea life, fruit and vegetables, things with wheels, clothes, bath items, toys and colour objects well enough for hours of varied associations.
   - **No for animated sets as a main set.** Noto Animated has 881 entries, 502 of them smileys. Fluent Animated has 746, with no fruit, clothes or bath items.
   - **Missing everywhere** (not in Unicode 18.0): towel, rubber duck, starfish, seahorse, excavator/digger, crane, dump truck, sweater, pyjamas, pacifier.
   - **Also missing from Fluent only** (Emoji 16–18): orca, lighthouse, treasure chest, pickle, monarch butterfly, trombone, shovel, harp, root vegetable, leafless tree.
7. **Totals and metadata:**

| set | items | per-emoji metadata | path |
|---|---|---|---|
| Fluent 3D | 1,595 emoji (3,145 PNGs incl. skin tones) | **yes**: `cldr`, `group`, `keywords`, `tts`, `unicode` | `assets/<Name>/metadata.json` |
| Fluent Animated | 746 emoji (2,241 APNGs) | **yes**, same schema | `assets/<Name>/metadata.json` in `microsoft/fluentui-emoji-animated` |
| Noto Animated | 881 entries (611 without skin tones) | **thin**: `categories`, `tags` (about 1.2 shortcodes each) | `https://googlefonts.github.io/noto-emoji-animation/data/api.json` |
| Noto 3D static | 4,007 PNGs per size | **none** (filename = codepoint) | join to Fluent `metadata.json` by codepoint |

### Format, size, packaging

8. **Static card sprite:**
   - WebP, lossy, `cwebp -q 85 -alpha_q 100 -m 6`, **320 × 320 px**. That is sharp up to a 107 CSS px picture box, under WebKit's 500 KB synchronous-decode bar, and about 13 KB each.
   - Use **384 × 384** only if the design shows the picture larger than 107 CSS px. Then always `await img.decode()` before revealing it.
   - If Fluent is chosen: 256 × 256 WebP at the same settings (about 5 KB each), never upscaled in the build.
9. **Markup:** one `<img src="/sprites/<codepoint>.webp" width="320" height="320" draggable="false" alt="">` per card, sized by CSS and moved by `transform` only.
   - Before dealing, `await Promise.all(cardImgs.map(i => i.decode()))` so no card paints blank in its first frame.
10. **Packaging: single files, no atlas.**
    - Put them under `public/sprites/`.
    - In `vite-plugin-pwa`, set `workbox: { globPatterns: ['**/*.{js,css,html,webp,avif,woff2}'] }`. Leave `maximumFileSizeToCacheInBytes` at 2 MiB as a guard.
    - Ship only the sprites the content model uses (about 600 ≈ 8 MB), not the whole set.
11. **Parade and celebration motion:**
    - Make it with **CSS `transform`/`opacity` keyframes on the static sprite** (walk off-screen with a small hop and tilt). This works even when Auto-Play Animated Images is off.
    - Optionally swap the walking sprite to its **Noto Animated `512.webp`**, shipped as downloaded (188–425 KB each, only for parade items), and only if the device CPU check passes. Use WebP over AVIF unless the device check shows AVIF is cheaper; AVIF files are 3–6x smaller.
    - No Lottie runtime.
12. **Credits** (one file, for example `/credits.txt`, linked from a parent-only screen or just reachable by URL):
    - Apache-2.0 and OFL-1.1 texts for Noto 3D.
    - MIT text for Fluent, if used.
    - For Noto Animated, the line: *"Animated emoji: Noto Emoji Animation by Google, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), from https://googlefonts.github.io/noto-emoji-animation/ — resized/re-encoded where noted."*
    - This wording is my suggestion built to meet CC BY 4.0 §3(a)(1). The site gives none.

## Must be measured on the device

1. **iOS point version** on the iPhone 12 (Settings → General → About). At 26.5 or later, script haptics are gone, as this file assumes.
2. **Settings → Sounds & Haptics → System Haptics** is on. Without it, no switch haptic can be felt.
3. **Baseline:** a tap on a visible native switch inside the *installed home-screen app* makes a haptic.
4. **Tap-haptic recipe** (rec. 2): it fires on the stock/deal tap, and the `change` handler and sound line up.
5. **"Card is a switch" experiment** (rec. 3): haptic on release? stray haptic mid-drag after the 200 ms hold? does `disabled` set in `pointerup` silence a wrong drop? Does `pointerup` run before the switch's `touchend` handling? (That ordering is in closed iOS WebKit code.) Is drag feel unchanged against the approved gate?
6. **Settings → Accessibility → Motion → Auto-Play Animated Images**: its current state, and whether it pauses animated WebP/AVIF inside the home-screen app.
7. **Animated sprite CPU and frame drops:** with 1, 4 and 8 Noto `512.webp` sprites playing during a parade, against the same with `512.avif`. Use Safari Web Inspector → Timelines (CPU, Rendering Frames) over USB, while dragging a card.
8. **Sharpness:** Fluent 256 px (1.22x upscale) against Noto 3D 320/384 px at the real card size. Plus the look, which is the author's taste call.
9. **First-frame blanks when dealing**, with and without `img.decode()`, at 320 px and at 384 px.
10. **Memory:** Web Inspector Memory timeline after many deals. Watch whether decoded sprites are dropped and re-decoded, which would cause jank on reveal.
11. **Offline precache:** time and success of the first service-worker install with about 8 MB of sprites, then a full airplane-mode session.
12. **Lottie CPU** — only if a Lottie runtime is ever reconsidered. No primary measurement for an iPhone 12 exists in the sources found.
