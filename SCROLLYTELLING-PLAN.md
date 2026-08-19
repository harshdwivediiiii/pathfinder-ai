# Scrollytelling Hero — Implementation Plan

## Overview

Replace the existing `StoryboardHero` + `ScrollStory` on the marketing page with a
unified, Apple-style scroll-driven canvas frame-sequence hero. Build as a standalone
set of components importable from both `app/(marketing)/page.js` and `app/page.tsx`.

---

## File Structure (new files)

```
components/
  scrollytelling/
    CareerScrollScene.jsx       — Canvas frame-sequence renderer
    CareerTextOverlays.jsx      — Framer Motion text panels
    CareerScrollWrapper.jsx     — Page-level scroll orchestrator (sticky + progress)
    CareerDetailsSection.jsx    — Post-scroll content (IntersectionObserver reveal)
    index.js                    — Barrel export
public/
  career-sequence/              — Placeholder frame images (generated via script)
```

---

## Step 1: Generate Placeholder Frames

**What:** Create a Node script (`scripts/generate-placeholders.js`) that produces
90 PNG placeholder images at 1920×1080 using canvas (node-canvas) or a simpler
approach: SVG-to-PNG via a build-time script, or inline SVG data URIs at runtime.

**Preferred approach:** Since adding `node-canvas` as a dep is not approved, we'll
use **inline SVG data URIs** generated at component mount time as the placeholder
strategy. Each "frame" is a gradient background + stage label rendered as an SVG
blob URL. This means zero new files on disk for placeholders — the component
self-generates them.

When real frame art is provided, swap the data URI generation for
`/career-sequence/{i}.jpg` loading.

**Decision:** Skip the script. Use runtime SVG placeholders. The component will
have a `FRAME_COUNT = 90` constant and a `generatePlaceholderFrame(index)` function
that returns a data URI. A config flag `USE_PLACEHOLDERS = true` controls this.

---

## Step 2: `CareerScrollScene.jsx` — Canvas Renderer

**Location:** `components/scrollytelling/CareerScrollScene.jsx`

### Responsibilities
- Preload N frames (90) into `Image()` objects (or generate SVG data URIs)
- `<canvas>` drawn with `object-fit: cover` math: `scale = max(cw/iw, ch/ih)`, center crop
- Map `scrollProgress` (0–1) → `frameIndex = clamp(floor(scrollProgress * (N-1)))`
- Redraw only on frame change via `requestAnimationFrame`
- `devicePixelRatio`-aware canvas sizing + resize listener
- Loading overlay with progress bar while frames preload
- "Quality reveal" on first ~8% of scroll: canvas starts `blur(8px) scale(1.06)`,
  clears to `blur(0) scale(1)` via CSS transform driven by scrollProgress
- Fading brand wordmark (top-left), scroll hint (only before ~4% scroll), and
  4–5 progress dots reflecting scroll position

### Props
```js
{
  scrollProgress, // MotionValue 0–1 from parent
  className,      // Optional wrapper class
}
```

### Key Implementation Details
- `lastFrameRef` gates redundant draws
- `cancelAnimationFrame` on unmount
- Canvas ref stored in `useRef`
- Frame images stored in `useRef` (array of `Image` objects)
- Loading state via `useState` with percentage
- SVG placeholder generation: each frame gets a unique gradient hue based on index
  (hue = index * 4 for smooth rainbow), with stage text labels at breakpoints:
  - 0–24: "Skills Being Decoded"
  - 25–49: "Your Roadmap Takes Shape"  
  - 50–74: "Resume Optimization"
  - 75–89: "Offer Awaits"

---

## Step 3: `CareerTextOverlays.jsx` — Text Panels

**Location:** `components/scrollytelling/CareerTextOverlays.jsx`

### Responsibilities
4 panels driven by a shared `scrollMotionValue` (Framer Motion `useMotionValue`),
each using `useTransform` to map scroll ranges → `opacity`/`y`/`scale`:

