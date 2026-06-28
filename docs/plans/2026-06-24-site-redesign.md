# Site Redesign — Design Brief & Decision Record

- **Date:** 2026-06-24
- **Branch:** `feat/site-redesign` (based on `feat/sveltia-cms-migration`)
- **Status:** Brief agreed (grilling session complete) — build not yet started
- **Author:** Matthew Freed + Claude (design/marketing review)

> Outcome of a structured grilling session on the homepage redesign suggestions.
> This is the spec to build against. Ships as one cohesive launch together with
> the Sveltia CMS migration.

---

## 1. Goal

Lift the site from a competent-but-generic 2021 template into a maker-led brand
that converts browsers into buyers. The technical foundation (Eleventy 3, Tailwind 4,
responsive images, PWA) is already strong; the gap is design, marketing, and trust.

Baseline rating from the review: **6/10 overall** — strong tech (9), generic visual
design (6), weak marketing/conversion (5), confusing IA (5).

---

## 2. Decisions

### 2.1 Brand voice
- **Warm first-person singular** for all maker-facing copy (hero, story, events,
  product blurbs). It's the single biggest advantage a solo potter has over a
  faceless shop — lean into it.
- **Transactional UI stays neutral** — buttons remain "Shop," "Subscribe,"
  "Add to cart" (never "Buy my mug").
- **Preserve the About-page "we/us" verbatim.** It is a deliberate romance
  metaphor (Matthew + clay as a couple — "we got engaged," "we parted ways"),
  not a team. Only fix team-implying "we/us" on marketing/UI surfaces.

### 2.2 Hero — product-forward
- Styled still-life of finished pieces (NOT maker-at-the-wheel; Matthew prefers
  product-forward).
- Text + CTAs sit in a calm zone — solid/tinted panel or negative space — never
  `text-shadow` over a busy photo (the current legibility problem).
- Keep headline **"Art for everyday life."**
- Two CTAs: **"Shop the collection"** (→ branded shop) · **"My story"** (→ /about).

### 2.3 Navigation
- New menu: `Collections · About · Events · Contact · [Instagram] · [Shop ↗]`
  (Shop = gold button, the single primary action). **Logo links home** — drop the
  literal "Home" text link.
- **Add Collections** (was missing despite being core browse content).
- **"Updates" → "Events"** — markets are the bigger draw. The page becomes
  events-led (upcoming markets front and centre) with a small "Latest update" slot
  for the ~once-a-year news post. The thin news archive stops masquerading as a
  content stream.
- Keep Instagram (real maker social proof).

### 2.4 Social proof
- **"Meet the maker" strip** carries the human story (since the hero is
  product-led). Source material: the About-page romance copy + the existing
  `/images/pottery-in-action-3.jpg` ("Matthew throwing a cup").
