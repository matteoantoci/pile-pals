# App Icons: Full-Bleed Icons On iPhone And Android

Researched 2026-11-23 for Pile Pals. Target: iPhone 12 with iOS 26, and Chrome on Android. Installed packages: `vite-plugin-pwa` 2.0.0, `@vite-pwa/assets-generator` 2.0.0, `sharp` 0.35.5.

Labels in this file: **[MEASURED date: ...]** marks a number that I got on this Mac from the repo or from `dist/`. **[INFERENCE]** marks a conclusion that I made from cited facts. **unverified** marks a claim that has no source sentence.

## Question

The installed app shows a white frame around the icon on the iPhone Home Screen. Native apps fill the full icon shape. What causes the frame, and what icon setup is correct for iPhone and Android?

## 1. Root cause: the `minimal-2023` preset adds a white border

### What the preset says

`vite.config.ts` sets `pwaAssets: { image: 'public/icon.svg', preset: 'minimal-2023' }`. The preset only lists sizes:

```js
// node_modules/@vite-pwa/assets-generator/dist/presets/minimal-2023.mjs
const minimal2023Preset = {
	transparent: { sizes: [64, 192, 512], favicons: [[48, "favicon.ico"]] },
	maskable: { sizes: [512] },
	apple: { sizes: [180] }
};
```

The preset gives no `padding` and no `resizeOptions`. Thus the package defaults apply:

```js
// node_modules/@vite-pwa/assets-generator/dist/utils-WVxdTzUh.mjs, lines 14-36
const defaultPngOptions = {
	transparent: { padding: .05, resizeOptions: { fit: "contain", background: "transparent" } },
	maskable:    { padding: .3,  resizeOptions: { fit: "contain", background: "white" } },
	apple:       { padding: .3,  resizeOptions: { fit: "contain", background: "white" } }
};
// lines 58-64
function toResolvedAsset(type, asset) {
	return {
		padding: defaultPngOptions[type].padding,
		resizeOptions: defaultPngOptions[type].resizeOptions,
		...asset,
		sizes: asset.sizes.map(toResolvedSize)
	};
}
```

The `apple` and `maskable` images come from one function. It makes a canvas in the background colour and puts the image, scaled to `1 - padding`, in the centre:

```js
// node_modules/@vite-pwa/assets-generator/dist/transparent-lM0a7r8e.mjs, lines 94-119
function extractAssetSize(size, padding) {
	...
	return { width: Math.round(width * (1 - padding)), height: Math.round(height * (1 - padding)) };
}
async function createSharp(type, image, size, background, options, channels) {
	const { padding = 0 } = options ?? {};
	...
	const result = sharp({ create: { width: useSize.width, height: useSize.height, channels: channels ?? 4, background } })
		.composite([{ input: await sharp(image).resize(width, height, options?.resizeOptions).toBuffer() }]);
	...
}
async function generateMaskableAsset(type, image, size, options) {
	return await createSharp(type, image, size, options?.resizeOptions?.background ?? "white", options, 4);
}
```

The resolver sends the `apple` icon through `generateMaskableAsset` too: `resolveMaskableIcons("apple", imageAssets, image, assets, htmlPreset, instructions);` (`instructions-resolver-DWK0ddGs.mjs`, line 329).

