# FIZZ — Scroll-Driven Automotive Experience

A cinematic, single-page automotive concept site whose hero is a **pinned, scroll-scrubbed car sequence** built with GSAP ScrollTrigger. FIZZ is a fictional brand; all figures on the site are illustrative.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- GSAP 3 + ScrollTrigger + ScrollToPlugin, loaded on demand (see *Engineering notes*)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run lint
```

## How the scroll animation works

The hero (`components/ScrollCarExperience.tsx`) has two independent layers of motion:

1. **Opening sequence (time-based, pure CSS)**: plays once from the first paint, before and without JavaScript. A warm bloom rises in a near-black frame, two crimson hairlines part like a letterbox and reveal the car, and a slow push-in settles the composition. The headline lines rise out of masks, then the copy and the three metrics follow in sequence. It is defined in `app/globals.css` ("Opening sequence") and only animates *inner* `[data-intro]` layers. JS adds the metric count-up when it can still start in sync; the delay is read from the CSS animation itself.
2. **Scroll timeline (scrubbed)**: one `gsap.timeline` attached to a ScrollTrigger with `pin: true` and `scrub: 0.5`. It animates the *outer* wrappers, so the two timelines never compete for the same property. Its progress is a pure function of scroll position: stop scrolling and it holds, scroll back and it reverses exactly.

The scroll timeline runs through five stages:

| Stage | What happens |
| --- | --- |
| A — Arrival | Initial composition; scroll indicator fades |
| B — Immersion | Camera push-in on the front-left shot; headline, copy and metrics clear the frame |
| C — Detail | The exposure dips, then a crimson edge with a soft light spill cuts to the **opposite real camera angle** while the outgoing shot keeps travelling; callouts draw on once the new shot has settled |
| D — Transition | Lighting shifts from dusk to crimson |
| E — Release | The letterbox closes into a crimson slit, then the pin releases into Section 01 |

A HUD (stage list, frame counter `000–240`, camera-view label) is updated from the timeline's `onUpdate` by writing directly to the DOM, so the scroll↔animation sync is visible without causing React re-renders.

The car is a set of photographs, not a 3D model. Motion is cinematic 2D: transform-only push-ins, parallax, clip-path wipes and masks, plus cuts between the supplied camera angles.

Other scroll-linked pieces:
- **Design**: a pinned camera dolly pans along the car's body, with callouts locked to features in the photo.
- **Technology**: a pull-back with numbered callouts.
- **Engineering**: bars and counters scrubbed together.
- **Gallery**: parallax plates.
- **Redline**: a final pull-back.

### Engineering notes

- Each shot is sized to its photo's own aspect ratio (`--ar`) instead of `object-fit: cover`, so percentage-positioned callouts stay on the car at every viewport, and image loading can't change any measured layout.
- **GSAP is not in the initial bundle.** `loadMotion()` in `lib/motion.ts` dynamic-imports GSAP and its plugins once, at hydration. Nothing above the fold needs it to paint, because the opening is CSS. This took about 115 KB (raw) of script off the critical path.
- **`useMotion(scopeRef, setup)`** (in `lib/motion.ts`) replaces `useGSAP`. It queues the setup, runs it inside a `gsap.context` scoped to the component, and reverts every tween, ScrollTrigger and `matchMedia` on unmount. React Strict Mode double-mounting leaves exactly the expected pins. Setup may return a cleanup function, and `ctx.add()` covers animations created later.
- **Rendered pin spacers.** Both pinned sections render their own wrapper `<div>` and pass it as ScrollTrigger's `pinSpacer`. Otherwise ScrollTrigger re-parents the section into a generated wrapper, which restarts CSS animations (it used to restart the opening sequence mid-play) and moves React-managed nodes.
- `gsap.matchMedia()` sets up separate configurations (shorter pin on mobile) and a `prefers-reduced-motion` mode (no pins, no opening animation, all content static and visible). The Design section's side-by-side pinned dolly uses the `wide` breakpoint (`MQ.wide` in JS, the `wide:` Tailwind variant in CSS): at least 768 px wide **and** landscape. Portrait tablets get the stacked layout, avoiding a ~1.8× upscale of the photo.
- HUD stages are derived from the timeline's own labels (`tl.labels`), so the readout can't drift from the animation. Letterbox geometry measures the pinned section, not `window.innerHeight`, which differs on mobile browsers.
- Distances use function values with `invalidateOnRefresh`. Deep links (`/#gallery`) are resolved after pin spacers exist, and a full `ScrollTrigger.refresh()` runs only if web fonts were still loading during setup.
- **Ordered setup queue.** Components build their timelines one per animation frame, strictly in page order, so each pin spacer exists before anything below it is measured. This replaced a single >1 s main-thread task on throttled mobile CPUs. Page-wide triggers (scroll progress bar) wait for the queue to drain (`whenMotionReady`) so `end: "max"` is measured against the final page height. ScrollTrigger's automatic refresh on window `load` is disabled because image loading cannot change layout (every image sits in a CSS-sized box).
- The hero photo (the LCP element) loads with `fetchPriority="high"`. The second camera angle isn't seen until the cut, so it is requested after `load` (or on the first scroll) instead of competing with it.
- Navigation targets a pinned section's pin spacer, so the nav still works from inside a pin. The mobile menu traps focus, closes on Escape and when the viewport reaches the desktop layout, and covers every section, including Engineering and Redline.
- In-page navigation uses `ScrollToPlugin` (with `autoKill`), not CSS `scroll-behavior`, and moves focus to the target section.
- Without JavaScript, all content is visible: the opening sequence is CSS, the scroll HUD is hidden, and the nav links are plain anchors.

## FIZZ Driver Experience (optional game layer)

