# Pottery Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every page of matthewfreed.ca to the approved design spec (`docs/superpowers/specs/2026-07-02-site-redesign-design.md`) inside the existing Eleventy + Tailwind 4 + Decap CMS setup.

**Architecture:** Eleventy 3 (Nunjucks templates in `src/views`, layouts in `_includes/layouts`, partials in `_includes/partials`), Tailwind 4 via PostCSS (`src/styles/main.css` with `@theme` tokens), content in `src/views/_data/*.json` + page front matter, images via the `{% img %}` shortcode. All Glide/Alpine/FontAwesome CDN dependencies are removed; total custom JS stays under 3 KB (vanilla nav toggle + collection filter).

**Tech Stack:** Eleventy 3.1, Tailwind 4 (PostCSS), Nunjucks, Decap CMS, Google Fonts (Fraunces variable + Karla), Netlify (redirects via `src/_redirects`).

**Working branch:** `feat/site-redesign-v2` (already exists, contains the spec).

## Global Constraints

- Color tokens, exact: paper `#F8F5EE`, ink `#2A2822`, blue `#1F3A52`, blue-light `#33556E`, sand `#C8A876`, hairline `#E9E3D5`, tile `#EDE8DB`, muted text `#75705F`, soft text `#9A937E`.
- Type: Fraunces (variable, weights 500 + 900, `opsz` axis) for display; Karla 400/500 for body/UI. **No italics anywhere.** Captions/eyebrows: Karla 500 uppercase `tracking-[0.14em]`.
- Body text ≥ 16px on mobile; tap targets ≥ 44px.
- No new npm dependencies. No JS frameworks. Custom JS ≤ 3 KB total.
- Shop base URL is `https://shop.matthewfreed.net` (live branded Shopify domain, already used by half the data files). No `myshopify.com` URL may remain anywhere in `src/`.
- Shop CTAs read "Shop", "Shop the collections", "View in the shop", "Browse in shop" — never "Buy" (no fake cart).
- Existing permalinks preserved, with ONE exception: `/updates/` becomes `/events/` with a 301 redirect.
- All copy is drafted (free hand granted) but must be flagged for Matthew's review in commit messages: include `[copy]` in the subject when a commit introduces new user-facing copy.
- Every `{% img %}` call must pass a real `alt` text.
- The repo has no unit-test framework. The test cycle for every task is: `npm run build` must exit 0, then grep `dist/` output for expected markup. Run commands from the repo root `D:\Projects\Repositories\11ty-matthew-freed-pottery-web`.

## File Structure

```
src/styles/main.css                       rewrite: tokens + component classes
src/views/_includes/layouts/base.njk      rewrite: fonts, drop CDN deps
src/views/_includes/layouts/home-layout.njk        rewrite: section assembly
src/views/_includes/layouts/collections-layout.njk rewrite: field guide
src/views/_includes/layouts/events-layout.njk      rewrite: event cards + JSON-LD
src/views/_includes/layouts/about-layout.njk       rewrite: story sections
src/views/_includes/layouts/general-layout.njk     rewrite: prose pages
src/views/_includes/layouts/faq-layout.njk         rewrite: <details> accordions
src/views/_includes/layouts/contact-layout.njk     rewrite: restyle
src/views/_includes/partials/nav.njk               rewrite
src/views/_includes/partials/footer.njk            rewrite (includes newsletter)
src/views/_includes/partials/hero.njk              rewrite
src/views/_includes/partials/trust-strip.njk       create
src/views/_includes/partials/featured-piece.njk    create
src/views/_includes/partials/collections-teaser.njk create
src/views/_includes/partials/home-products.njk     create (replaces home-features.njk)
src/views/_includes/partials/home-events.njk       rewrite (blue band)
src/views/_includes/partials/story-teaser.njk      create
src/views/_includes/partials/newsletter.njk        create (form extracted from old footer)
src/views/_includes/partials/collection-card.njk   create
src/views/_includes/partials/dogwood.njk           create (inline SVG mark)
src/javascript/nav.js                     rewrite: vanilla toggle
src/javascript/collections.js             rewrite: filter chips
src/javascript/home.js                    delete (Glide carousel, obsolete)
src/javascript/events.js                  delete IF only Glide/carousel code (verify first)
src/views/home.md                         front matter: featured_piece, trust, story_teaser
src/views/events.md                       create (from updates.md), permalink /events/
src/views/updates.md                      delete
src/views/about.md                        add `quote` front matter field
src/views/_data/global.json               shop.base + shop.collectionsPath
src/views/_data/showcase.json             gallery items gain slug/swatch/filterGroup
src/_redirects                            add /updates/* -> /events/ 301
src/admin/config.yml                      new CMS fields
src/assets/favicon.svg                    create (dogwood mark)
```

Old partials made obsolete (`home-features.njk`, `home-showcase.njk`, `card-feature.njk`, `card-sm-events.njk`, `card-sm-events-upcoming.njk`, `collections-collection.njk`, `card.njk`, `card-sm.njk`, `card-list.njk`, `load-more.njk`, `notification.njk`, `subnav.njk`) are deleted in Task 12 after nothing references them.

---

### Task 1: Design tokens, fonts, base layout shell

**Files:**
- Modify: `src/styles/main.css` (full rewrite)
- Modify: `src/views/_includes/layouts/base.njk` (full rewrite)

**Interfaces:**
- Produces: Tailwind color utilities `bg-paper`, `text-ink`, `bg-blue`, `bg-blue-light`, `text-sand`, `border-hairline`, `bg-tile`, `text-muted`, `text-soft`; font utilities `font-display`, `font-sans`; component classes `.btn-primary`, `.btn-outline`, `.link-underline`, `.cap-label`, `.chip`, `.chip.is-active`. Every later task uses these names exactly.

- [ ] **Step 1: Rewrite `src/styles/main.css`**

Replace the entire file with:

```css
@import "tailwindcss";

@theme {
    --breakpoint-sm: 640px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 1024px;

    --font-sans: 'Karla', Arial, sans-serif;
    --font-display: 'Fraunces', Georgia, serif;

    --color-paper: #F8F5EE;
    --color-ink: #2A2822;
    --color-blue: #1F3A52;
    --color-blue-light: #33556E;
    --color-sand: #C8A876;
    --color-hairline: #E9E3D5;
    --color-tile: #EDE8DB;
    --color-muted: #75705F;
    --color-soft: #9A937E;
    --color-white: #FFFFFF;
    --color-transparent: transparent;
}

@layer components {
    .btn-primary {
        @apply inline-block rounded-full bg-blue px-6 py-3 font-sans text-base font-medium text-paper transition-colors hover:bg-blue-light;
    }
    .btn-outline {
        @apply inline-block rounded-full border border-blue px-6 py-3 font-sans text-base font-medium text-blue transition-colors hover:bg-blue hover:text-paper;
    }
    .link-underline {
        @apply border-b border-blue pb-0.5 font-sans font-medium text-blue transition-colors hover:border-sand;
    }
    .cap-label {
        @apply font-sans text-xs font-medium uppercase tracking-[0.14em];
    }
    .chip {
        @apply cursor-pointer rounded-full border border-hairline px-4 py-2 font-sans text-sm text-muted transition-colors hover:border-blue hover:text-blue;
    }
    .chip.is-active {
        @apply border-blue bg-blue text-paper;
    }
}

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
    }
}
```

Note: the old `@source inline(...)` safelist lines and all `.glide--*` rules are intentionally gone — the new templates never interpolate class names from CMS data and Glide is removed.

- [ ] **Step 2: Rewrite `src/views/_includes/layouts/base.njk`**

