# Design Brief — Matthew Freed Pottery, "Concept B"

> **For:** `/frontend-design`
> **Deliverable:** one standalone HTML mockup in `docs/mockups/`.
> **Iterates on:** `docs/mockups/A-studio-art-zine.html` ("Concept A").
> **Next step after approval:** integrate the chosen direction into the 11ty site.

---

## 1. North star

An improved version of the site that feels **unique** but stays **true to its
origins**, that **highlights the products and sells them** — without feeling like
a **sellout**.

This is the whole goal. Every section below serves it. **If any single rule below
ever fights the north star, the north star wins.**

## 2. The problem to solve

Concept A is polished but **not distinctive enough** — it reads like a nice
template, not unmistakably Matthew Freed. The core job of Concept B is to be
**structurally bold and memorable** while carrying the same brand and content.

## 3. Who it's for / tone

Local (Vancouver) shoppers and gift-buyers who value handmade, one-of-a-kind
stoneware — people who meet Matthew at farmers' markets and studio crawls, or find
him online. Tone: artisanal, warm, quietly confident. An artist's world first, a
shop second.

## 4. Brand elements — sacred vs. open

**Sacred (do not change — this is "true to origins"):**
- **Voice & copy:** Vancouver/Strathcona place-names, the glaze collection names,
  "one of a kind", the maker's story, the real product names and prices.
- **Navy `#050237`** stays as the anchor color — for consistency with the old site,
  and because it's drawn from his actual cobalt/deep-blue glazes.

**Open (yours to reinvent — this is where "unique" comes from):**
- Layout, composition, grid, section concepts, motion/interaction.
- Typography (see §6).
- Secondary color palette (see §5).
- Illustration / signature motif (see §5).

## 5. Palette & motif — reference his real work

The old decorative **gold `#E9B45A` is dropped** as a required accent; it was
decoration, not drawn from the pottery.

**Derive the rest of the palette from his actual glazes.** His pieces cluster into
real color families you can pull from:
- **cobalt / deep blue** — Squamish Nights, Garibaldi, Galiano, Tofino, Pemberton Sky
- **semi-matte charcoal & speckled greys** — Yaletown, Saltspring, Dogwood,
  Strathcona, Tree of Life, Zen *(his most recurring family)*
- **warm earth** — mocha, amber, terracotta, medium brown (Tofino, Pemberton Earth)
- **soft lilac / grey-blue** — Kitsilano, Jericho

Make an **educated designer's choice** for the secondary color(s) — whatever best
serves a distinctive, gallery-like, handmade feel alongside navy. Then **present
2–3 candidate palette directions as labeled swatches** (naming the glaze each color
is pulled from) so the client can compare and choose. Build the mockup in your
recommended direction and note **why**.

**Signature motif:** add a graphic motif taken from his real hand-painted glaze
patterns — the **dogwood flower**, the **"leafing" pattern**, the **Tree of Life
emblem**, or a **chevron** — rendered as your own line-art / SVG. This is the visual
"reference to his work" and a strong source of distinctiveness. (Concept A only
hints at this with a carved-flower hero blob and a floral divider; make it a real
through-line.)

## 6. Creative direction

Push the asymmetric **"art-zine"** idea much further than Concept A — surprising
structure, editorial rhythm, a real point of view. Avoid the generic
hero → product-grid → footer. Avoid centered-everything AI defaults.

**Typography is open**, but any new typefaces must still feel like a hand-made
ceramics studio — not corporate or techy.

**Bold where, quiet where** (resolve the apparent tension):
- **Bold, surprising, un-safe** in *structure, composition, motif, and motion.*
- **Restrained** in *color noise and commercial pressure.*
- The "restraint" carried from the old site means *not shouting over the work* — it
  is **not** permission to make the layout timid or generic.

## 7. Carry over from the old site (matthewfreedpottery.com)

- The old site is deliberately minimal — near-white ground, charcoal text — and it
  lets the **pottery photography be the color.** Honor that restraint.
- Work in his existing brand phrase **"Each piece is a complexity of nature,
  science, and art."** (it is *not* in Concept A). Keep **"Art for everyday life."**
  as the hero line.

