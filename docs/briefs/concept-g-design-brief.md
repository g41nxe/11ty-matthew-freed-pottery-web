# Design Brief — Matthew Freed Pottery, "Concept G: Glaze Anthology"

> **For:** `/frontend-design`
> **Deliverable:** two standalone HTML mockups in `docs/mockups/`:
> `G-glaze-anthology.html` (homepage) and `G-glaze-anthology-glaze.html`
> (glaze stage, example: Squamish Nights). Add a "G" card to
> `docs/mockups/index.html`.
> **Relation to A–F:** an independent new direction, developed in a
> brainstorming session on 2026-07-02. Not an iteration of any earlier concept.
> **Next step after approval:** integrate the chosen direction into the 11ty site.

---

## 1. North star

**The fifteen glazes are the site.** Everything else — markets, shop, story —
hangs off them. The visitor should leave remembering glaze names the way one
remembers places: *Squamish Nights, Garibaldi, Kitsilano.*

Page priorities, agreed in session: **1) glaze showcase, 2) markets,
3) online sales**, then everything else.

## 2. The feel — "Werkstatt-Galerie"

Two agreed directions fused:

- **Gallery calm** (base): cream paper ground, generous whitespace, few words,
  pieces presented like exhibits.
- **Organic warmth** (accents): irregular, thrown-looking shapes. Glaze tiles,
  image masks, and accent fields use uneven border-radii — never perfect
  circles, never sharp cards. A single wavy divider line may separate sections.

Explicitly rejected in session: dark/moody atmospheric direction, elegant
high-contrast gallery type (Instrument Serif was voted out).

## 3. Presenting the fifteen glazes

Two agreed patterns combined:

- **Glaze explorer** (homepage section, the heart of the page): mood filter
  pills — `all · blues · greens · charcoal · warm` — above a grid of 15
  organic-shaped tiles. Each tile shows the glaze's real photo inside an
  irregular blob mask, with its Yeseva name beneath. Filtering hides/reveals
  tiles with a soft transition. Every tile links to the glaze stage.
- **Glaze stage** (detail page, one per glaze — mockup shows Squamish Nights):
  the page opens full-bleed in the glaze's own color world. Handwritten
  `glaze no. 01`, Yeseva title, a short story paragraph (Vollkorn, light on
  dark). Below, on cream: the purchasable pieces in this glaze with prices and
  shop links, a short "how it's made" studio note, and a prev/next
  navigation through all 15 glazes (dot strip + neighbor names) so the
  collection can be leafed through like a book.

## 4. Homepage structure (top to bottom)

1. **Header:** wordmark "Matthew Freed" (Yeseva, navy), nav:
   `glazes · markets · shop · about`.
2. **Hero:** Caveat line "handmade in Vancouver —", Yeseva headline
   "Art for everyday life", one hero piece photo (`blue-arrangement.jpg`) in
   an organic mask, and the
   15-glaze dot strip that anchors down to the explorer
   ("↓ fifteen glazes, one studio").
3. **Glaze explorer:** as in §3. Section title "The fifteen glazes".
4. **Markets band:** dark band (navy or charcoal), Caveat "find me this
   weekend —", the next 2–3 market dates with day/place/time, link to the
   full calendar. Prominent but after the glazes.
5. **Shop teaser:** three featured pieces, "free shipping over $150", link to
   the external shop.
6. **About Matthew:** portrait, two sentences (studio on Jackson Ave,
   Strathcona), Caveat signature "— Matt".
7. **Footer:** contact, Instagram, shop link.

## 5. Brand elements — sacred vs. open

**Sacred (kept from origins):**
- Voice and copy: BC place-name glazes, "one of a kind", "art for everyday
  life", real product names and prices.
- **Navy `#050237`** as anchor color — wordmark, headings, links. Drawn from
  his cobalt glazes, continuity with the old site.
- Real photography only (`https://matthewfreed.ca/images/…`), as in all
  existing mockups.

**Open (this concept's own moves):**
- Organic blob masks and wavy dividers as the shape language.
- The glaze-first information architecture (explorer + stage).
- The typography system below.

## 6. Typography — strict three-voice system

| Voice | Font (Google Fonts) | Used for | Discipline |
|---|---|---|---|
| Title | **Yeseva One** | glaze names, section titles, wordmark | only these |
| Body | **Vollkorn** (400/500 + italic) | all running text, prices, nav | the calm counterweight |
| Hand | **Caveat** (500) | studio margin notes | **max. once per screen**, slight rotation (−2°), mocha `#8A5A3B` |

Agreed in session ("System B"): Yeseva gives each glaze name the character of
a collector's label; Vollkorn keeps everything else calm; Caveat stays rare so
it reads personal, not crafty.

## 7. Color palette

| Role | Hex | Source |
|---|---|---|
| Paper (page ground) | `#F7F4EC` | unglazed clay body |
| Ink (body text) | `#2E2E30` | his charcoal glazes |
| Navy (anchor: wordmark, headings, links) | `#050237` | sacred, cobalt glazes |
| Mocha (handwriting, small accents) | `#8A5A3B` | warm clay browns |
| Gold (sparse highlights, e.g. market band accent) | `#C9A44A` | Strathcona/Zen gold |

Glaze tile colors come from the photos themselves; each tile carries a
representative swatch hex for its blob background while the photo loads
(and for the stage page ground):

| # | Glaze | Swatch | Photo (matthewfreed.ca/images/) |
|---|---|---|---|
| 01 | Squamish Nights | `#1D3A5F` | `squamish-nights.jpg` |
| 02 | Garibaldi | `#2F4A3C` | `garibaldi-cropped.jpg` |
| 03 | Yaletown | `#33343A` | `carousel-yaletown.jpg` |
| 04 | Galiano | `#24446B` | `carousel-galiano.jpg` |
| 05 | Dogwood | `#3A3A3E` | `carousel-dogwood.jpg` |
| 06 | Saltspring | `#41424A` | `carousel-saltspring.jpg` |
| 07 | Jericho | `#7D93A5` | `carousel-jericho.jpg` |
| 08 | Joffre | `#3D6060` | `carousel-joffre.jpg` |
| 09 | Kitsilano | `#B9A6C9` | `carousel-kitsilano.jpg` |
| 10 | Pemberton Sky | `#6E8FB5` | `carousel-pemberton-sky.jpg` |
| 11 | Pemberton Earth | `#6B4A35` | `carousel-pemberton-earth.jpg` |
| 12 | Strathcona | `#2E2E30` | `carousel-strathcona.jpg` |
| 13 | Tofino | `#4A5C74` | `carousel-tofino.jpg` |
| 14 | Tree of Life | `#35363B` | `carousel-tree-of-life.jpg` |
| 15 | Zen | `#2B2B2E` | `carousel-zen.jpg` |

Mood filter groups: **blues** 01·04·07·10·13 — **greens** 02·08 —
**charcoal** 03·05·06·12·14·15 — **warm** 09·11.

## 8. Mockup conventions (match A–F)

- Standalone HTML, no build step; Google Fonts via `<link>`.
- Concept banner at the top (`CONCEPT G — GLAZE ANTHOLOGY`) and a collapsible
  "designer's note" with the palette swatches and rationale.
- Photos hotlinked from `https://matthewfreed.ca/images/…`.
- Responsive down to mobile; smooth scroll; light JS only (filter pills,
  no framework).
- The stage page's prev/next links may point to `#` except the link back to
  the homepage mockup, which must work.