- **Testimonials**: REAL words from the contact-form export, lightly cleaned for
  apostrophes/typos, attributed to **alias first name + Vancouver neighbourhood**.
  - No fabricated wording (fabricated reviews are deceptive and an enforcement
    focus for Canada's Competition Bureau — not worth the exposure).
  - Aliases protect the customers' identities; the sentiment stays genuine.

### 2.5 Commerce & links
- Shopify remains the checkout; the site is the lookbook. No on-site cart to build.
- **Standardize every shop link on `shop.matthewfreed.net`** and retire the raw
  `matthew-freed-pottery.myshopify.com` URL (off-brand, lower trust at the point
  of purchase).
- Keep per-product **deep links** from featured pieces.
- Shop links open in a **new tab** (keeps the lookbook open behind them).
- Later, Shopify-side (out of scope here): skin the Shopify theme in navy/gold so
  the handoff doesn't feel like leaving the brand.

### 2.6 Locked minor items
- Collections **carousel → responsive grid** (also a UX/perf win — no content
  hidden behind a swipe).
- **Inline newsletter** section, reusing the existing Netlify Forms setup.
- **Warmer cream** base palette; navy (`#050237`) + gold (`#E9B45A`) untouched.

---

## 3. Inputs still needed from Matthew

1. **Product photography** for the hero still-life and the collections/featured
   grids — the mockup's flat colour tiles are placeholders. The site lives or dies
   on these photos.
2. **Alias sign-off** for the testimonials (proposed below).

### 3.1 Proposed testimonials (DRAFT — confirm aliases)

Real words from the contact-form export, trimmed to the praise, aliased:

| Alias (proposed) | Neighbourhood | Quote (real, cleaned) |
|---|---|---|
| Maya | North Vancouver | "I have small bowls and plates in the same pattern and I use them every day. I love them!" |
| Claire | Vancouver | "I just received my online order and LOVE the mugs." |
| Sophie | North Vancouver | "Your pottery is so beautiful!" |

Backup candidate (gift angle): "I love your work" — bought three mugs as Christmas
gifts (alias TBD).

Recurring themes in the real submissions (useful copy intel): everyday use,
gift-buying, and frequent sell-outs / reorder requests.

---

## 4. Build sequence

Each step its own reviewable commit on `feat/site-redesign`:

1. **Navigation** — add Collections + gold Shop button, logo-as-home, "Updates" → "Events".
2. **Testimonials** — CMS fields + data + section.
3. **Meet the maker** strip.
4. **Hero** — product-forward restructure + two CTAs.
5. **Collections** carousel → grid.
6. **Inline newsletter**.
7. **Palette** — warmer cream.
8. **Link hygiene** — standardize all shop links on `shop.matthewfreed.net`.
9. **Voice pass** — first-person-singular sweep (sparing the About metaphor).

New CMS fields (testimonials, hero CTAs, maker-story, events-led layout) go in the
**Sveltia** config, since this branch is based on it.

---

## 5. Out of scope / deferred

- On-site commerce / cart (stays on Shopify).
- Shopify theme reskin (Shopify-side task).
- Maker-forward hero imagery (Matthew prefers product-forward).
- Collecting *new* testimonials with explicit publish consent (future; current set
  uses real words + aliases).

---

## 6. Decision log (grilling outcomes)

1. Voice register → warm first-person singular; UI neutral.
2. About-page "we/us" → preserve (Matthew + pottery metaphor).
3. Testimonials source → real customer comments (contact-form export).
4. Attribution → real words + alias names (no fabricated wording).
5. Commerce → Shopify checkout; standardize on `shop.matthewfreed.net`.
6. Nav → add Collections + Shop button, logo-as-home.
7. "Updates" label → "Events" (events-led page, small news slot).
8. Hero → product-forward.
9. Where → `feat/site-redesign` off Sveltia; ship together.

---

## 7. Concept A — chosen direction & refinements (2026-06-24)

Matthew picked **Concept A (Studio Art-Zine)** — most personality. Refinements
agreed during review:

- **Direction:** A is the build target. Product-forward confirmed (no
  maker-at-the-wheel hero), but A's personality comes from the asymmetric
  collections grid + expressive type, not the hero.
- **Hero image:** `mthw-22-cropped.jpg` (cobalt leaf-dish styled with a lemon +
  linen + rosemary). Professionally shot, editorial, embodies "art for everyday
  life," blue/yellow pop, negative space for the headline.
- **Image roles:**
  - Hero → `mthw-22-cropped.jpg`.
  - Collections tiles → `carousel-saltspring*` (galaxy glaze) are strong
    candidates to add; current tiles: tofino, squamish-nights, jericho, joffre,
    garibaldi.
  - Featured → `blue-mug-and-plate.jpg` etc. (the moody `dsc06947`/`dsc07100`
    hands-in-clay shots are gorgeous but reserved — product-forward call stands).
- **Spacing:** general rhythm increased (section padding ~92px). Trust bar
  restyled into a deliberate band — ink uppercase text, gold diamond separators,
  larger internal padding so the rules don't hug the text.
- **Maker photo (section 3):** crops to match the text block height
  (`align-items: stretch`, no forced min-height) instead of running tall.
- **Testimonials:** quote-mark line-height fixed so it no longer bleeds into the
  section above; more breathing room around the block.
- **Hover treatments (new):**
  - Collections: image zoom + darken + a "View →" cue revealed on hover.
  - Featured: card lift + image zoom + title colour shift + "Shop ↗" revealed.

Still pending from Matthew: final product photography; alias sign-off.

---

## 8. Build handover spec — Concept A final (2026-06-24)

> This section is the **authoritative spec for the real build** and supersedes
> earlier sections wherever they conflict (§7 is kept as a dated changelog).
> Hand this document over **together with the mockup**.

### 8.1 Source of truth

- **Visual + interaction reference:** `docs/mockups/A-studio-art-zine.html`
  (self-contained: inline CSS + vanilla JS). Open in a browser to see the
  intended layout, hovers, slider, accordions, and the carved-flower motif.
  Images in the mockup load from the **live site** (`https://matthewfreed.ca/images/…`)
  purely as placeholders.
- The real build reproduces this in **Eleventy 3 templates + Tailwind v4 + Sveltia
  CMS** on `feat/site-redesign` (off `feat/sveltia-cms-migration`, ships as one launch).

### 8.2 Hard content rule (non-negotiable)

**All copy and all images in production must come from the existing repo files.**
Nothing in the mockup that I wrote as filler (e.g., featured-piece blurbs,
event blurbs, prices) ships as-is — it must be sourced from, or added to, the
real data/content files below.

- **Data:** `src/views/_data/` — `global.json`, `showcase.json`, `features.json`,
  `events.json`, `news.json`, `faq.json`, `seo.json`.
- **Page content:** `src/views/*.md` — `home.md`, `about.md`, `pottery.md`,
  `process.md`, `collections.md`, `contact.md`, `retail-stores.md`, `faq.md`,
  `privacy-statement.md`, `updates.md`.
- **Images:** `src/images/**`.

**Reorganizing these files is explicitly allowed** — add fields, split/merge
files, rename keys, move a paragraph from one file to another — as long as the
content *originates* from the existing files. **Do not invent new copy or source
new stock imagery.** If a section needs a field that doesn't exist yet (e.g. a
hero CTA label, a featured-piece one-liner), add it to the data file + the
Sveltia config and populate it from existing wording.