```njk
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#1F3A52"/>

    <link rel='manifest' href='/assets/manifest.json'>
    <link rel="apple-touch-icon" href="/assets/apple-icon-180x180.png">
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,900&family=Karla:wght@400;500&display=swap">

    <link rel="stylesheet" href="/styles/main.css">
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
    <script defer src="/js/nav.js"></script>

    {% seo "" %}
</head>
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", (user) => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/admin/";
        });
      }
    });
  }
</script>
<body class="bg-paper font-sans text-ink">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-blue focus:px-4 focus:py-2 focus:text-paper">Skip to content</a>
    {% include "nav.njk" %}

    <main id="main">
        {{ content | safe }}
    </main>

    {% include "footer.njk" %}

    <script>
    if ("serviceWorker" in navigator)
        navigator.serviceWorker.register("/service-worker.js");
    </script>

</body>
</html>
```

Removed vs. old file: Glide CSS + JS, Alpine, Font Awesome. Kept: manifest/PWA, Netlify identity, `{% seo %}`, service worker. `favicon.svg` is created in Task 12; the link tag is harmless until then.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: exit 0. (Templates still reference old classes — that's fine, Tailwind just won't emit them; the site will look broken until Tasks 2–6 land. Build success is the gate, not visuals.)

Run: `grep -c "color-paper" dist/styles/main.css`
Expected: `1` or more.