The docs say the same: "white 180x180 icon for iOS/MacOS" and "white 512x512 icon with purpose: 'maskable' (PWA Manifest icon): background color can be customized to your needs". The docs also give the values: "for transparent PNG files: 0.05", "for maskable and apple PNG files: 0.3", and "0 is no padding, 0.3 is a typical value for most icons." ([Assets generator](https://vite-pwa-org.netlify.app/assets-generator/), [CLI configurations](https://vite-pwa-org.netlify.app/assets-generator/cli.html#configurations))

### What the build contains

[MEASURED 2026-11-23: one `pnpm build`, then a pixel read of `dist/*.png` with `sharp`.]

| File | Size | Corner pixel (RGBA) | Green `#08813A` square | Border |
|---|---|---|---|---|
| `apple-touch-icon-180x180.png` | 180 × 180 | 255,255,255,255 (opaque white) | x and y 27 to 152 (126 px) | 27 px white on each side, 16,524 px, 51 % of the area |
| `maskable-icon-512x512.png` | 512 × 512 | 255,255,255,255 (opaque white) | x and y 77 to 434 (358 px) | 77 px white on each side, 134,980 px, 51 % of the area |
| `pwa-192x192.png` | 192 × 192 | alpha 0 | x and y 5 to 186 | 5 px transparent |
| `pwa-512x512.png` | 512 × 512 | alpha 0 | x and y 13 to 498 | 13 px transparent |

The numbers agree with the code: 180 × 0.7 = 126 and 512 × 0.7 = 358.

The built `dist/index.html` has `<link rel="apple-touch-icon" href="/pile-pals/apple-touch-icon-180x180.png">`. The manifest lists `pwa-64x64.png`, `pwa-192x192.png` and `pwa-512x512.png` with no `purpose`, and `maskable-icon-512x512.png` with `"purpose":"maskable"`. [MEASURED 2026-11-23]

### Root cause

`public/icon.svg` already has a full-bleed green background. The preset shrinks it to 70 % and puts it on a white square. iOS then rounds the corners of the white square, so the Home Screen shows a green square inside a white rounded square. [INFERENCE from the code and the measured PNG; the user saw this result on the iPhone.]

The Android maskable icon has the same white border. Chrome prefers the maskable icon (section 3), so an Android launcher shows a white ring around a smaller green square. [INFERENCE; not seen on a device.]

## 2. iOS: which icon, which size, and what iOS does with it

### Precedence: `apple-touch-icon` wins

> "To provide the icon to be used for your website or web app, list the icons in the Manifest file — a capability that's been supported since iOS and iPadOS 15.4. Or you can use the long-supported technique of listing `apple-touch-icons` in the HTML document `head`. (If you do both, `apple-touch-icon` will take precedence over the Manifest-declared icons.)"
> — [WebKit, Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

MDN compat data gives the same rule for Safari on iOS (`"version_added": "15.4"`): "Only used when no `apple-touch-icon` is present and either `"purpose" is set to "any"` or `"purpose"` is not specified." ([BCD manifests/webapp/icons](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/icons.json))

The Safari 26 notes do not change this: "If you define your icons in the manifest, they're used." ([WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/))

A third-party device test on iOS 18.6.2 saw the same order: "the 180 px apple-touch-icon won over manifest icons, the manifest any 192 px icon was used without it". The same test says "iOS 26 and later were not tested here." ([OpenPWA, Which icon iOS uses](https://openpwa.net/lab/behaviour/home-screen-icon-selection/))

Thus, for Pile Pals, iOS uses `apple-touch-icon-180x180.png`. The maskable icon has no effect on iOS. Firtman writes about maskable and monochrome: "WebKit recognizes these options, but it ignores them." ([Firtman, PWAs on iOS](https://firt.dev/notes/pwa-ios/))

### Size: 180 × 180

Apple's archived guide shows `<link rel="apple-touch-icon" sizes="180x180" href="touch-icon-iphone-retina.png">` and says "The icon that is the most appropriate size for the device is used." ([Apple, Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)) The vite-pwa docs also ask for "a 180x180 icon for iOS/MacOS" ([Assets generator](https://vite-pwa-org.netlify.app/assets-generator/)). One 180 px PNG is sufficient.

SVG does not work in the link: "If you use an SVG in the `apple-touch-icon` link element or as a favicon, Safari downloads it but doesn't use it for the Home Screen icon." ([Firtman, PWAs on iOS](https://firt.dev/notes/pwa-ios/))

### iOS applies its own mask

For native app icons, Apple says: "In iOS, iPadOS, and macOS, icons are square, and the system applies masking to produce rounded corners". Apple also says: "Produce appropriately shaped, unmasked layers" and "Keep primary content centered to avoid truncation when the system adjusts corners or applies masking." ([Apple HIG, App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons))

No Apple page states the same rule for web app icons. The user's screenshot shows rounded corners on the white square, so iOS rounds the web app icon too. [INFERENCE] Thus, supply a square, opaque, full-bleed PNG with no rounded corners.

### Transparency

A WebKit bug reports a black border from a transparent manifest PNG: "The black border is not supposed to be there." The reporter adds: "I'm guessing the black border is caused by the png being transparent." A second user writes: "I think in previous iOS the border was white in light mode and black in dark mode. Now it looks like it is always black." The fix in that bug was an opaque `apple-touch-icon`. Status: NEW. ([WebKit bug 255596](https://bugs.webkit.org/show_bug.cgi?id=255596))

The colour that iOS 26 puts behind transparent pixels is **unverified**. Our `apple-touch-icon` has no transparent pixels [MEASURED 2026-11-23: 0 of 32,400 pixels with alpha 0], so this does not apply. Keep the icon opaque.

### iOS 18 and iOS 26: dark, clear, tinted, and Liquid Glass

For native apps, Apple says: "In iOS, iPadOS, and macOS, people can choose whether their Home Screen app icons are default, dark, clear, or tinted in appearance." and "the system automatically generates variants you don't provide." For a bitmap icon, "the system attempts to segment your icon, isolating the foreground elements from the background to create an icon with two layers." ([Apple HIG, App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons))

No Apple or WebKit source says how iOS 18 or iOS 26 makes dark, clear, tinted, or Liquid Glass versions of a web app icon. A web app has no way to supply a dark icon: WebKit ignores `monochrome` icons (Firtman above), and an Apple forum thread asks for this feature ([Apple Developer Forums 761615](https://developer.apple.com/forums/thread/761615), not readable by script, so its content is **unverified**). The result on the device is **unverified**; it is a check in section 6.

## 3. Android and Chrome

### `any`, `maskable`, `monochrome`

The W3C spec defines the three purposes:

> "monochrome: A user agent can present this icon where a monochrome icon with a solid fill is needed. The color information in the icon is discarded and only the alpha data is used."
> "maskable: The image is designed with icon masks and safe zone in mind, such that any part of the image that is outside the safe zone can safely be ignored and masked away by the user agent."
> "any (default): The user agent is free to display the icon where no purpose is required."
> — [W3C Web Application Manifest, purpose member](https://w3c.github.io/manifest/#purpose-member)

web.dev says: "By default, icons have a purpose of `"any"`. In Android, these icons are resized on a white background." It also warns: "We don't recommend using multiple purposes for maskable icons." ([web.dev, Adaptive icon support in PWAs with maskable icons](https://web.dev/articles/maskable-icon))

### The safe zone: a circle with a radius of 40 %

> "It is defined as a circle with center point in the center of the icon and with a radius of 2/5 (40%) of the icon size"
> "The user agent MUST NOT make any pixel within the safe zone transparent."
> "If the icon contains transparent pixels, the user agent MUST composite the icon onto a solid fill (e.g., white) of the user agent's choice. It is suggested that designers avoid using transparent pixels in maskable icons."
> — [W3C Web Application Manifest, icon masks and safe zone](https://w3c.github.io/manifest/#icon-masks)

Android's own adaptive icon is 108 × 108 dp with a 66 × 66 dp safe zone: "The safe zone is centered inside of a 108x108 container." and "Use a logo that's at least 48x48 dp. It must not exceed 66x66 dp." ([Android, Adaptive icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive))

Chrome maps the W3C circle to the Android safe zone. The Chromium code has `MASKABLE_SAFE_ZONE_RATIO = 4.0f / 5.0f;` and `ADAPTIVE_SAFE_ZONE_RATIO = 66.0f / 108.0f;`, with the comment "The web standard for maskable icons specifies a larger safe zone inside the icon than Android adaptive icons define." ([Chromium WebappsIconUtils.java](https://github.com/chromium/chromium/blob/main/components/webapps/browser/android/java/src/org/chromium/components/webapps/WebappsIconUtils.java)) Thus, art inside the W3C 40 % circle is safe on Android. [INFERENCE]

### How Chrome selects the WebAPK icon

- Add to Home Screen asks for a maskable icon first: `params.prefer_maskable_icon = true;` ([Chromium add_to_homescreen_data_fetcher.cc](https://github.com/chromium/chromium/blob/main/components/webapps/browser/android/add_to_homescreen_data_fetcher.cc))
- An `any` icon is still necessary: "Whether to prefer an icon with purpose 'maskable' for the primary icon. An icon with purpose 'any' is still required for a valid manifest." ([Chromium installable_params.h](https://github.com/chromium/chromium/blob/main/components/webapps/browser/installable/installable_params.h))
- If the maskable icon is bad, Chrome uses an `any` icon: "We preferred a maskable icon, but the one we got was invalid (e.g., corrupted). Try again without preferring masking." ([Chromium installable_icon_fetcher.cc](https://github.com/chromium/chromium/blob/main/components/webapps/browser/installable/installable_icon_fetcher.cc))
- The maskable icon must be at least 83 px: `const int kMinimumPrimaryAdaptiveLauncherIconSizeInPx = 83;` (same file).
- Chrome does not use `monochrome` icons for the WebAPK: "MONOCHROME = 2; This is not currently used, so ignore it." ([Chromium webapk.proto](https://github.com/chromium/chromium/blob/main/components/webapk/webapk.proto)) Android itself can theme icons with no monochrome layer: "Starting with Android 16 QPR 2, Android automatically themes app icons for apps that don't provide their own." ([Android, Adaptive icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)) A `monochrome` icon thus has no value for Pile Pals today. [INFERENCE]

### Sizes

Chrome's install criteria: "`icons` - must include a 192px and a 512px icon" ([web.dev, What does it take to be installable?](https://web.dev/articles/install-criteria)). The build has `any` icons at 64, 192 and 512 px, and one maskable icon at 512 px. That set is correct. Only the maskable content is wrong.

## 4. The fix for this repo

### Where the art sits

[MEASURED 2026-11-23: `public/icon.svg` drawn at 512 × 512 with `sharp`; "art" is each pixel that is not the green background.]

- Art box: x 126 to 393, y 109 to 437.
- The art pixel farthest from the centre is at (186, 435), the lower-left corner of the blue back card. Its distance is 192.5 px, which is 37.6 % of the icon size.
- The W3C safe zone radius is 204.8 px (40 %). All art is inside it, with 12 px to spare. The face (eyes and mouth) is near the centre.

Thus `public/icon.svg` needs no change. With `padding: 0`, the generated icons hold the art at the same place, inside the safe zone.

### Why the background must be green too

The `resizeOptions.background` value fills the canvas around the scaled image. If it is `#08813A`, any `padding` value gives a seamless green icon. If it is white (the default), any `padding` above 0 gives a white frame. [INFERENCE from `createSharp` in section 1]

Do not give only `background`. `toResolvedAsset` replaces the whole default `resizeOptions` object, so also give `fit: 'contain'` (section 1, lines 58-64).

### Config, checked against the installed types

`vite-plugin-pwa` 2.0.0 accepts a custom preset object inline. Its type is `preset?: false | BuiltInPreset | Preset;` and the comment says "If the `config` option is enabled, this option will be ignored." (`node_modules/vite-plugin-pwa/dist/index.d.ts`, `interface PWAAssetsOptions`). The plugin imports `Preset` from `'@vite-pwa/assets-generator/config'`.

`@vite-pwa/assets-generator` 2.0.0 defines (`dist/types-C8T6_f2P.d.mts`):

```ts
interface Asset {
  sizes: AssetSize[];
  padding?: number;
  resizeOptions?: ResizeOptions;   // sharp's ResizeOptions
  favicons?: Favicon[];
}
interface Assets extends Record<AssetType, Asset> { png?: PngOptions; assetName?: ...; appleSplashScreens?: ... }
interface Preset extends Assets {}
```

The package exports `minimal2023Preset` and the `Preset` type from `@vite-pwa/assets-generator/config` (`package.json` `exports["./config"]`). The repo already has `@vite-pwa/assets-generator` as a direct devDependency.

[MEASURED 2026-11-23] I ran the generator API (`instructions()` from `@vite-pwa/assets-generator/api/instructions`) in memory with the preset below and `public/icon.svg`. Results: `apple-touch-icon-180x180.png` and `maskable-icon-512x512.png` both had corner pixel `8,129,58,255` and 0 edge pixels that were not `#08813A`. The `<link rel="apple-touch-icon">` output was the same as before. I did not run the TypeScript compiler on the change.

The copy-ready code is in the **Recommendation** section.

### Other options

- A `pwa-assets.config.ts` file with `defineConfig` and `pwaAssets: { config: true }` does the same thing. The vite-pwa docs show this form ([CLI configurations](https://vite-pwa-org.netlify.app/assets-generator/cli.html#configurations)). The inline preset keeps the `TABLE` colour in one file, so it is the better choice here. [INFERENCE]
- Hand-made PNGs in `public/` also work, but then the SVG and the PNGs can differ after a change to the art. [INFERENCE]
- Keep the `transparent` (`any`) icons as they are. iOS ignores them while an `apple-touch-icon` exists (section 2), and Chrome uses them only if the maskable icon is bad (section 3). web.dev recommends: "designing `any` icons like your site's favicons, with transparent regions and no extra padding." ([web.dev, maskable icons](https://web.dev/articles/maskable-icon))

## 5. How the devices get the new icon

### iPhone

Delete the Home Screen icon, then add the app again from Safari. No Apple or WebKit source says when iOS reads the icon again, so this step is **unverified**. Two answers on one Stack Overflow question disagree. One says: "It needs to be removed and re-added to the home screen for the new icon to be used." A later answer says a changed icon URL makes iOS fetch the icon again ([Stack Overflow 4587882](https://stackoverflow.com/questions/4587882/is-it-possible-to-force-iphone-ipod-to-update-apple-touch-icon-once-webapp-is-ad)). The file name stays the same after this fix, so remove and add again.

WebKit says that some `<head>` values are read only at install: "web apps need this to be set 'on install'. The behavior does not change when the meta tag is added later on." ([WebKit bug 316008](https://bugs.webkit.org/show_bug.cgi?id=316008)) That bug is about the status bar, not the icon. It supports the same rule for the icon. [INFERENCE]

Before you add the app again, open the live URL in Safari and reload it once. The service worker precaches `png` files (`globPatterns` in `vite.config.ts`), so an old service worker can serve the old icon. [INFERENCE] The add sheet shows the icon tile before you tap **Add** ([OpenPWA](https://openpwa.net/lab/behaviour/home-screen-icon-selection/), step 6), so check the tile there.

### Android

Chrome updates the WebAPK when the manifest `icons` change: "If the manifest hasn't been checked in the last 24 hours, Chrome will schedule a network request for the manifest, then compare it against the local copy." The update starts "after all windows of the PWA have been closed, the device is plugged in, and connected to WiFi". For a fast test, `about://webapks` has an "Update" button. ([web.dev, How Chrome handles updates to the web app manifest](https://web.dev/articles/manifest-updates)) To uninstall and install again is also possible.

## 6. Checks on the devices after the fix

Deploy the fix first. Write down the exact iOS and Android versions.

**iPhone 12, iOS 26**

1. Delete the Pile Pals icon. Open https://matteoantoci.github.io/pile-pals/ in Safari and reload once.
2. Tap Share, then **Add to Home Screen**. The tile in the add sheet is green to the edges, with no white frame.
3. On the Home Screen, put Pile Pals next to Lingokids. The green fills the rounded shape. The card and the face are not cut.
4. Long-press the Home Screen, tap **Edit**, then **Customize**. Select **Dark**, **Clear**, and **Tinted** in turn. Write down how the icon looks in each mode (section 2, **unverified**).
5. Open the app from the new icon. Confirm the launch and the game still work.

**Android, Chrome**

1. On a computer, open the live URL in Chrome. In DevTools, open **Application**, then **Manifest**. Select "Show only the minimum safe area for maskable icons". The card and the face are fully visible ([Chrome DevTools, Progressive Web Apps](https://developer.chrome.com/docs/devtools/progressive-web-apps)).
2. On the phone, install the app from Chrome. If an old install exists, use `about://webapks` and **Update**, or uninstall and install again.
3. The launcher icon fills the launcher shape, with no white ring. If the launcher can change the icon shape, try a circle and a squircle.
4. If the phone has themed icons on, write down how the icon looks.
5. Open the app. The Android splash screen shows the icon on the green `background_color`.

## Recommendation

1. Change only the `pwaAssets` preset in `vite.config.ts`. Keep `public/icon.svg` and `index.html` as they are. The art stays inside the 40 % safe circle (37.6 % measured).
2. Set `padding: 0` and a green background for the `apple` and `maskable` icons. Keep the `transparent` icons as they are.
3. After the deploy, delete and add the iPhone icon again. Update or install the Android app again. Do the checks in section 6.

Copy-ready change for `vite.config.ts`:

```ts
import { minimal2023Preset, type Preset } from '@vite-pwa/assets-generator/config';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

// The top colour of the table. Keep the same value in index.html, scripts/shell/splash.py, and src/ui/styles.css.
const TABLE = '#08813A';

// public/icon.svg has a full-bleed green background, and its art stays inside the 40 % safe circle of a
// maskable icon. The preset defaults (padding 0.3 on white) put a white frame around the iOS and Android icons.
const fullBleed = { padding: 0, resizeOptions: { fit: 'contain', background: TABLE } } as const;
const iconPreset = {
  ...minimal2023Preset,
  maskable: { ...minimal2023Preset.maskable, ...fullBleed },
  apple: { ...minimal2023Preset.apple, ...fullBleed },
} satisfies Preset;

export default defineConfig({
  // ...
  plugins: [
    solid(),
    VitePWA({
      // ...
      pwaAssets: { image: 'public/icon.svg', preset: iconPreset },
      // ...
    }),
  ],
});
```

`as const` keeps `fit` as the literal type `'contain'`, which sharp's `ResizeOptions` needs. [INFERENCE from the types in section 4] After the change, run the type check and `pnpm build`. Then confirm that `dist/apple-touch-icon-180x180.png` and `dist/maskable-icon-512x512.png` have green corner pixels.

## Sources

- Apple, Configuring Web Applications (archived 2016): https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- Apple Human Interface Guidelines, App icons: https://developer.apple.com/design/human-interface-guidelines/app-icons
- Apple Developer Forums, iOS 18 PWA App Icons: Dark and Tinted: https://developer.apple.com/forums/thread/761615
- WebKit, Web Push for Web Apps on iOS and iPadOS: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- WebKit, WebKit Features in Safari 26.0: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- WebKit bug 255596, black border in the icon: https://bugs.webkit.org/show_bug.cgi?id=255596
- WebKit bug 316008, values read at install: https://bugs.webkit.org/show_bug.cgi?id=316008
- MDN browser-compat-data, manifests/webapp/icons: https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/icons.json
- W3C Web Application Manifest, purpose member: https://w3c.github.io/manifest/#purpose-member
- W3C Web Application Manifest, icon masks and safe zone: https://w3c.github.io/manifest/#icon-masks
- web.dev, Adaptive icon support in PWAs with maskable icons: https://web.dev/articles/maskable-icon
- web.dev, What does it take to be installable?: https://web.dev/articles/install-criteria
- web.dev, How Chrome handles updates to the web app manifest: https://web.dev/articles/manifest-updates
- Chrome DevTools, Progressive Web Apps: https://developer.chrome.com/docs/devtools/progressive-web-apps
- Android Developers, Adaptive icons: https://developer.android.com/develop/ui/views/launch/icon_design_adaptive
- Chromium, WebappsIconUtils.java: https://github.com/chromium/chromium/blob/main/components/webapps/browser/android/java/src/org/chromium/components/webapps/WebappsIconUtils.java
- Chromium, add_to_homescreen_data_fetcher.cc: https://github.com/chromium/chromium/blob/main/components/webapps/browser/android/add_to_homescreen_data_fetcher.cc
- Chromium, installable_params.h: https://github.com/chromium/chromium/blob/main/components/webapps/browser/installable/installable_params.h
- Chromium, installable_icon_fetcher.cc: https://github.com/chromium/chromium/blob/main/components/webapps/browser/installable/installable_icon_fetcher.cc
- Chromium, webapk.proto: https://github.com/chromium/chromium/blob/main/components/webapk/webapk.proto
- vite-plugin-pwa, Assets generator: https://vite-pwa-org.netlify.app/assets-generator/
- vite-plugin-pwa, Assets generator CLI configurations: https://vite-pwa-org.netlify.app/assets-generator/cli.html#configurations
- Installed package source: `node_modules/@vite-pwa/assets-generator/dist/` (`presets/minimal-2023.mjs`, `utils-WVxdTzUh.mjs`, `transparent-lM0a7r8e.mjs`, `instructions-resolver-DWK0ddGs.mjs`, `types-C8T6_f2P.d.mts`) and `node_modules/vite-plugin-pwa/dist/index.d.ts`, version 2.0.0
- Firtman, PWAs on iOS (third party): https://firt.dev/notes/pwa-ios/
- OpenPWA, Which icon iOS uses for a Home Screen web app (third party, iOS 18.6.2): https://openpwa.net/lab/behaviour/home-screen-icon-selection/
- Stack Overflow 4587882, apple-touch-icon update (third party): https://stackoverflow.com/questions/4587882/is-it-possible-to-force-iphone-ipod-to-update-apple-touch-icon-once-webapp-is-ad
