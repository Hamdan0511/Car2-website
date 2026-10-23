# FIZZ — Scroll-Driven Automotive Experience

A cinematic, single-page automotive concept site whose hero is a **pinned, scroll-scrubbed car sequence** built with GSAP ScrollTrigger. FIZZ is a fictional brand; all figures on the site are illustrative.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- GSAP 3 + ScrollTrigger + ScrollToPlugin, via `@gsap/react` (`useGSAP`)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run lint
```

## How the scroll animation works

The hero (`components/ScrollCarExperience.tsx`) has two independent timelines:

1. **Intro timeline (time-based)**: plays once on load. The frame opens from a letterbox slit, the headline lines rise out of masks, then the copy and the three metrics follow in sequence (the metrics count up). It only animates *inner* `[data-intro]` layers.
2. **Scroll timeline (scrubbed)**: one `gsap.timeline` attached to a ScrollTrigger with `pin: true` and `scrub: 0.5`. It animates the *outer* wrappers, so the two timelines never compete for the same property. Its progress is a pure function of scroll position: stop scrolling and it holds, scroll back and it reverses exactly.

The scroll timeline runs through five stages:

| Stage | What happens |
| --- | --- |
| A — Arrival | Initial composition; scroll indicator fades |
| B — Immersion | Camera push-in on the front-left shot; headline, copy and metrics clear the frame |
| C — Detail | A crimson wipe cuts to the **opposite real camera angle**; callouts draw onto the car |
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
- `gsap.matchMedia()` sets up separate desktop and mobile configurations (shorter pin on mobile, no pin in Design on mobile) and a `prefers-reduced-motion` mode (no pins, no intro, all content static and visible).
- `useGSAP` scopes and reverts every tween and ScrollTrigger, so React Strict Mode doesn't create duplicates.
- Distances use function values with `invalidateOnRefresh`. `ScrollTrigger.refresh()` runs again after web fonts load, and deep links (`/#gallery`) are resolved after pin spacers exist.
- In-page navigation uses `ScrollToPlugin` (with `autoKill`), not CSS `scroll-behavior`, and moves focus to the target section.
- If JavaScript fails after the first paint, a CSS failsafe reveals the intro-hidden content.

## Assets

Images live in `public/images/` and were converted to WebP from the supplied renders:

| File | Source | Notes |
| --- | --- | --- |
| `fizz-hero-silver.webp` | silver car, front-left three-quarter | Cropped to 1860 px wide to remove outpainting artifacts at the right edge |
| `fizz-silver-front.webp` | silver car, front-right three-quarter | — |
| `fizz-rear-sunset.webp` | dark car, rear three-quarter at sunset | — |
| `fizz-redline-overhead.webp` | black car, overhead rear with red lighting | — |

The source renders are only 724 px tall, so full-bleed use is upscaled about 1.2–1.4× on large screens. Higher-resolution originals (≥ 1600 px tall) would noticeably sharpen the hero. There was no dedicated body close-up, so the Design section pans across a crop of the hero photo.

## Deployment (Vercel)

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

Or import the GitHub repository at https://vercel.com/new (framework preset: Next.js, no environment variables required).
