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
high-contrast gallery type (Instrument Serif was voted out), and — important —
**organic shapes inside piece galleries** (tried twice, felt restless).
Organic shapes live in the hero, the glaze walk, and section accents only;
piece galleries stay rectangular and calm (§3).

## 3. Presenting the fifteen glazes

Agreed in session (2026-07-02, revised): **never show more than one glaze at
a time.** A tile grid ("library") was explicitly rejected as overwhelming.

- **Glaze walk / Rundgang** (homepage section, the heart of the page): a
  single stage showing one glaze at a time — its real photo in an organic
  blob mask, Caveat counter `glaze no. 01 of 15`, Yeseva name, one italic
  Vollkorn line. Prev/next arrows and swipe move through the collection;
  a strip of 15 dots in the glazes' own colors doubles as jump navigation
  (current dot enlarged, others dimmed). Transitions are soft crossfades.
  The stage links to the glaze's detail page.
- The walk follows a curated order through color moods, like rooms of an
  exhibition: blues (01–05) → greens (06–07) → warm (08–09) → charcoals
  (10–15), closing on Zen's gold accent as the finale. See the table in §7.
- **Glaze stage** (detail page, one per glaze — mockup shows Squamish
  Nights): the walk's destination. The page opens full-bleed in the glaze's
  own color world. Handwritten
  `glaze no. 01`, Yeseva title, a short story paragraph (Vollkorn, light on
  dark; use the official collection one-liners from
  matthewfreedpottery.com/collections as the basis). Below, on cream: the
  **quiet gallery** ("The pieces") — uncropped rectangular photos in a
  uniform grid (aspect 4:3, 3px radius, no borders or shadows), generous
  gaps, museum-label captions (Yeseva piece name, Vollkorn price +
  "in the shop →"). The last grid cell stays empty except for the screen's
  single Caveat note ("more coming out of the kiln soon — Matt"). Warmth
  comes from the paper ground and typography; liveliness stays inside the
  photos, never in the layout. Then a short "how it's made" studio note and
  a prev/next navigation through all 15 glazes (dot strip + neighbor names)
  so the collection can be leafed through like a book.

## 4. Homepage structure (top to bottom)

1. **Header:** wordmark "Matthew Freed" (Yeseva, navy), nav:
   `glazes · markets · shop · about`.
2. **Hero:** Caveat line "handmade in Vancouver —", Yeseva headline
   "Art for everyday life", one hero piece photo (`blue-arrangement.jpg`) in
   an organic mask, and the
   15-glaze dot strip that anchors down to the explorer
   ("↓ fifteen glazes, one studio").
3. **Glaze walk:** as in §3. Section title "The fifteen glazes".
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

Each glaze carries a representative swatch hex (walk dot color, stage
ground, photo placeholder while loading). The table is in **walk order**
(§3): blues → greens → warm → charcoals, Zen as finale.

| # | Glaze | Family | Swatch | Photo (matthewfreed.ca/images/) |
|---|---|---|---|---|
| 01 | Squamish Nights | blues | `#1D3A5F` | `squamish-nights.jpg` |
| 02 | Galiano | blues | `#24446B` | `carousel-galiano.jpg` |
| 03 | Jericho | blues | `#7D93A5` | `carousel-jericho.jpg` |
| 04 | Pemberton Sky | blues | `#6E8FB5` | `carousel-pemberton-sky.jpg` |
| 05 | Tofino | blues | `#4A5C74` | `carousel-tofino.jpg` |
| 06 | Garibaldi | greens | `#2F4A3C` | `garibaldi-cropped.jpg` |
| 07 | Joffre | greens | `#3D6060` | `carousel-joffre.jpg` |
| 08 | Kitsilano | warm | `#B9A6C9` | `carousel-kitsilano.jpg` |
| 09 | Pemberton Earth | warm | `#6B4A35` | `carousel-pemberton-earth.jpg` |
| 10 | Yaletown | charcoal | `#33343A` | `carousel-yaletown.jpg` |
| 11 | Dogwood | charcoal | `#3A3A3E` | `carousel-dogwood.jpg` |
| 12 | Saltspring | charcoal | `#41424A` | `carousel-saltspring.jpg` |
| 13 | Strathcona | charcoal | `#2E2E30` | `carousel-strathcona.jpg` |
| 14 | Tree of Life | charcoal | `#35363B` | `carousel-tree-of-life.jpg` |
| 15 | Zen | charcoal | `#2B2B2E` | `carousel-zen.jpg` |

## 8. Mockup conventions (match A–F)

- Standalone HTML, no build step; Google Fonts via `<link>`.
- Concept banner at the top (`CONCEPT G — GLAZE ANTHOLOGY`) and a collapsible
  "designer's note" with the palette swatches and rationale.
- Photos hotlinked from `https://matthewfreed.ca/images/…`.
- Responsive down to mobile; smooth scroll; light JS only (glaze walk
  navigation with crossfade, no framework).
- The stage page's prev/next links may point to `#` except the link back to
  the homepage mockup, which must work.
