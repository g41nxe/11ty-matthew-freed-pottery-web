# Matthew's feedback on the v2 redesign — design

**Date**: 2026-07-21
**Branch**: `feat/site-redesign-v2`
**Status**: awaiting review

## Context

Matthew reviewed the v2 redesign preview and raised three points:

1. The title should read "Matthew Freed Pottery", not "Matthew Freed".
2. He has never sent a newsletter and doesn't expect to start. He'd rather send people to Instagram, where he actually posts.
3. Some images "don't quite fit, perhaps because of their formatting." He offered to supply others.

Points 1 and 2 are settled below. Point 3 turned out to be two unrelated problems; the sourcing half is deliberately deferred (see [Tabled](#tabled)).

## Scope

### 1. Wordmark shows the full brand name on mobile

Every rendered brand string already says "Matthew Freed Pottery" — browser tab, footer, PWA manifest, contact block. The single exception is the header wordmark below 640px, which swaps to the short form:

```
src/views/_includes/partials/nav.njk:10
<span class="sm:hidden">Matthew Freed</span><span class="hidden sm:inline">Matthew Freed Pottery</span>
```

The truncation is not arbitrary. At 375px the header row is wordmark + Shop button + hamburger: roughly 327px of content width, of which Shop (~78px), the hamburger (44px) and gaps consume ~134px. That leaves ~181px, and "Matthew Freed Pottery" at `text-lg font-black` needs about 234px on one line. Simply deleting the `sm:hidden` span overflows the header.

**Decision**: shrink the mobile type so the full name fits on one line. Do not guess the size — measure the rendered header at 375px and take the largest type step that fits without overflow, then confirm visually.

**Fallback if it reads as too timid**: a two-line stacked lockup ("Matthew Freed" / "Pottery") with tight leading, styled as a deliberate wordmark. Costs ~14px of mobile header height.

Also in scope:

- `src/assets/manifest.json:5` — description reads "Matthew Freeds - Pottery from Vancouver". Drop the stray "s".

Explicitly **not** changed:

- `src/views/_data/seo.json:5` — `author: "Matthew Freed"`. This is a person field consumed as the Open Graph author, not a brand string.

### 2. Newsletter band becomes a social band

`src/views/_includes/partials/newsletter.njk` is included from `footer.njk:1`, so it renders on **every page**. It is currently a full-width `py-20` section asking for signups to a newsletter that will never be sent.

**Decision**: replace it in place — same position, same paper background, same split-row composition. Headline and subcopy on the left; two buttons on the right, Instagram as `btn-primary` and Facebook as `btn-outline`. Instagram leads because that is where Matthew actually posts.

Rejected alternatives, and why:

- **Delete the band entirely.** Removes a prominent follow-me moment and leaves a rhythm gap at the bottom of every page.
- **Embed a live Instagram feed.** Needs the Instagram Basic Display API, an access token that expires every 60 days and must be refreshed programmatically, and third-party JS on every page. It would also expand the privacy statement rather than shrink it. On a static site whose owner has just told us he doesn't keep up with recurring chores, a component that silently goes blank after 60 days is the wrong trade.
- **Invert to a navy band.** Blue full-width sections are an established pattern (`home-events.njk`, `story-teaser.njk`), so this wouldn't be novel — but `story-teaser` is the last section before the footer on the home page, so a navy band there would sit directly against another navy section and the boundary would dissolve. This is also why `home.md:5` carries `newsletter_flush: true`: it strips the top hairline precisely because a paper band butts against a blue section there.

**Keep the flush flag.** The paper band still needs it for the same reason. Rename `newsletter_flush` to `social_flush` in `home.md:5` and in the partial's conditional, so the name matches what it now controls.

### 3. Band copy becomes CMS-editable

The current partial hardcodes its headline and subcopy, while `global.json:13-15` carries a `newsletter.title` field that nothing reads — a CMS field that was wired up and then orphaned when the redesign hardcoded the copy.

**Decision**: don't recreate that fork. Add a `social` block to `global.json` holding the band's title and subcopy. The two URLs already live in `global.socialmedia.services` and stay there. Delete the dead `newsletter` block.

This is the one section of the site whose entire purpose is funnelling people somewhere Matthew actively maintains, so he is the most likely person to want to reword it. Hardcoding the headline while the URLs beside it are CMS data would be an odd split.

Consequences:

- `src/admin/config.yml` — swap the Decap newsletter field group for the social one. Decap remains the live CMS: `main` is production, it is fully contained in `feat/site-redesign-v2`, and the TinaCMS migration is still behind its unverified auth gate at Task 1.9 with Waves 2 and 3 outstanding. v2 will almost certainly ship to production while Decap is still in use.
- TinaCMS Wave 2 must author the `global` collection against this shape, not the current one.

### 4. Copy that references the newsletter

Three strings mention a newsletter that will no longer exist. All three render **without** `| safe`, so they are plain-text escaped; making them clickable would mean adding `| safe` to CMS-editable fields, which opens an HTML-injection surface for three links. They stay plain text — the band itself carries the real link.

| Location | Current | Replacement |
|---|---|---|
| `src/views/events.md:18` `studio.footnote` | Can't make it? The newsletter announces every market and firing. | Can't make it? Every market and firing gets announced on Instagram. |
| `src/views/events.md:23` `no_events` | Nothing on the calendar right now — the newsletter is the first to know when that changes. | Nothing on the calendar right now — new dates go up on Instagram first. |
| `src/views/home.md:45` `events_band.no_events` | Nothing on the calendar right now — join the newsletter below and you'll hear about the next market first. | Nothing on the calendar right now — follow along on Instagram and you'll hear about the next market first. |

The middle one is rewritten rather than substituted: "the newsletter is the first to know" was always slightly off, and swapping in "Instagram" would inherit the awkwardness.

`src/views/privacy-statement.md` needs **no change**. Its only related clause is a generic statement about forms collecting "name, e-mail address, mailing address," which stays accurate because the contact form is unaffected.

### 5. Correct the `sizes` attributes

Every `{% img %}` call declares `sizes` in viewport units, but every container is capped by `max-w-6xl` (1152px). Above that viewport the declared size diverges from what actually renders, and the browser fetches larger variants than it displays.

Measured rendered widths (CSS px), from the built site at three viewports:

| Context | 390 | 768 | 1440 | Declared at 1440 | Over-fetch |
|---|---|---|---|---|---|
| Hero | 342 | 377 | 532 | 720 | 35% |
| Featured piece | 342 | 333 | 528 | 720 | 36% |
| Feature tiles (home 2×2) | 161 | 156 | 254 | 360 | 42% |
| Collections teaser | 294 | 219 | 342 | 446 | 30% |
| Collections grid | — | — | 350 | 475 | 36% |
| Events news card | — | — | 445 | 432 | — |
| About / process split | — | — | 472 | 720 | 53% |
| Story teaser | 390 | 377 | 576 | 720 | 25% |
| Retail header | 342 | — | 720 | 768 | 7% |

Because containers cap at 1152px, desktop 1440 is the worst case; widths do not grow beyond it.

**Decision**: rewrite each `sizes` attribute to pin the capped width above 1152px and use `calc()` below it. Pure bandwidth win, no visual change. Verify after the change that the browser selects a smaller variant and that nothing renders soft.

## Tabled

Deferred by explicit request; revisit as a separate piece of work.

- **The nine 400×300 feature images.** `showcase.features` renders 11 visible product photos; nine are 400×300. Measured against a 254px tile at 2× they are ~27% short. Two have already been upgraded to ~2000px, so the home 2×2 grid currently shows two sharp tiles beside two soft ones — a direct A/B comparison, which is likely what prompted Matthew's remark. The bar is **~640–800px**, not full resolution.
- **Sourcing.** Shopify holds 2000×2000 originals for these pieces (verified against `chopstick-bowl-tofino`), but they are square and the tiles are 4:3, so each needs a crop rather than a straight download. Instagram exports at 1080px would also clear the bar comfortably, but automated scraping conflicts with Instagram's terms even for Matthew's own work.
- **The Tofino glaze card.** `showcase.gallery` entry "Tofino Collection" uses `/images/carousel-tofino2.jpg` (1090×726), which renders in both the home collections teaser and the collections grid page. **This is a framing problem, not a resolution one** — 1090px comfortably clears the 684px the teaser needs at 2×. The photo is an extreme close-up of glaze surface: the mug's rim, base and overall form all fall outside the frame, so the piece isn't legible as a mug despite alt text reading "A close-up of a Mug". It reads as an abstract texture swatch beside sibling cards that show whole pieces.
  Candidate replacement already on disk but untracked and unreferenced: `/images/carousel-tofino3.jpg` (1848×1232) — a complete rectangular tray, whole form visible, higher resolution. Caveat: it's shot flat on a white background, whereas the gallery's house style is styled and contextual (compare `carousel-tree-of-life.jpg`, shot with lemons on a wooden table). Swapping it in fixes legibility at the cost of stylistic consistency. `/images/carousel-tofino.jpg` (1090×727) is also unused and hasn't been reviewed.
- **The Tree of Life featured piece.** `/images/updates/treeoflife-teaset.jpg` (812×549) has the creamer clipped by the frame edge — a source-file problem, not CSS, since the container applies no crop. It is also 23% short for its 528px slot at 2×, and is reused in a 2021 news entry. No replacement exists: the repo holds no unused tea-set photo, the shop sells the pieces individually but has no tea-set composition, and the one strong Tree of Life photo (`carousel-tree-of-life.jpg`, 1904×1320) already renders on the same page as `gallery[13]`. The likely resolution is asking Matthew for the uncropped camera original.

## Out of scope

- **Existing newsletter signups.** The Netlify form (`name="newsletter"`) is live and collecting. Deleting the partial takes it inactive; Netlify retains prior submissions. Anyone who signed up is expecting mail that will never arrive. **Dan is handling this manually** — decide whether to export the list and send one final "I'm on Instagram now" message before the form goes away.

## Branch plan

Land on `feat/site-redesign-v2` directly — this is feedback on v2, and a sub-branch would be ceremony for a small change set. Afterwards merge `feat/site-redesign-v2` into `feat/tinacms-migration` so Wave 2's collection authoring is written against the final data shape rather than a stale one.

`main` currently has zero commits that v2 lacks, so there is no drift from Matthew's Decap edits to reconcile.

## Verification

- Header at 375px: full wordmark on one line, no overflow, Shop button and hamburger unmoved.
- Social band renders on every page; both links resolve; the home page shows no hairline between `story-teaser` and the band.
- The three copy strings render as plain text with no stray markup.
- Decap loads with the social fields present and the newsletter fields gone.
- After the `sizes` change, spot-check that the browser selects smaller variants and no image renders soft.
