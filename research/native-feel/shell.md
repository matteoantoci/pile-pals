# The App Shell: Making A Home-Screen Web App Feel Native On iOS 26

Researched 2026-11-09 for the kids' picture solitaire game. Target: iPhone 12 (non-Pro, 60 Hz, 3×), iOS 26, Safari 26. No fallbacks for older iOS.

This game is **not** part of the smart-games collection, but that project already researched the same platform. Its findings are treated as prior work and are cited, not repeated:

- [pwa-route.md](../../../smart-games/.scratch/minigame-collection/research/pwa-route.md): install, the storage exemption, offline, the audio unlock gesture, and the fact that orientation cannot be locked.
- [web-input-latency.md](../../../smart-games/.scratch/minigame-collection/research/web-input-latency.md) and [19-drag-feel-gate.md](../../../smart-games/.scratch/minigame-collection/issues/19-drag-feel-gate.md): the drag recipe (`transform` written inside `pointermove`, `touch-action: none`, `setPointerCapture`, `-webkit-user-select: none`), already approved on this exact phone.
- [code-synthesised-sfx.md](../../../smart-games/.scratch/minigame-collection/research/code-synthesised-sfx.md): ZzFX, one `AudioContext`, and respecting the silent switch.
- [21-stack-policy.md](../../../smart-games/.scratch/minigame-collection/issues/21-stack-policy.md): vite-plugin-pwa with `autoUpdate`, `localStorage` plus an export code. This file does **not** assume Solid; all code below is framework-neutral TypeScript.
- [20-responsive-layout.md](../../../smart-games/.scratch/minigame-collection/issues/20-responsive-layout.md) and the safe-area hazard in [map.md](../../../smart-games/.scratch/minigame-collection/map.md).

Labels used below: **unverified** means no source sentence was found. **[INFERENCE]** means a conclusion I drew from cited facts, not something a source says.

## Question

What must the shell of a home-screen web app do on iOS 26 so that launching, pausing, resuming, updating and touching it feel like a native app, with no white flash, no browser behaviour leaking through, and no lost game?

## 1. Launch: splash screen, white flash, and the iOS 26 install change

### What changed in iOS 26

Every site added to the Home Screen now opens as a web app, and the user can turn that off:

> "Now, we are revising the behavior on iOS 26 and iPadOS 26. By default, every website added to the Home Screen opens as a web app. If the user prefers to add a bookmark for their browser, they can disable “Open as Web App” when adding to Home Screen — even if the site is configured to be a web app."
> — [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

> "Simply put, there are now zero requirements for “installability” in Safari."
> — [same page](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

The manifest still matters:

> "If you include a Web Application Manifest with your site, the benefits it provides will be part of the user’s experience. If you define your icons in the manifest, they’re used."
> — [same page](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

Safari 26.0 also fixed a bug in the install flow itself:

> "Fixed the “Add to Home Screen” flow failing to load webpage data, preventing users from making new Home Screen web apps. (154655565)"
> — [same page](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

SVG icons are new in Safari 26:

> "Safari 26 beta now supports the SVG file format for icons everyplace there are icons in the interface, including favicons."
> — [News from WWDC25: WebKit in Safari 26 beta](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)

A third-party table, updated 13 Oct 2026, adds a limit: "SVG icons only work when you declare them in the manifest." — [Firtman, PWAs on iOS](https://firt.dev/notes/pwa-ios/). An `apple-touch-icon` link overrides manifest icons. MDN's compat data says manifest icons are "Only used when no `apple-touch-icon` is present and either `"purpose" is set to "any"` or `"purpose"` is not specified." — [BCD manifests/webapp/icons](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/icons.json).

**Practical consequence.** When the parent adds the game, the "Open as Web App" switch must stay on. If it is off, the icon opens a Safari tab with browser chrome.

### Does iOS 26 build a splash screen from the manifest?

**No source says it does, and two sources say it does not.**

- MDN's compat data lists manifest `background_color` as **not supported** in Safari (`"version_added": false`), and Safari on iOS mirrors that entry — [BCD manifests/webapp/background_color](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/background_color.json).
- Firtman's table (updated 13 Oct 2026) lists `background_color` with ❌ and says of `apple-touch-startup-image`: "👍 Still the only way to define splash screens". Its footnote: "Startup images only work if the apple-mobile-web-app-capable meta tag is present despite the presence of the manifest standalone replacement." — [firt.dev/notes/pwa-ios](https://firt.dev/notes/pwa-ios/)
- web.dev (last updated 2024-09-20): "Android creates splash screens automatically based on the manifest's values. That's not the case for iOS and iPadOS. In these devices, you should define the splash screens in the HTML as static images using `<link>` elements." It also warns: "The challenge is that the startup image must have the exact window size that your PWA will have on opening." and "If you don't provide a startup image for your user's iOS or iPadOS context, a white screen will appear instead in the opening animation, and while your PWA is loading" — [web.dev, Learn PWA: Enhancements](https://web.dev/learn/pwa/enhancements)

Apple's own (2016, archived) guide describes the link and a different default:

> "On iOS, similar to native applications, you can specify a launch screen image that is displayed while your web application launches. This is especially useful when your web application is offline. By default, a screenshot of the web application the last time it was launched is used."
> — [Apple, Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

The two defaults (white screen vs. last screenshot) conflict. Which one iOS 26 shows when no startup image matches is **unverified** and goes on the measurement list.

WebKit does **parse** `background_color`, and it now also parses a dark variant. The parser reads `parsedManifest.backgroundColor = parseColor(manifest, "background_color"_s);` and, inside a `color_scheme_dark` object, `parsedManifest.backgroundColorDark = parseColor(*darkManifest, "background_color"_s);` — [WebKit ApplicationManifestParser.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/applicationmanifest/ApplicationManifestParser.cpp). The commit that added the dark variant (2026-05-29) says: "This allows developers to specify both a light and dark theme color (and background color) instead of only having a single color for both." — [WebKit commit 4335716](https://github.com/WebKit/WebKit/commit/4335716855bb893798267c14053068e6c8ad010e). Which iOS release ships that commit, and whether the parsed `background_color` is used for the launch screen, is **unverified**.

One known bug affects how the image is given: "After updating to iOS 17.6.1, the splash screen for Progressive Web Apps (PWAs) no longer displays correctly when using a data URL or blob URL as the source for the apple-touch-startup-image." — [WebKit bug 280262](https://bugs.webkit.org/show_bug.cgi?id=280262) (status NEW). Serve real PNG files.

**Image size for the iPhone 12.** Apple's spec: "2532‑by‑1170-pixel resolution at 460 ppi" — [iPhone 12 Technical Specifications](https://support.apple.com/en-us/111876). At 3× this is 390 × 844 points. So the portrait image is **1170 × 2532 px** and the landscape image is **2532 × 1170 px**. Orientation cannot be locked (prior work: pwa-route.md §6), so both are needed.

### Avoiding the white flash, including in dark mode

There are three moments where white can show: the system launch animation (covered by the startup image), the time before the CSS loads, and any frame where the page background is not yet painted.

For the time before CSS loads, HTML gives a direct tool:

> "To aid user agents in rendering the page background with the desired color scheme immediately (rather than waiting for all CSS in the page to load), a 'color-scheme' value can be provided in a meta element."
> — [HTML Standard, meta name="color-scheme"](https://html.spec.whatwg.org/multipage/semantics.html#meta-color-scheme)

The CSS spec says the color scheme changes the canvas colour: "On the root element, the used color scheme additionally must affect the surface color of the canvas" — [CSS Color Adjustment Level 1](https://www.w3.org/TR/css-color-adjust-1/). So if the game declares only `light` and paints its own background, dark mode cannot turn the canvas dark-grey before the game's colour arrives. **[INFERENCE]**

The status bar and home-indicator strip take their colour from the page (see section 2), and one report says that colour is cached: "The bottom bar's color is cached from the page background and only updates on relaunch, not on live theme change." — reporter comment, 2026-07-20, [WebKit bug 301994](https://bugs.webkit.org/show_bug.cgi?id=301994). So the `html` background should be **one colour for the whole app**, never changed per screen. **[INFERENCE]**

## 2. Status bar, safe areas and the home indicator

### What the status-bar meta values mean

> "If content is set to default, the status bar appears normal. If set to black, the status bar has a black background. If set to black-translucent, the status bar is black and translucent. If set to default or black, the web content is displayed below the status bar. If set to black-translucent, the web content is displayed on the entire screen, partially obscured by the status bar. The default value is default."
> — [Apple, Supported Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html)

That explains the measured 797pt viewport in the drag gate: it used `black`, so content starts **below** the 47pt status bar (19-drag-feel-gate.md).

### Apple now says black-translucent is deprecated

A WebKit engineer at Apple, answering an iOS 27 report on 2026-06-16:

> "The status bar behavior has not changed between iOS 26 and iOS 27. The black-translucent status bar mode has been deprecated for multiple releases because it semantically can’t work with dark mode and across different webpage styles. Please remove this key, and the status bar should automatically appear in the same color as the webpage. Home Screen web apps does not support drawing arbitrary content below the status bar."
> — Luming Yin, comment 2, [WebKit bug 317153](https://bugs.webkit.org/show_bug.cgi?id=317153)

This replaces `theme-color` and the status-bar meta as the lever: **the status bar takes the page colour.** Manifest `theme_color` is listed as supported on iOS since 15 (`"version_added": "15"`) in [BCD manifests/webapp/theme_color](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/theme_color.json), but no source says iOS 26 uses it for the standalone status bar. **Unverified**; the page colour is the reliable lever.

### Behaviour has flipped between iOS 26 point releases

- iOS 26.1: "Installed PWAs (both local and online) are no longer displayed correctly in fullscreen mode since iOS 26.1." and "Additionally, env(safe-area-inset-top) now returns 0, whereas before the update it was approximately 44pt." Later: "I can confirm, that 26.2 fixed the issue." Then on 2026-07-20: "Still reproducing on iOS 26.5.2 (Home Screen standalone web app, portrait)." with "Gap: 62px, drawn by the system above the web layer and unreachable by any DOM element." An Apple engineer then wrote "Confirmed in iOS 27 beta. Reopening." Status: REOPENED. — [WebKit bug 301994](https://bugs.webkit.org/show_bug.cgi?id=301994)
- A related report was moved off WebKit: "It's been determined that this is actually an issue in Safari, not in WebKit, so this will continue to be tracked by Apple internally." — [WebKit bug 300445](https://bugs.webkit.org/show_bug.cgi?id=300445)
- The status-bar style is fixed at install time: "AFAIK, there is no workaround or anything we can fix on our side, as web apps need this to be set 'on install'. The behavior does not change when the meta tag is added later on." The same report: "The `100vh` and `-lvh` values are incorrect when a web app is installed without the `[meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /]` tag in place." — [WebKit bug 316008](https://bugs.webkit.org/show_bug.cgi?id=316008) (status NEW)

**Practical consequences:** after any change to the `<head>` metas, delete the Home Screen icon and add it again before measuring. Do not size anything with `vh` or `lvh`.

### Verdict on the map.md inference

map.md and 19-drag-feel-gate.md guessed that `black` zeroed the insets and that "`black-translucent` plus `viewport-fit=cover` would likely restore real values."

- **Partly supported:** one developer measured, with `viewport-fit=cover` and `black-translucent`, "env(safe-area-inset-top) = 62px" and "env(safe-area-inset-bottom) = 34px" — but also "screen.height = 874", "visualViewport.height = 812", and a 62px "orphan strip below page" that no CSS can reach. — [WebKit bug 313800](https://bugs.webkit.org/show_bug.cgi?id=313800) (different iPhone, iOS version not stated, NEW)
- **Refuted as a plan:** Apple calls `black-translucent` deprecated and says web apps cannot draw under the status bar (bug 317153 above), and its behaviour changed in 26.1, 26.2 and 26.5.2 (bug 301994 above). A fluid layout cannot trust a value that changes between point releases.
- **The bottom inset is the real problem, and it is older than iOS 26.** "Observe how the text is behind the line both in portrait and landscape." Fix reported: "Adding "viewport-fit=cover" fixes the problem for added-to-homescreen websites." A 2024 comment: "navigation line is not considered as "unsafe" and shows on top of the content when viewport-fit=contain is set. And env(safe-area-inset-bottom) is zero!" — [WebKit bug 236445](https://bugs.webkit.org/show_bug.cgi?id=236445) (status NEW). The drag gate already had `viewport-fit=cover` with `black` and still read 0, so no source explains the gate's reading. **Unverified**; it must be measured with the status-bar meta removed.

How `viewport-fit=cover` and `env()` are meant to work:

> "In order to disable that behavior and cause the page to lay out to the full size of the screen, you can set viewport-fit to cover."
> "When combined, these allow style declarations to reference the current size of the safe area insets on each side."
> — [WebKit, Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

The same post gives the pattern used below: `padding-left: max(12px, env(safe-area-inset-left));`.

### Home indicator

A native app can only *ask* to hide it: "The system takes your preference into account, but returning true is no guarantee that the indicator will be hidden." — [Apple, prefersHomeIndicatorAutoHidden](https://developer.apple.com/documentation/uikit/uiviewcontroller/prefershomeindicatorautohidden). I found no web equivalent (**unverified** that none exists). Treat the bottom strip as unusable for touch: an upward drag that starts on that strip is a system gesture (see section 5).

## 3. Lifecycle: background, return, and invisible restore

### Is the page kept or reloaded?

Both happen, and the web app cannot choose.

- iOS may end any background app: "UIKit can disconnect a background or suspended scene at any time to reclaim its resources, returning that scene to the unattached state." — [Apple, Managing your app's life cycle](https://developer.apple.com/documentation/uikit/managing-your-app-s-life-cycle)
- When that happens no script runs: "If WebContent process dies (e.g. due to jetsam / crash) or MobileSafari itself is killed, then the fact pagehide event not firing is by design. If there is no process left, or we ran out of memory, then we can't run any scripts." — Ryosuke Niwa (WebKit), [WebKit bug 199854](https://bugs.webkit.org/show_bug.cgi?id=199854). The reporter on the same bug: "pagehide, beforeunload & unload all seem not to fire at all on iOS."
- An old (2019, iOS 12.2) note reports the kept-state case: "PWAs have a new lifecycle and on most normal situations, the state of your app will be saved and restored between sessions, but there is no way to kill the PWA and restart it from scratch" — [firt.dev, iOS 12.2](https://firt.dev/ios-12.2). Old; how long iOS 26 keeps a suspended web app on an iPhone 12 is **unverified** and must be measured.

### Which events to use

> "Transitioning to `hidden` is the last event that's reliably observable by the page, so developers should treat it as the likely end of the user's session"
> — [MDN, Document: visibilitychange event](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)

`pageshow` fires on load, on bfcache restores and when "Restoring a frozen page on mobile OSes", but MDN warns: "Despite the name, the `pageshow` event does not fire when the page is actually _shown_ to the user." — [MDN, Window: pageshow event](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event). The game is one document with no navigation, so bfcache does not apply. **[INFERENCE]** Use `visibilitychange` for both directions; do not depend on `pagehide`, `beforeunload` or `unload`.

### AudioContext after background, lock, or a phone call

WebKit has a fourth state that the W3C spec does not list:

```
enum AudioContextState { "suspended", "running", "interrupted", "closed" };
```
— [WebKit AudioContextState.idl](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContextState.idl)

> "In iOS Safari, when a user leaves the page (e.g., switches tabs, minimizes the browser, or turns off the screen) the audio context's state changes to "interrupted" and needs to be resumed."
> — [MDN, BaseAudioContext: state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state)

MDN also lists "A conferencing or phone app on the same system requiring exclusive access to the device's audio hardware" as an interruption (same page).

WebKit's own test shows what `resume()` does while interrupted: "Test 1: resume() while interrupted is resolved after the interruption ends." and "Test 2: resume() while interrupted will cause interruption to end." — [WebKit LayoutTests audiocontext-state-interrupted.html](https://github.com/WebKit/WebKit/blob/main/LayoutTests/webaudio/audiocontext-state-interrupted.html). So calling `resume()` is safe in any non-running state; its promise may wait.

Web Audio never plays in the background: "On iOS, WebAudio is considered "Ambient" audio from the system's perspective, and ambient audio is blocked by the system once the app producing it is no longer foreground." — Jer Noble (Apple), [WebKit bug 198277](https://bugs.webkit.org/show_bug.cgi?id=198277). That is fine for a game.

Known failure modes:

- "WebAudio Context continues to be stuck on "interrupted" state on IPhone and IPads without an option to resume." — [WebKit bug 273511](https://bugs.webkit.org/show_bug.cgi?id=273511) (NEW, 2024)
- On iOS 17.5.1: "the only way to hear sounds again is to create a new instance of web audio context every time you gain focus". A commenter: "The solution is to suspend and resume the audio context when Safari is resumed, which can be done on visibilitychange." Another saw a context in "this frozen audio state (context.state == 'running' but context.currentTime is not changing over time)" and recovered with `context.suspend()` then `context.resume()` after short delays. — [WebKit bug 276016](https://bugs.webkit.org/show_bug.cgi?id=276016) (NEW)

Whether any of these still happens on iOS 26 is **unverified**. The recovery code below handles all three: resume, then suspend+resume, then recreate.

**Audio Session API.** Safari 16.4 shipped `navigator.audioSession.type`, but not its `state` or `statechange` (BCD: `AudioSession.type` Safari `"16.4"`, `AudioSession.state` `false`) — [BCD api/AudioSession](https://github.com/mdn/browser-compat-data/blob/main/api/AudioSession.json). WebKit hides those behind `DOMAudioSessionFullEnabled`, with `status: testable` and `defaultValue: false` — [UnifiedWebPreferences.yaml](https://github.com/WebKit/WebKit/blob/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml). So it cannot be used to detect interruptions. Setting the type does work: WebKit maps `case DOMAudioSession::Type::Ambient:` to `return AudioSessionCategory::AmbientSound;` — [DOMAudioSession.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.cpp). The spec defines it as "Ambient audio, which is mixable with other types of audio." — [W3C Audio Session](https://w3c.github.io/audio-session/). Apple's ambient category is the one where "Screen locking and the Silent switch (on iPhone, the Ring/Silent switch) silence your audio" (quoted in prior work, code-synthesised-sfx.md). Setting `ambient` explicitly keeps the silent-switch decision from prior work true by declaration, not by default. **[INFERENCE]**

### Saving mid-level so a reload is invisible

Prior work already chose `localStorage` and an export code, because `navigator.storage.persist()` does not help on WebKit (21-stack-policy.md). For this game, the rules that make a cold relaunch look like a resume are design choices, not citations:

1. **Save after every committed move**, not only on `hidden`, because `hidden` may never come before a kill (bug 199854 above). The state is small, so a synchronous `localStorage.setItem` per drop is cheap. **[INFERENCE]**
2. **Save logic, never animation.** Save the state *after* the move resolves: a card that is mid-shake-back is saved at its origin; a category that has started its parade is saved as cleared. On restore, nothing replays.
3. **Save the deal, not the seed alone.** Store the full tableau, the anchor piles and the face-up/face-down flags, plus a schema version.
4. **On `hidden`, cancel any drag.** Snap the dragged card back to its origin, stop confetti, then save.
5. **Restore before first paint.** Read the save synchronously in the entry script and render the level directly, with transitions disabled for the first frame (a `data-restoring` attribute on `html`, removed after one `requestAnimationFrame`). The child then sees the same table, not the start screen.
6. Sound needs a gesture after a cold launch anyway (prior work). The first card touch resumes the context; nothing visible is needed.

## 4. Service-worker updates without a mid-level reload

### When vite-plugin-pwa `autoUpdate` reloads

> "With this behavior, once the browser detects a new version of your application, then, it will update the caches and will reload any browser windows/tabs with the application opened automatically to take the control."
> "With this option, the plugin will force workbox.clientsClaim and workbox.skipWaiting to true on the plugin options."
> "The disadvantage of using this behavior is that the user can lose data in any browser windows/tabs in which the application is open and is filling in a form."
> — [vite-plugin-pwa, Automatic reload](https://vite-pwa-org.netlify.app/guide/auto-update.html)

The plugin's source shows the exact trigger: in auto mode it listens for `activated` and, `if (event.isUpdate || event.isExternal)`, calls `onNeedReload()` if given, otherwise `window.location.reload()` — [register.ts lines 60–68](https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/client/build/register.ts). The option is documented as: "Called when the service worker has taken control and the page would normally reload. Useful to fully control the reload flow (for example, to defer reload until the next SPA navigation)." — [type.d.ts](https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/client/type.d.ts). I checked the published `vite-plugin-pwa@2.0.0` tarball (npm `latest`, published 2026-10-03): `dist/client/build/register.js` contains `onNeedReload`.

When does the browser look for a new version?

> "An update is triggered if any of the following happens: A navigation to an in-scope page. A functional events such as push and sync, unless there's been an update check within the previous 24 hours."
> "Once successfully installed, the updated worker will wait until the existing worker is controlling zero clients."
> — [web.dev, The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)

**[INFERENCE]** On the phone this means: a cold launch is a navigation, so the check starts at launch. The new worker downloads while the child is already playing. With `autoUpdate` it then activates at once and the page **reloads seconds into the session**, possibly mid-drag. Returning from the background is not a navigation, so no check happens then unless the code calls `registration.update()`.

`skipWaiting` has a second cost: "`skipWaiting()` means that your new service worker is likely controlling pages that were loaded with an older version. This means some of your page's fetches will have been handled by your old service worker, but your new service worker will be handling subsequent fetches. If this might break things, don't use skipWaiting()." — [web.dev, same page](https://web.dev/articles/service-worker-lifecycle). If `onNeedReload` delays the reload, the old page keeps running under the new worker. Any lazy-loaded chunk the old page asks for later may already be gone from the cache. **[INFERENCE]**

### Recommended: `registerType: 'prompt'`, with code (not the child) accepting

The smart-games project picked `autoUpdate` because "the user is a small child who cannot read a ... prompt" (21-stack-policy.md). But "prompt" mode does not require showing a prompt. The plugin only calls `onNeedRefresh`; the app decides when to call `updateSW()`:

> "When the user clicks the "refresh" button when `onNeedRefresh` called, then call `updateSW()` function; the page will reload and the up-to-date content will be served."
> — [vite-plugin-pwa, Prompt for update](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html)

"Prompt" is the plugin default: "Since this is the default behavior for the `registerType` plugin option, you don't need to configure it." (same page). Workbox explains the message plumbing: "If you're using generateSW from workbox-build and you have its skipWaiting option set to false (the default), then you're good to go, as the code below will be automatically included in your generated service worker file." — [Chrome for Developers, Handling service worker updates](https://developer.chrome.com/docs/workbox/handling-service-worker-updates)

So the game's own code plays the role of the "user":

- The new version waits, and the old worker keeps serving the old files, so nothing mixes mid-level.
- Pile Pals has no hub. It has three screens: the **start screen** (one large Play button, which also unlocks audio), the **level**, and the **reward screen** (the sticker flies into the sticker book, then a "next" button shows). The code calls `updateSW()` at two safe moments only: (1) on the start screen before the first touch, and (2) when the child taps "next" on the reward screen. At moment 2 the save already points at the next level, so the reload paints the next level from the save. The screen changes at that moment anyway, so the reload is not visible as a jump **[INFERENCE]**.
- If the code never calls it, the waiting worker still activates after a cold relaunch, because the old worker then controls zero clients (web.dev quote above). Updates can never get stuck. **[INFERENCE]**

The plugin warns about switching later: "Changing the behavior of the service worker from autoUpdate to prompt can be a pain." — [vite-plugin-pwa, Automatic reload](https://vite-pwa-org.netlify.app/guide/auto-update.html). This game has not shipped yet, so choose `prompt` now.

To also find updates when the app resumes from the background, call `registration.update()` on `visibilitychange` → visible. The plugin documents the same call on a timer: "you can use this code to configure periodic service worker updates" with `r.update()` — [vite-plugin-pwa, Periodic SW updates](https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html).

## 5. System behaviour that breaks the illusion

web-input-latency.md already settled `touch-action: none` on the board, `setPointerCapture`, `-webkit-user-select: none` on the root, `-webkit-tap-highlight-color: transparent`, and `touch-action: manipulation` for double-tap. Only additions are below.

| Leak | Cause | Fix | Source |
|---|---|---|---|
| Long-press bubble / link preview on a card | iOS callout | `-webkit-touch-callout: none` on `html` (inherited); never use `<a href>` for game objects, use `<button>` or a `div` | MDN: "When a target is touched and held on iOS, Safari displays a callout information about the link. This property allows disabling that behavior." — [MDN -webkit-touch-callout](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-touch-callout). WebKit lists it as `"inherited": true` — [CSSProperties.json](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/css/CSSProperties.json) |
| Card image lifts out as a system drag "ghost" | `<img>` is draggable by default | `draggable="false"` on every `<img>`, `-webkit-user-drag: none` on `img`, and `pointer-events: none` on `img` so the touch lands on the card's `div`; or draw sprites as inline SVG or CSS backgrounds instead of `<img>` | HTML: "img elements and a elements with an href attribute have their draggable attribute set to true by default." — [HTML Standard, drag and drop](https://html.spec.whatwg.org/multipage/dnd.html). WebKit's `-webkit-user-drag` values: `["auto", "none", "element"]` — [CSSProperties.json](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/css/CSSProperties.json). That `pointer-events: none` stops the iOS drag is **[INFERENCE]** |
| Emoji art gets selected, loupe appears | emoji are text | `-webkit-user-select: none` on root (prior work); also `-webkit-text-size-adjust: 100%` so emoji do not grow on rotation | MDN: "The `text-size-adjust` CSS property controls the text inflation algorithm used on some smartphones and tablets." — [MDN text-size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/text-size-adjust). BCD: Safari iOS needs the `-webkit-` prefix — [BCD text-size-adjust](https://github.com/mdn/browser-compat-data/blob/main/css/properties/text-size-adjust.json) |
| Pinch zoom | `user-scalable=no` may be ignored | Keep `maximum-scale=1, user-scalable=no` in the viewport, **and** put `touch-action: none` on `html` so pinch cannot start anywhere; optionally `preventDefault()` on `gesturestart` | Safari 10: "Pinch-to-zoom is always enabled for all users. The viewport setting for user-scalable is ignored." — [What's New in Safari 10](https://developer.apple.com/library/archive/releasenotes/General/WhatsNewInSafari/Articles/Safari_10_0.html). A plain `WKWebView` honours it by default: "The default value of this property is false." — [ignoresViewportScaleLimits](https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/ignoresviewportscalelimits). Which one the Home Screen web app uses is **unverified**. Pointer Events: "the effect of that input is determined by the value of the touch-action property, and the default direct manipulation behaviors of the element and its ancestors" — [W3C Pointer Events 3](https://www.w3.org/TR/pointerevents3/). Apple: "To disable pinch open and pinch close gestures in iOS 2.0, implement the gesturestart and gesturechange event handlers" and "Important: The default browser behavior may change in future releases." — [Apple, Handling Events](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html) |
| Rubber-band bounce of the whole page | the root scroller overscrolls | Make nothing scroll: `overflow: hidden` on `html, body`, game root `position: fixed; inset: 0`, `touch-action: none` on `html`. Add `overscroll-behavior: none` too, but do not rely on it | Safari 16: "Added support for Overscroll Behavior." — [Safari 16 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16-release-notes). BCD marks it partial: "The property has no effect on scroll containers that have no scrollable overflow." — [BCD overscroll-behavior](https://github.com/mdn/browser-compat-data/blob/main/css/properties/overscroll-behavior.json). Still open: "To implement this we’d have to represent non-scrollable boxes with overscroll-behavior:contain in the scrolling tree, which is a fair amount of work." — Simon Fraser, [WebKit bug 243452](https://bugs.webkit.org/show_bug.cgi?id=243452) |
| Left-edge swipe goes "back" | standalone web apps have history gestures | Never create history entries: no `pushState`, no `#hash` routing, no real navigations between screens. With no previous entry, a back swipe has nothing to go to **[INFERENCE]** | "On platforms such as iOS, web apps installed to the home screen have swipe gestures that allow users to navigate back and forth between pages." — third-party proposal, still open, [w3c/manifest#1041](https://github.com/w3c/manifest/issues/1041). No Apple source found (**unverified**) |
| Swipe from top (Notification/Control Center) or up from the bottom (Home) | system edge gestures | No web fix. Keep draggable cards away from the very top and bottom edges; for full lock-down use Guided Access (section 6) | Native apps can defer these: "immersive apps can use this property to allow app-defined gestures to take precedence over the system gestures." — [Apple, preferredScreenEdgesDeferringSystemGestures](https://developer.apple.com/documentation/uikit/uiviewcontroller/preferredscreenedgesdeferringsystemgestures). No web equivalent found (**unverified** that none exists) |
| Tap highlight on non-link elements | default highlight colour | `-webkit-tap-highlight-color: transparent` on `html` (inherited) | MDN: "sets the color of the highlight that appears over a link while it's being tapped." — [MDN -webkit-tap-highlight-color](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-tap-highlight-color). WebKit: `"inherited": true` — [CSSProperties.json](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/css/CSSProperties.json) |

`touch-action: none` on `html` is stricter than the prior work's board-only rule. It is right here because no screen in this game ever needs native scrolling or zoom. **[INFERENCE]**

## 6. Guided Access

Apple describes it for exactly this use:

> "With Guided Access, you can temporarily restrict your device to a single app. This can be useful when you let a child use your device, or you want to stay focused on a task. You can set a time limit, customize which features, hardware buttons, and areas of the screen are available, and even restrict access to the keyboard."
> — [Apple Support, Use Guided Access on iPhone or iPad](https://support.apple.com/en-us/111795)

Apple's page talks about "app" and does not mention Home Screen web apps. A third-party write-up (iPad, 2023) says it works: "The trick here is that we're using this feature in tandem with a PWA. This means we can lock down the screen to our PWA application, not just the browser." and "With guided access mode enabled, you can't swipe out or exit the screen." — [Timmy O'Mahony, Kiosk Mode on iPads with PWAs and Guided Access Mode](https://timmyomahony.com/blog/kiosk-mode-on-ipads-with-pwa/). On iPhone 12 with iOS 26 this is **unverified** and must be tried.

Two session options matter more than the lock itself:

- **It can freeze rotation**, which the web cannot do (pwa-route.md §6): "Motion: Limit how your device responds to motion. For example, your screen won't respond when shaken, and it won't rotate no matter how you hold your device." — [Apple Support](https://support.apple.com/en-us/111795)
- **It has a time limit for a child's session:** "Time Limit: Set a time limit after which Guided Access shows a full-screen message" (same page).

How it starts and stops on iOS 26: "Open the app that you want to use with Guided Access." "Triple-click the side button on iPhone or top button on iPad." To pause: "Triple-click the side button on iPhone, top button on iPad, or Home button on your older device. If using iOS 18 or iPadOS 18 or earlier, double-click the button instead." Settings are remembered: "If you previously set up Guided Access for this app, the session begins immediately using your previous settings." And a safety note: "Important: Crash Detection and Emergency Services aren’t available while using Guided Access." — [Apple Support](https://support.apple.com/en-us/111795)

"Display Auto-Lock: Set how quickly your device automatically locks when not in use during a Guided Access session." (same page). An auto-lock hides the page, so the audio-resume code in section 3 must handle it. **[INFERENCE]**

## Recommendations

### `<head>` (copy-ready)

Replace `#2F6F4E` with the art-direction table colour. It must be the **same value** in the inline style, the manifest, the startup images and the CSS.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <!-- One fixed palette: dark mode must not repaint the canvas before our CSS arrives. -->
  <meta name="color-scheme" content="light">
  <!-- Needed for apple-touch-startup-image (firt.dev footnote 2). -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <!-- Deliberately NO apple-mobile-web-app-status-bar-style:
       deprecated per WebKit bug 317153; the status bar takes the page colour. -->
  <meta name="apple-mobile-web-app-title" content="Solitaire">
  <meta name="theme-color" content="#2F6F4E">
  <link rel="manifest" href="/manifest.webmanifest">
  <!-- 180x180 PNG; this overrides manifest icons on iOS (BCD note). -->
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
  <!-- Real files, not data: URLs (WebKit bug 280262). iPhone 12: 1170x2532 @3x. -->
  <link rel="apple-touch-startup-image" href="/splash/iphone-390x844-portrait.png"
        media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
  <link rel="apple-touch-startup-image" href="/splash/iphone-390x844-landscape.png"
        media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)">
  <!-- Paint the table colour before any CSS or JS loads. -->
  <style>html{background:#2F6F4E}</style>
  <title>Solitaire</title>
</head>
```

Startup images: **PNG, 1170 × 2532 px (portrait) and 2532 × 1170 px (landscape)**, a plain fill of the table colour, optionally with the game mark centred. Make them look exactly like the first frame the app paints (start screen or restored level background with no cards), so the launch fades into the app with no visible change. **[INFERENCE]**

### Manifest (`/manifest.webmanifest`)

```json
{
  "name": "Solitaire",
  "short_name": "Solitaire",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#2F6F4E",
  "theme_color": "#2F6F4E",
  "color_scheme_dark": { "background_color": "#2F6F4E", "theme_color": "#2F6F4E" },
  "icons": [
    { "src": "/icons/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ]
}
```

`background_color` and `color_scheme_dark` cost nothing and may be used by newer iOS releases (WebKit parses both); the startup image is what actually covers launch today.

### CSS reset (copy-ready)

```css
:root {
  --table: #2F6F4E;
  /* Bottom strip nothing interactive may use. 34px is a measurement from a
     different iPhone (WebKit bug 313800); confirm on the iPhone 12. */
  --bottom-reserve: max(env(safe-area-inset-bottom), 34px);
}

html {
  background: var(--table);          /* never changes per screen (bug 301994 comment) */
  -webkit-text-size-adjust: 100%;
  touch-action: none;                /* no pan, pinch or double-tap zoom anywhere */
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;       /* inherited */
  -webkit-tap-highlight-color: transparent; /* inherited */
}

html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;                  /* nothing scrolls, so nothing rubber-bands */
  overscroll-behavior: none;         /* extra; partial in WebKit (bug 243452) */
}

#app {
  position: fixed;
  inset: 0;                          /* not 100vh / 100lvh (WebKit bug 316008) */
  box-sizing: border-box;
  padding:
    env(safe-area-inset-top)
    env(safe-area-inset-right)
    var(--bottom-reserve)
    env(safe-area-inset-left);
}

img {
  -webkit-user-drag: none;
  pointer-events: none;              /* the card div, not the img, receives the touch */
}

/* First frame after a restore: show the saved table without replaying motion. */
html[data-restoring] * {
  transition: none !important;
  animation: none !important;
}
```

Every `<img>` also gets `draggable="false"` in the markup.

### Shell code (framework-neutral TypeScript)

```ts
// --- audio: one context, ambient, self-healing ---------------------------
if ('audioSession' in navigator) {
  (navigator as Navigator & { audioSession: { type: string } }).audioSession.type = 'ambient';
}

let ctx: AudioContext | undefined;
export const audio = (): AudioContext => (ctx ??= new AudioContext());

/** Call from every pointerdown handler (it is a user gesture). */
export function ensureAudio(): void {
  const c = audio();
  if (c.state !== 'running') void c.resume(); // also ends "interrupted" (WebKit test 2)
}

/** On return to foreground: resume; if the clock is frozen, kick it; if still frozen, rebuild. */
async function healAudio(): Promise<void> {
  if (!ctx || ctx.state === 'closed') return;
  if (ctx.state !== 'running') { void ctx.resume(); return; } // finishes on next gesture if needed
  const t0 = ctx.currentTime;
  await new Promise((r) => setTimeout(r, 150));         // design value, tune on device
  if (ctx.currentTime !== t0) return;
  await ctx.suspend(); await ctx.resume();
  await new Promise((r) => setTimeout(r, 150));
  if (ctx.currentTime === t0) { void ctx.close(); ctx = undefined; } // next play() recreates
}
// The vendored ZzFX must read its context through audio(), not keep its own
// (prior work: code-synthesised-sfx.md already patches ZzFX context creation).

// --- save / restore --------------------------------------------------------
const SAVE_KEY = 'solitaire:save:v1';
export function saveNow(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state)); // after every committed move
}
export function loadSave(): GameState | undefined {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? (JSON.parse(raw) as GameState) : undefined; // validate schema version here
}

// --- service-worker updates (vite-plugin-pwa, registerType: 'prompt') -----
import { registerSW } from 'virtual:pwa-register';
let updatePending = false;
let reg: ServiceWorkerRegistration | undefined;
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() { updatePending = true; maybeApplyUpdate(); },
  onRegisteredSW(_url, r) { reg = r; },
});
/** Call on the start screen before the first touch, and when "next" is tapped on the reward screen. */
export function maybeApplyUpdate(): void {
  if (updatePending && isSafeMoment()) void updateSW(true); // skipWaiting + reload
}

// --- visibility: the only reliable lifecycle signal on iOS ---------------
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    cancelActiveDrag();        // snap the card home; never save a half-drag
    stopEffects();             // confetti, parade timers
    saveNow(currentState());
  } else {
    void healAudio();
    if (isSafeMoment()) void reg?.update(); // a resume is not a navigation
    maybeApplyUpdate();
  }
});
```

`isSafeMoment()` is true on the start screen before the first `pointerdown`, and in the "next" tap handler of the reward screen (after the save points at the next level). `GameState`, `currentState`, `cancelActiveDrag` and `stopEffects` belong to the game.

vite config:

```ts
VitePWA({
  registerType: 'prompt',      // the code accepts, not the child
  injectRegister: false,       // we call registerSW ourselves
  workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'] },
})
```

Ship one JS bundle (no lazy route chunks), so an old page can never ask for a file the new cache has deleted. **[INFERENCE]**

### Parent setup checklist (one-time)

1. Safari → Share → Add to Home Screen, and leave **Open as Web App** on.
2. Settings → Accessibility → Guided Access: on; set a passcode; set Display Auto-Lock.
3. Open the game, triple-click the side button, turn **Motion** off (freezes rotation) and set a Time Limit if wanted, then Start.
4. After any change to the `<head>` metas, delete the icon and add it again (bug 316008: the style is read at install).

## Must be measured on the device

All on the iPhone 12, iOS 26 (note the exact point release; behaviour changed in 26.1, 26.2 and 26.5.2), installed fresh from the Home Screen after the `<head>` above is deployed.

1. **Insets with the status-bar meta removed:** read `env(safe-area-inset-top/bottom)`, `innerHeight`, `visualViewport.height`, `screen.height` and `#app` height. Confirm the content starts below the status bar and find where the home indicator sits relative to `#app`. Set `--bottom-reserve` from this, replacing the borrowed 34px.
2. **Status-bar colour:** confirm it matches `html` background, in both light and dark system appearance.
3. **Launch:** does the startup image show (portrait and landscape)? With it removed, is the launch white or the last screenshot? Is there any white frame between the image and the first paint? Repeat with the phone in dark mode.
4. **Suspend vs. kill:** background the app for 1 min, 10 min, 1 h, and overnight; record whether it resumes in place or cold-launches. Check that the restore is invisible in both cases.
5. **Audio after:** app switch, lock/unlock, an incoming phone call (answered and declined), a Siri prompt, an alarm. Log `ctx.state` and whether `currentTime` advances; note which `healAudio` step was needed.
6. **Update timing:** deploy a new build, cold-launch, start a level at once; confirm no reload happens mid-level, and that the update applies on the "next" tap of the reward screen or on the next cold launch.
7. **Pinch:** does a two-finger pinch zoom the page? Is `user-scalable=no` honoured in the standalone app, or is `touch-action: none` doing the work?
8. **Rubber-band:** drag hard downward and upward from empty table areas; any bounce?
9. **Edge swipe:** left-edge swipe on the start screen and in a level; does anything move?
10. **Long-press on a card** for 2 s: any callout, lift ghost, loupe, Live Text or selection?
11. **Guided Access:** does it start inside the Home Screen web app? Does Motion-off freeze rotation? Are settings remembered per web app on the next session?
