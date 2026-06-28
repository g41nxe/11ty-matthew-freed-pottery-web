# Concept A Homepage Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Matthew Freed Pottery homepage in the real Eleventy site to match the approved "Concept A — Studio Art-Zine" mockup, wired to existing repo data/content.

**Architecture:** The visual + interaction reference is the self-contained mockup `docs/mockups/A-studio-art-zine.html`. We port it section-by-section into Eleventy Nunjucks partials under `src/views/_includes/partials/`, drive every string/image from the existing `_data/*.json` + `views/*.md` files, add the new brand tokens/fonts/CSS to `src/styles/main.css`, and replace the Glide-based homepage carousels with the mockup's CSS-scroll-snap + vanilla-JS interactions in `src/javascript/home.js`. Other pages keep their current layouts (they inherit the new global tokens/fonts only).

**Tech Stack:** Eleventy 3.1 (Nunjucks, `.md`/`.njk`), Tailwind v4 (CSS-first `@theme` in `src/styles/main.css`, compiled by postcss-cli), `@11ty/eleventy-img` 6 (`{% img %}` async shortcode), Luxon date filters, Alpine 2.7 (already loaded), Glide 3.3 (kept for non-home pages), Sveltia CMS.

---

## Global Constraints

Copied verbatim from `docs/plans/2026-06-24-site-redesign.md` §8 (the spec) — every task implicitly includes these:

- **Content rule:** ALL production copy + images must originate from existing repo files (`src/views/_data/*.json`, `src/views/*.md`, `src/images/**`). Reorganizing/adding fields is allowed; **no invented copy, no new stock imagery.** Any mockup filler (featured blurbs, event blurbs, prices, testimonials) must be replaced by real data or a new CMS-backed field populated from existing wording.
- **Images:** never hard-code `https://matthewfreed.ca/images/…` (mockup placeholders). Use the `{% img %}` shortcode with sources from `src/images/`. Signature: `{% img src, alt, sizes, classes, loading, ratio, focal %}` — `src` is the stored `/images/...` path (the shortcode prepends `src`).
- **Fonts:** Fraunces (serif display, italic) + Space Grotesk (sans body).
- **Palette tokens:** navy `#050237`, gold `#E9B45A` (bright = action), gold-deep `#b8862f` (small labels on light), ink `#26233d` (body), paper/cream `#FBF8F1`, line `#e7ddcf`, carved-brown `#6e4a22` (motif on gold).
- **Colour usage:** gold = primary action (buttons/CTAs); deep gold = small uppercase labels on light; navy = panels (maker, newsletter) + headlines; carved-brown motif on gold, gold motif on navy.
- **Brand motif:** one reusable carved-flower SVG (big 4-petal veined flowers + diagonal drop-leaves + ringed-dot centre on a 60px grid, small 5-petal flower in each gap). Brown-on-gold in hero circle, gold-on-navy in newsletter, single petal in dividers.
- **Links:** standardize all shop URLs on `shop.matthewfreed.net`; open external shop links in a new tab. Retire raw `*.myshopify.com`.
- **Section order:** Nav → Hero (01) → Trust marquee → Featured (02) → divider → Collections (03) → divider → Maker (04) → divider → Events (05) → Newsletter → Footer.
- **Pre-prod (do NOT do mid-build, listed in final task):** revert Sveltia `backend.branch` in `src/admin/config.yml` to the deploy branch.

### Project facts the implementer needs

- **Branch:** work on `feat/site-redesign` (off `feat/sveltia-cms-migration`). Confirm with `git branch --show-current` before starting; do not build on `main`.
- **Build:** `npm run build` → outputs to `dist/` (runs `clean` → `styles:prod` → eleventy). `clean` uses `rm -rf`, so **run npm via Git Bash** (the Bash tool), not PowerShell/cmd.
- **Dev server:** `npm run dev` serves on `http://localhost:8080` with watch.
- **No unit-test framework exists** (`npm test` is a stub). "Tests" in this plan = (a) `npm run build` exits 0, (b) `grep` the built `dist/index.html` for expected markup, (c) visual check in the dev server / preview. Each task's verification uses these.
- **Eleventy dirs:** input `src/views`, includes `_includes/partials` (so `{% include "x.njk" %}` → `partials/x.njk`), layouts `_includes/layouts`, output `dist`.
- **Homepage entry:** `src/views/home.md` (front matter only) → `home-layout.njk` → includes the home partials → `base.njk`.
- **Existing home partials to replace:** `hero.njk`, `home-features.njk`, `home-showcase.njk`, `home-events.njk` (+ `notification.njk`).
- **Tailwind v4** is CSS-first: tokens live in the `@theme { }` block in `src/styles/main.css`; component CSS lives below it in the same file. Interpolated class names need `@source inline(...)` safelisting (see existing examples at top of `main.css`).

---

## File map

**Create:**
- `src/views/_includes/partials/carved-flower.njk` — reusable motif SVG (params: variant).
- `src/views/_includes/partials/section-divider.njk` — hairline + centred carved flower (used once, before newsletter).
- `src/views/_includes/partials/home-hero.njk` — Concept A hero (replaces `hero.njk` on home).
- `src/views/_includes/partials/home-trust.njk` — trust marquee band.
- `src/views/_includes/partials/home-featured.njk` — featured slider (replaces `home-features.njk`).
- `src/views/_includes/partials/home-collections.njk` — collections grid (replaces `home-showcase.njk`).
- `src/views/_includes/partials/home-maker.njk` — meet-the-maker navy panel.
- `src/views/_includes/partials/home-newsletter.njk` — navy newsletter panel.