An opt-in progression system layered over the existing site. It's off until the visitor presses **Start experience** (hero) or starts it from the **Driver** gauge in the header. The site works the same without it, and without JavaScript the game's controls are hidden.

### Missions and rewards (`lib/driver.ts` is the single source of truth)

| | Unlock rule | XP |
| --- | --- | --- |
| 01 Performance Explorer | Performance section stays in the middle of the viewport for 1.2 s | 100 |
| 02 Design Connoisseur | Same, Design section | 100 |
| 03 Technology Specialist | Same, Technology section | 100 |
| 04 Engineering Insider | Same, Engineering section | 100 |
| 05 Gallery Hunter | Open any plate in the Gallery viewer | 100 |
| Inspection: front / side / rear | Open a hotspot in the matching group (Design callouts; Technology plan view) | 50 each |
| **REDLINE** | Automatically, once, when all five missions are complete | 250 |

Levels: Rookie (0), Contender (150), Pro (350), Elite (600), Legend (900 = everything). XP and levels are game rewards, not vehicle data. Completion % = completed missions / 5. XP, level, completion and the current mission are **derived** from the stored lists of completed IDs, never stored, so they can't drift apart.

Because rewards are set-based, they are idempotent: revisiting a section, re-opening a hotspot or crossing a section repeatedly never grants XP twice. The 1.2 s "dwell" means fast scroll-throughs don't count, while normal scrolling, menu links and deep links all do.

### Architecture

- `lib/driver.ts`: definitions, `deriveStats()`, validated storage parsing, cosmetic driver-ID generator.
- `lib/driverStore.ts`: one module-level store read via `useSyncExternalStore`. The server snapshot is always "not started", so markup hydrates identically and real progress arrives in the first client render. Every mutation goes through one synchronous `update()`, which is the only place rewards (and REDLINE) are granted and the only place unlock notifications are emitted (by diffing old vs new). It runs outside React updaters, so Strict Mode can't double-grant. The hero never subscribes, so game updates never re-render it.
- `components/driver/`: `DriverButton` (header gauge), `MissionPanel` (drawer: level, XP, missions, inspection checklist, REDLINE, reset with confirmation), `MissionToast` (top-layer popover so it shows above an open dialog; announcements go through an always-present polite live region), `MissionTracker` (IntersectionObserver), `Hotspot`, `IntroControls` (Start / Skip intro), `RedlineStatus` (finale), `DriverCardDialog` (REDLINE reveal + card).
- **Storage:** `localStorage["fizz.driver.v1"]` holds `{ v, started, missions[], discoveries[], redlineAt }`. Each read is validated: unknown IDs, duplicates, a wrong version, malformed JSON, or a REDLINE timestamp without five missions are discarded. The driver ID lives in `sessionStorage` (cosmetic, random, per session, not an account). If storage is blocked, the game runs in memory.
- **Opening:** *Skip intro* finishes the running CSS animations in place (`Animation.finish()`), so nothing restarts. Returning visitors get a compressed opening: the `<head>` script sets `--t: 0.4`, which scales every CSS timing before first paint.
- **Driver card:** rendered with the Canvas API (no dependency) to a 1200 × 630 JPEG for download and Web Share; *Copy summary* is the fallback. Status messages only report what actually happened.

## Assets

Images live in `public/images/` and were converted to WebP from the supplied renders. Next.js serves responsive AVIF/WebP variants.

| File | Pixels | Size | Shot | Used in |
| --- | --- | --- | --- | --- |
| `fizz-hero-silver.webp` | 1860 × 724 | 107 KB | Silver car, front-left three-quarter (cropped from 2172 px to remove outpainting artifacts at the right edge) | Hero (opening angle), Design pan, Gallery |
| `fizz-silver-front.webp` | 2172 × 724 | 177 KB | Silver car, front-right three-quarter | Hero (second angle), Gallery |
| `fizz-rear-sunset.webp` | 2172 × 724 | 170 KB | Dark car, rear three-quarter at sunset | Performance, Gallery |
| `fizz-redline-overhead.webp` | 2171 × 724 | 95 KB | Black car, overhead rear with red lighting | Technology, Gallery, Redline |

### Known limitation: source resolution

Every render is only **724 px tall**, and a search of the local machine found no higher-resolution versions. To limit softness, the layouts cap upscaling:
- Hero push-ins stop at 1.16× (desktop) and 1.2× (mobile).
- The pinned Design pan renders at about 1.24× on a 1440 × 900 screen.
- Portrait tablets use stacked layouts at about 1.0×.

Large and high-DPI screens will still show some softness. There is no dedicated body close-up, so the Design section is a slow pan across the hero photograph, and is described that way.

### Recommended replacement renders

| Priority | Asset | Recommended size | Notes |
| --- | --- | --- | --- |
| 1 | Hero front-left + front-right angles | 4344 × 1448 px (2× current) or larger, WebP/AVIF ≤ 400 KB each | Same car, lighting and horizon height in both, so the camera cut stays continuous. Car centred at roughly the same horizontal position (`--cx` ≈ 0.52–0.53). |
| 2 | Body close-up for Design | ≥ 3600 × 1400 px | A genuine side-profile detail pass (headlight → wheel → intake) to replace the pan across the hero photo. |
| 3 | Rear three-quarter, overhead | ≥ 3200 px wide | Lower priority: shown at smaller sizes. |

**To swap in a render:** replace the file in `public/images/`, keep the filename, and update its `width`/`height` in `lib/site.ts`. The animation system needs no other changes if the framing is similar. If the framing changes, re-check the callout percentages (`DETAIL_NOTES`, `SURFACES`, `SYSTEMS`), the hero's `--cx` car-centre values, and the Design pan's start offset.

## Deployment (Vercel)

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Or import the GitHub repository at https://vercel.com/new (framework preset: Next.js, no environment variables required).
