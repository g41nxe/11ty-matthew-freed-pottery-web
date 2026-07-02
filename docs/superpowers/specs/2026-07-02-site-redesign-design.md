# Matthew Freed Pottery — site redesign design spec

Date: 2026-07-02
Status: approved direction, pending final user review
Supersedes: any earlier redesign concepts (fresh start requested 2026-07-02)

## 1. Context and goals

matthewfreed.ca is the digital version of Matthew's studio: people come to explore
his work and find upcoming events. Full redesign of all pages.

- Primary goal: a deliberate mix — products lead visually; shop clicks and event
  attendance carry roughly equal conversion weight.
- The personal story has a home but is not front and center.
- Hard constraint: the shop is and stays Shopify
  (`matthew-freed-pottery.myshopify.com`); the site never imitates a cart.
- Stack: keep the existing Eleventy + git-based CMS setup in this repo. Content
  files and permalinks are preserved (no SEO loss); layouts, partials, and CSS are
  rewritten.
- Content rules: free hand on copy and structure; placeholders allowed where better
  photography is needed, clearly flagged "needs real photo"; Matthew reviews all
  drafted copy before launch.

## 2. Design direction

Merge of two explored directions:

- From "Glaze & landscape" (A): product-first page structure, warm paper canvas,
  the "fifteen glazes, fifteen places" storytelling (his collections are named
  after BC places), and a strong blue events band.
- From "Quiet gallery" (B): gallery discipline — featured-piece spotlight,
  hairline dividers instead of boxes, generous whitespace, restrained accent use.

Rejected: green as a key color (user), terracotta canvas (cliché, fights his
cool-toned glazes), studio-first hierarchy (conflicts with product-first goal).

Reference points: East Fork (glaze names drive the brand), Florian Gadsby /
Heath Ceramics (gallery restraint).

## 3. Foundations

### 3.1 Color tokens

| Token         | Value     | Role                                                        |
| ------------- | --------- | ----------------------------------------------------------- |
| Paper         | `#F8F5EE` | Page background everywhere                                  |
| Ink           | `#2A2822` | Headlines, dark text, footer background                     |
| Squamish blue | `#1F3A52` | The one accent: primary buttons, links, captions, events band |
| Blue-light    | `#33556E` | Hover states, cards on the blue band                        |
| Sand          | `#C8A876` | Rare warm moments: links on blue, badges — never a button   |

Supporting: hairline `#E9E3D5`, image tile ground `#EDE8DB`.

Each of the 15 collections carries its own swatch hex (CMS field), used only for
its tile in collections grids — the "glazes as palette" idea without a rainbow UI.

Squamish-speckle texture (tiny sand dots) is held in reserve for hero/newsletter
bands; decide against real photos during build, default is off.

### 3.2 Typography

- Headlines (h1/h2): Fraunces, weight 900 (Black), upright. No italics anywhere
  on the site.
- Sub-level headings (h3, event names, card titles): Fraunces 500–900 by scale.
- Glaze captions / eyebrows / labels: Karla 500, uppercase, letterspaced (~0.14em).
- Body and all UI chrome (nav, buttons, forms, dates): Karla 400/500.
- Pull quotes (About): Fraunces Regular upright in Squamish blue with a sand
  left rule — replaces the italic treatment.
- Loading: two variable font files (Fraunces, Karla), preloaded,
  `font-display: swap`. Body text never below 16px on mobile.

### 3.3 Components

- Filled blue pill: the single primary CTA per screen.
- Outlined pill: secondary actions. Thin blue underline: tertiary links.
- Hairline dividers instead of boxed cards wherever possible.
- Soft corners (8–10px); no shadows — elevation via cream/ink contrast.

### 3.4 Brand

- Wordmark: "Matthew Freed" in Fraunces Black (blue on paper, paper on blue/ink).
- Secondary mark: four-petal dogwood, lifted from his hand-painted Dogwood glaze
  pattern. Used for favicon, section-divider ornament, Dogwood tile. Never
  replaces the wordmark in the nav.

### 3.5 Imagery

- Product photos on consistent neutral/cream grounds (`#EDE8DB` tiles).
- Studio and event photos are the only place clutter/life is allowed.
- Existing repo photos are used first; gaps get flagged placeholders for Matthew.

## 4. Homepage

Desktop section order:

1. Nav: wordmark, Collections / Events / About / Contact, blue Shop pill.
2. Hero: eyebrow "Handthrown in Vancouver", h1 "Art for everyday life", one-line
   sub, primary CTA "Shop the collections" + underline link "Upcoming events",
   product photo (Galiano bowls or equivalent).
3. Trust strip (hairline-bounded): Circle Craft gold medal · every piece one of a
   kind · free local delivery over $150.
