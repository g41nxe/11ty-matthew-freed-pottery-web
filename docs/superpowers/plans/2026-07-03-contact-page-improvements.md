# Contact page — design improvements plan

Date: 2026-07-03
Status: planned (not started)
Related: [site redesign spec](../specs/2026-07-02-site-redesign-design.md)

## Context

The contact page rhythm was fixed on 2026-07-03 (commit `3832c52`): it now
follows the site's eyebrow → headline → intro pattern ("Get in touch" →
"Don't be a stranger" → "Just say hello.") with two balanced columns —
`contact-form.njk` ("Contact me") and `contact-details.njk`
("Reach me directly"). Structure is solid; these three items are about
warmth and polish.

Files in play:
- `src/views/_includes/layouts/contact-layout.njk` — page shell, two columns
- `src/views/_includes/partials/contact-form.njk` — the form
- `src/views/_includes/partials/contact-details.njk` — socials, copy, email,
  phone, address, map
- `src/views/contact.md` — frontmatter (headline, subheadline, intro list,
  `gmaps` iframe embed, contactform labels, `image`)
- `src/admin/config.yml` — CMS fields for the contact file (update if adding
  new frontmatter fields)

Design tokens/rules: paper `#F8F5EE`, ink `#2A2822`, blue `#1F3A52`,
blue-light `#33556E`, sand `#C8A876`, hairline `#E9E3D5`. No shadows;
soft 8–10px corners; Fraunces headings, Karla body/UI. Keep WCAG AA.

## Item 1 — Tame the Google Map (highest impact)

**Problem:** `contact-details.njk` renders the raw `gmaps` iframe from
frontmatter — full-colour Google map with POI/restaurant labels, the
"Open in Maps" chip and Google chrome. It's the one element clashing with
the restrained gallery aesthetic.

**Preferred approach — static styled map + directions button:**
- Replace the live iframe with a static map image (Google Static Maps API or
  a Mapbox static style tuned toward the paper/blue palette — muted, few
  labels). The studio address is fixed, so pan/zoom adds little.
- Frame it in the existing `rounded-xl` + hairline, add a `btn-outline` or
  `link-underline` "Get directions →" linking to the Google Maps search URL
  (same pattern already used on the events/retail pages:
  `https://www.google.com/maps/search/?api=1&query=<urlencoded address>`).
- Benefits: faster, no tracking/cookie iframe, fully on-brand.
- Decision needed: Static Maps API key (Google) vs Mapbox token. If neither
  is wanted, fall back to the quick approach below.

**Quick fallback — filter the existing iframe:**
- Wrap the iframe and apply `filter: grayscale(1) contrast(0.9)` (add a
  utility/class in `main.css`); optionally lift the filter on hover. Keeps
  the live map but mutes it into the palette. Least effort, no API key.

## Item 2 — Add a human photo

**Problem:** "Don't be a stranger" promises warmth, but the page is pure
form + data. Every other page carries Matthew's presence.

**Approach:**
- Add a portrait/studio photo. Candidates already in `src/images/`:
  `matthew-and-mugs.jpg`, `overheadwork.jpg` (wheel), `market.jpg` (booth).
- Placement options: (a) top of the right column, above "Reach me directly",
  in a `rounded-xl` frame; or (b) a slim banner under the page intro spanning
  both columns. Prefer (a) to keep the two-column rhythm.
- Wire as a frontmatter field (`contact.md` already has an unused `image`)
  and expose it in `src/admin/config.yml`.
- Respect the imagery rule: studio/market photos are where life/clutter is
  allowed, so a candid shot fits here.

## Item 3 — Tighten the form & structure the details

- **Form:** put Name + Phone side-by-side on one row (both short) so the form
  reads as a composed pair, not four stacked full-width inputs. Use a
  responsive 2-col grid that stacks on mobile. Keep the iOS-zoom-safe input
  sizing and existing focus states.
- **Details:** give email/phone/address a small blue icon-led treatment
  (reuse the icon style from the footer/contact socials) instead of the
  current cap-label-over-value stack, so "Reach me directly" reads as a tidy
  contact card. Keep the existing `mailto:`/`tel:` links.

## Suggested order

1. Item 1 (map) — biggest visual win.
2. Item 2 (photo) — adds the promised warmth.
3. Item 3 (form/details polish) — lowest stakes.

## Open questions for the user / Matthew

- Map: Static Maps + which provider/key, or just filter the live iframe?
- Which photo for the contact page (or supply a new one)?
- Keep the recaptcha widget, or is Netlify honeypot enough? (affects form
  layout tidiness)