**Modify:**
- `src/styles/main.css` — add fonts/tokens to `@theme`; add Concept A homepage component CSS.
- `src/views/_includes/layouts/base.njk` — add Google Fonts links.
- `src/views/_includes/partials/nav.njk` — gold Shop button + Collections link.
- `src/views/_includes/partials/home-events.njk` — rebuild as accordion list.
- `src/views/_includes/layouts/home-layout.njk` — new include order.
- `src/views/home.md` — front matter for new hero CTAs / section copy.
- `src/views/_data/global.json` — hero CTAs, trust-bar items, shop domain, newsletter copy.
- `src/views/_data/showcase.json` — per-glaze shop links on `shop.matthewfreed.net`.
- `src/views/_data/features.json` — prices + shop-domain hygiene.
- `src/javascript/home.js` — slider arrows, show-all toggle, events accordion.
- `src/admin/config.yml` — new CMS fields (final task), backend.branch revert (final task).

**Reference (read-only source of truth for markup/CSS):**
- `docs/mockups/A-studio-art-zine.html` — copy section markup + the exact CSS from here.

---

## Task 1: Brand tokens, fonts, and base CSS scaffold

**Files:**
- Modify: `src/views/_includes/layouts/base.njk` (head, around line 13–16)
- Modify: `src/styles/main.css` (`@theme` block line 14–35; append component CSS at end)

**Interfaces:**
- Produces: theme tokens `--color-paper`, `--color-ink`, `--color-gold` (alias of highlight `#E9B45A`), `--color-gold-deep`, `--color-line`, `--color-carved` and font vars `--font-display` (Fraunces), `--font-sans` (Space Grotesk). Produces a `/* ===== Concept A homepage ===== */` CSS region at the end of `main.css` that later tasks append section styles into.

- [ ] **Step 1: Add the Google Fonts links** to `base.njk` `<head>` (after the existing `main.css` link, line 13). Replace the current Playfair/Open-Sans-free head (fonts are currently only declared in CSS) by adding:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500;1,9..144,600&family=Space+Grotesk:wght@300;400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Update the `@theme` block** in `src/styles/main.css`. Set the font vars and add the new colour tokens (keep existing tokens that other pages use; `--color-highlight` stays as the gold):

```css
    --font-sans: 'Space Grotesk', system-ui, sans-serif;
    --font-display: 'Fraunces', Georgia, serif;

    --color-brand: #050237;        /* navy */
    --color-highlight: #E9B45A;    /* gold (action) */
    --color-gold: #E9B45A;
    --color-gold-deep: #b8862f;
    --color-paper: #FBF8F1;        /* cream */
    --color-ink: #26233d;
    --color-line: #e7ddcf;
    --color-carved: #6e4a22;
```

- [ ] **Step 3: Append the Concept A CSS region** at the very end of `src/styles/main.css`. Open the region now (later tasks append to it). Set the page background + base type:

```css
/* ===== Concept A homepage ===== */
body.bg-gray-default { background: var(--color-paper); color: var(--color-ink); }
.ca-wrap { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
.ca-disp { font-family: var(--font-display); }
.ca-idx { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: var(--color-gold-deep); font-weight: 600; }
```

- [ ] **Step 4: Build and verify tokens compile.** Run (Git Bash):

```
npm run build
```

Expected: exits 0. Then verify the compiled CSS contains the new font + cream background:

```
grep -c "Space Grotesk" dist/styles/main.css
grep -c "FBF8F1\|#fbf8f1" dist/styles/main.css
```

Expected: both ≥ 1.

- [ ] **Step 5: Commit.**

```
git add src/styles/main.css src/views/_includes/layouts/base.njk
git commit -m "feat(home): add Concept A brand tokens + fonts"
```

---

## Task 2: Reusable carved-flower motif partial

**Files:**
- Create: `src/views/_includes/partials/carved-flower.njk`

**Interfaces:**
- Produces: `{% include "carved-flower.njk" %}` rendered with a `cf` context object: `{% set cf = { variant: "hero" } %}` then include. `variant` is `"hero"` (brown on gold) or `"news"` (gold on navy). Renders an inline `<svg class="cf-svg cf-svg--{variant}">` with a tiling `<pattern>`. Element IDs are suffixed with `{variant}` to avoid duplicate-ID collisions when both appear on the page.

- [ ] **Step 1: Create the partial.** Copy the pattern geometry verbatim from the mockup (`docs/mockups/A-studio-art-zine.html`, the hero `.blob` SVG and the `.news-bg` SVG), parameterised by `cf.variant`. The pattern: defs `bigpet` (`M0,0 C5,-11 5,-23 0,-31 C-5,-23 -5,-11 0,0` + vein `M0,-6 L0,-26`), `drop` (`M0,-12 C5.5,-15 5.5,-23 0,-29 C-5.5,-23 -5.5,-15 0,-12`), `mp` (`M0,0 C3,-5 3,-10 0,-13 C-3,-10 -3,-5 0,0`); group `fl` = 4× bigpet at rotate 0/90/180/270 + 4× drop at 45/135/225/315 + `<circle r="3.2">`; group `mini` = 5× mp at 0/72/144/216/288 + `<circle r="1.6">`; `<pattern width="60" height="60" patternUnits="userSpaceOnUse">` placing `fl` at (0,0),(60,0),(0,60),(60,60) and `mini` at (30,30); a `<rect>` filled with the pattern. Stroke colour: `var(--color-carved)` for `hero`, `var(--color-gold)` for `news`. Use `stroke="currentColor"` on the groups and set `color` via the wrapping class so one geometry serves both:

