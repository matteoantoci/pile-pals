# AI-generated card pictures with Grok Imagine (fallback plan)

Research date: 2026-11-09. Every fact below quotes the sentence it rests on, with its URL. Text marked **[INFERENCE]** is my own reasoning, not a quote. Text marked **unverified** has no source I could find.

Note on names: xAI now calls itself "SpaceXSI" in its docs and legal pages: "These Terms form an agreement between you and SpaceX Super Intelligence LLC (“**SpaceXSI**,” “**we**,” “**our**,” or “**us**”)…" ([x.ai/legal/terms-of-service](https://x.ai/legal/terms-of-service)). The API is still at `api.x.ai` and the docs at `docs.x.ai`.

## Question

The game needs 300 to 500 card pictures (the first plan said 100 to 200). Each card shows one object on a transparent background, at about 100 to 130 CSS px on a 3x iPhone, so a 400 to 512 px source. The first choice is an open emoji set (Fluent Emoji 3D, Noto Animated). If that set lacks items, or we drop it, can Grok Imagine make the pictures?

1. What Grok Imagine is today, and how to reach it.
2. What the image API can do: size, format, transparency, reference images, `n`, seed, rate limits, price.
3. How to keep one style across hundreds of pictures, and how to fill only the gaps in Fluent Emoji 3D so they match.
4. How to cut the object out of its background.
5. Whether Grok video can make short sprite loops, and whether CSS motion is better.
6. Who owns the pictures, and which content rules matter.

## 1. What Grok Imagine is today

**Current API models.** The models page lists two image models and three video models, with these prices:

> | grok-imagine-image | $0.02 / image |
> | grok-imagine-image-2.0 | $0.04 / image |
> | grok-imagine-video-1.5-lite | $0.020 / sec |
> | grok-imagine-video | $0.050 / sec |
> | grok-imagine-video-1.5 | $0.080 / sec |

Source: [docs.x.ai/developers/models](https://docs.x.ai/developers/models). The same page names the default picks: "Images: [Grok Imagine Image 2.0]" and "Videos: [Grok Imagine Video 1.5]".

- One API covers both images and video: "The Imagine API lets you generate and edit images and videos with Grok Imagine models. Use it for image generation, image editing with up to 5 reference images, video generation from text or still images, video editing, and more." ([Imagine overview](https://docs.x.ai/developers/model-capabilities/imagine))
- Image 2.0 is new (August 2026): "Imagine Image 2.0 is now generally available as the new **Quality Mode** on grok.com/imagine, and our iOS and Android apps." and "Image 2.0 is available in the API as `grok-imagine-image-2.0`." ([x.ai/news/grok-imagine-image-2](https://x.ai/news/grok-imagine-image-2))
- The older 1.0 model is still live, pinned by date: "**Aliases:** `grok-imagine-image-2026-03-02`" ([grok-imagine-image model page](https://docs.x.ai/developers/models/grok-imagine-image)).
- One older name is gone: "**Effective November 2, 2026**, the `grok-imagine-image-quality` model slug is retired from the xAI API." ([migration guide](https://docs.x.ai/developers/migration/imagine-image-quality-nov-2))
- Video advice from xAI: "We recommend `grok-imagine-video-1.5-lite` for simple videos, and `grok-imagine-video-1.5` when you need references, voices, pinned frames, or native 1080p." ([Video overview](https://docs.x.ai/developers/model-capabilities/video/overview))

**Ways to reach it.**

| Route | What the source says | Fit for 300 to 500 sprites |
|---|---|---|
| API (`api.x.ai`, pay per image) | "Our [Enterprise Terms of Service] govern the use of our Services for developers and businesses, including SpaceXSI APIs and PromptIDE." ([consumer terms](https://x.ai/legal/terms-of-service)) | Best. Scriptable, pay per picture. |
| grok.com and the Grok iOS/Android apps | "Grok is SpaceXSI's assistant, available on the web at grok.com and in the iOS and Android apps." and "**Create images and video** with Grok Imagine." ([Grok overview](https://docs.x.ai/grok/overview)). Paid plans share one pool: "you get one shared weekly usage pool that you can spend however you like across any Grok product." ([Grok FAQ](https://docs.x.ai/grok/faq)) | Good for trying styles by hand. Not for batch work: the rules forbid "Accessing the Services through unauthorized automated or non-human means, whether through a bot, script, or otherwise" ([Acceptable Use Policy](https://x.ai/legal/acceptable-use-policy)). |
| Grok inside X | "Use of Grok on the X platform is not governed by these Terms. To access Grok on X, you must agree to the X Terms of Service." ([consumer terms](https://x.ai/legal/terms-of-service)) | No benefit here, and different terms. |

## 2. Image API capabilities

**Output count, `n`.** "Generate multiple images in a single request with the `n` parameter (`1`–`10`)." ([Image Generation](https://docs.x.ai/developers/model-capabilities/images/generation))

**Aspect ratio.** The ratio table includes "`1:1` | Social media, thumbnails" ([Image Generation](https://docs.x.ai/developers/model-capabilities/images/generation)).

**Resolution.** "Currently supported image resolutions are: `1k` (default when omitted), `2k`" ([Image Generation](https://docs.x.ai/developers/model-capabilities/images/generation)). The REST reference also lists `1.5k`: "`resolution` ("1k" | "2k" | "1.5k")" ([REST: Images](https://docs.x.ai/developers/rest-api-reference/inference/images)). In pixels, for square output: "at 1K (1024×1024) or 2K (2048×2048) resolutions." ([x.ai/api/imagine](https://x.ai/api/imagine)). So `1k` already gives twice our 512 px target.

**Quality.** "Allowed values are `low`, `medium`, and `auto`. When omitted, the default is `auto`, which lets the service choose the quality for each request. Auto currently uses `low` for image generation and `medium` for image editing." ([Image Generation](https://docs.x.ai/developers/model-capabilities/images/generation)). Set `quality` on every call so the price does not change under you.

**Output format.** "Images are returned as URLs by default. URLs are temporary, so download or process promptly." ([Image Generation](https://docs.x.ai/developers/model-capabilities/images/generation)). The file type is usually JPEG: "Each PUT sends a `Content-Type` equal to the image's `mime_type` in the response (`image/jpeg` unless the requested quality produces PNG)…" and the sample reply shows `"mime_type": "image/jpeg"` ([REST: Images](https://docs.x.ai/developers/rest-api-reference/inference/images)). JPEG has no alpha channel.

**Transparent background: not in the API.** The full request body for `POST /v1/images/generations` lists only these fields: `aspect_ratio`, `deferred`, `model`, `n`, `output`, `prompt`, `resolution`, `response_format`, `storage_options`, `user` (plus `quality` in the guide) ([REST: Images](https://docs.x.ai/developers/rest-api-reference/inference/images)). None of them asks for a transparent background. The consumer app does have it: "Background removal exports any subject with a transparent background, ready to drop into other work." ([Image 2.0 announcement](https://x.ai/news/grok-imagine-image-2)). That is a manual tool on grok.com; an API version is **unverified** (I found none).

**Reference images and editing.** This is what makes a consistent set possible.
- "Edit a source image with natural language. Provide a public image URL or base64-encoded data URI, then describe the change you want Grok Imagine to apply. Multi-image editing supports up to 5 source images in a single request for combining subjects, transferring styles, and composing scenes." ([Imagine overview](https://docs.x.ai/developers/model-capabilities/imagine))
- How to pass several: "`images` (array<object>) — List of input images for multi-reference editing. Mutually exclusive with `image`. When multiple images are provided, refer to them as <IMAGE_0>, <IMAGE_1>, etc. in the prompt." Each one is a "Public URL or base64-encoded data URL of the image (JPEG, PNG, or WebP)." ([REST: Images](https://docs.x.ai/developers/rest-api-reference/inference/images))
- "By default, the output aspect ratio follows the first input image." ([Multi-Image Editing](https://docs.x.ai/developers/model-capabilities/images/multi-image-editing))
- The 5-image limit is for Image 2.0: "`grok-imagine-image-2.0` additionally accepts `quality`, up to five source images for editing, and the `21:9` and `5:2` aspect ratios." ([migration guide](https://docs.x.ai/developers/migration/imagine-image-quality-nov-2)). The older note says "pass one to three source images" ([x.ai/api/imagine](https://x.ai/api/imagine)), so expect 3 on the 1.0 model **[INFERENCE]**.

**Seed: none.** The SDK's request message has exactly these fields: `__slots__ = ("prompt", "image", "model", "n", "user", "format", "quality", "aspect_ratio", "resolution", "images", "storage_options")` ([xai-sdk-python, image_pb2.pyi](https://github.com/xai-org/xai-sdk-python/blob/main/src/xai_sdk/proto/v6/image_pb2.pyi)). There is no `seed`. The only `seed` in the REST docs is on chat: "If specified, our system will make a best effort to sample deterministically…" ([REST reference](https://docs.x.ai/developers/rest-api-reference/inference/chat-completions)). Also, the API rewrites your prompt before it draws: "Prompt text tokens consumed by the prompt-rewriting (upsampler) LLM, including any served from cache." ([REST: Images](https://docs.x.ai/developers/rest-api-reference/inference/images)). So the same prompt will not give the same picture twice.

**Rate limits.** Model page: "Requests per second | 6" ([grok-imagine-image-2.0](https://docs.x.ai/developers/models/grok-imagine-image-2.0)). The tier table says "grok-imagine-image-2.0 | T0: 6, T1: 12, T2: 25, T3: 50, T4: 100", but the same page also says "Rate limit tiers apply to text, embedding, and voice models. For increases to Imagine API limits, contact sales@x.ai." ([Rate Limits](https://docs.x.ai/developers/rate-limits)). Either way, 6 requests per second is far more than 500 pictures need.

**Price per image.** The rendered model page for Image 2.0 shows:

> Image input $0.01 per image … Output pricing per image based on resolution and quality: 1K · Low $0.04 · 1.5K · Low $0.05 · 2K · Low $0.06 · 1K · Medium $0.06 · 1.5K · Medium $0.07 · 2K · Medium $0.08

and "You are also charged when using image as an input." ([grok-imagine-image-2.0](https://docs.x.ai/developers/models/grok-imagine-image-2.0)). For the older model: "Image input $0.002 per image … 1K (1024x1024) $0.02 · 2K (2048x2048) $0.02" ([grok-imagine-image](https://docs.x.ai/developers/models/grok-imagine-image)). Edits pay for inputs too: "Image edits are billed for both the input image and the generated output image." ([Imagine overview](https://docs.x.ai/developers/model-capabilities/imagine))

**Other billing facts.**
- No bulk discount: "Image and video generation are supported in the Batch API but are billed at standard rates." ([Pricing](https://docs.x.ai/developers/pricing))
- Blocked pictures still cost money: "When your request is deemed to be in violation of our usage guideline by our system, we will still charge for the generation of the request." ([Pricing](https://docs.x.ai/developers/pricing))
- Each reply reports its own cost: "`cost_in_usd_ticks` … One USD cent equals 100,000,000 ticks…" ([REST: Images](https://docs.x.ai/developers/rest-api-reference/inference/images))

## 3. Keeping one style across 300 to 500 pictures

**What the API offers.** Text prompts, single-image edits ("Transform existing images by describing the desired aesthetic in your prompt." — [Image Editing](https://docs.x.ai/developers/model-capabilities/images/editing)), and multi-reference edits with up to 5 images (section 2). There is no seed, no style ID, and no fine-tuning for images (none documented).

**Official guidance.**
- xAI claims Image 2.0 holds a look: "And it preserves what you put in across generations and edits." and "One world from a handful of prompts: a character, her locations, and the props she carries — generated separately, holding one style from image to image." ([Image 2.0 announcement](https://x.ai/news/grok-imagine-image-2))
- Fixed settings: "Lock `aspect_ratio` across a series so the images sit together" and "Pin `medium` and `2k` when fine detail has to be recognizable." ([Image Prompting Guide](https://docs.x.ai/developers/model-capabilities/images/prompting-guide))
- Fixed prompt shape: "Keep the same order in every prompt of a series:" then Subject, Details and focal point, Art direction, Light, Color, Composition ([Image Prompting Guide](https://docs.x.ai/developers/model-capabilities/images/prompting-guide)).
- Say what you want, not a list of bans: "A long avoid list is easy to ignore, and it spends the prompt on objects that then show up anyway." ([Image Prompting Guide](https://docs.x.ai/developers/model-capabilities/images/prompting-guide))
- Fix misses narrowly: "Save the prompt next to the image. On the next pass, change only the detail that failed and leave the rest of the original prompt in place, so the subject and the layout stay put." ([Image Prompting Guide](https://docs.x.ai/developers/model-capabilities/images/prompting-guide))
- The grok.com app has ready templates for this kind of work: "Icon Maker", "Character Sprite", "Emoji Creator" ([Image 2.0 announcement](https://x.ai/news/grok-imagine-image-2)). They are handy for trying a look by hand.

**Community guidance** (third party, not xAI). A July 2026 guide gives each reference one job and names the job in the prompt: "The model cannot infer "the third image is the lighting" — you have to say it." ([promptlibrary.space](https://www.promptlibrary.space/blog/grok-imagine-multi-image-editing-how-to-combine-up-to-three-references)). Its "up to 3 references" limit is out of date; xAI's release notes now say "Image editing now accepts up to 5 source images per request (was 3)." ([Release Notes](https://docs.x.ai/developers/release-notes))

**Method that follows from this [INFERENCE].** Text prompts alone will drift over 500 pictures, because there is no seed and the prompt is rewritten. The stable anchor is the same 3 to 4 reference pictures sent with every request, plus one fixed prompt template. Work one category at a time, with references from that category (animals for animals, fruit for fruit).

### Filling only the gaps in Fluent Emoji 3D

Yes, the API can do this through multi-reference editing (`/v1/images/edits` with `images`).

- Fluent Emoji may be used this way. Its license is MIT: "Permission is hereby granted, free of charge, to any person obtaining a copy of this software… to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies…" ([fluentui-emoji LICENSE](https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/LICENSE)). Keep the notice: "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software." (same file)
- The API accepts PNG references (quoted in section 2).
- Size check (my own test with `file`, 2026-11-09): the Fluent 3D files [`cow_face_3d.png`](https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cow%20face/3D/cow_face_3d.png), `red_apple_3d.png`, `automobile_3d.png` and `teddy_bear_3d.png` are each "PNG image data, 256 x 256, 8-bit/color RGBA". So the Fluent 3D set is 256 px, below our 400 to 512 px target. Generated gap items come out at 1024 px. Ship the whole set at one size so the gap items do not look sharper than the rest **[INFERENCE]**.

Steps **[INFERENCE, to be tested]**:
1. List every card word. Match each one to a folder name in Fluent's `assets/` directory. The words with no match are the gaps.
2. For each category, pick 3 or 4 Fluent 3D pictures closest to the gap item (for "goat": cow, sheep, pig). Paint each onto the same flat background colour you will ask for in the prompt, and scale it up to 1024 px. How the API reads PNG alpha is not documented, so this avoids black or checkerboard backgrounds.
3. Call `/v1/images/edits` with `model: grok-imagine-image-2.0`, `images: [ref0, ref1, ref2]`, `aspect_ratio: "1:1"`, `resolution: "1k"`, `quality: "medium"`, `n: 2`, `response_format: "b64_json"`, and the template in Recommendations. Name the references in the prompt as `<IMAGE_0>`, `<IMAGE_1>`, `<IMAGE_2>`.
4. Put each result next to its Fluent neighbours on one contact sheet. Keep it only if a child would not spot the odd one out.

## 4. Background removal

Because the API returns flat JPEGs, every picture needs a cut-out step. Four local options on macOS:

**a) Chroma key (ffmpeg).** "Turns a certain color into transparency. Operates on YUV colors." (`ffmpeg -h filter=chromakey`; also [ffmpeg filters: chromakey](https://ffmpeg.org/ffmpeg-filters.html#chromakey)). To clean the coloured rim: "Remove unwanted contamination of foreground colors, caused by reflected color of greenscreen or bluescreen." ([ffmpeg filters: despill](https://ffmpeg.org/ffmpeg-filters.html#despill)). Weak points **[INFERENCE]**: green items (frog, broccoli, cucumber) get eaten by a green key; the model may not paint a perfectly flat colour; JPEG compression smears the key colour into the edges.

**b) rembg (CLI, batch).** "Rembg is a tool to remove image backgrounds. It can be used as a CLI, Python library, HTTP server, or Docker container." and "`p` - folders (batch processing)" ([rembg README](https://github.com/danielgatis/rembg)). Edge advice from the same page:
- "**Use the default (naive)** when the subject has hard edges — products, cars, logos, screenshots…"
- "**Use `-dc`** when the cutout has a colored halo: the subject was shot against a strongly colored background … and that color survives as a rim around hair or fine detail."
- "If you are batch-processing and cannot inspect each result, prefer `-dc` over `-a`: it is faster and cannot fail."
- License trap: "`bria-rmbg` is the default", and those weights say "Bria AI Model weights are open source for non commercial use only" ([briaai/RMBG-2.0](https://huggingface.co/briaai/RMBG-2.0)). That is fine for a family game, but pass `-m birefnet-general` to avoid the question.

**c) BiRefNet (the model behind `birefnet-general`).** MIT licensed (`license: mit` on [huggingface.co/ZhengPeng7/BiRefNet](https://huggingface.co/ZhengPeng7/BiRefNet)). Speed on a desktop GPU: "the standard BiRefNet can run in `17 FPS` with `resolution==1024x1024` with `3.45GB GPU memory` on a single `RTX 4090`." ([BiRefNet README](https://github.com/ZhengPeng7/BiRefNet)). A cartoon-tuned version exists: "fine-tuned BiRefNet with their **custom anime data** to obtain their model **ToonOut**, which brings improvement on the background-removal task for anime images." (same README). Apple-silicon speed for 500 images is **unverified**; on CPU it will be slower but it is a one-time job.

**d) Apple Vision `VNGenerateForegroundInstanceMaskRequest`.** "A request that generates an instance mask of noticable objects to separate from the background." Available on "macOS: 14.0.0 -" ([Apple docs](https://developer.apple.com/documentation/vision/vngenerateforegroundinstancemaskrequest)). Its output call: "Creates a high-resolution image where everything becomes transparent black, except for the instances you specify." ([VNInstanceMaskObservation](https://developer.apple.com/documentation/vision/vninstancemaskobservation)). It is not limited to people: "the newly introduced subject lifting API is "class agnostic". Any foreground object, regardless of its semantic class, can be potentially segmented." and it "produces a soft segmentation mask at the same resolution." ([WWDC23 session 10176](https://developer.apple.com/videos/play/wwdc2023/10176/)). There is no ready `vision` command on this Mac (`which vision` found nothing on 2026-11-09), so this needs a short Swift script.

**Comparison [INFERENCE].**

| Option | Edge quality on fur and soft 3D shading | Fails when | Setup |
|---|---|---|---|
| Chroma key | Hard or spilled edges | Object contains the key colour; uneven background | ffmpeg (already installed here) |
| rembg + BiRefNet | Soft, well-shaped alpha | Thin parts (whiskers, antennae) may break | `pip install "rembg[cpu,cli]"` |
| Apple Vision | Soft mask, full resolution | May treat a cast shadow or two objects as one subject | ~30 lines of Swift |

Best plan: ask the model for a plain flat background that contrasts with the object, cut out with BiRefNet, and use Apple Vision as a second opinion on the 5 to 10% that look wrong.

## 5. Video: animated sprites from a still

**What Grok video can do.**
- Length: "Set `duration` from 1 to 15 seconds; the default is 8." ([Video Generation](https://docs.x.ai/developers/model-capabilities/video/generation))
- Size: "`480p` | Standard definition, faster processing (default)" (same page). The overview lists 480p, 720p, 1080p, and square output: "1:1, 16:9, 9:16…" ([Video overview](https://docs.x.ai/developers/model-capabilities/video/overview)).
- From a picture: "The still you pass as `image` becomes the first frame, and the prompt describes what happens next. The output always matches the still's aspect ratio; `aspect_ratio` is ignored." ([Video overview](https://docs.x.ai/developers/model-capabilities/video/overview))
- Loops: "Pass the same image as `image` and `last_frame` to make a loop." Only on `grok-imagine-video-1.5`; for `-lite` the first and last frame row says "Not supported" ([Video overview](https://docs.x.ai/developers/model-capabilities/video/overview)).
- Sound is on by default: "Pass `generate_audio=False` to request a silent video" ([Video Generation](https://docs.x.ai/developers/model-capabilities/video/generation)).
- Output is an MP4 link, e.g. `"url": "https://vidgen.x.ai/.../video.mp4"`, and "Videos are returned as temporary URLs." It is slow: "typically takes up to several minutes to complete." ([Video Generation](https://docs.x.ai/developers/model-capabilities/video/generation))
- Price per second on `grok-imagine-video-1.5`: "480p $0.08 · 720p $0.14 · 1080p $0.25", image input "$0.01" ([model page](https://docs.x.ai/developers/models/grok-imagine-video-1.5)). On `-lite`: "480p $0.02 · 720p $0.03 · 1080p $0.14" ([model page](https://docs.x.ai/developers/models/grok-imagine-video-1.5-lite)).

**Cost of one 2-second bouncing-cow loop [INFERENCE from the prices above]:** 2 s × $0.08 = $0.16, plus two image inputs (first and last frame) at $0.01 each, so about $0.18. One clip for every card: about $36 for 200 cards and $90 for 500, before retakes.

**Making it a transparent animated WebP.** MP4 has no transparency here, so every frame needs a cut-out **[INFERENCE]**. rembg can read frames straight from ffmpeg: "Process a sequence of RGB24 images from stdin. This is intended to be used with programs like FFmpeg that output RGB24 pixel data to stdout." ([rembg README](https://github.com/danielgatis/rembg)). Then join the frames: "`img2webp` -- Create animated WebP file from a sequence of input images." and "`-loop int` … Using `0` means 'loop indefinitely'." ([img2webp docs](https://developers.google.com/speed/webp/docs/img2webp)). Safari plays it: WebP "supports lossy and lossless compression, as well as animation and alpha transparency" and iOS Safari is marked supported from 14.0 ([caniuse data](https://github.com/Fyrd/caniuse/blob/main/features-json/webp.json)); WebKit: "This release of WebKit in Safari 14 adds support for the WebP open-source image format." ([WebKit blog](https://webkit.org/blog/11340/new-webkit-features-in-safari-14/)).

Problems **[INFERENCE]**: the mask can flicker from frame to frame; the model may restyle the cartoon or move the camera; and 24 to 48 frames of a 512 px picture is many times the size of one still, multiplied by 500 cards.

**CSS motion on the still is the better default.** "Modern browsers can animate two CSS properties cheaply: `transform` and `opacity`." ([web.dev: Animation performance](https://web.dev/articles/animations-overview)). A bounce, wiggle, pop or squash is just `transform` (translate, rotate, scale) on the still sprite: free, the same style for every card, and no extra files. Keep Grok video for a few special "celebration" clips, for example 5 to 10 clips for about $1 to $2.

## 6. Rights and content rules

**Who owns the output.**
- API (the route we would use) is under the Enterprise terms, which give the output to you: "Customer … (b) owns all right, title, and interest in the Output in perpetuity and, to the fullest extent possible under applicable law, SpaceXSI hereby assigns to Customer all of its right, title, and interest in such Output…" ([Enterprise terms §3.2](https://x.ai/legal/terms-of-service-enterprise)).
- Fit check: those terms say "These terms are for enterprise (business) users of the SpaceXSI API … who are at least 18 years old." and grant use "solely for Customer’s business purposes" ([Enterprise terms](https://x.ai/legal/terms-of-service-enterprise)). How this applies to one parent making a private game is **unverified**; there is no separate personal API plan in the docs I read.
- Consumer app (grok.com): "To the extent permitted by applicable law, and as between you and SpaceXSI, you retain your ownership rights to the User Content." ([consumer terms](https://x.ai/legal/terms-of-service)) and "You own the Inputs and Outputs. You are free to use Grok’s Outputs (including generated images) from your conversations as you wish, including for commercial use." ([Consumer FAQs](https://x.ai/legal/faq))
- Others may get similar pictures: "Due to the nature of artificial intelligence, Outputs may not be unique, and different users may receive similar Output from our Service." ([consumer terms](https://x.ai/legal/terms-of-service))

**What happens to your inputs.**
- API: "SpaceXSI will not use any User Content to train any foundation models, large language models, or other artificial intelligence systems…" ([Enterprise terms §3.1](https://x.ai/legal/terms-of-service-enterprise)) and "Generated media is subject to content policy review and is not used for training." ([Imagine overview](https://docs.x.ai/developers/model-capabilities/imagine))
- Consumer app: uploads give xAI a very wide license: "you grant an irrevocable, perpetual, transferable, sublicensable, royalty-free, and worldwide right to SpaceXSI to use, copy, store, modify…" ([consumer terms](https://x.ai/legal/terms-of-service)). Another reason to use the API for the Fluent reference pictures.

**Attribution and AI labels.**
- "If you used Grok to generate text or images, please attribute them to SpaceXSI and Grok by displaying one of the following phrases in a legible and noticeable manner wherever the Grok-generated material is published or distributed: Written with Grok / Created with Grok" ([Brand Guidelines](https://x.ai/legal/brand-guidelines)). A line in an "About" screen covers this **[INFERENCE]**.
- API: "Customer will not … (ii) misrepresent that any Output was human-generated." ([Enterprise terms §3.2](https://x.ai/legal/terms-of-service-enterprise))

**Watermarks.** Consumer app: "Generated images and videos include a Grok watermark to indicate that the content was created with AI. There is no setting to remove the watermark." ([Grok FAQ](https://docs.x.ai/grok/faq)). Removing one is banned: "Stripping, altering or circumventing embedded provenance metadata or watermarks" ([Acceptable Use Policy](https://x.ai/legal/acceptable-use-policy)). Whether API images carry a visible mark or provenance metadata is **unverified** (the API watermark page only covers text: "Watermarking applies to text output from text generation requests…" — [Output Watermarking](https://docs.x.ai/developers/advanced-api-usage/watermarking)). This matters for our pipeline: `cwebp` drops metadata by default ("`-metadata <string>` … Valid values: all, none (default), exif, icc, xmp", from `cwebp -longhelp`). Check this before converting 500 files.

**Content rules that matter here.**
- Every output is checked: "All generated images and videos go through automatic content moderation. Content that violates usage policies may be blocked." ([x.ai/api/imagine](https://x.ai/api/imagine)). The SDK flags it: "Whether the image respects moderation rules." (`respect_moderation`, [xai-sdk-python image.py](https://github.com/xai-org/xai-sdk-python/blob/main/src/xai_sdk/image.py)). Blocked requests are still billed (section 2).
- No branded characters: the policy bans "Violating copyright, trademark, or other intellectual property law" ([Acceptable Use Policy](https://x.ai/legal/acceptable-use-policy)). For the "toys" category, ask for a generic teddy bear, not a named TV character.
- Age: "You must be at least 13 years old or the minimum age required in your country to use the Service…" ([consumer terms](https://x.ai/legal/terms-of-service)). The parent runs the tool; the child only sees the reviewed pictures.
- Outputs can be off: "the Service may produce outputs that you may consider inappropriate for a particular context." (same page). Review every picture by eye before it goes into the game.

## Recommendations

**Model:** `grok-imagine-image-2.0` through `POST /v1/images/edits` with 3 reference images, `resolution: "1k"`, `aspect_ratio: "1:1"`, `quality: "medium"` (use `"low"` while exploring), `n: 2`, `response_format: "b64_json"`. Budget option: `grok-imagine-image` (1.0) at a third of the price, with weaker style holding **[INFERENCE]**.

**Two modes:**
- **Gap-fill mode (preferred):** Fluent Emoji 3D covers what it covers. Generate only the missing words, with 3 Fluent 3D pictures from the same category as references (section 3).
- **Full-AI mode (if Fluent is dropped):** first make a "style bible" of 8 to 12 hero items text-only (cow, apple, car, teddy bear…), pick the 3 to 5 best, then use them as references for every other card.

**Prompt template** (the field order follows the xAI prompting guide; `{…}` are per-item slots):

```
One {object}, {key details: colour, form, count}, shown whole from a slight
front three-quarter view, centred and filling about 80% of the square.
Draw it as one more picture in the same 3D emoji set as <IMAGE_0>, <IMAGE_1>
and <IMAGE_2>: the same soft rounded toy-like shapes, the same smooth surface
with a gentle gloss, the same simple friendly face (for animals), the same
proportions and outline thickness.
Light: the same soft light from the top left as in the reference pictures,
bright and easy to read.
Colours: the {object} is {main colours}. The background is one flat, even,
solid {background colour} with nothing else on it.
Composition: one {object} only, the whole object inside the frame, no text.
```

Background colour rule **[INFERENCE]**: light grey `#E8E8E8` by default; dark blue `#1E3A8A` for white or very pale objects (sheep, egg, milk, cloud). Paint the reference pictures onto the same colour before you send them.

**Step-by-step pipeline:**
1. **Word list.** Write the 300 to 500 card words in a CSV: `id, word, category, details, colours, background`. Mark which ones Fluent already has.
2. **References.** For each category, pick 3 reference PNGs (Fluent or style-bible), flatten onto the background colour, scale to 1024 px.
3. **Pilot.** Run 20 items from 4 categories. Check style match, cost per call (`usage.cost_in_usd_ticks`), file type (`mime_type`), and any watermark. Adjust the template once.
4. **Batch.** A small Python script loops over the CSV and calls `/v1/images/edits` (one request at a time is fine). Save each image with its prompt and the full JSON reply. Use `deferred: true` only if calls time out.
5. **Review.** Build one contact sheet per category (for example 6×6 tiles with ffmpeg's `tile` filter), with Fluent neighbours mixed in. Pick the better of the two candidates. For misses, change only the failing words and re-run.
6. **Cut out.** `rembg p -m birefnet-general raw/ cut/` (add `-dc` if you see coloured rims). Re-run the failures through an Apple Vision Swift script and keep the better one.
7. **Normalise.** Crop to the alpha bounding box, pad to a square with the same margin on every card (about 8%), resize to 512×512 with Lanczos. Keep a 1024 px PNG master.
8. **Export.** `cwebp -q 90 -alpha_q 100 -m 6 in.png -o out.webp` (add `-metadata all` if step 3 found provenance metadata). Ship WebP; keep PNG masters out of the app bundle.
9. **Motion.** CSS `transform` keyframes on the still (bounce, wiggle, pop). Optional: 5 to 10 Grok video celebration loops with `image` = `last_frame`, `duration: 2`, `resolution: "480p"`, `generate_audio: false`, cut out per frame, then `img2webp -loop 0`.
10. **Credits.** Add "Pictures created with Grok" and the Fluent MIT notice to an About screen.

**Sizes:** generate at 1024×1024; ship 512×512 WebP with alpha (≈170 CSS px at 3x, so 100 to 130 CSS px cards are sharp). If you mix in Fluent 3D (256×256 source), ship all cards at one size and check that the 256 px ones are not visibly softer.

**Cost estimate** (all from the prices quoted in section 2; the assumptions are mine):
- Each item = one request with `n: 2`, plus a second request for 25% of items. That is 1.25 requests and 2.5 pictures per item.
- Edits use 3 reference images. I assume inputs are billed once per request; if they are billed per output picture, use the "worst case" row.
- Background removal and resizing run locally and cost $0.

| Setup | Cost per request | Per item | **200 items** | **500 items** |
|---|---|---|---|---|
| A. Image 2.0 edit, medium, 1K, 3 refs (recommended) | 3×$0.01 + 2×$0.06 = $0.15 | $0.19 | **$37.50** | **$93.75** |
| A, worst case (inputs billed per output) | 2×($0.03 + $0.06) = $0.18 | $0.23 | $45.00 | $112.50 |
| B. Image 2.0 edit, low, 1K, 3 refs | 3×$0.01 + 2×$0.04 = $0.11 | $0.14 | $27.50 | $68.75 |
| C. Image 2.0 text only, low, 1K (weaker consistency) | 2×$0.04 = $0.08 | $0.10 | $20.00 | $50.00 |
| D. Image 1.0 edit, 1K, 3 refs (budget) | 3×$0.002 + 2×$0.02 = $0.046 | $0.06 | $11.50 | $28.75 |
| One-off pilot and style bible (~40 pictures) | | | ~$5 | ~$5 |
| Optional: a 2 s video loop for every card (1.5, 480p) | ~$0.18 | ~$0.18 | ~$36 | ~$90 |

Bottom line for setup A plus the pilot: about **$43 for 200 items** and about **$99 for 500 items**, or up to about $118 if input images are billed per output. In gap-fill mode only the missing words are generated, so the real bill is a share of these numbers. The real cost is human review: 500 items × 2.5 candidates is about 1,250 pictures to check.

## Unknowns to test

1. **Style match from Fluent references.** Does a 3-reference edit really copy Fluent 3D's look, and do 256 px references need upscaling? Test on 20 items before committing.
2. **Watermark and provenance on API images.** Is there a visible mark or C2PA/XMP metadata? If so, the cut-out and WebP steps must keep it (the AUP bans stripping it).
3. **Input billing with `n > 1`.** Are reference images charged once per request or once per output? Read `usage.cost_in_usd_ticks` on the pilot.
4. **PNG alpha in references.** How does the API read transparent pixels? Flattening first avoids the question; test one unflattened file to know.
5. **Prompt rewriting.** The upsampler may change the background colour or add a floor or shadow. No switch to turn it off is documented.
6. **Output file type.** JPEG or PNG at `quality: medium`? JPEG artefacts hurt edges and rule out a clean chroma key.
7. **Cut-out quality on hard items.** Fluffy (sheep, chick), thin (bee legs, antennae), white-on-light (egg). Compare BiRefNet, ToonOut and Apple Vision on 20 hard cases.
8. **Drift over 500 items.** Recheck a random 10% at the end next to the first batch.
9. **Moderation false positives.** Toy sword, kitchen knife, toy gun, and so on. Each block costs money.
10. **Video loops.** Does image-to-video keep the cartoon style, loop cleanly at 1 to 2 s, and give a flicker-free per-frame mask? How big is a 2 s animated WebP at 512 px?
11. **Terms fit.** The API terms speak of "business purposes" and users 18+. Confirm this covers one parent making a private game, or ask support@x.ai.
12. **Apple-silicon speed.** How long do rembg/BiRefNet on CPU and Apple Vision take for 500 images on this Mac?