## 8. Commerce — highlight the products, sell without selling out

The products are the **stars**: showcase them beautifully, and make the path to buy
**obvious and easy** — clear prices, clear links to `shop.matthewfreed.net`, an
unmissable way to shop.

"Not a sellout" means **tasteful, not timid**:
- ✅ Desire comes from the craft and glaze story; buying is effortless once it lands.
- ❌ No pop-ups, repeated/aggressive CTAs, urgency tricks, or store-like clutter.
- ❌ But equally — never hide the products or make them hard to buy.

It should feel like an artist's zine/gallery that *happens* to sell.

## 9. Content

Use the **Content Manifest (Appendix A)** verbatim. Do not invent, paraphrase,
translate, or substitute any copy. Do not swap, drop, or reorder products,
collections, or events; do not change any image URL or price. **Every product,
collection, and event must appear.** You are redesigning the *container*, not the
content. If your layout surfaces fewer items above the fold, keep the rest reachable
(carousel, "show all", accordion, etc.) — nothing gets deleted.

The manifest is the source of truth for copy/images. The live sites
(`matthewfreedpottery.com`, `matthewfreed.ca`) are for **brand feel only** — study
and reconcile them, but don't pull copy from them.

## 10. Technical constraints & deliverable

- One **self-contained HTML file** in `docs/mockups/` — fonts via Google Fonts CDN,
  inline CSS/JS, same conventions as `A-studio-art-zine.html`.
- A **concept banner** at the top like Concept A's — give this concept a short name
  and put it there (e.g. `Concept B · <name>`).
- **Fully responsive; mobile matters most** (market shoppers browse on phones).
- **Accessible:** preserve alt text, keep interactions keyboard-usable, and keep
  text/interactive **contrast at WCAG AA** — watch this if a lighter secondary
  color is chosen.

## 11. Success criteria

Judge against the **north star**, not just novelty:
- **Distinctive** — next to Concept A, visibly, structurally more distinctive, yet
  unmistakably the same brand (navy, voice, place-names, his motif).
- **Highlights products** — the pieces are clearly the stars, and it's obvious and
  easy to buy.
- **Not a sellout** — still feels like an artist's world, not a store.
- **Accessible** — meets the §10 accessibility bar.

The client reviews the mockup; only after approval do we integrate it into the
11ty site.

---

## Appendix A — Content Manifest (verbatim, extracted from A-studio-art-zine.html)

Image base URL: `https://matthewfreed.ca/images/`
Shop URL (for all product / shop links): `https://shop.matthewfreed.net`

### Brand / nav
- Logo / name: **Matthew Freed**
- Nav links: Collections · About · Events · Contact · Instagram · Shop

### Hero
- Eyebrow: `01 — Handmade in Vancouver`
- Headline: **Art for _everyday_ life.** (emphasis on "everyday")
- Body: `Wheel-thrown stoneware, glazed by hand in my Strathcona studio. No two pieces are ever quite the same.`
- Primary CTA: `Shop the collection` → shop
- Secondary link: `My story →`
- Hero image: `mthw-22-cropped.jpg` · alt: "Cobalt leaf dish styled with a lemon"

### Marquee strip
`One of a kind` · `Free local delivery over $150` · `Found at 6 local markets` · `Small batches`

### Featured pieces (10 — name · price · image · overlay copy)
1. Tofino mug · $48 · `carousel-tofino2.jpg` · "This belly mug from the Tofino Collection is one of my best-selling pieces."
2. Jericho bowl · $62 · `carousel-jericho2.jpg` · "A little bowl from the Jericho Collection, hand-glazed in soft lilac."
3. Blue belly mug · $54 · `blue-mug-and-plate.jpg` · "My blue belly mug — a customer favourite, and every glaze pour is one of a kind."
4. Joffre jug · $95 · `carousel-joffre2.jpg` · "My Joffre jug in glacier teal, from the Joffre Collection."
5. Yaletown plate · $46 · `carousel-yaletown2.jpg` · "A serving plate from the Yaletown Collection — everyday elegance."
6. Pemberton bowl · $58 · `carousel-pemberton-sky2.jpg` · "A bowl in pale blue from the Pemberton Sky Collection."
7. Zen vase · $88 · `carousel-zen4.jpg` · "A quiet vase from the Zen Collection — calm, simple lines."
8. Saltspring tray · $72 · `carousel-saltspring2.jpg` · "A tray from the Saltspring Collection — every reactive glaze is unique."
9. Tree of Life pitcher · $110 · `carousel-tree-of-life.jpg` · "A statement pitcher from the Tree of Life Collection."
10. Oil dispenser · $64 · `oil-dispenser.jpg` · "A hand-thrown oil dispenser — a favourite for the everyday kitchen."