Run: `grep -c "glidejs" dist/index.html`
Expected: `0` (the Glide CDN `<link>`/`<script>` tags are gone from the head; old body markup may still carry `glide--*` classes until Tasks 4–6 replace those partials — that's expected and not checked here).

- [ ] **Step 4: Commit**

```bash
git add src/styles/main.css src/views/_includes/layouts/base.njk
git commit -m "feat: new design tokens, fonts, and base layout shell"
```

---

### Task 2: Global chrome — nav, footer, newsletter, nav.js

**Files:**
- Modify: `src/views/_includes/partials/nav.njk` (full rewrite)
- Modify: `src/views/_includes/partials/footer.njk` (full rewrite)
- Create: `src/views/_includes/partials/newsletter.njk`
- Modify: `src/javascript/nav.js` (full rewrite)

**Interfaces:**
- Consumes: component classes from Task 1; `global.shop.base` does NOT exist yet — nav uses `global.shop.url` in this task and Task 3 swaps it to the composed form. To avoid the double edit, this task already writes `{{ global.shop.base }}{{ global.shop.collectionsPath }}/` and Task 3 must land before the nav link works. Build still passes (Nunjucks renders empty string for missing keys).
- Produces: `nav.njk` expects pages to exist at `/collections.html`, `/events/`, `/about/`, `/contact/`. `newsletter.njk` is included by `footer.njk` only.

- [ ] **Step 1: Check the current footer for the newsletter form**

Run: `grep -n -i "form\|action\|mailchimp\|newsletter" src/views/_includes/partials/footer.njk`

Copy the existing `<form>` element (its `action`, `method`, hidden inputs, and input `name` attributes) EXACTLY into the new `newsletter.njk` in Step 3 — only the styling classes change. The form target is live infrastructure; do not invent a new one. If the old footer has no form (newsletter is an external link), replicate that link in the newsletter band instead.

- [ ] **Step 2: Rewrite `src/views/_includes/partials/nav.njk`**

```njk
<header class="border-b border-hairline bg-paper">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" class="font-display text-xl font-black text-blue">Matthew Freed</a>

        <nav class="hidden items-center gap-8 md:flex" aria-label="Main">
            <a href="/collections.html" class="text-base text-muted transition-colors hover:text-blue">Collections</a>
            <a href="/events/" class="text-base text-muted transition-colors hover:text-blue">Events</a>
            <a href="/about/" class="text-base text-muted transition-colors hover:text-blue">About</a>
            <a href="/contact/" class="text-base text-muted transition-colors hover:text-blue">Contact</a>
            <a href="{{ global.shop.base }}{{ global.shop.collectionsPath }}/" class="btn-primary px-5 py-2 text-sm">Shop</a>
        </nav>

        <div class="flex items-center gap-3 md:hidden">
            <a href="{{ global.shop.base }}{{ global.shop.collectionsPath }}/" class="btn-primary px-5 py-2.5 text-sm">Shop</a>
            <button id="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Menu" class="flex h-11 w-11 items-center justify-center text-ink">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
        </div>
    </div>

    <nav id="nav-menu" hidden class="border-t border-hairline px-6 py-4 md:hidden" aria-label="Main mobile">
        <a href="/collections.html" class="block py-3 text-base text-ink">Collections</a>
        <a href="/events/" class="block py-3 text-base text-ink">Events</a>
        <a href="/about/" class="block py-3 text-base text-ink">About</a>
        <a href="/contact/" class="block py-3 text-base text-ink">Contact</a>
    </nav>
</header>
```

- [ ] **Step 3: Create `src/views/_includes/partials/newsletter.njk`**

```njk
<section class="border-t border-hairline bg-paper" aria-label="Newsletter">
    <div class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
        <div>
            <h2 class="font-display text-2xl font-black text-ink">First to know about firings and markets</h2>
            <p class="mt-1 text-sm text-soft">One email a month, no clutter.</p>
        </div>
        {# REPLACE the form below with the exact form element found in Step 1 — keep its action/method/input names, apply only these classes #}
        <form action="__FROM_STEP_1__" method="post" class="flex w-full max-w-md gap-2">
            <label for="newsletter-email" class="sr-only">Email address</label>
            <input id="newsletter-email" type="email" name="__FROM_STEP_1__" required placeholder="you@email.com"
                   class="w-full rounded-full border border-hairline bg-white px-5 py-3 text-base text-ink placeholder:text-soft focus:border-blue focus:outline-none">
            <button type="submit" class="btn-primary whitespace-nowrap">Sign up</button>
        </form>
    </div>
</section>
```

The `__FROM_STEP_1__` markers are the ONLY permitted substitution — they must be replaced with the real values discovered in Step 1 before committing. `grep __FROM_STEP_1__` must return nothing at commit time.

- [ ] **Step 4: Rewrite `src/views/_includes/partials/footer.njk`**

```njk
{% include "newsletter.njk" %}
<footer class="bg-ink text-paper">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div>
            <p class="font-display text-lg font-black">Matthew Freed Pottery</p>
            <p class="mt-2 whitespace-pre-line text-sm text-soft">{{ global.contact.address }}</p>
        </div>
        <nav class="flex flex-col gap-2 text-sm" aria-label="Footer">
            <a href="/retail-stores/" class="text-soft transition-colors hover:text-sand">Retail stores</a>
            <a href="/faq/" class="text-soft transition-colors hover:text-sand">FAQ</a>
            <a href="/process/" class="text-soft transition-colors hover:text-sand">My process</a>
            <a href="/privacy-statement/" class="text-soft transition-colors hover:text-sand">Privacy</a>
        </nav>
        <div class="flex gap-4">
            <a href="{{ global.socialmedia.services.instagram.url }}" aria-label="Instagram" class="text-soft transition-colors hover:text-sand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.8" fill="currentColor"/></svg>
            </a>
            <a href="{{ global.socialmedia.services.facebook.url }}" aria-label="Facebook" class="text-soft transition-colors hover:text-sand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1z"/></svg>
            </a>
        </div>
    </div>
    <div class="border-t border-blue-light/30 px-6 py-4 text-center text-xs text-soft">
        © Matthew Freed Pottery
    </div>
</footer>
```

Footer link targets: verify the actual permalinks first with
`grep -n "permalink" src/views/faq.md src/views/retail-stores.md src/views/process.md src/views/privacy-statement.md src/views/contact.md`
and correct the `href`s above to match exactly what those files declare.

- [ ] **Step 5: Rewrite `src/javascript/nav.js`**

```js
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("nav-toggle");
    const menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
        const open = menu.hidden;
        menu.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
    });
});
```

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: exit 0.

Run: `grep -c "nav-toggle" dist/index.html` → `2` or more (button + script hook).
Run: `grep -c "alpine" dist/index.html` → `0`.
Run: `grep -rn "__FROM_STEP_1__" src/` → no matches.

- [ ] **Step 7: Commit**

```bash
git add src/views/_includes/partials/nav.njk src/views/_includes/partials/footer.njk src/views/_includes/partials/newsletter.njk src/javascript/nav.js
git commit -m "feat: [copy] new global chrome - nav, footer, newsletter band"
```

---

### Task 3: Data groundwork — shop URL, collection metadata, home front matter, redirect

**Files:**
- Modify: `src/views/_data/global.json`
- Modify: `src/views/_data/showcase.json`
- Modify: `src/views/home.md` (front matter only)
- Modify: `src/views/about.md` (add `quote` field)
- Modify: `src/_redirects`

**Interfaces:**
- Produces: `global.shop.base` = `"https://shop.matthewfreed.net"`, `global.shop.collectionsPath` = `"/collections/all"`. Every `gallery` item in `showcase.json` gains `slug` (string), `swatch` (hex string), `filterGroup` (one of `"Blues" | "Charcoals" | "Earth tones" | "Patterned"`). `home.md` gains `featured_piece`, `trust`, `story_teaser` front-matter objects with the exact keys shown below. `about.md` gains `quote` (string).

- [ ] **Step 1: Update `src/views/_data/global.json` shop object**

Replace the existing `"shop"` key with:

```json
"shop": {
    "base": "https://shop.matthewfreed.net",
    "collectionsPath": "/collections/all"
}
```

- [ ] **Step 2: Add slug/swatch/filterGroup to every `gallery` item in `src/views/_data/showcase.json`**

For each of the 15 items in `gallery`: derive `slug` from the tail of its existing `cta.url` (e.g. `.../collections/all/Squamish` → `"Squamish"`), then add `swatch` and `filterGroup` from this table:

| Collection title    | swatch    | filterGroup |
| ------------------- | --------- | ----------- |
| Squamish Nights     | `#22333B` | Blues       |
| Garibaldi           | `#2E4636` | Earth tones |
| Yaletown            | `#3A3835` | Charcoals   |
| Galiano             | `#2B4A6F` | Blues       |
| Dogwood             | `#3A3835` | Patterned   |
| Saltspring          | `#4A4741` | Patterned   |
| Tofino              | `#33556E` | Blues       |
| Zen                 | `#4A4741` | Charcoals   |
| Tree of Life        | `#5C4A38` | Patterned   |
| Kitsilano           | `#6B7A85` | Blues       |
| Jericho             | `#7A8B7F` | Earth tones |
| Joffre              | `#2B4A6F` | Blues       |
| Strathcona          | `#55524A` | Charcoals   |
| Pemberton Earth     | `#6B4430` | Earth tones |
| Pemberton Sky       | `#7A96AD` | Blues       |

(If a title in the file differs slightly, match by the collection name prefix. These values are CMS-editable defaults, refined by Matthew later.)

Example — the Squamish entry becomes:

```json
{
    "image": { "url": "/images/squamish-nights.jpg", "alt": "Squamish Nights Teardrop Vase by Matthew Freed" },
    "title": "Squamish Nights Collection",
    "text": "A speckled deep green and blue glaze with a celestial look",
    "slug": "Squamish",
    "swatch": "#22333B",
    "filterGroup": "Blues",
    "cta": { "label": "Browse All Items", "url": "https://matthew-freed-pottery.myshopify.com/collections/all/Squamish" },
    "style": "center"
}
```

Leave `cta` and `style` in place for now — Task 12 removes stale `myshopify` URLs after no template reads them.

Also in `showcase.json`: in the `features` list, replace every `matthew-freed-pottery.myshopify.com` host with `shop.matthewfreed.net` (path unchanged) and strip tracking query strings (`?_pos=...`) from all `features[].cta.url` values.

- [ ] **Step 3: Rewrite `src/views/home.md` front matter**

Replace the front matter (keep `layout`, `title`, `permalink`, `eleventyNavigation`, and the SEO keys) so it reads:

```yaml
---
layout: home-layout
title: Home
permalink: /index.html
eleventyNavigation:
  key: Home
  order: 1
hero:
  eyebrow: Handthrown in Vancouver
  title: Art for everyday life
  text: Functional pottery in glazes named after the West Coast places that inspired them.
  cta_primary:
    label: Shop the collections
  cta_secondary:
    label: Upcoming events
    url: /events/
  image:
    url: /images/hero.jpg
    alt: Two blue Galiano bowls on a board by Matthew Freed
trust:
  - Circle Craft gold medal
  - Every piece one of a kind
  - Free local delivery over $150
featured_piece:
  title: Teardrop vase
  caption: Squamish Nights · celestial speckle
  text: Wheel-thrown stoneware — no two alike.
  image:
    url: /images/squamish-nights.jpg
    alt: Squamish Nights Teardrop Vase by Matthew Freed
  cta:
    label: View in the shop
    url: https://shop.matthewfreed.net/collections/all/Squamish
collections_teaser:
  title: Fifteen glazes, fifteen places
  text: Each collection is named for the coast, mountain, or neighbourhood that shaped its colour.
products:
  title: From the current firing
  note: Checkout happens on the Shopify shop — the site hands over seamlessly.
events_band:
  title: Where to find me next
  no_events: Nothing on the calendar right now — join the newsletter below and you'll hear about the next market first.
story_teaser:
  title: A love affair with clay since the early '90s
  text: From lessons in a Winnipeg stoneware studio to a gold medal and a Strathcona studio of our own.
  label: Read our story
  image:
    url: /images/matthew-and-mugs.jpg
    alt: Matthew Freed holding a stack of his mugs
custom_seo_settings: false
author: ""
excerpt: ""
image: ""
ogtype: ""
---
```

(The old `notification`, `event`, `gallery`, `features` keys are replaced by the blocks above; the stray `123123` typo disappears with them.)

- [ ] **Step 4: Add pull quote to `src/views/about.md` front matter**

Add this key to the existing front matter (do not change anything else):

```yaml
quote: Pottery can be somewhat unpredictable and moody — so we fight on occasion. But our foundation is strong and we always patch things up.
```

- [ ] **Step 5: Add redirect**

Append to `src/_redirects`:

```
/updates/* /events/ 301
```

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: exit 0. (home-layout still reads old keys until Task 4 — Nunjucks tolerates missing keys, and the new keys are simply unused for now.)

Run: `grep -c "filterGroup" src/views/_data/showcase.json` → `15`.
Run: `grep -c "shop.matthewfreed.net" src/views/_data/showcase.json` → ≥ 12 (all features + none of gallery yet).
Run: `grep "updates" dist/_redirects` → shows the 301 line.

- [ ] **Step 7: Commit**

```bash
git add src/views/_data/global.json src/views/_data/showcase.json src/views/home.md src/views/about.md src/_redirects
git commit -m "feat: [copy] shop URL centralization, collection metadata, home front matter"
```

---

### Task 4: Homepage — hero and trust strip

**Files:**
- Modify: `src/views/_includes/partials/hero.njk` (full rewrite)
- Create: `src/views/_includes/partials/trust-strip.njk`
- Modify: `src/views/_includes/layouts/home-layout.njk` (full rewrite, initial version)

**Interfaces:**
- Consumes: `hero` and `trust` front-matter objects from Task 3; `global.shop.*`; `{% img %}` shortcode; Task 1 classes.
- Produces: `home-layout.njk` includes placeholders for sections added in Tasks 5–6 (they are added as includes in those tasks).

- [ ] **Step 1: Rewrite `src/views/_includes/partials/hero.njk`**

```njk
<section class="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 pb-12 pt-10 md:flex-row md:pt-16">
    <div class="w-full md:flex-1">
        <p class="cap-label text-blue">{{ hero.eyebrow }}</p>
        <h1 class="mt-3 font-display text-4xl font-black leading-tight text-ink md:text-5xl">{{ hero.title }}</h1>
        <p class="mt-4 max-w-md text-base leading-relaxed text-muted">{{ hero.text }}</p>
        <div class="mt-7 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <a href="{{ global.shop.base }}{{ global.shop.collectionsPath }}/" class="btn-primary text-center">{{ hero.cta_primary.label }}</a>
            <a href="{{ hero.cta_secondary.url }}" class="link-underline self-center">{{ hero.cta_secondary.label }}</a>
        </div>
    </div>
    <div class="w-full bg-tile md:flex-1">
        {% img hero.image.url.slice(1), hero.image.alt, "(min-width: 768px) 50vw, 100vw", "w-full object-cover", "eager" %}
    </div>
</section>
```

Note on the `{% img %}` call: the shortcode expects a path relative to `src/` (it prepends `src/`), while front-matter stores `/images/...`. Check how existing partials call it first: `grep -rn "{% img" src/views/_includes/` and copy that exact invocation pattern (including any leading-slash handling). If existing calls pass `"images/hero.jpg"` style paths, use `hero.image.url | replace("/images/", "images/")` instead of `.slice(1)`. Match the working pattern, then use the same pattern in ALL later `{% img %}` calls in this plan.

- [ ] **Step 2: Create `src/views/_includes/partials/trust-strip.njk`**

```njk
<section class="border-y border-hairline" aria-label="Why buy from Matthew">
    <ul class="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-4 md:justify-between">
        {% for item in trust %}
        <li class="text-sm text-muted">{{ item }}</li>
        {% endfor %}
    </ul>
</section>
```

- [ ] **Step 3: Rewrite `src/views/_includes/layouts/home-layout.njk`**

```njk
---
layout: base
---
{% include "hero.njk" %}
{% include "trust-strip.njk" %}
```

Check first how the old `home-layout.njk` chains to base (`grep -n "layout" src/views/_includes/layouts/home-layout.njk` before overwriting) — reuse the exact same front-matter chaining (it may be `layout: base.njk`).

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exit 0.

Run: `grep -c "Art for everyday life" dist/index.html` → ≥ 1.
Run: `grep -c "Circle Craft gold medal" dist/index.html` → `1`.
Run: `grep -c "glide" dist/index.html` → `0`.

- [ ] **Step 5: Commit**

```bash
git add src/views/_includes/partials/hero.njk src/views/_includes/partials/trust-strip.njk src/views/_includes/layouts/home-layout.njk
git commit -m "feat: homepage hero and trust strip"
```

---

### Task 5: Homepage — featured piece, collections teaser, products row

**Files:**
- Create: `src/views/_includes/partials/featured-piece.njk`
- Create: `src/views/_includes/partials/collections-teaser.njk`
- Create: `src/views/_includes/partials/home-products.njk`
- Create: `src/views/_includes/partials/dogwood.njk`
- Modify: `src/views/_includes/layouts/home-layout.njk`

**Interfaces:**
- Consumes: `featured_piece`, `collections_teaser`, `products` front matter (Task 3); `showcase.gallery` (with `slug`/`swatch` from Task 3); `showcase.features`; `global.shop.*`.
- Produces: `dogwood.njk` renders the four-petal mark, colored by the parent's `currentColor` (included as an ornament by Task 7's collections intro; the favicon in Task 12 is a standalone copy of the same shape).