### 8.3 Images / pipeline

- Use the Eleventy `{% img %}` shortcode (responsive AVIF/WebP variants) with
  sources from `src/images/`. **Do not** hard-code the live `matthewfreed.ca`
  URLs — those are mockup placeholders only.
- Originals remain passthrough-copied to `/images/` for CMS preview.
- Image roles (from §7): hero → `mthw-22-cropped.jpg`; collections/featured →
  the carousel + product shots already in `src/images/`.

### 8.4 Design tokens

- **Fonts:** Fraunces (serif display, often italic) + Space Grotesk (sans body),
  Google Fonts.
- **Palette** (mockup `:root`): navy `#050237`, gold `#E9B45A` (bright = action),
  gold-deep `#b8862f` (small labels on light), ink `#26233d` (body), paper/cream
  `#FBF8F1`, line `#e7ddcf`, carved-brown `#6e4a22` (motif on gold).
- **Colour usage rules:** gold = primary action (buttons/CTAs, hover target);
  deep gold = small uppercase labels on light; navy = panels (maker, newsletter)
  + headlines; carved-brown motif on gold, gold motif on navy.

### 8.5 Brand motif — carved flower

A seamless SVG `<pattern>` derived from Matthew's carved/Dogwood sgraffito work:
big 4-petal flowers (veined petals + drop-leaves on the diagonals + ringed-dot
centre) on a grid, with a small 5-petal flower in each gap. Appears three ways:

- **Hero gold circle** — brown (`#6e4a22`) on gold, ~50% opacity.
- **Newsletter panel** — gold (`#E9B45A`) on navy, ~14% opacity.
- **Section dividers** — a single carved petal centred on a hairline rule.

(The mockup defines the pattern inline 3×; in the build, factor it into one
reusable SVG partial/symbol with `currentColor` so colour/opacity vary per use.)

### 8.6 Section order & spec (top → bottom)