4. Featured piece: gallery-style spotlight — image tile, Fraunces name, uppercase
   glaze caption, one-liner, outlined "View in the shop". CMS-repointable so the
   homepage stays alive.
5. Collections teaser: "Fifteen glazes, fifteen places", 3 collection tiles +
   "view all" tile.
6. Products: "From the current firing", 3 cards linking into Shopify, small note
   "checkout happens on the Shopify shop".
7. Events band (blue): "Where to find me next", ruled list of upcoming events,
   sand "at my studio" badge for studio events, "All events" link.
8. Story teaser (quiet, low on page): round photo, "A love affair with clay since
   the early '90s", "Read our story" link.
9. Newsletter: "First to know about firings and markets", one email a month.
10. Footer (ink): address, Instagram/Facebook, Retail stores, FAQ, Privacy.

Conversion paths: exactly two routes repeat — shop (nav pill, hero CTA, featured,
products) and events (hero link, band, newsletter). Story gets one teaser.

Content mapping: hero from `global.json`; collections from `showcase.json`;
events from `events.json` filtered to future dates (empty state: newsletter
fallback message); story teaser from `about.md`.

## 5. Inner pages

### 5.1 Collections (`/collections`) — "the field guide"

- Centered intro: eyebrow, h1 "Fifteen glazes, named after the places that made
  them", short sub.
- Client-side filter chips: All / Blues / Charcoals / Earth tones / Patterned
  (plain JS, no framework).
- Grid of 15 cards: product photo over swatch color, Fraunces name, uppercase
  caption, "Browse in shop" link to the collection's Shopify URL.

### 5.2 Events (`/events`) — replaces "Updates" (nav renamed)

- Upcoming events as date-block cards (blue block for studio events + sand
  "at my studio" badge), time/location/description, Directions link from existing
  `gmaps` data.
- Sidebar card (blue): "Visit the studio" — by-appointment invitation + contact
  CTA + newsletter line. The studio as a standing destination.
- Past events compress into a one-line "annual rhythm" note (summer farmers
  markets, November crawl + Circle Craft). No stale listings.

### 5.3 About (`/about`)

- Matthew's "love affair with clay" text kept verbatim — including the "we/us"
  romance voice; that is intentional, not an error.
- Alternating photo/text sections, one sand-ruled pull quote, gold-medal moment
  as the closing note with a handoff link to the shop.

### 5.4 Utility pages (same system, structure kept)

- Contact: form + studio details + map, restyled.
- FAQ: accordions.
- Process: current step content with numbered Fraunces headings.
- Retail stores: ruled list. Privacy: restyled as-is.

## 6. Mobile

- Nav collapses to hamburger, but wordmark + blue Shop pill always visible.
- Section order change: products ("From the current firing", horizontal snap-scroll
  swipe row) move directly after the hero; featured piece plays that role on
  desktop instead.
- Collections: 2-column tap grid. Events: plain stacked rows. No carousels that
  hide content.
- Tap targets ≥ 44px; body ≥ 16px; full-width hero CTA; inputs sized to avoid
  iOS zoom-on-focus.
- Performance budget: page ≤ ~300 KB before images; responsive AVIF/WebP with
  lazy loading; no JS framework; JS total under ~3 KB (mobile nav + filter chips).

## 7. Shopify integration

- Base shop URL centralized in `global.json`; collections store only their
  Shopify slug; templates compose links. Domain change = one-line edit.
- Buttons say "View in the shop" / "Browse in shop"; same-tab navigation.
- Recommended follow-up (out of scope): restyle the Shopify theme with the same
  paper/blue/Fraunces system; suggest connecting a branded shop domain
  (e.g. `shop.matthewfreed.ca`) in Shopify settings.

## 8. CMS changes (all additive)

- Collections: optional `swatch` hex + `filterGroup` (Blues/Charcoals/Earth
  tones/Patterned).
- Homepage: new "featured piece" entry (image, name, glaze, shop URL).
- Events: `atStudio` boolean flag.
- Everything else maps to existing fields.

## 9. Technical notes

- Eleventy layouts/partials rewritten; CSS rebuilt from scratch on custom
  properties (the five tokens); existing permalinks preserved.
- Accessibility: blue-on-cream passes WCAG AA; blue-underline focus states;
  semantic heading order; `prefers-reduced-motion` respected.
- SEO: keep `seo.json` wiring; add schema.org Event structured data on the events
  page (markets can surface in Google event listings).

## 10. Out of scope

- Shopify theme restyling and shop-domain setup (flagged as follow-ups).
- New photography production (Matthew supplies; placeholders flagged meanwhile).
- Blog/news beyond the events page.

## 11. Needs from Matthew before launch

- Review of all drafted copy.
- Product photography for: hero (if replacing current), featured piece, any
  collection missing a clean tile shot.
- Choice of the first "featured piece".
