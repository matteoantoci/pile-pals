# Motion That Feels Native In A Home-Screen Web App On iPhone 12 (Safari 26)

## Question

The game is a picture version of Solitaire Associations for a 4–5-year-old. The child drags picture
cards from tableau columns onto category piles. There is no text and no speech, so motion and
sound carry all feedback: lift, magnet snap, spring landing, a soft shake-back on a wrong drop, a
3D card flip, a category "parade" exit, and confetti. Which animation techniques does WebKit on
iOS run smoothly, what do they cost, and what exact approach should the build use?

**Settled before this research, not re-argued here.** The drag itself is solved and approved on
the device: write the CSS `transform` directly inside `pointermove`, with `touch-action: none` and
`setPointerCapture()`, at 59 Hz with no `getCoalescedEvents()`
([web-input-latency.md](../../../smart-games/.scratch/minigame-collection/research/web-input-latency.md),
[19-drag-feel-gate.md](../../../smart-games/.scratch/minigame-collection/issues/19-drag-feel-gate.md)).
The gate's prototype kept the piece on its own layer with `will-change: transform` and
`transform: translate3d(0,0,0)` (`smart-games/prototypes/drag-feel-gate/index.html`, lines 78–79).
A library is rejected if it "takes ownership of the transform pipeline" of the dragged piece
([21-stack-policy.md](../../../smart-games/.scratch/minigame-collection/issues/21-stack-policy.md)).
No canvas framework moves the cards
([2d-game-frameworks.md](../../../smart-games/.scratch/minigame-collection/research/2d-game-frameworks.md)).
The open ticket on what moves and sounds at each moment is
[25-feedback-choreography.md](../../../smart-games/.scratch/minigame-collection/issues/25-feedback-choreography.md);
this file supplies its technical floor, not its taste calls.

**How the WebKit claims are sourced.** Safari 26.6 ships WebKit build `20624.4.5` ("Released July
27, 2026 — 26.6 (20624.4.5)",
[Safari 26.6 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-26_6-release-notes)).
WebKit's public branch for that build is `safari-7624.4.5-branch`, and the code quotes below come
from that branch, so they describe what the phone runs rather than WebKit trunk. Where a quote is a
line of code, the "sentence" quoted is that line.

---

## 1. Which animations run off the main thread in Safari 26

### The accelerated property list

WebKit marks each CSS property that it can animate on the compositor. In the Safari 26.6 branch
exactly seven properties carry `"animation-wrapper-acceleration": "always"`: `opacity`, `filter`,
`backdrop-filter`, `transform`, `translate`, `scale` and `rotate`. The `offset-*` (motion path)
properties carry `"threaded-only"`. For example, the `opacity` entry:

> `"animation-wrapper-acceleration": "always",`