| Panel | Scroll Range | Heading | Sub | Accent |
|-------|-------------|---------|-----|--------|
| 1 | 0.00–0.20 | "Your Skills, Decoded." | "AI reads between the lines of your experience." | left |
| 2 | 0.22–0.46 | "Every Step, Mapped." | "6–8mo Roadmap · 92% Match Score" (stat row) | right |
| 3 | 0.50–0.74 | "Resume, Rebuilt." | "3 Projects Suggested · ATS Score +40%" (stat row) | left |
| 4 | 0.78–1.00 | "Your Offer Awaits." | CTA teaser + button | center |

### Panel Animation Pattern
Each panel:
```js
const opacity = useTransform(scrollProgress, [start - 0.04, start, end - 0.04, end], [0, 1, 1, 0]);
const y = useTransform(scrollProgress, [start - 0.04, start, end - 0.04, end], [60, 0, 0, -60]);
const scale = useTransform(scrollProgress, [start - 0.04, start, end - 0.04, end], [0.96, 1, 1, 0.96]);
```

### Positioning
Alternate left/right/center via Tailwind:
- Panel 1: `items-start pl-[8%]` (left-aligned)
- Panel 2: `items-end pr-[8%]` (right-aligned)
- Panel 3: `items-start pl-[8%]` (left-aligned)
- Panel 4: `items-center text-center` (center)

### Stat Rows
Panels 2 and 3 include a stat row with animated counter values:
```jsx
<div className="flex gap-6 mt-6">
  <StatBadge value="6–8mo" label="Roadmap" />
  <StatBadge value="92%" label="Match Score" />
</div>
```

### Optional: Spin Badge
Each panel gets a rotating circular badge element (CSS `animate-spin-slow` or
Framer `rotate` animation) for visual rhythm.

### Props
```js
{
  scrollProgress, // MotionValue 0–1
}
```

---

## Step 4: `CareerScrollWrapper.jsx` — Orchestrator

**Location:** `components/scrollytelling/CareerScrollWrapper.jsx`

### Responsibilities
- Tall wrapper (~550vh), `position: sticky` inner container pinned to viewport
- Scroll listener computes `progress = clamp((-rect.top) / (wrapperHeight - innerHeight))`
- Feeds progress into both `CareerScrollScene` and `scrollMotionValue`
- Uses `overflow-x: clip` on ancestors so `position: sticky` isn't broken
- Wraps children in a container that has `will-change: transform` for GPU compositing

### Structure
```jsx
<section ref={wrapperRef} className="relative h-[550vh]">
  <div className="sticky top-0 h-screen overflow-hidden">
    <CareerScrollScene scrollProgress={scrollMV} />
    <CareerTextOverlays scrollProgress={scrollMV} />
  </div>
</section>
```

### Scroll Calculation
```js
useEffect(() => {
  const handleScroll = () => {
    const rect = wrapperRef.current.getBoundingClientRect();
    const wrapperH = wrapperRef.current.offsetHeight;
    const innerH = window.innerHeight;
    const progress = clamp(-rect.top / (wrapperH - innerH), 0, 1);
    scrollMV.set(progress);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

---

## Step 5: `CareerDetailsSection.jsx` — Post-Scroll Content

**Location:** `components/scrollytelling/CareerDetailsSection.jsx`

### Responsibilities
Revealed via `IntersectionObserver` after the scrollytelling section scrolls past.

### Sections

1. **"How PathFinder AI Works"** — 4–6 numbered step cards
   - Input Skills → AI Analysis → Personalized Roadmap → ATS Resume → Job Matches → Offer
   - Uses existing `TiltCard` + `StaggerContainer`/`StaggerItem` from `components/motion/`

2. **Stat Cards Row** — e.g.:
   - "10,000+ roles mapped"
   - "92% avg match score"
   - "3x faster job search"
   - Uses existing `FadeUp` wrapper

3. **Feature Pills Row** — e.g.:
   - "Personalized Roadmaps"
   - "ATS Resume AI"
   - "Live Job Matching"
   - "Interview Coaching"
   - Glass-morphism pill styling using existing `.glass` utility

4. **Closing CTA** — "Start Free" / "View Demo" buttons
   - Uses existing `Button` component + `MagneticButton`

### Animation
Each section uses `FadeUp` (existing component) for scroll-triggered reveal.
Stat numbers use a `CountUp` animation (similar to existing `HeroStats`).

---

## Step 6: Integration into Landing Pages

### `app/(marketing)/page.js`
Replace:
```jsx
<StoryboardHero autoPlay={true} interval={5000} />
<ScrollStory />
```
With:
```jsx
import { CareerScrollWrapper } from "@/components/scrollytelling";