```njk
<svg class="cf-svg cf-svg--{{ cf.variant }}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <g id="cf-bigpet-{{ cf.variant }}"><path d="M0,0 C5,-11 5,-23 0,-31 C-5,-23 -5,-11 0,0"/><path d="M0,-6 L0,-26"/></g>
    <path id="cf-drop-{{ cf.variant }}" d="M0,-12 C5.5,-15 5.5,-23 0,-29 C-5.5,-23 -5.5,-15 0,-12"/>
    <path id="cf-mp-{{ cf.variant }}" d="M0,0 C3,-5 3,-10 0,-13 C-3,-10 -3,-5 0,0"/>
    <g id="cf-fl-{{ cf.variant }}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <use href="#cf-bigpet-{{ cf.variant }}"/><use href="#cf-bigpet-{{ cf.variant }}" transform="rotate(90)"/><use href="#cf-bigpet-{{ cf.variant }}" transform="rotate(180)"/><use href="#cf-bigpet-{{ cf.variant }}" transform="rotate(270)"/>
      <use href="#cf-drop-{{ cf.variant }}" transform="rotate(45)"/><use href="#cf-drop-{{ cf.variant }}" transform="rotate(135)"/><use href="#cf-drop-{{ cf.variant }}" transform="rotate(225)"/><use href="#cf-drop-{{ cf.variant }}" transform="rotate(315)"/>
      <circle r="3.2" stroke-width="1.3"/>
    </g>
    <g id="cf-mini-{{ cf.variant }}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <use href="#cf-mp-{{ cf.variant }}"/><use href="#cf-mp-{{ cf.variant }}" transform="rotate(72)"/><use href="#cf-mp-{{ cf.variant }}" transform="rotate(144)"/><use href="#cf-mp-{{ cf.variant }}" transform="rotate(216)"/><use href="#cf-mp-{{ cf.variant }}" transform="rotate(288)"/>
      <circle r="1.6"/>
    </g>
    <pattern id="cf-carve-{{ cf.variant }}" width="60" height="60" patternUnits="userSpaceOnUse">
      <use href="#cf-fl-{{ cf.variant }}"/><use href="#cf-fl-{{ cf.variant }}" x="60"/><use href="#cf-fl-{{ cf.variant }}" y="60"/><use href="#cf-fl-{{ cf.variant }}" x="60" y="60"/><use href="#cf-mini-{{ cf.variant }}" x="30" y="30"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#cf-carve-{{ cf.variant }})"/>
</svg>
```

- [ ] **Step 2: Add the motif CSS** to the Concept A region in `main.css`:

```css
.cf-svg { width: 100%; height: 100%; display: block; }
.cf-svg--hero { color: var(--color-carved); opacity: .5; }
.cf-svg--news { color: var(--color-gold); opacity: .14; }
```

- [ ] **Step 3: Smoke-test render.** Temporarily add to `home-layout.njk` above the hero include: `{% set cf = { variant: "hero" } %}{% include "carved-flower.njk" %}`. Run `npm run build`, then:

```
grep -c "cf-carve-hero" dist/index.html
```

Expected: ≥ 1. Then remove the temporary include line (the hero task wires it properly).

- [ ] **Step 4: Commit.**

```
git add src/views/_includes/partials/carved-flower.njk src/styles/main.css
git commit -m "feat(home): reusable carved-flower motif partial"
```

---

## Task 3: Section divider partial

> **Design note (2026-06-24):** the divider ornament is a **carved flower** (4 big petals + 4 diagonal drop-leaves + centre dot), **centred on the hairline** — NOT a single petal. It is used **exactly once**, before the newsletter (see Task 12). Earlier rounds used a single petal at four section breaks; both were dialled back.

**Files:**
- Create: `src/views/_includes/partials/section-divider.njk`
- Modify: `src/styles/main.css` (Concept A region)

**Interfaces:**
- Produces: `{% include "section-divider.njk" %}` — a `<div class="ca-divider">` with the carved-flower ornament. No params.

- [ ] **Step 1: Create the partial** (flower geometry copied verbatim from the mockup divider):

```njk
<div class="ca-divider"><svg width="42" height="42" viewBox="-23 -23 46 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="#b8862f" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path d="M0,0 C4,-7 4,-15 0,-20 C-4,-15 -4,-7 0,0"/><path d="M0,0 C4,-7 4,-15 0,-20 C-4,-15 -4,-7 0,0" transform="rotate(90)"/><path d="M0,0 C4,-7 4,-15 0,-20 C-4,-15 -4,-7 0,0" transform="rotate(180)"/><path d="M0,0 C4,-7 4,-15 0,-20 C-4,-15 -4,-7 0,0" transform="rotate(270)"/></g><g stroke-width="1.3"><path d="M0,-6 C3,-9 3,-13 0,-16 C-3,-13 -3,-9 0,-6" transform="rotate(45)"/><path d="M0,-6 C3,-9 3,-13 0,-16 C-3,-13 -3,-9 0,-6" transform="rotate(135)"/><path d="M0,-6 C3,-9 3,-13 0,-16 C-3,-13 -3,-9 0,-6" transform="rotate(225)"/><path d="M0,-6 C3,-9 3,-13 0,-16 C-3,-13 -3,-9 0,-6" transform="rotate(315)"/></g><circle r="2.2" stroke-width="1.2"/></g></svg></div>
```

- [ ] **Step 2: Add the divider CSS** to the Concept A region (centre the flower on the hairline):

```css
.ca-divider { display: flex; align-items: center; gap: 22px; max-width: 1100px; margin: 0 auto; padding: 0 32px; }
.ca-divider::before, .ca-divider::after { content: ""; flex: 1; height: 1px; background: var(--color-line); }
.ca-divider svg { flex: none; }
```

- [ ] **Step 3: Build + verify.** `npm run build`, then add a temp include in `home-layout.njk`, build, `grep -c "ca-divider" dist/index.html` (expect ≥1), remove temp include.

- [ ] **Step 4: Commit.**

```
git add src/views/_includes/partials/section-divider.njk src/styles/main.css
git commit -m "feat(home): section-divider partial"
```

---

## Task 4: Navigation — gold Shop button + Collections link

**Files:**
- Modify: `src/views/_includes/partials/nav.njk`
- Modify: `src/styles/main.css` (Concept A region)
- Modify: `src/views/_data/global.json` (add `shop.url` on the branded domain — see Task 12 for the full domain sweep; here just ensure nav reads `global.shop.url`)

**Interfaces:**
- Consumes: `global.shop.url`, `global.socialmedia.services.instagram.url`, `collections.all | eleventyNavigation`.
- Produces: a nav matching the mockup (logo-as-home left; Collections/About/Events/Contact/Instagram; gold **Shop** pill button right).

- [ ] **Step 1: Translate the mockup `<nav>`** (top of `docs/mockups/A-studio-art-zine.html` `<body>`) into `nav.njk`, keeping the existing `eleventyNavigation` loop for the page links and the existing mobile menu structure/IDs (`#mobile--btn`, `#mobile--menu`) so `nav.js` keeps working. Replace the bare shop-bag icon with a labelled gold pill:

```njk
<a target="_blank" rel="noopener" href="{{ global.shop.url | url }}" class="ca-shop-btn">Shop</a>
```

Ensure the logo links to `/` and reads "Matthew Freed".

- [ ] **Step 2: Add nav CSS** to the Concept A region (gold pill → navy text, hover invert), copied from the mockup `.shop`/nav rules:

```css
.ca-shop-btn { background: var(--color-gold); color: var(--color-brand); padding: 9px 20px; border-radius: 40px; font-weight: 600; font-size: 13px; }
.ca-shop-btn:hover { background: var(--color-brand); color: var(--color-gold); }
```

- [ ] **Step 3: Build + verify.** `npm run build`, then:

```
grep -c "ca-shop-btn" dist/index.html
```

Expected: ≥ 1. Start `npm run dev`, open `http://localhost:8080`, confirm the gold Shop pill renders and links to the shop.

- [ ] **Step 4: Commit.**

```
git add src/views/_includes/partials/nav.njk src/styles/main.css
git commit -m "feat(home): nav with gold Shop button"
```

---

## Task 5: Hero (01) — blob photo + gold circle with motif + two CTAs

**Files:**
- Create: `src/views/_includes/partials/home-hero.njk`
- Modify: `src/styles/main.css` (Concept A region)
- Modify: `src/views/_data/global.json` (hero block)
- Modify: `src/views/_includes/layouts/home-layout.njk` (swap `hero.njk` → `home-hero.njk`)

**Interfaces:**
- Consumes: `global.hero.image` (`url`/`alt`/`focal`), `global.hero.title`, `global.hero.subtitle`, `global.hero.cta_primary` (`label`/`url`), `global.hero.cta_secondary` (`label`/`url`).
- Produces: `home-hero.njk` rendering the mockup hero markup; the gold circle includes `{% set cf = { variant: "hero" } %}{% include "carved-flower.njk" %}`.

- [ ] **Step 1: Extend `global.json` hero block** with the new fields (populate from existing wording — title/subtitle already exist; CTAs reuse the shop URL + the About page):

```json
  "hero": {
    "image": { "url": "/images/mthw-22-cropped.jpg", "alt": "Cobalt leaf dish styled with a lemon by Matthew Freed", "focal": "auto" },
    "title": "Art for everyday life",
    "subtitle": "Wheel-thrown stoneware, glazed by hand and made to be used — not shelved.",
    "cta_primary": { "label": "Shop the collection", "url": "https://shop.matthewfreed.net" },
    "cta_secondary": { "label": "My story", "url": "/about" }
  },
```