— [CSSProperties.json, `opacity`, Safari 26.6 branch, L7015–L7022](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/css/CSSProperties.json#L7015-L7022)
(same key on `filter` L10131, `transform` L11988, `translate` L12136, `scale` L12157, `rotate` L12179).
`box-shadow` (L3937), `width`, `height`, `left`, `top`, `border-radius`, `background-color` and
`clip-path` carry no such key, so animating them is never accelerated.

The `threaded-only` value only counts when one of two settings is on:

> `return "settings.threadedScrollDrivenAnimationsEnabled() || settings.threadedTimeBasedAnimationsEnabled()"`

— [process-css-properties.py](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/css/scripts/process-css-properties.py)
(`_property_is_accelerated_return_clause`).

### Safari 26 uses the older Core Animation path, not "threaded animations"

WebKit is building a new engine that resolves animations on a separate thread. It is **off** in
Safari 26:

> `ThreadedTimeBasedAnimationsEnabled:` … `status: unstable` … `default: false`

— [UnifiedWebPreferences.yaml, Safari 26.6 branch, L8340–L8353](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml#L8340-L8353).
The same file defines the status: "Feature in active development. Unfinished, no promise it is
usable or safe. OFF by default." (same file, L28–L30). It is still off in the Safari 27 branch
(`status: preview`, `default: false`,
[L8557–L8570](https://github.com/WebKit/WebKit/blob/safari-7625.1.29.10-branch/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml#L8557-L8570)),
where `preview` means "OFF by default elsewhere" outside Safari Technology Preview. So every
conclusion below holds whether the phone stays on iOS 26 or moves to iOS 27.

On this older path, WebKit hands qualifying animations to Core Animation. Apple describes what
that buys: "During the course of an animation, Core Animation does all of the frame-by-frame
drawing for you in hardware." ([Core Animation Basics](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/CoreAnimationBasics/CoreAnimationBasics.html))
and "This automatic graphics acceleration results in high frame rates and smooth animations
without burdening the CPU and slowing down your app."
([Core Animation Programming Guide, About](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/Introduction/Introduction.html)).
An accelerated animation therefore keeps moving even when JavaScript is busy.

### WAAPI uses the same gate as CSS animations

`element.animate()` builds the same object that CSS animations use:

> `auto keyframeEffectResult = KeyframeEffect::create(lexicalGlobalObject, document, this, WTF::move(keyframes), WTF::move(keyframeEffectOptions));`

— [Element.cpp, Safari 26.6 branch, L6149](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/dom/Element.cpp#L6149)

So **yes: `element.animate()` on `transform` or `opacity` is eligible for Core Animation in
Safari 26**, under exactly the same rules as a CSS `@keyframes` animation. Those rules are in
`KeyframeEffect::canBeAccelerated()`
([KeyframeEffect.cpp, Safari 26.6 branch, L1930–L1976](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/animation/KeyframeEffect.cpp#L1930-L1976)).
Each line below is a condition that sends the animation back to the main thread:

| What breaks acceleration | Code line (Safari 26.6) |
|---|---|
| No accelerated property animated (e.g. `width`, `box-shadow`) | `if (m_acceleratedPropertiesState == AcceleratedProperties::None) return false;` (L1935–1936) |
| An `!important` or cascade value overrides the animated property | `if (m_hasAcceleratedPropertyOverriddenByCascadeProperty) return false;` (L1938–1939) |
| `filter: url(#svg-filter)` | `if (m_hasReferenceFilter) return false;` (L1941–1942) |
| Size and a size-dependent transform (e.g. `%` translate) animate together | `if (m_animatesSizeAndSizeDependentTransform) return false;` (L1944–1945) |
| Keyframes whose transform lists cannot interpolate | `if (m_blendingKeyframes.hasDiscreteTransformInterval()) return false;` (L1947–1948) |
| Animation driven by a scroll timeline | `if (m_isAssociatedWithProgressBasedTimeline) return false;` (L1960–1961) |
| `steps()` easing | `if (m_someKeyframesUseStepsTimingFunction \|\| is<StepsTimingFunction>(timingFunction())) return false;` (L1963–1964) |
| **`linear(…)` easing with points** | `if (m_someKeyframesUseLinearTimingFunctionWithPoints \|\| isLinearTimingFunctionWithPoints(timingFunction())) return false;` (L1966–1967) |
| `composite: 'add'` or `'accumulate'` | `if (m_compositeOperation != CompositeOperation::Replace) return false;` (L1969–1970) |
| A motion path (`offset-path`) on the element | "We cannot run accelerated transform animations if a motion path is applied" (L1994) |

`linear` *as a keyword* has no points, so it stays accelerated: the helper only matches
"`linearTimingFunction && !linearTimingFunction->points().isEmpty()`"
([L1738–L1742](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/animation/KeyframeEffect.cpp#L1738-L1742)).
The conversion to Core Animation handles only cubic Béziers and the plain linear keyword
([PlatformCAAnimationCocoa.mm, L130–L151](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/platform/graphics/ca/cocoa/PlatformCAAnimationCocoa.mm#L130-L151)).

### Filters and shadows

`filter` is on the list, but shadows are carved out:

> `// FIXME: We can't currently hardware animate shadows.`

— [GraphicsLayerCA.cpp, Safari 26.6 branch, L3954–L3960](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/platform/graphics/ca/GraphicsLayerCA.cpp#L3954-L3960),
followed by "Make sure the platform layer didn't fallback to using software filter compositing
instead." So `filter: drop-shadow()` and `box-shadow` both animate on the main thread with a
repaint every frame. The smart-games art work already banned SVG filters for a WebKit rendering
failure ([05-art-direction.md](../../../smart-games/.scratch/minigame-collection/issues/05-art-direction.md));
this is a second, separate reason to keep filters out of anything that moves.

### Mixing properties in one animation

> `// If any animated property can be accelerated, then the animation should run accelerated.`

— [KeyframeEffect.cpp, Safari 26.6 branch, L1720](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/animation/KeyframeEffect.cpp#L1720)

**[INFERENCE]** An animation that mixes `transform` with, say, `background-color` splits: part on
Core Animation, part on the main thread. Keep each animation to accelerated properties only.

### Recent Safari 26 fixes that shape the rules

- "Fixed a regression where animating to an implicit value for individual transform properties
  failed to animate." — [Safari 26.5 notes](https://developer.apple.com/documentation/safari-release-notes/safari-26_5-release-notes).
  Give every keyframe animation an explicit first **and** last keyframe.
- "Fixed incorrect overlap calculations for transform animations including `translate`, `scale`,
  and `rotate` properties." — [Safari 26.4 notes](https://developer.apple.com/documentation/safari-release-notes/safari-26_4-release-notes).
- "Fixed an issue where identity matrix decomposition generated invalid quaternions, resulting in
  incorrect transform animations." — fixed only in [Safari 27](https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes),
  so present on iOS 26. **[INFERENCE]** Keep the same list of transform functions in every
  keyframe (e.g. always `translate(…) rotateY(…) scale(…)`), so WebKit interpolates function by
  function and never decomposes a matrix.
- **iOS 26 bug, not fixed in a release:** "When an element has both a `transition: transform` and a
  `transform` keyframe animation that are started together, at some point the animated element has
  an instantaneous jumps backward to an earlier position." Observed on "iOS 26.5.2". The WebKit
  engineer's answer: "This is fixed by the Threaded Time-based Animations flag which is on by
  default in Safari Technology Preview." — [WebKit bug 318849](https://bugs.webkit.org/show_bug.cgi?id=318849).
  That flag is off in Safari 26 and 27 (above). **Never put a CSS `transition` on `transform` of an
  element that WAAPI also animates.**

---

## 2. Spring motion: `linear()`, Motion, and handing finger velocity to a spring

### `linear()` is supported, but it is not accelerated in Safari 26

"Safari 17.2 adds support for the linear() function in CSS animations and transitions."
([WebKit Features in Safari 17.2](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)).
BCD agrees: `css.types.easing-function.linear-function` → `safari_ios` `"version_added": "17.2"`
([mdn/browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/css/types/easing-function.json)).
The spec shows it can draw a bounce: "For example, here’s how linear() could be used to create a
reusable "bounce" easing function" ([CSS Easing 2](https://drafts.csswg.org/css-easing-2/)).

But on the Core Animation path a `linear()` curve with points is refused (table above, L1966–1967).
WebKit's own engineer explained why when he filed it:

> "CoreAnimation doesn’t have any native equivalent to linear() so we’ll have to either find
> something that matches and add code to translate to the CA-native primitive or expand
> KeyframeEffect::canBeAccelerated() to do something similar to what we do with steps(). I argue for
> the latter because with the work for threaded animation resolution support for linear() will be
> free"

— [WebKit bug 260136](https://bugs.webkit.org/show_bug.cgi?id=260136) (RESOLVED FIXED, 269594@main)

So a CSS or WAAPI spring written as `linear(…)` **works** in Safari 26 but runs on the main thread.
That is acceptable while the main thread is idle and risky when it is not (confetti on the main
thread, a Solid update, audio scheduling).

### A spring that *is* accelerated: sampled keyframes with `easing: 'linear'`

**[INFERENCE from the code above]** Core Animation accepts many keyframes with the plain `linear`
keyword. A spring can therefore be pre-computed into one keyframe per 60 Hz frame
(`translate(x px, y px)` at each step) and played with `easing: 'linear'`. None of the conditions
in the table fires, so the spring should run on Core Animation. This also gives true overshoot and
any initial velocity, in two dimensions. Whether it really stays on Core Animation must be checked
on the phone (see the last section). Motion samples too ("Otherwise it has as few sampled keyframes
as keep it accurate", quoted below), but its transform path writes easings it cannot express
natively as `"linear(" + points + ")"`
([TransformAnimation.ts @ v14.11.1, L154–L174 and L914](https://github.com/motiondivision/motion/blob/v14.11.1/packages/motion-dom/src/animation/waapi/transforms/TransformAnimation.ts#L154-L174))
and only groups transforms at all where `linear()` exists: "Browsers without linear() easing stay
on the main thread." (L213–L214).

### What a "spring" means, in numbers Apple publishes

Apple's `Spring` type converts between "duration and bounce" and physics:

> `let spring = Spring(duration: 0.5, bounce: 0.3)` … `// (1.0, 157.9, 17.6)`

— [SwiftUI `Spring`](https://developer.apple.com/documentation/swiftui/spring) (mass, stiffness,
damping). Its initializer documents the defaults: `init(duration: TimeInterval = 0.5, bounce:
Double = 0.0)`, and "A value of 0 indicates no bounces (a critically damped spring), positive values
indicate increasing amounts of bounciness up to a maximum of 1.0"
([`init(duration:bounce:)`](https://developer.apple.com/documentation/swiftui/spring/init(duration:bounce:))).

The mapping stiffness = (2π / duration)², damping = 4π(1 − bounce) / duration, mass = 1, damping
ratio ζ = 1 − bounce reproduces both of Apple's printed examples: (2π/0.5)² = 157.9 and
4π·0.7/0.5 = 17.6; and for `Spring(mass: 1, stiffness: 100, damping: 10)` it gives duration
2π/10 = 0.63 and bounce 1 − 10·0.63/(4π) = 0.5, matching Apple's `// (0.63, 0.5)`. **The formula is
my derivation, checked against Apple's numbers; Apple does not print it.**

### Handing release velocity to the spring

Apple's rule for UIKit springs: "For smooth start to the animation, match this value to the view’s
velocity as it was prior to attachment." and "A value of 1 corresponds to the total animation
distance traversed in one second. For example, if the total animation distance is 200 points and
you want the start of the animation to match a view velocity of 100 pt/s, use a value of 0.5."
([`UIView.animate(…usingSpringWithDamping:initialSpringVelocity:…)`](https://developer.apple.com/documentation/uikit/uiview/animate(withduration:delay:usingspringwithdamping:initialspringvelocity:options:animations:completion:))).

On the web this means: measure the finger's velocity at `pointerup`, then start the spring at the
release point with that velocity. Solving the spring per axis in pixels and seconds needs no
normalisation. The closed form of a damped spring, mass 1, displaced by `x0 = from − to` with
initial velocity `v0`, is standard physics (no source needed); the code is in Recommendations.

### The Motion library (`motion` on npm, v14.11.1 is `latest`)

**Does it use WAAPI?** Yes: "Because Motion is built on WAAPI, it can also run hardware accelerated
animations." ([motion.dev/docs/performance](https://motion.dev/docs/performance)). Its list of
values it sends to WAAPI is `"opacity"`, `"clipPath"`, `"filter"`, `"transform"`
([accelerated-values.ts @ v14.11.1, L8–L13](https://github.com/motiondivision/motion/blob/v14.11.1/packages/motion-dom/src/animation/waapi/utils/accelerated-values.ts#L8-L13)).
Its own docs warn: "Even when animating supposedly performant styles, each browser has different
rules for when an animation does or doesn't receive acceleration." and "Animating a CSS variable
isn't hardware accelerated, even when the variable is applied to `transform`."
([motion.dev/docs/performance](https://motion.dev/docs/performance)).

**Are its springs accelerated in Safari 26?** Motion turns a spring into `linear()` when the
browser supports it: `if (isGenerator(type) && supportsLinearEasing()) { return
type.applyToOptions!(options) }`
([apply-generator.ts](https://github.com/motiondivision/motion/blob/v14.11.1/packages/motion-dom/src/animation/waapi/utils/apply-generator.ts)),
and its spring's `toString()` emits `generateLinearEasing(…)`
([spring.ts @ v14.11.1, L496–L510](https://github.com/motiondivision/motion/blob/v14.11.1/packages/motion-dom/src/animation/generators/spring.ts#L496-L510)).
**[INFERENCE]** Combined with WebKit refusing `linear()` with points (section above), Motion's
springs in Safari 26 run as WAAPI animations that WebKit resolves on the main thread. Motion calls
them "accelerated"; WebKit does not put them on Core Animation.

**Does it own a rAF loop?** Yes, for anything it runs in JavaScript: "`frame` is used to schedule a
function to run on Motion's animation loop." ([motion.dev/docs/frame](https://motion.dev/docs/frame)).
For independent transforms (`x`, `y`, `scale`) it composes one WAAPI animation, and then "The
animations stay JSAnimations, but their driver doesn't tick, so they do no work per frame."
([TransformAnimation.ts @ v14.11.1, L41–L58](https://github.com/motiondivision/motion/blob/v14.11.1/packages/motion-dom/src/animation/waapi/transforms/TransformAnimation.ts#L41-L58)).

**Does it interfere with a drag that writes `transform` in `pointermove`?** On the same element,
yes, by design. It writes the inline transform itself:

> `element.style.transform = toTransform(values, true)`

— [TransformAnimation.ts @ v14.11.1, L734](https://github.com/motiondivision/motion/blob/v14.11.1/packages/motion-dom/src/animation/waapi/transforms/TransformAnimation.ts#L734)

and it treats anyone else's writes as a reason to leave WAAPI: "If one of them can't be
accelerated, or something else keeps writing the element's transform, the whole group moves to the
main thread." (L57–L58), and "An outside write. Rebuild once, but if it keeps happening, move to the
main thread." (L1522–L1523). That is the "owns the transform pipeline" case the stack policy
rejects. On a *different* element (an inner wrapper, a confetti piece) it does not touch pointer
input at all.

**Does it keep release velocity?** Only for physics springs: "Physics-based spring animations are
set via `stiffness`, `damping` and `mass`, and these incorporate the velocity of any existing
gestures or animations for natural feedback." and "Duration-based spring animations are set via a
`duration` and `bounce`. These don't incorporate velocity but are easier to understand."
([motion.dev/docs/animate](https://motion.dev/docs/animate)). The source says why: "Time-defined
springs ignore inherited velocity. Velocity from interrupted animations causes massive oscillation
on small-range animations." ([spring.ts @ v14.11.1, L306–L311](https://github.com/motiondivision/motion/blob/v14.11.1/packages/motion-dom/src/animation/generators/spring.ts#L306-L311)).
Motion would also not know where the drag left the card, because the drag wrote `transform`
outside it; the start keyframe would have to be passed by hand.

### Why a running animation silently beats the drag's inline write

CSS Cascade 5 lists origins "in descending order", and "Animation declarations [css-animations-1]"
come above "Normal author declarations" ([CSS Cascade 5](https://drafts.csswg.org/css-cascade-5/)).
Inline `style.transform` is a normal author declaration. **So if a WAAPI animation (or a
`fill: 'forwards'` leftover) is still attached to the dragged element, the drag's writes are
ignored until it is cancelled.** Cancel first, then write.

---

## 3. Layer cost, `will-change`, and blur when a layer scales up

### What gives an element its own layer in WebKit

In Safari 26 a 2D `translate()` alone does **not** make a layer; only 3D transforms do:

> `case CompositingPolicy::Normal: return styleHas3DTransformOperation(renderer.style());`

— [RenderLayerCompositor.cpp, Safari 26.6 branch, L3858–L3886](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/rendering/RenderLayerCompositor.cpp#L3858-L3886)

Other reasons, from `requiresCompositingLayer()` (same file, L3263–L3291): a running
transform/opacity/filter animation (`requiresCompositingForAnimation`, L3813–L3835), `will-change`
(L3977–L3997), and `backface-visibility: hidden` (`requiresCompositingForBackfaceVisibility`,
L3889+). Elements drawn *above* a layer and overlapping it may also get layers: "If we're testing
for overlap, we only need to composite if we overlap something that is already composited."
(L1325), and during a transform animation WebKit may stop testing: "Turn overlap testing off for
later layers if it's already off, or if we have an animating transform." (L187).

### Under memory pressure, `will-change` stops working

WebKit switches to a "Conservative" policy when memory is tight:

> `m_compositingPolicy = cachedMemoryPolicy == WTF::MemoryUsagePolicy::Unrestricted ? CompositingPolicy::Normal : CompositingPolicy::Conservative;`

([L721–L734](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/rendering/RenderLayerCompositor.cpp#L721-L734))
and in that mode `will-change` no longer creates a layer on iPhone:

> `// Ugly workaround for rdar://71881767. Undo when webkit.org/b/222092 and webkit.org/b/222132 are fixed.`
> `if (m_compositingPolicy == CompositingPolicy::Conservative) return false;`

([L3988–L3992](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/rendering/RenderLayerCompositor.cpp#L3988-L3992),
inside `#if !PLATFORM(MAC)`). Running animations still get layers. So `will-change` is a speed hint,
never a correctness requirement.

### Memory per layer, and WebKit's warning

WebKit's estimate for one layer's bitmap:

> `return layer->backingStoreBytesPerPixel() * size().width() * layer->contentsScale() * size().height() * layer->contentsScale();`

— [GraphicsLayerCA.cpp, Safari 26.6 branch, `backingStoreMemoryEstimate`, L5288–L5303](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/platform/graphics/ca/GraphicsLayerCA.cpp#L5288-L5303)

Another comment in the same file implies wide-colour surfaces on 3x screens: "On a 3x display with
RGB10A8 surfaces, this is about 12 tiles." (L114). **Worked example, assuming a card laid out at
100 × 140 CSS px:** 300 × 420 device pixels × 4–5 bytes ≈ 0.5–0.6 MB per card, so 30 always-layered
cards ≈ 15–18 MB. The card size is an assumption and the byte count per pixel is inferred from that
comment; **measure the real figure in Web Inspector** (below).

WebKit's guidance: "But the trade-off for these computational savings is memory cost. Creating too
many layers (intentionally or otherwise) can have disastrous results on memory-constrained
devices." The Layers tab shows "a cumulative paint count and the memory cost" per layer
([Web Inspector Layers Tab](https://webkit.org/web-inspector/layers-tab/)). MDN adds: "Don't apply
will-change to too many elements" and "Some of the stronger optimizations that are likely to be
tied to will-change end up using a lot of a machine's resources."
([MDN `will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change)).
Neither source gives a safe number; 20–30 card layers is a bounded count, but only the Layers tab on
the device can say what it costs.

### Blur when a layer scales above 1×

A layer's bitmap is drawn at page scale × screen scale, not at the transform's scale:

> `float contentsScale = pageScaleFactor * deviceScaleFactor() * m_contentsScaleLimitingFactor;`

— [GraphicsLayerCA.cpp, Safari 26.6 branch, L4409–L4411](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/platform/graphics/ca/GraphicsLayerCA.cpp#L4409-L4411)

The code that would raise it for a scaled layer is switched off: "For now we disable this logic
alltogether, but allow to turn it on selectively (for LBSE)" then
`if (!m_shouldUpdateRootRelativeScaleFactor) return;` (L4378–L4384), and it is only switched on for
the new SVG engine (`layerBasedSVGEngineEnabled()`,
[RenderLayerBacking.cpp L435–L436](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebCore/rendering/RenderLayerBacking.cpp#L435-L436)),
which is `status: unstable`, `default: false` in Safari 26.6 (UnifiedWebPreferences.yaml L4521–L4533).

The open WebKit bug says the same from the outside: "Then the original (smaller) rendering is used
during the transition. That causes it to appear pixelated as it scales up." Its newest comment
(2026-10-28) gives the workaround: "Here is a simple way to approximate that idea in CSS, by using a
larger `font-size` and scaling down to the initial size, rather than scaling up a smaller
rendering." — [WebKit bug 27684](https://bugs.webkit.org/show_bug.cgi?id=27684) (status ASSIGNED).

**So yes: lay each card out at its largest on-screen size (the lifted size) and scale it *down* at
rest.** One caveat: Apple has a "Dynamic Content Scaling" path that re-renders layers at any scale,
but the public source only shows it enabled for visionOS ("visionOS: Enable Dynamic Content Scaling
for GPU process DOM rendering", [WebKit PR 21492](https://github.com/WebKit/WebKit/pull/21492)).
Whether iPhone uses it is **unverified**; look at the phone.

### 20 to 30 cards

Nothing in the sources forbids 30 layers; the risks are memory (above) and extra overlap layers.
**[INFERENCE from L187 and L1325]** A dragged or animating card painted *under* other cards forces
the overlapping cards above it onto layers too. Raising the dragged card's `z-index` to the top of
its stacking context at `pointerdown` keeps it last in paint order, so nothing above it needs a
layer. Columns must therefore not create their own stacking contexts (no `transform`, `opacity < 1`,
`z-index` or `will-change` on the column elements).

---

## 4. Image sprites: decoding, preloading, raster vs SVG

### `decode()` prevents the first-frame hitch

The HTML standard: "This latter form avoids the dropped frames of the original, by allowing the
user agent to decode the image in parallel, and only inserting it into the DOM (and thus causing it
to be painted) once the decoding process is complete."
([HTML, `img.decode()`](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-img-decode)).
MDN: "This, in turn, prevents the rendering of the next frame after adding the image to the DOM from
causing a delay while the image loads."
([MDN `HTMLImageElement.decode()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)).
Safari has it since iOS 11.3 (BCD `api.HTMLImageElement.decode` → `safari_ios` `"11.3"`,
[mdn/browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLImageElement.json)).

**A Safari 26 defect to design around:** "Fixed `HTMLImageElement.decode()` to no longer resolve
spuriously after adoption, `src` change, or cached-image reuse." — fixed only in
[Safari 27](https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes).
On iOS 26, `decode()` on an image whose URL was already cached may resolve before decoding is
done. Decode each sprite URL **once**, on a fresh `Image`, at level start, and never change an
`<img>`'s `src` mid-animation.

### SVG gains nothing from `decode()`

The standard resolves the promise at once for vector images: "If decoding does not need to be
performed for this image (for example because it is a vector graphic) or the decoding process
completes successfully, then queue a global task … to resolve promise with undefined."
([HTML](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-img-decode)).
**[INFERENCE]** An SVG sprite (inline or `<img src=*.svg>`) pays its cost when it is first
*painted*, so `decode()` cannot pre-pay it.

### Raster vs SVG when the card moves

While a layer only moves, scales or fades, its contents are not redrawn: "If the DOM node has its
own layer, however, it may be possible to skip repainting entirely and instead simply recomposite
the layers on screen." ([Layers Tab](https://webkit.org/web-inspector/layers-tab/)). Core Animation
works by "caching the contents of views into bitmaps that can be manipulated directly by the
graphics hardware." ([Core Animation Basics](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/CoreAnimation_guide/CoreAnimationBasics/CoreAnimationBasics.html)).
So during transform/opacity animation **PNG/WebP and SVG cost the same**: one cached bitmap per
layer. They differ only when the layer is (re)painted: first appearance, a content change (e.g.
changing an SVG `fill`), or a layer resize. SVG paints by running its paths; a raster sprite is a
scaled image draw after a one-time decode.

On iOS the layer tree is the "remote" one (`RemoteLayerTreeDrawingAreaProxyIOS::create`,
[WKContentView.mm L896–L899](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebKit/UIProcess/ios/WKContentView.mm#L896-L899)),
and it declines to hand an `<img>` straight to Core Animation:
`bool shouldDirectlyCompositeImage(WebCore::Image*) const override { return false; }`
([GraphicsLayerCARemote.h L72](https://github.com/WebKit/WebKit/blob/safari-7624.4.5-branch/Source/WebKit/WebProcess/WebPage/RemoteLayerTree/GraphicsLayerCARemote.h#L72)).
**[INFERENCE]** A composited raster card therefore holds the decoded image *and* a layer bitmap.
At 30 small cards this is a few megabytes, not a reason to choose SVG.

**Size rule (follows from section 3):** export raster sprites at 3 × the largest CSS size they are
laid out at, which is the lifted size. Smaller blurs on the 3x screen; larger only wastes decode
memory. The choice of art format itself belongs to the asset research, not here.

---

## 5. The 3D card flip and squash-and-stretch

### Support

`backface-visibility` is unprefixed since iOS 15.4 and `perspective` was fixed in iOS 14 (BCD:
"In iOS 13, the `perspective` property did not function properly. The issues were fixed in iOS
14.", [mdn/browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/perspective.json)).
The flip is a transform, so it is on the accelerated list.

### Known WebKit bugs that bite a flip card

- **Open, 2026:** "A painted element inside a `border-radius` + `overflow: hidden` box, inside a
  `transform-style: preserve-3d` subtree whose plane has `backface-visibility: hidden`, composites as
  a solid black square at certain page zoom levels." — [WebKit bug 322397](https://bugs.webkit.org/show_bug.cgi?id=322397)
  (NEW). Rounded, clipped cards are exactly that shape.
- **Open:** "If an element has a `transform: rotateX()` or `rotateY()` with more than 180deg (or
  .5turn) of rotation and either an opacity or translate, the transition or animation does not work
  in Safari 16.5 -> TP." — [WebKit bug 260281](https://bugs.webkit.org/show_bug.cgi?id=260281) (NEW).
- **Open:** "Elements with perspective and transform-style: preserve-3d render correctly on screen,
  but any WebKit snapshot flattens the 3D transforms." and "this also affects view transitions,
  since they rely on snapshots." — [WebKit bug 302166](https://bugs.webkit.org/show_bug.cgi?id=302166) (NEW).
- **Old, open:** "When three or more 3D transformed elements with the -webkit-transform-style
  property set to preserve-3d are nested inside one another, webkit seems to get confused about
  their z-ordering." — [WebKit bug 71624](https://bugs.webkit.org/show_bug.cgi?id=71624) (NEW).
- `backface-visibility: hidden` forces a layer per face (section 3), so the classic
  two-face card doubles the layer count for every face-down card.

### A flip that avoids all four bugs

**[INFERENCE from the bugs above]** Do not use `preserve-3d` or `backface-visibility` at all. Flip
one element in two halves: rotate `perspective(600px) rotateY(0deg)` → `rotateY(90deg)` (the card is
edge-on and invisible), swap the picture, then `rotateY(-90deg)` → `rotateY(0deg)`. Each half stays
inside ±90°, uses no opacity on the same element, needs no backface, and has no nested 3D context.
The `perspective()` function inside `transform` gives the 3D look without a 3D rendering context.
The swap happens at an edge-on frame, so a one-frame gap between the two animations is not visible
(**unverified on device**).

### Squash and stretch

`scale(sx, sy)` is an accelerated transform. Two rules from above apply: never scale a layer above 1
(blur), and keep the same function list in each keyframe. With the card laid out at its lifted size
and resting at `scale(0.926)`, a landing squash can go from the lifted `scale(1, 1)` through a wide,
short `scale(0.982, 0.870)` to rest, so no axis ever passes 1.

---

## 6. Confetti on a `<canvas>` while the cards animate

### `canvas-confetti` 1.9.4 (ISC, latest)

It uses a worker with OffscreenCanvas when the page has every piece it needs:

> `var canUseWorker = !!( global.Worker && global.Blob && global.Promise && global.OffscreenCanvas && global.OffscreenCanvasRenderingContext2D && global.HTMLCanvasElement && global.HTMLCanvasElement.prototype.transferControlToOffscreen && global.URL && global.URL.createObjectURL);`

— [confetti.js L4–L13](https://github.com/catdad/canvas-confetti/blob/20eebad51dde793070c373d594099a7ed8d96e22/src/confetti.js#L4-L13)

Safari has those since 16.4: "In Safari 16.4 we’ve added Offscreen Canvas support for 2D
operations." ([WebKit Features in Safari 16.4](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/));
BCD `api.HTMLCanvasElement.transferControlToOffscreen` and `api.OffscreenCanvasRenderingContext2D`
→ `safari_ios` `"16.4"` ([mdn/browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLCanvasElement.json)).
**[INFERENCE]** So on Safari 26, `useWorker: true` takes the worker path.

The README: "`useWorker` _Boolean (default: false)_: Whether to use an asynchronous web worker to
render the confetti animation, whenever possible. This is turned off by default, meaning that the
animation will always execute on the main thread." and "If you use `useWorker: true`, I own your
canvas now." ([README](https://github.com/catdad/canvas-confetti/blob/master/README.md)).
The default `confetti()` export already uses it:
`defaultFire = confettiCannon(null, { useWorker: true, resize: true });`
([L722](https://github.com/catdad/canvas-confetti/blob/20eebad51dde793070c373d594099a7ed8d96e22/src/confetti.js#L722)).
Its own canvas never blocks taps: `canvas.style.position = 'fixed';` …
`canvas.style.pointerEvents = 'none';` (L319–L323).

### Cost

- Frame rate: its loop throttles to 60 Hz, `var TIME = Math.floor(1000 / 60);` (L83), which
  matches the iPhone 12 panel.
- Bitmap size: with `resize: true` it sizes the canvas in CSS pixels, not device pixels:
  `canvas.width = document.documentElement.clientWidth;`
  `canvas.height = document.documentElement.clientHeight;` (L306–L307). **[INFERENCE]** On a
  390 × 797 viewport that is a ~1.2 MB bitmap, upscaled 3 × by the compositor: soft-edged confetti,
  but a tenth of the memory and fill work of a device-pixel canvas.
- Defaults: `particleCount: 50`, `ticks: 200` (L225–L232); about 3.3 s at 60 Hz.
- Main-thread effect: in worker mode the drawing leaves the main thread, so main-thread-resolved
  card animations (any `linear()` spring) do not compete with it. Core Animation card animations
  never compete with it anyway. Whether the GPU keeps 60 Hz with a full-screen canvas plus moving
  card layers is **not settled by any source**; measure it.
- A Safari 26.0 fix that matters if confetti overlaps a screen change: "Fixed an issue causing a
  `<canvas>` element to disappear for one frame if a view transition occurs."
  ([Safari 26.0 notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes)).

---

## 7. View Transitions between screens (start → level → reward)

### Support in Safari 26

"WebKit added support for the View Transitions API in Safari 18."
([WebKit Features in Safari 18.0](https://webkit.org/blog/15865/webkit-features-in-safari-18-0/)).
BCD: `api.Document.startViewTransition` → `safari_ios` `"18"`; its options object
(`types`) and `view-transition-class` → `"18.2"`
([mdn/browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/Document.json)).
Safari 26.2 added "support for `document.activeViewTransition` to expose the current active view
transition." and fixed "flickering of elements with slow-painting content during view transitions."
([Safari 26.2 notes](https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes)).

Still broken on iOS 26, fixed only in Safari 27: "Fixed an issue where view transition snapshots
could capture stale transform values for accelerated CSS transform animations." and "Fixed
inserting a CSS rule while a view transition is active causing the group animation to snap to its
final state." ([Safari 27 notes](https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes)).
Plus the `preserve-3d` snapshot bug in section 5. **Start a view transition only after card
animations have finished.**

### Does it block input? Yes, by specification

- While the update callback runs: "While a Document’s rendering suppression for view transitions
  is true, all pointer hit testing must target its document element, ignoring all other elements."
  with the note "This does not affect pointers that are captured."
- While animating: "When a Document’s active view transition’s phase is "animating", the boxes
  generated by any element in that Document with captured in a view transition and its element
  contents, except transition root pseudo-element’s inclusive descendants, are not painted (as if
  they had opacity: 0) and do not respond to hit-testing (as if they had pointer-events: none)."
- The root is captured by default: `:root { view-transition-name: root; }`, and the default length
  is `animation-duration: 0.25s;` (UA stylesheet).
- `finished` is "A promise that fulfills once the end state is fully visible and interactive to the
  user."

— all from [CSS View Transitions 1](https://drafts.csswg.org/css-view-transitions-1/).
**[INFERENCE]** Because the root is captured, taps on the page go to `<html>` for the whole
transition, and a card being held with pointer capture keeps its events. Chrome's guide gives the
practical rule: "network fetches should be done before calling .startViewTransition(), while the
page is still fully interactive, rather than doing them as part of the .startViewTransition()
callback." ([Chrome: same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)).
Whether Safari 26 matches the spec here is **to be checked on the phone**.

### The update reload gets no View Transition

When an app update waits, the "next" tap on the reward screen calls `updateSW(true)`, and the page
reloads (see `shell.md` §4). A same-document View Transition cannot run across a page reload, so
this one screen change shows the startup colour and then the next level, with no animation
**[INFERENCE]**. Do not try to animate across this reload. Every other screen change uses the
normal View Transition.

---

## 8. `prefers-reduced-motion`

WebKit's guidance: "If your site uses a vestibular trigger animation to convey some essential
meaning to the user, removing the animation entirely may make the interface confusing or unusable."
and "If you determine a specific animation is likely to be a vestibular trigger, consider serving
an alternate, simpler animation, or display another visual indicator to convey the intended
meaning." ([Responsive Design for Motion](https://webkit.org/blog/7551/responsive-design-for-motion/)).
Also: "Use a prefers-reduced-motion media query to determine whether to modify or stop motion
triggers like parallax effects, dimensionality, or depth simulations like zooming/scaling."
([WebKit blog, cross-document view transitions](https://webkit.org/blog/16967/two-lines-of-cross-document-view-transitions-code-you-can-use-on-every-website-today/)).
canvas-confetti has a switch: "`disableForReducedMotion` _Boolean (default: false)_: Disables
confetti entirely for users that prefer reduced motion" ([README](https://github.com/catdad/canvas-confetti/blob/master/README.md)).

**Recommendation (one sentence):** read `matchMedia('(prefers-reduced-motion: reduce)')` at start
and on `change`, and when it matches keep every cue and every sound but swap travel for fades — the
card still follows the finger, the landing spring becomes a 120 ms ease-out with bounce 0, the
flip becomes a 150 ms opacity cross-fade, the parade becomes a 300 ms fade-out in place, confetti is
skipped (`disableForReducedMotion: true`), and screen changes become the default cross-fade —
because in a game with no text, removing motion would remove meaning.

---

## Recommendations

### The animation approach: WAAPI (`element.animate()`), used directly, for everything that is not the live drag

Not CSS transitions, and not Motion. Reasons:

1. **Same accelerated engine as CSS.** `element.animate()` builds the same `KeyframeEffect` as CSS
   animations (Element.cpp L6149), so transform/opacity animations reach Core Animation in
   Safari 26 under the same rules.
2. **Control the drag needs.** A drag must cancel whatever is animating the card at `pointerdown`
   (an animation outranks the inline write in the cascade). WAAPI gives `cancel()`, `finished`
   promises for sequencing (flip halves, parade → confetti), and `getComputedStyle()` to read the
   current position mid-flight.
3. **CSS transitions are a hazard here.** An iOS 26 bug makes a `transition: transform` plus a
   `transform` animation on one element jump backwards (bug 318849), fixed only by a flag that is
   off in Safari 26 and 27. One mechanism removes the whole class.
4. **Motion is rejected for the cards.** It writes `element.style.transform` itself (L734) and
   demotes when anything else writes it (L57–L58, L1522), which is the stack policy's rejection
   test for the dragged element; its springs become `linear()` which Safari 26 does not accelerate;
   its time-based springs drop the release velocity. Using it only for non-dragged effects would
   mean two animation systems for no gain, since every effect below is a few WAAPI keyframes.
   Bundle size played no part in this.

### Element structure per card

```html
<div class="card">                 <!-- position: drag writes, landing spring animates -->
  <div class="card-shadow"></div>  <!-- static shadow; only opacity/transform animate -->
  <div class="card-face">          <!-- effects: lift, squash, shake, flip, walk-bob -->
    <img src="…" decoding="async" draggable="false" alt="">
  </div>
</div>
```

```css
.card        { position: absolute; left: 0; top: 0;
               will-change: transform;            /* the one permanent layer per card */
               transform: translate3d(0px, 0px, 0); }
.card.lifted { z-index: 1000; }                   /* paint last: no overlap layers above it */
.card-face   { transform: translate(0px, 0px) rotate(0deg) scale(0.926);
               transform-origin: 50% 100%; }      /* laid out at lifted size, rests at 0.926 */
.card-shadow { position: absolute; inset: 0; border-radius: inherit; opacity: 0;
               box-shadow: 0 8px 16px rgb(0 0 0 / 0.25); }  /* painted once, never animated */
.card, .card-face, .card-shadow { transition: none; }
```

- The drag code from the gate stays exactly as approved and writes only `.card`'s `transform`.
  Effects live on `.card-face`, a different element, so the two never fight.
- Lay the card box out at its **lifted** size; `scale(0.926)` (= 1/1.08) at rest; export raster art
  at 3 × the lifted CSS size.
- Columns must not create stacking contexts, so `.card.lifted { z-index }` puts the held card on top.

### Rules for every animation

1. Animate only `transform` (or `translate`/`scale`/`rotate`) and `opacity`. Never `box-shadow`,
   `filter: drop-shadow()`, `width`/`height`/`left`/`top`, `border-radius`, `clip-path`, or CSS
   variables.
2. Easing: `cubic-bezier()`, the keywords, or `'linear'` over sampled keyframes. Never `linear(…)`
   with points and never `steps()`.
3. Same transform function list, in the same order, in every keyframe of one animation.
4. Always an explicit first and last keyframe.
5. `composite` stays `'replace'` (the default).
6. No `fill: 'forwards'` or `'both'`. Write the final value to inline style first, then animate
   *from* the old value; nothing needs committing afterwards. Use `fill: 'backwards'` only to hold
   the first keyframe during a `delay`.
7. At `pointerdown`, for a card that is still moving: read the live position, cancel, write it,
   then continue the drag:
   ```ts
   const m = new DOMMatrixReadOnly(getComputedStyle(card).transform)
   for (const a of card.getAnimations()) a.cancel()
   card.style.transform = `translate3d(${m.m41}px, ${m.m42}px, 0)`
   ```
8. Before `document.startViewTransition()`, wait for finite animations:
   `await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished))`.

### Spring with release velocity, accelerated on Core Animation

```ts
type Vec = { x: number; y: number }
const FRAME = 1 / 60

// Apple's Spring(duration:bounce:) mapping, mass 1, 0 <= bounce < 1.
function springAxis(t: number, from: number, to: number, v0: number, duration: number, bounce: number) {
  const w0 = (2 * Math.PI) / duration
  const zeta = 1 - bounce
  const x0 = from - to
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    const b = (v0 + zeta * w0 * x0) / wd
    return to + Math.exp(-zeta * w0 * t) * (x0 * Math.cos(wd * t) + b * Math.sin(wd * t))
  }
  return to + Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t)
}

function springTo(card: HTMLElement, from: Vec, to: Vec, v: Vec, duration = 0.4, bounce = 0.25) {
  const frames: Keyframe[] = []
  let lastMoving = 0
  for (let t = 0; t <= 1.2; t += FRAME) {
    const x = springAxis(t, from.x, to.x, v.x, duration, bounce)
    const y = springAxis(t, from.y, to.y, v.y, duration, bounce)
    frames.push({ transform: `translate3d(${x}px, ${y}px, 0)` })
    if (Math.abs(x - to.x) > 0.25 || Math.abs(y - to.y) > 0.25) lastMoving = frames.length
  }
  frames.length = Math.max(lastMoving + 1, 2)
  frames[frames.length - 1] = { transform: `translate3d(${to.x}px, ${to.y}px, 0)` }
  card.style.transform = `translate3d(${to.x}px, ${to.y}px, 0)`   // final state lives inline
  return card.animate(frames, { duration: (frames.length - 1) * FRAME * 1000, easing: 'linear' })
}
```

Release velocity, in px/s, from the drag's own samples (`e.timeStamp` in ms):

```ts
function releaseVelocity(s: { t: number; x: number; y: number }[], upAt: number): Vec {
  const last = s.at(-1)
  if (!last || upAt - last.t > 50) return { x: 0, y: 0 }      // finger had stopped
  const first = s.find(p => p.t >= last.t - 80) ?? last
  const dt = (last.t - first.t) / 1000
  const clamp = (n: number) => Math.max(-4000, Math.min(4000, n))
  return dt > 0 ? { x: clamp((last.x - first.x) / dt), y: clamp((last.y - first.y) / dt) }
                : { x: 0, y: 0 }
}
```

The 80 ms window, 50 ms "stopped" test and 4000 px/s clamp are starting values, not sourced.

### Starting values for each moment

All durations and curves below are **design starting points** for the choreography ticket to tune
on the phone with the child; none is a cited fact. "CA" = expected to run on Core Animation under
the rules above (verify). `s` = 0.926, the resting face scale.

| Moment | Element | Keyframes | Duration | Easing | CA |
|---|---|---|---|---|---|
| Lift | `.card-face` + `.card-shadow` | face `translate(0px, 0px) rotate(0deg) scale(s)` → same with `scale(1)`; shadow `opacity 0 → 1` and `translateY(2px) → translateY(8px)` | 120 ms | `cubic-bezier(0.2, 0, 0, 1)` | yes |
| Drag | `.card` | written in `pointermove` (approved gate code) | — | — | no animation |
| Magnet snap | `.card` | in `pointermove`: inside the capture radius, draw at `finger + (slot − finger) × pull`, `pull` rising 0 → 0.5 as the finger nears | — | — | no animation |
| Spring landing | `.card` | `springTo(…)` from release point with `releaseVelocity` | spring `duration 0.4`, `bounce 0.25` (k ≈ 246.7, c ≈ 23.6, ζ = 0.75); 1.2 s cap | `'linear'` over 60 Hz samples | yes |
| Land (face + shadow) | `.card-face` + `.card-shadow` | face `scale(1, 1)` → `scale(0.982, 0.870)` → `scale(0.907, 0.945)` → `scale(s, s)` at offsets 0, 0.35, 0.7, 1 (each with the full `translate(0px, 0px) rotate(0deg)` prefix); shadow `opacity 1 → 0`; both with `delay` = time of the spring's first crossing of the slot (or its end when bounce is 0) and `fill: 'backwards'` | 260 ms | `ease-out` | yes |
| Wrong drop: shake | `.card-face` | `translate(Xpx, 0px) rotate(0deg) scale(s)` with X: 0, −10, 8, −6, 4, −2, 0 | 360 ms | `'linear'` | yes |
| Wrong drop: return | `.card` | `springTo(…)` back to its column, after `shake.finished` | `duration 0.35`, `bounce 0` | `'linear'` samples | yes |
| Flip, half 1 | `.card-face` | `perspective(600px) rotateY(0deg) scale(s)` → `perspective(600px) rotateY(90deg) scale(s)` | 140 ms | `cubic-bezier(0.4, 0, 1, 1)` | yes |
| Flip, swap | `<img>` | change picture after `half1.finished` (sprite already decoded) | — | — | — |
| Flip, half 2 | `.card-face` | `perspective(600px) rotateY(-90deg) scale(s)` → `perspective(600px) rotateY(0deg) scale(s)` | 140 ms | `cubic-bezier(0, 0, 0.2, 1)` | yes |
| Parade: walk off | `.card` | current `translate3d` → x past the right edge (viewport width + card width), stagger 90 ms per card | 900 ms | `cubic-bezier(0.4, 0, 1, 1)` | yes |
| Parade: walk bob | `.card-face` | `translate(0px, 0px) rotate(-6deg) scale(s)` → `translate(0px, -4px) rotate(0deg) scale(s)` → `translate(0px, 0px) rotate(6deg) scale(s)`, `direction: 'alternate'`, `iterations: 5` | 180 ms each | `ease-in-out` | yes |
| Confetti | full-screen canvas | `confetti.create(canvas, { useWorker: true, resize: true, disableForReducedMotion: true })`, fire `particleCount: 100, spread: 70, origin: { y: 0.6 }` after the parade's `finished` | `ticks: 200` (~3.3 s) | — | worker |
| Screen change | View Transition | wait for card animations, then `document.startViewTransition(() => setScreen(next))` with a synchronous update; new screen `scale(0.96) → scale(1)` plus the default cross-fade | 300 ms | `cubic-bezier(0.2, 0, 0, 1)` | expected |

Notes on the table:

- The flip never uses `preserve-3d` or `backface-visibility` (bugs 322397, 260281, 302166, 71624)
  and never rotates past 90° in one animation.
- The shadow is a separate element with a static `box-shadow`, faded with `opacity`, because
  shadows cannot be animated on Core Animation.
- Every `.card-face` keyframe repeats the full `translate() rotate() scale()` list (the flip uses
  its own `perspective() rotateY() scale()` list in both halves), so WebKit interpolates per
  function and never decomposes a matrix.
- The landing merges "lift ends" and the squash into one face animation, so two animations never
  fight over the face's `transform`.
- Decode a level's sprites before showing it, once per URL, and keep the `Image` objects alive for
  the session:
  `await Promise.all(urls.map(u => { const i = new Image(); i.src = u; return i.decode().then(() => i) }))`.
- Reduced motion: section 8.

---

## Must be measured on the device

Each of these needs the iPhone 12 on iOS 26 (or what it runs then), with Safari Web Inspector
attached from the Mac where noted. No citation settles them.

1. **Is each animation really on Core Animation?** Start the animation, then block the main thread
   for 300 ms (`const end = performance.now() + 300; while (performance.now() < end) {}`). An
   accelerated animation keeps moving; a main-thread one freezes. Test lift, the sampled-keyframe
   spring, the flip halves, the parade, and a `linear()` spring for comparison.
2. **The felt values.** Every duration, curve, spring and the magnet pull in the table — with the
   child, not only the author. That is the choreography ticket's job.
3. **Release velocity handling.** The 80 ms window, the 50 ms "stopped" test and the 4000 px/s
   clamp: does a flick land with a pleasing overshoot, and does a careful drop land without one?
4. **Layer count and memory with 20–30 cards.** Web Inspector → Layers tab: total layer memory,
   paint counts, and whether extra layers appear above a held card (compositing borders).
5. **Blur.** The lifted card at scale 1, the resting card at 0.926, the squash at
   `scale(0.982, 0.870)`: are edges crisp at 3x? Compare with a card laid out at resting size and
   scaled *up* to lift, to see whether iPhone re-renders scaled layers (Dynamic Content Scaling,
   unverified).
6. **Sprite first appearance.** After `decode()`, does a card's first paint (deal, flip swap)
   hitch? Watch Web Inspector → Timelines → Rendering Frames. Check the Safari 26 early-resolve
   defect by decoding a cached URL twice.
7. **Flip.** Is there a visible gap at the 90° swap? Do the rounded corners stay correct through
   the flip (bug 322397 was reported at desktop zoom levels; iOS is unknown)?
8. **Confetti plus parade.** Rendering Frames while 4–8 cards walk off and 100 particles fall, with
   `useWorker: true` and `false`. Are the soft 1x-bitmap confetti edges acceptable?
9. **View Transitions.** Do taps during the 300 ms transition really go nowhere (spec says the
   document element)? Does a card held with pointer capture survive a transition? Any flicker with
   the confetti canvas?
10. **Interrupting a moving card.** Grab a card mid-spring: does `getComputedStyle()` return the
    position that is on screen, so the drag continues without a jump?
11. **Lift latency.** Time from `pointerdown` to the first visible lift frame. Starting a Core
    Animation animation needs a layer commit; if the lift lags the finger, start it in the same
    handler that captures the pointer and keep that handler minimal.
12. **Memory pressure.** If the phone is low on memory WebKit drops `will-change` layers, and the
    drag then repaints on every move. Not controllable from the page; note whether it ever shows.