- [ ] **Step 1: Create `src/views/_includes/partials/dogwood.njk`**

```njk
<svg viewBox="0 0 40 40" width="28" height="28" fill="currentColor" aria-hidden="true">
    <ellipse cx="20" cy="9" rx="6" ry="9"/>
    <ellipse cx="20" cy="31" rx="6" ry="9"/>
    <ellipse cx="9" cy="20" rx="9" ry="6"/>
    <ellipse cx="31" cy="20" rx="9" ry="6"/>
    <circle cx="20" cy="20" r="4" fill="#C8A876"/>
</svg>
```

- [ ] **Step 2: Create `src/views/_includes/partials/featured-piece.njk`**

```njk
<section class="mx-auto max-w-6xl px-6 py-12" aria-label="Featured piece">
    <p class="cap-label text-center text-soft">Featured piece</p>
    <div class="mt-8 flex flex-col items-center gap-8 md:flex-row md:gap-12">
        <div class="w-full bg-tile md:flex-1">
            {% img featured_piece.image.url.slice(1), featured_piece.image.alt, "(min-width: 768px) 50vw, 100vw", "w-full object-cover" %}
        </div>
        <div class="w-full md:flex-1">
            <h2 class="font-display text-3xl font-black text-ink">{{ featured_piece.title }}</h2>
            <p class="cap-label mt-2 text-blue">{{ featured_piece.caption }}</p>
            <p class="mt-4 text-base leading-relaxed text-muted">{{ featured_piece.text }}</p>
            <a href="{{ featured_piece.cta.url }}" class="btn-outline mt-6">{{ featured_piece.cta.label }}</a>
        </div>
    </div>
</section>
```

(Use the `{% img %}` invocation pattern settled in Task 4 here and everywhere below.)

- [ ] **Step 3: Create `src/views/_includes/partials/collections-teaser.njk`**

```njk
<section class="mx-auto max-w-6xl px-6 py-12" aria-label="Collections">
    <div class="flex items-baseline justify-between gap-4">
        <h2 class="font-display text-3xl font-black text-ink">{{ collections_teaser.title }}</h2>
        <a href="/collections.html" class="link-underline hidden whitespace-nowrap text-sm sm:inline">All collections</a>
    </div>
    <p class="mt-2 max-w-xl text-sm text-muted">{{ collections_teaser.text }}</p>
    <div class="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
        {% for item in showcase.gallery %}
        {% if loop.index <= 3 %}
        <a href="{{ global.shop.base }}{{ global.shop.collectionsPath }}/{{ item.slug }}" class="group">
            <div class="aspect-[4/3] w-full" style="background-color: {{ item.swatch }}">
                {% if item.image.url %}{% img item.image.url.slice(1), item.image.alt, "(min-width: 768px) 25vw, 50vw", "h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" %}{% endif %}
            </div>
            <p class="mt-3 font-display text-base font-black text-ink">{{ item.title | replace(" Collection", "") }}</p>
            <p class="cap-label mt-1 text-[11px] text-soft">{{ item.text | truncate(28, true, "…") }}</p>
        </a>
        {% endif %}
        {% endfor %}
        <a href="/collections.html" class="group">
            <div class="flex aspect-[4/3] w-full items-center justify-center bg-tile text-sm text-muted">+ {{ showcase.gallery.length - 3 }} more</div>
            <p class="mt-3 font-display text-base font-black text-blue">View all</p>
            <p class="cap-label mt-1 text-[11px] text-soft">The full field guide</p>
        </a>
    </div>
    <a href="/collections.html" class="link-underline mt-6 inline-block text-sm sm:hidden">All collections</a>
</section>
```

- [ ] **Step 4: Create `src/views/_includes/partials/home-products.njk`**

```njk
<section class="mx-auto max-w-6xl px-6 py-12" aria-label="Shop pieces">
    <div class="flex items-baseline justify-between gap-4">
        <h2 class="font-display text-3xl font-black text-ink">{{ products.title }}</h2>
        <a href="{{ global.shop.base }}{{ global.shop.collectionsPath }}/" class="link-underline whitespace-nowrap text-sm">Shop all pieces</a>
    </div>
    <div class="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
        {% set shown = 0 %}
        {% for item in showcase.features %}
        {% if not item.hide and shown < 3 %}
        {% set shown = shown + 1 %}
        <a href="{{ item.cta.url }}" class="group w-[72%] flex-none snap-start md:w-auto">
            <div class="bg-tile">
                {% img item.image.url.slice(1), item.image.alt, "(min-width: 768px) 33vw, 72vw", "w-full object-cover" %}
            </div>
            <p class="mt-3 font-display text-base font-black text-ink">{{ item.title.split(" - ")[1] | default(item.title) }}</p>
            <p class="cap-label mt-1 text-[11px] text-soft">{{ item.title.split(" - ")[0] }}</p>
            <span class="link-underline mt-2 inline-block text-sm">View in the shop</span>
        </a>
        {% endif %}
        {% endfor %}
    </div>
    <p class="mt-4 text-center text-xs text-soft">{{ products.note }}</p>
</section>
```