1. **Nav** — logo = home; links Collections, About, Events, Contact, Instagram;
   gold **Shop** button. Internal links → real pages; Shop → `shop.matthewfreed.net`.
2. **Hero (01)** — product-forward photo clipped to an organic blob; gold circle
   behind it carrying the carved motif. Headline "Art for everyday life"
   ("everyday" in gold) + subcopy; gold "Shop the collection" button + "My story"
   text link. → from `home.md` / `global.json`.
3. **Trust marquee** — band overlapping the hero (-80px): one-of-a-kind, free
   local delivery over $150, found at local markets, small batches. → `global.json`.
4. **Featured pieces (02)** — horizontal scroll-snap slider with prev/next arrows;
   product cards (image, name, price); hover reveals a gold "Shop ↗" in a bottom
   bar (image stays visible). → `features.json`; each links to its product on
   `shop.matthewfreed.net` (new tab).
5. **Divider** — hairline + single carved petal.
6. **Collections (03)** — staggered grid; shows 5 with a "Show all 15" toggle;
   speckle texture behind the grid; hover reveals the glaze description; each tile
   links to its per-glaze shop collection. → `showcase.json` (15 items: name +
   description + cta).
7. **Meet the maker (04)** — navy panel; portrait crops to text height; first-person
   copy. → `about.md`. **TODO:** add "Read my story →" link to `/about`.
8. **Upcoming events (05)** — accordion; gold date, name, venue/time; expand reveals
   blurb + "Get directions ↗" (Google Maps); "See all events →" → `/events`
   (was "updates"). → `events.json` (filter upcoming).
9. **Stay in touch** — navy panel with the gold carved motif; "Never miss a drop
   or a date." + email form → existing Netlify newsletter form. Copy may draw on
   `news.json`/`global.json`.
10. **Footer** — logo, nav links, location + social. → `global.json`.

### 8.7 Interaction patterns

Button hovers (gold ↔ navy); featured slider (CSS scroll-snap + JS arrows);
collections "show all" toggle (JS); collection-tile hover reveals description;
events accordion (JS); all external shop links open in a new tab.

### 8.8 Content-file → section map

| Section | Primary source file(s) | Notes / fields to add |
|---|---|---|
| Hero | `home.md`, `global.json` | hero image, headline, subcopy, 2× CTA labels/links |
| Trust marquee | `global.json` | list of trust points |
| Featured | `features.json` | image, name, price, product link (+ optional one-liner) |
| Collections | `showcase.json` | name, description, image, per-glaze shop link |
| Maker | `about.md` | first-person excerpt + "Read my story" link |
| Events | `events.json` | date, name, venue, time, blurb, maps query |
| Newsletter | `news.json`, `global.json` | heading/subcopy, form action |
| Footer/Nav | `global.json` | links, location, socials |

### 8.9 Deferred / still-to-do in the build

- **Responsive / mobile** — the mockup is desktop-only; build mobile-first.
- **Touch** — hover-revealed CTAs (featured "Shop", collection description) must
  be reachable without hover on touch devices (show by default at small widths).
- **Wire links** — collection → per-glaze shop, featured → product deep links,
  events → maps, nav → pages.
- **Link hygiene** — standardize all shop URLs on `shop.matthewfreed.net`; retire
  raw `*.myshopify.com`.
- **Replace placeholder copy** with real data (per §8.2); add CMS fields as needed.
- **Copy polish** — maker "Read my story →"; reconsider the "01–05" index numbers.
- **Social proof** — testimonials removed from the page; optionally reintroduce a
  single real quote (real words + alias, see §3) later, e.g. in the maker block.

### 8.10 Pre-production checklist

- [ ] Revert Sveltia `backend.branch` in `src/admin/config.yml` to the deploy branch.
- [ ] No `matthewfreed.ca/images/…` placeholder URLs remain (all via `{% img %}`).
- [ ] No filler copy remains; every string traces to a repo file.
- [ ] All shop links on `shop.matthewfreed.net`.
- [ ] PWA service worker still excludes `/admin` and `/images`.