(`mthw-22-cropped.jpg` exists in `src/images/`. The headline is the brief-approved hero line; the subtitle is Concept B's existing approved subcopy — both are existing repo wording.)

- [ ] **Step 2: Create `home-hero.njk`** by translating the mockup `.hero` block. Use `{% img %}` for the photo (ratio per the mockup blob, `eager`), the gold-circle `<span class="blob">` containing the carved-flower include, the headline with "everyday" wrapped in `<span class="ca-gold">`, and the two CTAs (`ca-btn` gold primary + `ca-link` secondary):

```njk
<section class="hero ca-wrap">
  <div class="hero-copy">
    <span class="ca-idx">01</span>
    <h1 class="ca-disp hero-h1">Art for <span class="ca-gold">everyday</span> life</h1>
    <p class="hero-sub">{{ global.hero.subtitle }}</p>
    <a class="ca-btn" target="_blank" rel="noopener" href="{{ global.hero.cta_primary.url | url }}">{{ global.hero.cta_primary.label }}</a>
    <a class="ca-link" href="{{ global.hero.cta_secondary.url | url }}">{{ global.hero.cta_secondary.label }} →</a>
  </div>
  <div class="hero-img">
    <span class="blob">{% set cf = { variant: "hero" } %}{% include "carved-flower.njk" %}</span>
    {% img global.hero.image.url, global.hero.image.alt, "(min-width: 768px) 50vw, 100vw", "hero-photo", "eager", "1:1", global.hero.image.focal %}
  </div>
</section>
```

- [ ] **Step 3: Add hero CSS** to the Concept A region — copy the mockup's `.hero`, `.hero-img`, `.blob`, organic-blob `border-radius` on the photo, `.hero-h1` (`clamp(42px,5vw,70px)`), `.hero-sub`, `.ca-btn`, `.ca-link`, `.ca-gold` rules verbatim (translate selector names: mockup `.hero-img .blob` → same; mockup `img` → `.hero-photo`). Keep the gold circle `width/height:300px;top:50%;right:-100px;border-radius:50%;overflow:hidden`.

- [ ] **Step 4: Swap the include** in `home-layout.njk`: replace `{% include "hero.njk" %}` with `{% include "home-hero.njk" %}`.

- [ ] **Step 5: Build + verify.** `npm run build`, then:

```
grep -c "hero-photo" dist/index.html
grep -c "cf-carve-hero" dist/index.html
grep -c "matthewfreed.ca/images" dist/index.html
```

Expected: first two ≥ 1; the third = **0** (no placeholder URLs). Visually confirm in `npm run dev`: photo as organic blob, gold circle with brown carved motif peeking on the right, headline with gold "everyday", gold button + text link.

- [ ] **Step 6: Commit.**

```
git add src/views/_includes/partials/home-hero.njk src/styles/main.css src/views/_data/global.json src/views/_includes/layouts/home-layout.njk
git commit -m "feat(home): Concept A hero with carved gold circle + two CTAs"
```

---

## Task 6: Trust marquee band

**Files:**
- Create: `src/views/_includes/partials/home-trust.njk`
- Modify: `src/styles/main.css` (Concept A region)
- Modify: `src/views/_data/global.json` (add `trust` array)
- Modify: `src/views/_includes/layouts/home-layout.njk` (include after hero)

**Interfaces:**
- Consumes: `global.trust` (array of strings).
- Produces: `home-trust.njk` band overlapping the hero (`margin-top:-80px`), diamond separators.

- [ ] **Step 1: Add `trust` to `global.json`** (wording from the existing site's trust points / delivery copy):

```json
  "trust": ["One of a kind", "Free local delivery over $150", "Found at local markets", "Small batches"],
```

- [ ] **Step 2: Create `home-trust.njk`:**

```njk
<div class="ca-marquee">
  <div class="ca-marquee-in ca-wrap">
    {%- for item in global.trust -%}
      <span class="ca-trust-item">{{ item }}</span>{% if not loop.last %}<i class="ca-diamond" aria-hidden="true"></i>{% endif %}
    {%- endfor -%}
  </div>
</div>
```

- [ ] **Step 3: Add marquee CSS** to the Concept A region — copy the mockup `.marquee` rules (ink uppercase, gold diamond separators, `margin-top:-80px`, larger internal padding). Map `.marquee i` → `.ca-diamond`, `.marquee span` → `.ca-trust-item`.

- [ ] **Step 4: Include in `home-layout.njk`** immediately after `home-hero.njk`.

- [ ] **Step 5: Build + verify.** `npm run build`, then `grep -c "ca-trust-item" dist/index.html` (expect 4). Confirm band overlaps the hero visually.

- [ ] **Step 6: Commit.**

```
git add src/views/_includes/partials/home-trust.njk src/styles/main.css src/views/_data/global.json src/views/_includes/layouts/home-layout.njk
git commit -m "feat(home): trust marquee band"
```

---

## Task 7: Featured pieces (02) — scroll-snap slider with hover Shop bar

**Files:**
- Create: `src/views/_includes/partials/home-featured.njk`
- Modify: `src/styles/main.css` (Concept A region)
- Modify: `src/views/_data/features.json` (add `price`; shop-domain hygiene)
- Modify: `src/views/home.md` (section heading copy) or read from `features.title`
- Modify: `src/views/_includes/layouts/home-layout.njk`

**Interfaces:**
- Consumes: `features.features` (array; each `title`, `overlay.text`, `cta.url`, `cta.label`, `image.url/alt`, `price`, `hide`).
- Produces: `home-featured.njk` — section `02`, horizontal scroll-snap track of cards + `.feat-nav` prev/next buttons (`.fbtn`) driven by `home.js` (Task 13). Card hover reveals a bottom gold "Shop ↗" bar (`.ov`/`.cta2`) without moving content.

- [ ] **Step 1: Add a `price` field to each non-hidden entry in `features.json`.** Prices are not currently in the repo; since the content rule forbids invented copy, **do not fabricate prices** — instead omit price display if `price` is absent, and add a CMS `price` field (Task 12) for the editor to fill. Render price only when present:

```njk
{% if entry.price %}<div class="feat-price">{{ entry.price }}</div>{% endif %}
```

(If Matthew supplies prices, populate `features.json`; until then cards show name only.)

- [ ] **Step 2: Create `home-featured.njk`** translating the mockup `.feat`/`.p`/`.pic`/`.ov`/`.cta2` markup. Loop `features.features`, skip `entry.hide == true`, use `{% img %}` (ratio `1:1`), wrap each card in the product `cta.url` link (new tab), reveal `entry.overlay.text` + a gold "Shop ↗" in the `.ov` bottom bar:

```njk
<section class="ca-wrap feat-sec">
  <div class="shead"><span class="ca-idx">02</span><h2 class="ca-disp">{{ features.title }}</h2>
    <div class="feat-nav"><button class="fbtn" aria-label="Previous">‹</button><button class="fbtn" aria-label="Next">›</button></div>
  </div>
  <div class="feat" id="featTrack">
    {%- for entry in features.features -%}{% if entry.hide !== true %}
      <a class="p" target="_blank" rel="noopener" href="{{ entry.cta.url | url }}">
        <div class="pic">
          {% img entry.image.url, entry.image.alt, "(min-width:768px) 25vw, 70vw", "", ("lazy" if loop.index > 4 else "auto"), "1:1", "auto" %}
          <div class="ov"><p>{{ entry.overlay.text | safe }}</p><span class="cta2">Shop ↗</span></div>
        </div>
        <h4>{{ entry.title }}</h4>
        {% if entry.price %}<div class="feat-price">{{ entry.price }}</div>{% endif %}
      </a>
    {% endif %}{%- endfor -%}
  </div>
</section>
```

- [ ] **Step 3: Add featured CSS** to the Concept A region — copy the mockup `.feat` (scroll-snap track), `.p`, `.pic`, `.ov` (bottom gradient bar), `.cta2`, `.feat-nav`, `.fbtn`, `.shead` rules verbatim.

- [ ] **Step 4: Wire the section heading.** `features.title` already = "Featured Items" in `home.md`; change to "Featured pieces" in `home.md` front matter (existing field, reworded — allowed).

- [ ] **Step 5: Include** in `home-layout.njk` after the trust band. (No divider here — the single divider lives before the newsletter only; see Task 12.)

- [ ] **Step 6: Build + verify.** `npm run build`, then:

```
grep -c "feat-sec" dist/index.html
grep -c "myshopify.com" dist/index.html
```

Expected: first ≥ 1. The second should trend to 0 after Task 12 (note any remaining here). Confirm cards scroll and hover reveals the Shop bar without layout shift.

- [ ] **Step 7: Commit.**

```
git add src/views/_includes/partials/home-featured.njk src/styles/main.css src/views/_data/features.json src/views/home.md src/views/_includes/layouts/home-layout.njk
git commit -m "feat(home): featured pieces scroll-snap slider"
```

---

## Task 8: Collections (03) — grid, show-all, hover descriptions, per-glaze links

**Files:**
- Create: `src/views/_includes/partials/home-collections.njk`
- Modify: `src/styles/main.css` (Concept A region)
- Modify: `src/views/home.md` (`gallery.title`)
- Modify: `src/views/_includes/layouts/home-layout.njk`

**Interfaces:**
- Consumes: `showcase.gallery` (15 items; each `title`, `text`, `cta.url`, `image.url/alt/focal`).
- Produces: `home-collections.njk` — section `03`, 12-col staggered grid; first 5 visible, rest hidden behind a "Show all 15 collections →" button (`#showColl`) toggled by `home.js`; speckle background behind the grid; each tile is a link to `cta.url` (new tab) with name + description revealed on hover.

- [ ] **Step 1: Create `home-collections.njk`** translating the mockup `.coll-sec`/`.coll`/`.c`/`.cap` markup. Loop `showcase.gallery` (all 15). The mockup hard-codes per-tile grid spans via `c1..c15` classes — reproduce by adding `c{{ loop.index }}` to each tile. Tile:

```njk
<a href="{{ entry.cta.url | url }}" target="_blank" rel="noopener" class="c c{{ loop.index }}">
  {% img entry.image.url, entry.image.alt, "(min-width:768px) 40vw, 90vw", "", ("lazy" if loop.index > 4 else "auto"), "", entry.image.focal %}
  <span class="cap"><span class="cap-name">{{ entry.title }}</span><span class="cap-desc">{{ entry.text }}</span></span>
</a>
```

Wrap in `<section class="ca-wrap coll-sec">` with the `03` shead, the `.coll` grid, and the toggle button:

```njk
<div class="coll-more"><button class="show-all" id="showColl">Show all 15 collections →</button></div>
```

- [ ] **Step 2: Add collections CSS** to the Concept A region — copy the mockup `.coll` grid, the `c1..c15` span placements, `.c`/`.cap`/`.cap-name`/`.cap-desc` (hover-reveal gradient), the speckle `.coll::before` (the inline data-URI SVG), `.coll .c:nth-child(n+6){display:none}` + `.coll.expanded .c:nth-child(n+6){display:block}`, and `.coll-more`/`.show-all` — all verbatim from the mockup.

- [ ] **Step 3: Reword `gallery.title`** in `home.md` to "The glaze collections" (existing field).

- [ ] **Step 4: Include** in `home-layout.njk` after the featured section. (No divider.)

- [ ] **Step 5: Build + verify.** `npm run build`, then:

```
grep -o "class=\"c c[0-9]*\"" dist/index.html | wc -l
```

Expected: 15 (all collections present). Confirm only 5 show until "Show all" is clicked (after Task 13 JS), hover reveals descriptions, tiles link to per-glaze collections.

- [ ] **Step 6: Commit.**

```
git add src/views/_includes/partials/home-collections.njk src/styles/main.css src/views/home.md src/views/_includes/layouts/home-layout.njk
git commit -m "feat(home): collections grid with show-all + hover descriptions"
```

---

## Task 9: Meet the maker (04) — navy panel

**Files:**
- Create: `src/views/_includes/partials/home-maker.njk`
- Modify: `src/styles/main.css` (Concept A region)
- Modify: `src/views/_includes/layouts/home-layout.njk`

**Interfaces:**
- Consumes: an excerpt from `src/views/about.md` (first-person). Add a `maker` block to `home.md` front matter holding the excerpt + image + link, sourced from `about.md` wording (keeps the partial data-driven and CMS-friendly).
- Produces: `home-maker.njk` — section `04`, navy `.maker` panel: portrait (crops to text height) + heading + 1–2 paragraphs + "Read my story →" link to `/about`.

- [ ] **Step 1: Add a `maker` block to `home.md` front matter** (copy 1–2 sentences from `about.md`; image is an existing repo file):

```yaml
maker:
  image:
    url: /images/matthew-and-mugs.jpg
    alt: Matthew Freed with his mugs
    focal: auto
  title: Meet the maker
  heading: My love affair with clay
  body: >-
    It began in the early 1990s at a little stoneware studio. Every piece I sell
    still starts as a lump of clay on my wheel.
  link:
    label: Read my story
    url: /about
```

(Replace `body` with the actual opening lines from `about.md` during implementation — verify wording matches.)

- [ ] **Step 2: Create `home-maker.njk`** translating the mockup `.maker` navy panel; `{% img %}` for the portrait (ratio to crop to text height, e.g. `4:5`), heading, body, and the "Read my story →" link (`maker.link`).

- [ ] **Step 3: Add maker CSS** to the Concept A region — copy the mockup `.maker` rules (navy panel, grid, `align-items:stretch` so the photo matches text height, `margin-top:36px`).

- [ ] **Step 4: Include** in `home-layout.njk` after the collections section. (No divider.)

- [ ] **Step 5: Build + verify.** `npm run build`, then `grep -c "Read my story" dist/index.html` (expect ≥1). Confirm navy panel + portrait crop + link to `/about`.

- [ ] **Step 6: Commit.**

```
git add src/views/_includes/partials/home-maker.njk src/styles/main.css src/views/home.md src/views/_includes/layouts/home-layout.njk
git commit -m "feat(home): meet-the-maker navy panel"
```

---

## Task 10: Upcoming events (05) — accordion list

**Files:**
- Modify: `src/views/_includes/partials/home-events.njk` (full rebuild)
- Modify: `src/styles/main.css` (Concept A region)
- Modify: `src/views/_includes/layouts/home-layout.njk` (ensure include + order)

**Interfaces:**
- Consumes: `events.events | filterFeatured` (upcoming, featured, ≤5, date-sorted — the existing filter). Each `name`, `date`, `end_date`, `multi_day_event`, `time`, `location`, `content.body`, `gmaps`.
- Produces: `home-events.njk` — section `05`, an accordion list (`.ev-item`, `.ev` button); expanding shows blurb + a "Get directions ↗" Google Maps link (built from `entry.gmaps`); a "See all events →" link to `/updates` (the events page).

- [ ] **Step 1: Rebuild `home-events.njk`** as the mockup accordion. Use the existing `filterFeatured` filter and `date` filter. Markup per item:

```njk
<div class="ev-item">
  <button class="ev" aria-expanded="false">
    <span class="ev-date">{{ entry.date | date('MMM d') }}{% if entry.multi_day_event %} – {{ entry.end_date | date('MMM d') }}{% endif %}</span>
    <span class="ev-name">{{ entry.name | trim }}</span>
    <span class="ev-meta">{{ entry.location | trim }} · {{ entry.time | trim }}</span>
  </button>
  <div class="ev-detail"><div class="ev-detail-in">
    <p>{{ entry.content.body | trim }}</p>
    <p><a href="https://maps.google.com/?q={{ entry.gmaps | urlencode }}" target="_blank" rel="noopener">Get directions ↗</a></p>
  </div></div>
</div>
```

Wrap in `<section class="ca-wrap ev-sec">` with the `05` shead and a trailing `<div class="coll-more"><a class="show-all" href="/updates">See all events →</a></div>`.

- [ ] **Step 2: Add events CSS** to the Concept A region — copy the mockup `.ev-sec`, `.ev-item`, `.ev`, `.ev-date`, `.ev-name`, `.ev-meta`, `.ev-detail` (max-height transition), `.ev-detail-in`, `.ev-item.open .ev-detail` rules verbatim.

- [ ] **Step 3: Include** in `home-layout.njk` after the maker divider. (The accordion JS is Task 13.)

- [ ] **Step 4: Build + verify.** `npm run build`, then `grep -c "ev-item" dist/index.html` (expect ≥1, ≤5). Confirm list renders; accordion open/close verified after Task 13.

- [ ] **Step 5: Commit.**

```
git add src/views/_includes/partials/home-events.njk src/styles/main.css src/views/_includes/layouts/home-layout.njk
git commit -m "feat(home): upcoming events accordion"
```

---

## Task 11: Stay-in-touch newsletter — cream section, preceded by a divider

> **Design note (2026-06-24):** the newsletter is a **cream** section (NOT a navy panel, and NO carved-motif background — both were tried and removed). It is led into by a carved-petal `section-divider`. Navy heading on cream, gold Subscribe button. The `carved-flower.njk` "news" variant is consequently **unused** — keep the partial generic but only the "hero" variant is wired.

**Files:**
- Create: `src/views/_includes/partials/home-newsletter.njk`
- Modify: `src/styles/main.css` (Concept A region)
- Modify: `src/views/_data/global.json` (`newsletter` copy)
- Modify: `src/views/_includes/layouts/home-layout.njk`

**Interfaces:**
- Consumes: `global.newsletter.title`, `global.newsletter.subtitle`. Reuses the existing Netlify newsletter form (`name="newsletter"`, `data-netlify="true"`, action `/success`) from `footer.njk`.
- Produces: `home-newsletter.njk` — centred cream `.news` section (no background panel), heading, subcopy, gold Subscribe button. A `section-divider` is included immediately before it (in `home-layout.njk`).

- [ ] **Step 1: Update `global.json` newsletter block:**

```json
  "newsletter": { "title": "Never miss a drop or a date.", "subtitle": "Can't make it to a market? Join the list for first access to new pieces — and every upcoming date." },
```

- [ ] **Step 2: Create `home-newsletter.njk`** translating the mockup `.news` section (cream, no background panel, no motif) and reusing the Netlify form markup from `footer.njk` (keep the honeypot + `id="newsletter_email"` + `name="newsletter_email"`):

```njk
<section class="news ca-wrap">
  <span class="ca-idx">Stay in touch</span>
  <h2 class="ca-disp">{{ global.newsletter.title }}</h2>
  <p>{{ global.newsletter.subtitle }}</p>
  <form name="newsletter" method="POST" action="/success" data-netlify="true" netlify-honeypot="bot-field">
    <p class="hidden"><label>Don’t fill this out: <input name="bot-field" /></label></p>
    <label class="hidden" for="newsletter_email">Email</label>
    <input required type="email" id="newsletter_email" name="newsletter_email" placeholder="your@email.com">
    <button type="submit">Subscribe</button>
  </form>
</section>
```

- [ ] **Step 3: Add newsletter CSS** to the Concept A region — copy the mockup `.news` rules verbatim: cream/centred (`text-align:center;padding:84px 0 96px`, no background), `.news .ca-idx` deep-gold, `.news h2` navy display italic, `.news p` muted `max-width:460px`, input underline `var(--color-ink)`, and the gold Subscribe button (`background:var(--color-gold);color:var(--color-brand)`, hover → navy bg/gold text).

- [ ] **Step 4: Include** in `home-layout.njk` — a `{% include "section-divider.njk" %}` **then** `{% include "home-newsletter.njk" %}`, after the events section.

- [ ] **Step 5: Build + verify.** `npm run build`, then:

```
grep -c "data-netlify" dist/index.html
```

Expected: ≥ 1. Confirm a cream newsletter (no dark panel), navy heading, gold Subscribe button, with the carved-petal divider above it.

- [ ] **Step 6: Commit.**

```
git add src/views/_includes/partials/home-newsletter.njk src/styles/main.css src/views/_data/global.json src/views/_includes/layouts/home-layout.njk
git commit -m "feat(home): newsletter navy panel with gold motif"
```

---

## Task 12: Homepage assembly, JS interactions, and link hygiene

**Files:**
- Modify: `src/views/_includes/layouts/home-layout.njk` (final include order; drop `notification.njk` if unused, keep if Matthew wants the banner)
- Modify: `src/javascript/home.js` (slider, show-all, accordion)
- Modify: `src/views/_data/global.json`, `src/views/_data/showcase.json`, `src/views/_data/features.json` (shop-domain sweep)

**Interfaces:**
- Consumes: DOM IDs/classes produced by earlier tasks — `#featTrack` + `.fbtn` (Task 7), `#showColl` + `.coll` (Task 8), `.ev` buttons + `.ev-item` (Task 10).
- Produces: working slider arrows, show-all toggle, events accordion; all shop URLs on `shop.matthewfreed.net`.

- [ ] **Step 1: Finalise `home-layout.njk` include order:**

```njk
---
layout: base
---
{% include "home-hero.njk" %}
{% include "home-trust.njk" %}
{% include "home-featured.njk" %}
{% include "home-collections.njk" %}
{% include "home-maker.njk" %}
{% include "home-events.njk" %}
{% include "section-divider.njk" %}
{% include "home-newsletter.njk" %}
<script defer src="/js/home.js"></script>
```

- [ ] **Step 2: Rewrite `src/javascript/home.js`** with the mockup's IIFE (copy from the `<script>` at the end of `docs/mockups/A-studio-art-zine.html`): featured slider arrows (`.feat-nav .fbtn` → `#featTrack.scrollBy(±260)`), collections show-all (`#showColl` toggles `.coll.expanded` + swaps button label), events accordion (`.ev` buttons toggle `.ev-item.open` + `aria-expanded`). Verify selectors match the partials' markup.

- [ ] **Step 3: Shop-domain sweep.** Replace every `matthew-freed-pottery.myshopify.com` with `shop.matthewfreed.net` in `global.json`, `showcase.json`, and `features.json`. For `showcase.json`, the per-glaze pattern becomes `https://shop.matthewfreed.net/collections/all/<Glaze>`:

```
grep -rl "myshopify.com" src/views/_data/
```

Edit each; re-run the grep — expected: no matches.

- [ ] **Step 4: Build + verify everything.** Run:

```
npm run build
grep -c "myshopify.com" dist/index.html
grep -c "matthewfreed.ca/images" dist/index.html
```

Expected: both **0**. Start `npm run dev`; manually verify: slider arrows scroll, "Show all 15" reveals all tiles + relabels, event rows expand/collapse with directions links.

- [ ] **Step 5: Commit.**

```
git add src/views/_includes/layouts/home-layout.njk src/javascript/home.js src/views/_data/
git commit -m "feat(home): assemble homepage, wire JS interactions, shop-domain hygiene"
```

---

## Task 13: Responsive / mobile pass

**Files:**
- Modify: `src/styles/main.css` (Concept A region — add `@media` blocks)

**Interfaces:**
- Consumes: all Concept A section classes.
- Produces: mobile-first behaviour at the existing breakpoints (`--breakpoint-sm:640px`, `md:768px`, `lg:1024px`).

- [ ] **Step 1: Add responsive rules** to the Concept A region. The mockup is desktop-only; collapse each section for small screens: hero → single column (copy above image, gold circle reduced/hidden), trust marquee → wrap/stack, featured → horizontal scroll already touch-friendly (ensure the hover Shop bar is **always visible** under `@media (hover: none)`), collections grid → 1–2 cols and **show the hover description by default** under `@media (hover: none)`, maker/newsletter panels → stacked with reduced padding, events accordion → already vertical. Example for touch hover-reveal:

```css
@media (hover: none) {
  .p .ov { opacity: 1; }
  .c .cap-desc { max-height: 200px; opacity: 1; }
}
@media (max-width: 768px) {
  .hero { grid-template-columns: 1fr; }
  .hero-img .blob { width: 180px; height: 180px; right: -40px; }
  .coll { grid-template-columns: repeat(2, 1fr); }
  .coll .c[class*="c"] { grid-column: span 1 !important; }
}
```

- [ ] **Step 2: Build + verify at 3 widths.** `npm run dev`; check 375px, 768px, 1280px. Confirm no horizontal overflow, all CTAs reachable without hover, text legible.

- [ ] **Step 3: Commit.**

```
git add src/styles/main.css
git commit -m "feat(home): responsive/mobile pass"
```

---

## Task 14: CMS fields + pre-production checklist

**Files:**
- Modify: `src/admin/config.yml`

**Interfaces:**
- Produces: Sveltia CMS fields for every new data field so Matthew can edit; production-ready config.

- [ ] **Step 1: Add CMS fields** in `src/admin/config.yml` for the new data: `global.hero.cta_primary/cta_secondary`, `global.trust` (list), `global.newsletter.subtitle`, `features[].price`, `home.md` `maker` block. Match the existing config's widget patterns (read the file first; mirror its structure for the `global` "settings" file collection and the `features` list).

- [ ] **Step 2: Pre-prod — revert backend branch.** In `src/admin/config.yml`, set `backend.branch` back to the deploy branch (the value it must hold in production, not `feat/sveltia-cms-migration`). Confirm with Matthew which branch deploys.

- [ ] **Step 3: Final full verification.** Run:

```
npm run build
grep -c "myshopify.com" dist/index.html
grep -c "matthewfreed.ca/images" dist/index.html
grep -c "service-worker.js" dist/index.html
test -f dist/service-worker.js && echo "SW ok"
```

Expected: the two URL greps = 0; SW present. Confirm `dist/admin/` is excluded from the SW precache (PWA config already does this — spot-check `dist/service-worker.js` does not precache `admin/` or `images/`).

- [ ] **Step 4: Commit.**

```
git add src/admin/config.yml
git commit -m "feat(home): CMS fields for new homepage data + prod backend branch"
```

---

## Self-review notes (for the implementer)

- **Spec coverage:** Tasks map to spec §8.6 sections 1→10: Nav (T4), Hero+Trust (T5,T6), Featured (T7), dividers (T3 + T12), Collections (T8), Maker (T9), Events (T10), Newsletter (T11), Footer — **note:** the existing `footer.njk` is kept as-is and only inherits new tokens/fonts; if the mockup footer differs materially, add a follow-up task. Deferred items §8.9: mobile (T13), link wiring (T7/T8/T12), link hygiene (T12), CMS fields + backend revert (T14).
- **Content rule:** prices (T7) and the maker excerpt (T9) are the two spots where wording must come from Matthew / `about.md` — flagged inline, never fabricate.
- **Glide:** kept loaded in `base.njk` for non-home pages (collections/updates). The homepage no longer uses it. If a later cleanup removes Glide globally, audit `collections-collection.njk` first.
- **IDs:** carved-flower IDs are variant-suffixed to avoid collisions when hero + newsletter motifs coexist (T2).
- **Open question for Matthew:** keep the `notification.njk` banner on the homepage? Currently dropped from the include order (T12) — re-add if wanted.