Nunjucks note: `{% set %}` inside `{% for %}` does not persist across iterations in Nunjucks. If the `shown` counter doesn't work (all visible features render), replace the loop with a pre-filter: `{% for item in showcase.features | rejectattr("hide") %}{% if loop.index <= 3 %}...{% endif %}{% endfor %}` — `rejectattr` is available in Nunjucks. Verify by counting rendered cards in Step 6.

- [ ] **Step 5: Update `src/views/_includes/layouts/home-layout.njk`**

Add after the trust-strip include, implementing the mobile/desktop order swap (mobile: products → featured → collections; desktop: featured → collections → products):

```njk
<div class="flex flex-col">
    <div class="order-2 md:order-1">{% include "featured-piece.njk" %}</div>
    <div class="order-3 md:order-2">{% include "collections-teaser.njk" %}</div>
    <div class="order-1 md:order-3">{% include "home-products.njk" %}</div>
</div>
```

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: exit 0.

Run: `grep -c "Featured piece" dist/index.html` → `1`.
Run: `grep -c "Fifteen glazes" dist/index.html` → `1`.
Run: `grep -c "View in the shop" dist/index.html` → exactly `4` (3 product cards + the featured-piece CTA uses the same label). If the count is higher, the `shown` counter isn't limiting the loop — apply the `rejectattr` fix from the Nunjucks note in Step 4.
Run: `grep -c "myshopify" dist/index.html` → `0`.

- [ ] **Step 7: Commit**

```bash
git add src/views/_includes/partials/featured-piece.njk src/views/_includes/partials/collections-teaser.njk src/views/_includes/partials/home-products.njk src/views/_includes/partials/dogwood.njk src/views/_includes/layouts/home-layout.njk
git commit -m "feat: homepage featured piece, collections teaser, products row"
```

---

### Task 6: Homepage — events band, story teaser; retire home.js

**Files:**
- Modify: `src/views/_includes/partials/home-events.njk` (full rewrite)
- Create: `src/views/_includes/partials/story-teaser.njk`
- Modify: `src/views/_includes/layouts/home-layout.njk`
- Delete: `src/javascript/home.js`

**Interfaces:**
- Consumes: `events.events` data + existing `filterFeatured` filter (returns up to 5 future featured events sorted ascending); `events_band` and `story_teaser` front matter (Task 3); `atStudio` flag is added to data in Task 8 — this template already reads `event.atStudio` (renders nothing until then).

- [ ] **Step 1: Rewrite `src/views/_includes/partials/home-events.njk`**

```njk
<section class="bg-blue" aria-label="Upcoming events">
    <div class="mx-auto max-w-6xl px-6 py-12">
        <div class="flex items-baseline justify-between gap-4">
            <h2 class="font-display text-3xl font-black text-paper">{{ events_band.title }}</h2>
            <a href="/events/" class="whitespace-nowrap border-b border-sand pb-0.5 text-sm font-medium text-sand">All events</a>
        </div>
        {% set upcoming = events.events | filterFeatured %}
        {% if upcoming.length %}
        <ul class="mt-6">
            {% for event in upcoming %}
            {% if loop.index <= 3 %}
            <li class="flex flex-col justify-between gap-1 border-b border-blue-light py-4 last:border-b-0 sm:flex-row sm:items-baseline">
                <p class="font-display text-lg font-black text-paper">
                    {{ event.name }}
                    {% if event.atStudio %}<span class="cap-label ml-2 text-[11px] text-sand">At my studio</span>{% endif %}
                </p>
                <p class="text-sm text-paper/70">
                    {{ event.date | date("MMM d") }}{% if event.multi_day_event %} – {{ event.end_date | date("MMM d") }}{% endif %}
                </p>
            </li>
            {% endif %}
            {% endfor %}
        </ul>
        {% else %}
        <p class="mt-6 max-w-xl text-base text-paper/80">{{ events_band.no_events }}</p>
        {% endif %}
    </div>
</section>
```

Note: `text-paper/70` opacity utilities work in Tailwind 4 with custom colors. If the build emits nothing for them, use `text-[#AEBFCE]` as fallback.

- [ ] **Step 2: Create `src/views/_includes/partials/story-teaser.njk`**

```njk
<section class="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-12 md:flex-row" aria-label="About Matthew">
    <div class="h-28 w-28 flex-none overflow-hidden rounded-full bg-tile">
        {% img story_teaser.image.url.slice(1), story_teaser.image.alt, "112px", "h-full w-full object-cover" %}
    </div>
    <div>
        <h2 class="font-display text-2xl font-black text-ink">{{ story_teaser.title }}</h2>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted">{{ story_teaser.text }}</p>
        <a href="/about/" class="link-underline mt-4 inline-block text-sm">{{ story_teaser.label }}</a>
    </div>
</section>
```

- [ ] **Step 3: Complete `src/views/_includes/layouts/home-layout.njk`**

Append after the order-swap `</div>`:

```njk
{% include "home-events.njk" %}
{% include "story-teaser.njk" %}
```

- [ ] **Step 4: Delete `src/javascript/home.js`**

```bash
git rm src/javascript/home.js
```

Then check nothing references it: `grep -rn "home.js" src/` → no matches (base.njk was already cleaned in Task 1; if a layout still loads it, remove that script tag).

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: exit 0.

Run: `grep -c "Where to find me next" dist/index.html` → `1`.
Run: `grep -c "Read our story" dist/index.html` → `1`.

Manual preview: `npm run dev`, open `http://localhost:8080/`, confirm the full homepage renders in order (mobile order swap: narrow the window below 768px and confirm products appear before featured piece). Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: [copy] homepage events band and story teaser; drop Glide carousel JS"
```

---

### Task 7: Collections field-guide page

**Files:**
- Modify: `src/views/collections.md` (front matter rewrite)
- Modify: `src/views/_includes/layouts/collections-layout.njk` (full rewrite)
- Create: `src/views/_includes/partials/collection-card.njk`
- Modify: `src/javascript/collections.js` (full rewrite)

**Interfaces:**
- Consumes: `showcase.gallery` items with `slug`/`swatch`/`filterGroup` (Task 3); Task 1 `.chip` classes.
- Produces: filter chips with `data-filter` attributes; cards with `data-group` attributes. `collections.js` binds them.

- [ ] **Step 1: Rewrite `src/views/collections.md` front matter**

Keep `layout`, `title`, `tags`, `permalink` and SEO keys exactly as they are; replace `notification`, `intro`, `features` with:

```yaml
intro:
  eyebrow: The collections
  title: Fifteen glazes, named after the places that made them
  text: Each glaze began somewhere — a night sky over Squamish, dogwoods on the boulevard. Find yours.
filters:
  - All
  - Blues
  - Charcoals
  - Earth tones
  - Patterned
```

- [ ] **Step 2: Create `src/views/_includes/partials/collection-card.njk`**

```njk
<article class="overflow-hidden rounded-xl border border-hairline bg-white" data-group="{{ item.filterGroup }}">
    <div class="aspect-[4/3]" style="background-color: {{ item.swatch }}">
        {% if item.image.url %}{% img item.image.url.slice(1), item.image.alt, "(min-width: 768px) 33vw, 50vw", "h-full w-full object-cover" %}{% endif %}
    </div>
    <div class="p-4">
        <h2 class="font-display text-lg font-black text-ink">{{ item.title | replace(" Collection", "") }}</h2>
        <p class="mt-1 text-sm text-muted">{{ item.text }}</p>
        <a href="{{ global.shop.base }}{{ global.shop.collectionsPath }}/{{ item.slug }}" class="link-underline mt-3 inline-block text-sm">Browse in shop</a>
    </div>