<CareerScrollWrapper />
```

Keep all other sections (Features, How It Works, Stats, Testimonials, Pricing, FAQ, CTA, OpenSource).

Update `GlobalScrollTracker.jsx` to hide during the new scrollytelling section
(check for a new section ID like `career-scroll` instead of `scroll-story`).

### `app/page.tsx`
Add the scrollytelling hero before the existing hero content, or replace the
inline `HeroSection` with `CareerScrollWrapper`. This is a secondary integration
point — the user chose "Both" but the primary target is the marketing page.

---

## Step 7: Barrel Export

### `components/scrollytelling/index.js`
```js
export { CareerScrollWrapper } from "./CareerScrollWrapper";
export { CareerScrollScene } from "./CareerScrollScene";
export { CareerTextOverlays } from "./CareerTextOverlays";
export { CareerDetailsSection } from "./CareerDetailsSection";
```

---

## Performance Considerations

- **Frame count:** 90 frames (good balance — reference used 240, but 90 with
  smaller images is faster)
- **Preload sequentially** with `img.decoding = 'async'`, track load % for loading bar
- **Only redraw canvas on frame change**, gated with `lastFrameRef`
- **Cancel any pending `requestAnimationFrame`** on unmount
- **SVG placeholders** are instant (no network fetch) — real frames will need
  the sequential preloading strategy
- **`will-change: transform`** on the sticky container for GPU compositing
- **`passive: true`** on scroll listeners
- **Canvas uses `devicePixelRatio`** for sharp rendering on Retina displays

---

## Styling Conventions (must follow)

- All Tailwind v4 utility classes — no hardcoded colors
- Use `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`,
  `text-primary`, `border-border` etc. for all solid backgrounds/text
- Use existing `.glass`, `.text-gradient-primary`, `.glass-pill` utilities where appropriate
- No new CSS file — all styles via Tailwind utilities + existing globals.css tokens
- `.jsx` files only (not `.tsx`)
- `"use client"` at top of every component that uses hooks/canvas/scroll

---

## Content Dependencies (flagged)

1. **Frame sequence images** — Currently using SVG data URI placeholders.
   When real art is provided:
   - Place JPGs in `public/career-sequence/001.jpg` through `090.jpg`
   - Set `USE_PLACEHOLDERS = false` in `CareerScrollScene.jsx`
   - The preloading logic will switch to `new Image(); img.src = '/career-sequence/${i}.jpg'`

2. **Stat copy** — The stat values ("92% Match Score", "ATS Score +40%", etc.)
   are hardcoded placeholders. May need approval from product/marketing.

---

## Order of Implementation

1. Create `components/scrollytelling/` directory
2. Build `CareerScrollScene.jsx` (canvas + SVG placeholders + loading overlay)
3. Build `CareerTextOverlays.jsx` (4 panels with scroll-linked animations)
4. Build `CareerScrollWrapper.jsx` (sticky orchestrator)
5. Build `CareerDetailsSection.jsx` (post-scroll content sections)
6. Create `components/scrollytelling/index.js` barrel
7. Integrate into `app/(marketing)/page.js` (replace StoryboardHero + ScrollStory)
8. Update `GlobalScrollTracker.jsx` for new section ID
9. Secondary integration into `app/page.tsx`
10. Verify no lint/type errors