### Glaze collections (15 — name · image · description)
1. Squamish Nights · `squamish-nights.jpg` · "A speckled deep green and blue glaze with a celestial look."
2. Garibaldi · `garibaldi-cropped.jpg` · "A deep forest green glaze with speckled cobalt tones and a warm blue rim."
3. Yaletown · `carousel-yaletown2.jpg` · "Red, green or blue rims pop on a charcoal glazed base."
4. Galiano · `carousel-galiano.jpg` · "A multi-tone deep blue glaze."
5. Dogwood · `carousel-dogwood3.jpg` · "A semi-matte charcoal glaze with a hand-painted dogwood pattern."
6. Saltspring · `carousel-saltspring2.jpg` · "A semi-matte charcoal glaze with vibrant bursts of glossy colour."
7. Jericho · `carousel-jericho2.jpg` · "A pale grey-blue glaze with sand-toned speckles."
8. Joffre · `carousel-joffre2.jpg` · "A rich green-blue glaze with multi-toned variation."
9. Kitsilano · `carousel-kitsilano3.jpg` · "A satiny-smooth lilac glaze with a warm blue rim."
10. Pemberton Sky · `carousel-pemberton-sky2.jpg` · "A hand-painted leafing pattern in a two-toned glossy blue."
11. Pemberton Earth · `carousel-pemberton-earth2.jpg` · "A hand-painted leafing pattern in medium brown and charcoal."
12. Strathcona · `carousel-strathcona2.jpg` · "Semi-matte charcoal with a hand-painted gold chevron pattern."
13. Tofino · `carousel-tofino2.jpg` · "A stormy landscape effect in cobalt, mocha, and amber."
14. Tree of Life · `carousel-tree-of-life.jpg` · "A textured Tree of Life emblem on semi-matte charcoal."
15. Zen · `carousel-zen4.jpg` · "A semi-matte charcoal glaze with a textured gold accent tile."

### Meet the maker
- Eyebrow: `04 — Meet the maker`
- Headline: **Twelve years at the wheel.**
- Body: `My love affair with clay began in the early 1990s. I kept it as a hobby for years before realizing it was the passion I wanted at the centre of my life.`
- Pull quote: `"It was time to make a lifetime commitment to one another."`
- Image: `overheadwork.jpg` · alt: "Matthew at the wheel"

### Upcoming events (4 — date · title · place/time · detail)
1. Jul 18 · Trout Lake Farmers Market · John Hendry Park · 9 am – 2 pm · "Most Saturdays through the summer — a full table of mugs, bowls, and my seconds." (John Hendry Park, Vancouver)
2. Aug 5–7 · Bespoke Summer Night Market · Ambleside, West Vancouver · 3 – 9 pm · "An evening market by Ambleside Beach with 40+ local makers and live music."
3. Sep 20 · Eastside Culture Crawl — studio open · 740 Jackson Ave · 11 am – 6 pm · "My studio doors open for Vancouver's biggest artist tour — come see where it's made, and shop my seconds."
4. Nov 11 · Circle Craft Holiday Market · Vancouver Convention Centre · "Western Canada's premier artisan market — find me there in the lead-up to the holidays."

### Newsletter
- Eyebrow: `Stay in touch`
- Headline: **Never miss a drop or a date.**
- Body: `Can't make it to a market? Join the list for first access to new pieces — and every upcoming date.`
- Button: `Subscribe`

### Footer
- Name: Matthew Freed
- `Collections · About · Events · FAQ`
- `Vancouver, BC · Instagram · Facebook`