</article>
```

- [ ] **Step 3: Rewrite `src/views/_includes/layouts/collections-layout.njk`**

Match the base-chaining front matter style found in the old file, then:

```njk
<section class="mx-auto max-w-3xl px-6 pt-12 text-center">
    <p class="cap-label text-blue">{{ intro.eyebrow }}</p>
    <h1 class="mt-3 font-display text-4xl font-black leading-tight text-ink">{{ intro.title }}</h1>
    <p class="mt-4 text-base text-muted">{{ intro.text }}</p>
    <div class="mt-6 flex justify-center text-blue">{% include "dogwood.njk" %}</div>
</section>

<div class="mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-6 pt-8" role="group" aria-label="Filter collections">
    {% for f in filters %}
    <button type="button" class="chip{% if loop.first %} is-active{% endif %}" data-filter="{{ f | lower | replace(" ", "-") }}">{{ f }}</button>
    {% endfor %}
</div>

<section class="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-2 md:grid-cols-3" id="collection-grid" aria-label="All collections">
    {% for item in showcase.gallery %}
    {% include "collection-card.njk" %}
    {% endfor %}
</section>
<script defer src="/js/collections.js"></script>
```

Important: `data-group` on cards must match `data-filter` on chips. In `collection-card.njk` change the attribute to the same normalization: `data-group="{{ item.filterGroup | lower | replace(" ", "-") }}"`.

- [ ] **Step 4: Rewrite `src/javascript/collections.js`**

```js
document.addEventListener("DOMContentLoaded", () => {
    const chips = document.querySelectorAll("[data-filter]");
    const cards = document.querySelectorAll("[data-group]");
    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            chips.forEach((c) => c.classList.toggle("is-active", c === chip));
            const group = chip.dataset.filter;
            cards.forEach((card) => {
                card.hidden = group !== "all" && card.dataset.group !== group;
            });
        });
    });
});
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: exit 0.

Run: `grep -c "data-group" dist/collections.html` → `15`.
Run: `grep -c "Browse in shop" dist/collections.html` → `15`.
Run: `grep -c "myshopify" dist/collections.html` → `0`.

Manual preview: `npm run dev`, open `/collections.html`, click "Blues" — only Blues cards remain; click "All" — all 15 return.

- [ ] **Step 6: Commit**

```bash
git add src/views/collections.md src/views/_includes/layouts/collections-layout.njk src/views/_includes/partials/collection-card.njk src/javascript/collections.js
git commit -m "feat: [copy] collections field-guide page with glaze filters"
```

---

### Task 8: Events page — rename from Updates, cards, studio sidebar, JSON-LD

**Files:**
- Create: `src/views/events.md`
- Delete: `src/views/updates.md`
- Modify: `src/views/_includes/layouts/events-layout.njk` (full rewrite)
- Modify: `src/views/_data/events.json` (add `atStudio` to each event)
- Delete: `src/javascript/events.js` (only if it contains just carousel/Glide code — check first)

**Interfaces:**
- Consumes: `events.events` with `filterFuture` filter; existing `date` filter (`MM-dd-yyyy` input).
- Produces: page at `/events/`; `atStudio: true|false` on every event object (Task 6's band already reads it).

- [ ] **Step 1: Inspect the old page and JS**

Run: `grep -n "layout\|permalink\|eleventyNavigation" src/views/updates.md` and `head -40 src/javascript/events.js`.
The new `events.md` reuses the old front-matter keys where still needed. Delete `events.js` only if it is Glide/carousel wiring; if it does anything else (e.g. maps embed), keep the needed part and note it in the layout.

- [ ] **Step 2: Create `src/views/events.md`**

```yaml
---
layout: events-layout
title: Events
tags: footer
permalink: "/events/index.html"
eleventyNavigation:
  key: Events
  order: 3
intro:
  eyebrow: Events
  title: Where to find me
rhythm: "The annual rhythm: farmers markets through the summer, then the Eastside Culture Crawl and Circle Craft Holiday Market each November."
studio:
  title: Visit the studio
  text: Between events, the studio opens by appointment — send a note and come see where the work happens.
  cta:
    label: Get in touch
    url: /contact/
  footnote: Can't make it? The newsletter announces every market and firing.
custom_seo_settings: false
author: ""
excerpt: ""
image: ""
ogtype: ""
---
```

Then: `git rm src/views/updates.md`

- [ ] **Step 3: Add `atStudio` to every event in `src/views/_data/events.json`**

Add `"atStudio": true` to events whose `location` contains "Studio" or "Jackson" (the Eastside Culture Crawl entries), `"atStudio": false` to all others.

- [ ] **Step 4: Rewrite `src/views/_includes/layouts/events-layout.njk`**

Match the base-chaining front matter of the old file, then:

```njk
<section class="mx-auto max-w-6xl px-6 pt-12">
    <p class="cap-label text-blue">{{ intro.eyebrow }}</p>
    <h1 class="mt-3 font-display text-4xl font-black text-ink">{{ intro.title }}</h1>
</section>

<div class="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
    <div class="flex-[1.4]">
        {% set upcoming = events.events | filterFuture %}
        {% if upcoming.length %}
        {% for event in upcoming | sortByDate | reverse %}
        <article class="mb-4 flex gap-4 rounded-xl border border-hairline bg-white p-5">
            <div class="flex h-fit flex-none flex-col items-center rounded-lg px-4 py-2 {% if event.atStudio %}bg-blue{% else %}bg-tile{% endif %}">
                <span class="cap-label text-[11px] {% if event.atStudio %}text-sand{% else %}text-soft{% endif %}">{{ event.date | date("MMM") }}</span>
                <span class="font-display text-xl font-black {% if event.atStudio %}text-paper{% else %}text-ink{% endif %}">{{ event.date | date("d") }}{% if event.multi_day_event and event.end_date != event.date %}–{{ event.end_date | date("d") }}{% endif %}</span>
            </div>
            <div>
                <h2 class="font-display text-xl font-black text-ink">
                    {{ event.name }}
                    {% if event.atStudio %}<span class="cap-label ml-2 text-[11px] text-sand">At my studio</span>{% endif %}
                </h2>
                <p class="mt-1 text-sm text-muted">{{ event.location }} · {{ event.time }}</p>
                {% if event.content.body %}<p class="mt-2 text-sm leading-relaxed text-muted">{{ event.content.body }}</p>{% endif %}
                {% if event.gmaps %}<a href="https://www.google.com/maps/search/?api=1&query={{ event.gmaps | urlencode }}" class="link-underline mt-3 inline-block text-sm">Directions</a>{% endif %}
            </div>
        </article>
        {% endfor %}
        {% else %}
        <p class="rounded-xl border border-hairline bg-white p-6 text-base text-muted">Nothing on the calendar right now — the newsletter is the first to know when that changes.</p>
        {% endif %}
        <p class="mt-6 text-center text-sm text-soft">{{ rhythm }}</p>
    </div>

    <aside class="h-fit flex-1 rounded-xl bg-blue p-6">
        <h2 class="font-display text-xl font-black text-paper">{{ studio.title }}</h2>
        <p class="mt-3 text-sm leading-relaxed text-paper/80">{{ studio.text }}</p>
        <a href="{{ studio.cta.url }}" class="mt-5 inline-block rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-blue">{{ studio.cta.label }}</a>
        <p class="mt-5 border-t border-blue-light pt-4 text-sm text-paper/80">{{ studio.footnote }}</p>
    </aside>
</div>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {% for event in events.events | filterFuture %}
    {
      "@type": "Event",
      "name": {{ event.name | dump | safe }},
      "startDate": "{{ event.date | date("yyyy-MM-dd") }}",
      "endDate": "{{ event.end_date | date("yyyy-MM-dd") }}",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": {{ event.location | dump | safe }},
        "address": {{ event.gmaps | dump | safe }}
      }
    }{% if not loop.last %},{% endif %}
    {% endfor %}
  ]
}
</script>
```

Ordering note: `sortByDate` sorts descending (newest first); `| reverse` flips to ascending (soonest first). Verify against the rendered order in Step 6.

- [ ] **Step 5: Update the nav — no change needed**

Task 2's nav already links `/events/`. Verify no template still links `/updates`: `grep -rn '"/updates' src/views/` → only `_redirects` context allowed.

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: exit 0.

Run: `test -f dist/events/index.html && echo OK` → `OK`.
Run: `test -f dist/updates/index.html || echo GONE` → `GONE`.
Run: `grep -c '"@type": "Event"' dist/events/index.html` → equals the number of future events in `events.json` (0 is valid if all dates have passed — then the JSON-LD `@graph` is an empty array and the no-events card shows).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: [copy] events page replaces updates - date cards, studio sidebar, Event schema"
```

---

### Task 9: About page

**Files:**
- Modify: `src/views/_includes/layouts/about-layout.njk` (full rewrite)

**Interfaces:**
- Consumes: `about.md` front matter: `headline`, `intro`, `sections[]` (each `image{url,alt}` + `paragraphs[]`), `quote` (Task 3). Content text is used VERBATIM — the "we/us" romance voice is intentional, do not edit it.

- [ ] **Step 1: Rewrite `src/views/_includes/layouts/about-layout.njk`**

Match base-chaining front matter of the old file, then:

```njk
<section class="mx-auto max-w-3xl px-6 pt-12 text-center">
    <p class="cap-label text-blue">About Matthew</p>
    <h1 class="mt-3 font-display text-4xl font-black leading-tight text-ink">{{ headline }}</h1>
    <p class="mt-5 text-base leading-relaxed text-muted">{{ intro }}</p>
</section>

{% for section in sections %}
<section class="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-10 md:flex-row {% if loop.index % 2 == 0 %}md:flex-row-reverse{% endif %}">
    <div class="w-full overflow-hidden rounded-xl bg-tile md:flex-1">
        {% img section.image.url.slice(1), section.image.alt, "(min-width: 768px) 50vw, 100vw", "w-full object-cover" %}
    </div>
    <div class="w-full md:flex-1">
        {% for p in section.paragraphs %}
        <p class="mb-4 text-base leading-relaxed text-muted">{{ p }}</p>
        {% endfor %}
    </div>
</section>
{% if loop.index == 1 and quote %}
<section class="mx-auto max-w-3xl px-6 py-6">
    <blockquote class="border-l-4 border-sand pl-6 font-display text-xl font-medium leading-relaxed text-blue">{{ quote }}</blockquote>
</section>
{% endif %}
{% endfor %}

<section class="mx-auto max-w-3xl px-6 pb-14 pt-4">
    <div class="flex items-center gap-5 rounded-xl border border-hairline bg-white p-6">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C8A876" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5"/></svg>
        <p class="text-sm leading-relaxed text-muted">Gold Medal for Excellence in Craft — Circle Craft. The story ends where the shop begins: <a href="{{ global.shop.base }}{{ global.shop.collectionsPath }}/" class="link-underline">see what we've made together</a>.</p>
    </div>
</section>
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: exit 0.

Run: `grep -c "love affair" dist/about/index.html` → ≥ 1 (intro text verbatim).
Run: `grep -c "flex-row-reverse" dist/about/index.html` → `1` (second section alternates).
Run: `grep -c "unpredictable and moody" dist/about/index.html` → `1` (pull quote).

- [ ] **Step 3: Commit**

```bash
git add src/views/_includes/layouts/about-layout.njk
git commit -m "feat: [copy] about page - alternating story, pull quote, medal handoff"
```

---

### Task 10: Utility pages — general layout, FAQ accordions, contact

**Files:**
- Modify: `src/views/_includes/layouts/general-layout.njk` (full rewrite)
- Modify: `src/views/_includes/layouts/faq-layout.njk` (full rewrite)
- Modify: `src/views/_includes/layouts/contact-layout.njk` (restyle)

**Interfaces:**
- Consumes: `faq.json` (check its shape first: `head -30 src/views/_data/faq.json`); existing `contact-form.njk` + `contact-details.njk` partials (kept, restyled in place).

- [ ] **Step 1: Rewrite `src/views/_includes/layouts/general-layout.njk`**

First check which pages use it: `grep -rln "general-layout" src/views/`. Then (matching base-chaining):

```njk
<article class="mx-auto max-w-3xl px-6 py-12">
    <h1 class="font-display text-4xl font-black leading-tight text-ink">{{ title }}</h1>
    <div class="prose-pottery mt-8">{{ content | safe }}</div>
</article>
```

Add to `src/styles/main.css` `@layer components`:

```css
.prose-pottery {
    @apply text-base leading-relaxed text-muted;
}
.prose-pottery h2 { @apply mt-8 mb-3 font-display text-2xl font-black text-ink; }
.prose-pottery h3 { @apply mt-6 mb-2 font-display text-xl font-black text-ink; }
.prose-pottery p  { @apply mb-4; }
.prose-pottery a  { @apply link-underline; }
.prose-pottery ul { @apply mb-4 list-disc pl-6; }
```

- [ ] **Step 2: Rewrite `src/views/_includes/layouts/faq-layout.njk`**

Adapt the loop to the actual `faq.json` shape found in Step 1 consumes-check (keys below assume `faq.faqs[]` with `question`/`answer` — adjust names to the real ones):

```njk
<section class="mx-auto max-w-3xl px-6 py-12">
    <h1 class="font-display text-4xl font-black text-ink">{{ title }}</h1>
    <div class="mt-8">
        {% for item in faq.faqs %}
        <details class="group border-b border-hairline py-4">
            <summary class="flex cursor-pointer list-none items-center justify-between font-display text-lg font-black text-ink">
                {{ item.question }}
                <svg class="flex-none transition-transform group-open:rotate-45" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </summary>
            <p class="mt-3 text-base leading-relaxed text-muted">{{ item.answer | safe }}</p>
        </details>
        {% endfor %}
    </div>
</section>
```

No JS — native `<details>`.

- [ ] **Step 3: Restyle `src/views/_includes/layouts/contact-layout.njk`**

Keep the existing includes (`contact-form.njk`, `contact-details.njk`) and their form field names untouched; wrap them:

```njk
<section class="mx-auto max-w-6xl px-6 py-12">
    <h1 class="font-display text-4xl font-black text-ink">{{ title }}</h1>
    <div class="mt-8 flex flex-col gap-10 md:flex-row">
        <div class="flex-1">{% include "contact-form.njk" %}</div>
        <div class="flex-1">{% include "contact-details.njk" %}</div>
    </div>
</section>
```

Inside `contact-form.njk`, only swap styling classes on inputs/buttons to the Task 1 system (`rounded-full border border-hairline bg-white px-5 py-3`, submit = `btn-primary`); do NOT touch `name`, `action`, `method`, or hidden Netlify form attributes.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exit 0.

Run: `grep -c "<details" dist/faq/index.html` → equals FAQ count in `faq.json`.
Run: `grep -c "prose-pottery" dist/process/index.html` → ≥ 1 (adjust path if process.md's permalink differs).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: restyle utility pages - prose layout, FAQ accordions, contact"
```

---

### Task 11: CMS — Decap config for the new fields

**Files:**
- Modify: `src/admin/config.yml`

**Interfaces:**
- Consumes: every front-matter/data key introduced in Tasks 3 and 8. The CMS must round-trip them: `slug`, `swatch`, `filterGroup` (showcase gallery); `featured_piece`, `trust`, `story_teaser`, `hero`, `collections_teaser`, `products`, `events_band` (home file); `atStudio` (events); `quote` (about); shop `base`/`collectionsPath` (global).

- [ ] **Step 1: Update the showcase gallery fields**

In the `Home - Gallery` file collection (around line 99, `name: "showcase"`), add to the gallery item `fields` list:

```yaml
              - {label: "Shop collection slug (tail of the shop URL)", name: "slug", widget: "string"}
              - {label: "Swatch colour (hex)", name: "swatch", widget: "string", pattern: ["^#[0-9A-Fa-f]{6}$", "Must be a hex colour like #1F3A52"]}
              - label: "Filter group"
                name: "filterGroup"
                widget: "select"
                options: ["Blues", "Charcoals", "Earth tones", "Patterned"]
```

- [ ] **Step 2: Update the home page fields**

In the home file collection (the one pointing at `src/views/home.md`), replace the removed `notification`/`event`/`gallery`/`features` field groups with the blocks below. For the two `image` object fields, copy the exact widget shape (including `media_folder`/`public_folder` settings) from an existing image field in this same file — the inner `{url, alt}` structure must match what the old fields used so `{% img %}` keeps working.

```yaml
          - label: "Hero"
            name: "hero"
            widget: "object"
            fields:
              - {label: "Eyebrow", name: "eyebrow", widget: "string"}
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Text", name: "text", widget: "text"}
              - label: "Primary button"
                name: "cta_primary"
                widget: "object"
                fields:
                  - {label: "Label", name: "label", widget: "string"}
              - label: "Secondary link"
                name: "cta_secondary"
                widget: "object"
                fields:
                  - {label: "Label", name: "label", widget: "string"}
                  - {label: "URL", name: "url", widget: "string"}
              - label: "Image"
                name: "image"
                widget: "object"
                fields:
                  - {label: "url", name: "url", widget: "image"}
                  - {label: "alt", name: "alt", widget: "string"}
          - label: "Trust strip"
            name: "trust"
            widget: "list"
            field: {label: "Item", name: "item", widget: "string"}
          - label: "Featured piece"
            name: "featured_piece"
            widget: "object"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Glaze caption", name: "caption", widget: "string"}
              - {label: "Text", name: "text", widget: "text"}
              - label: "Image"
                name: "image"
                widget: "object"
                fields:
                  - {label: "url", name: "url", widget: "image"}
                  - {label: "alt", name: "alt", widget: "string"}
              - label: "Shop link"
                name: "cta"
                widget: "object"
                fields:
                  - {label: "Label", name: "label", widget: "string"}
                  - {label: "URL", name: "url", widget: "string"}
          - label: "Collections teaser"
            name: "collections_teaser"
            widget: "object"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Text", name: "text", widget: "text"}
          - label: "Products section"
            name: "products"
            widget: "object"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Note under the grid", name: "note", widget: "string"}
          - label: "Events band"
            name: "events_band"
            widget: "object"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Text when no events", name: "no_events", widget: "text"}
          - label: "Story teaser"
            name: "story_teaser"
            widget: "object"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Text", name: "text", widget: "text"}
              - {label: "Link label", name: "label", widget: "string"}
              - label: "Image"
                name: "image"
                widget: "object"
                fields:
                  - {label: "url", name: "url", widget: "image"}
                  - {label: "alt", name: "alt", widget: "string"}
```

- [ ] **Step 3: Update events fields**

In the events file collection (around line 471), add to the event `fields`:

```yaml
            - {label: "Takes place at my studio", name: "atStudio", widget: "boolean", default: false}
```

- [ ] **Step 4: Update about + global**

- About file collection: add `- {label: "Pull quote", name: "quote", widget: "text", required: false}`.
- Global file collection: replace the old `shop` `url` field with `base` and `collectionsPath` string fields.
- Rename the "News & Events" → events file label if it still says "Updates" anywhere, and update any `file:` path that pointed at `src/views/updates.md` to `src/views/events.md`.

- [ ] **Step 5: Verify config parses and round-trips**

Run: `npx js-yaml src/admin/config.yml > /dev/null && echo YAML-OK` (js-yaml ships with the dependency tree; if unavailable, run `node -e "const y=require('js-yaml');y.load(require('fs').readFileSync('src/admin/config.yml','utf8'));console.log('YAML-OK')"`).
Expected: `YAML-OK`.

Run: `npm run dev:cms`, open `http://localhost:8080/admin/`, open Home, the Gallery, and an Event — every new field renders and shows the current value. Save nothing. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/admin/config.yml
git commit -m "feat: CMS fields for swatches, filters, featured piece, studio flag"
```

---

### Task 12: Cleanup, favicon, link hygiene, final verification

**Files:**
- Create: `src/assets/favicon.svg`
- Modify: `src/views/_data/showcase.json` (retire myshopify gallery cta URLs)
- Delete: obsolete partials (list below) after reference check

- [ ] **Step 1: Create `src/assets/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" fill="#F8F5EE"/>
    <g fill="#1F3A52">
        <ellipse cx="20" cy="9" rx="6" ry="9"/>
        <ellipse cx="20" cy="31" rx="6" ry="9"/>
        <ellipse cx="9" cy="20" rx="9" ry="6"/>
        <ellipse cx="31" cy="20" rx="9" ry="6"/>
    </g>
    <circle cx="20" cy="20" r="4" fill="#C8A876"/>
</svg>
```

- [ ] **Step 2: Retire stale gallery cta URLs**

In `src/views/_data/showcase.json` gallery items: now that no template reads `gallery[].cta` (Tasks 5 and 7 compose links from `slug`), replace each gallery `cta.url` host `matthew-freed-pottery.myshopify.com` → `shop.matthewfreed.net` anyway (the CMS still edits these and Matthew may reuse them). Keep the field.

Also remove the corresponding `cta` fields from config.yml ONLY if removed here — otherwise leave both (leave both is the default; this step is host-swap only).

- [ ] **Step 3: Delete obsolete partials**

For each of: `home-features.njk`, `home-showcase.njk`, `card-feature.njk`, `card-sm-events.njk`, `card-sm-events-upcoming.njk`, `collections-collection.njk`, `card.njk`, `card-sm.njk`, `card-list.njk`, `load-more.njk`, `notification.njk`, `subnav.njk` in `src/views/_includes/partials/`:

Run first: `grep -rn "<name>" src/views/` — delete (`git rm`) only files with zero remaining references. Any partial still referenced stays and gets a note in the commit message.

- [ ] **Step 4: Link hygiene sweep**

Run: `grep -rn "myshopify" src/ --include="*.json" --include="*.md" --include="*.njk" --include="*.yml"`
Expected: zero matches. Fix any stragglers by swapping host to `shop.matthewfreed.net`.

Run: `grep -rn "font-awesome\|fontawesome\|glide\|alpine" src/views/`
Expected: zero matches.

Run: `grep -rn "italic" src/views/ src/styles/`
Expected: zero matches (no-italics rule).

- [ ] **Step 5: Full build + preview sweep**

Run: `npm run build` → exit 0.
Run: `npm run dev` and check every page at desktop and ~375px width: `/`, `/collections.html`, `/events/`, `/about/`, `/contact/`, `/faq/`, `/process/`, `/retail-stores/`, `/privacy-statement/`. Confirm: fonts render (Fraunces headlines), nav toggle works, collection filters work, FAQ accordions open, no console errors, `/updates/` redirects (redirect only verifiable on Netlify — locally just confirm `dist/_redirects` contains the rule). Stop the server.

Check JS budget: `wc -c src/javascript/*.js` → total < 3000 bytes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: favicon, dead partial cleanup, shop link hygiene"
```

---

## Post-plan follow-ups (not tasks — hand back to the user)

1. Matthew reviews all `[copy]` commits' wording and the swatch/filterGroup table.
2. Matthew supplies photography: hero replacement (optional), featured piece, any collection tile without a clean shot.
3. Optional: restyle the Shopify theme (paper/blue/Fraunces) so the handoff is seamless.
4. Deploy preview on Netlify; verify `/updates/` 301 and Google fonts load.
