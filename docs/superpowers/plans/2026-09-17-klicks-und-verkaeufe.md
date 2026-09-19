# Klicks und Verkäufe messen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jeder Shop-Link trägt eine Herkunftsmarke, sodass Shopify Verkäufe der Seite zuordnet, und die Seite meldet ohne Cookies, welches Shop-Set gezeigt, gesehen und angeklickt wurde und wo Besucher sonst handeln.

**Architecture:** Ein Eleventy-Filter `shopLink` hängt die UTM-Parameter zur Bauzeit an jede Shop-URL; die Platzierung (`utm_content`) beschreibt den Ort auf der Seite und kommt aus dem Template, nicht aus dem CMS. Ein optionales Umami-Skript, das nur bei gesetzter Umgebungsvariable gerendert wird, zählt Besuche. Eine einzige Datei `src/javascript/analytics.js` meldet alle Ereignisse: gezeigtes Set, gesehenes Set, Shop-Klick, Karten-Link, Glasur-Slider und Kontaktformular. Die Datenschutzerklärung wird im selben Zug an die Wirklichkeit angepasst.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, `node:test`, Umami Cloud (kostenloser Tarif), Netlify-Umgebungsvariablen, TinaCMS 3.14.0.

**Spec:** `docs/superpowers/specs/2026-09-17-klicks-und-verkaeufe-design.md`. Begriffe: `CONTEXT.md`.

## Global Constraints

- **Erst nach der Tina-Umstellung starten** (Spec `2026-09-14-tinacloud-migration-design.md`, Phase 3). Vorher liegt Tina auf einem Branch und `home.md` ändert sich noch.
- Eigener Branch von `main`, nicht auf `main` arbeiten. Push auf den eigenen Branch ist frei, Release nur nach Dans Freigabe.
- Keine Cookies, kein Banner. Einziger Speicherzugriff ist keiner: `analytics.js` liest und schreibt weder Cookies noch `localStorage`.
- Keine UTM-Parameter in von Tina gepflegten Inhalten. Sie entstehen ausschließlich im Filter.
- Platzierungen beschreiben den **Ort**, nie das Stück: keine Titel aus Tina in `utm_content`.
- Ohne `UMAMI_WEBSITE_ID` rendert kein Analytics-Skript und `analytics.js` wird nicht eingebunden. Das ist der Normalzustand für lokale Builds und Vorschau-Deploys.
- Eigene Besuche werden nicht ausgenommen (Spec Abschnitt 3).
- Ereignisnamen höchstens 50 Zeichen. Es gibt genau diese: `firing-shown`, `firing-seen`, `shop-click`, `directions`, `glaze-slider`, `contact-sent`.
- Jede Task endet grün: `npm test` und `npm run typecheck` ohne Fehler.
- Commit-Nachrichten Deutsch, `typ(bereich): …`, Abschluss `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Dev-Server nur über `preview_start` (`pottery-serve` genügt, Tina braucht nur Task 7).

---

## Task 0: Voraussetzungen (ohne Code, Dan)

**Stand 2026-09-19:** Konto angelegt, Website-ID `5248032c-eec0-4b7c-aef8-87f2575ced2c`. Die ID ist öffentlich (sie steht in jedem Seiten-HTML) und darf zum lokalen Testen genutzt werden: `data-domains` hält `localhost` und Vorschau-Deploys aus den Zahlen. Offen: Schritt 2 bis 4.

Blockiert nur die Prüfung in Task 5 bis 6 gegen echte Daten; Task 1 bis 4 laufen ohne.

- [ ] **Schritt 1: Umami-Konto anlegen**

Auf <https://cloud.umami.is> mit Dans Adresse registrieren, Website `matthewfreed.ca` anlegen, die **Website ID** kopieren. Den kostenlosen Tarif gegenprüfen: Ereignisse im Monat, Zahl der Websites, Aufbewahrungsdauer. Weicht er von 100 000 / eine / sechs Monate ab, Spec Abschnitt 6 korrigieren.

- [ ] **Schritt 2: Share-URL für Matthew**

Settings → Websites → Edit → Share URL einschalten, Link an Matthew schicken. Lesezugriff ohne Anmeldung ([Umami-Doku](https://docs.umami.is/docs/enable-share-url)).

- [ ] **Schritt 3: Variable in Netlify hinterlegen**

Netlify → Site configuration → Environment variables → `UMAMI_WEBSITE_ID` = die kopierte ID, für alle Deploy-Kontexte. Lokal optional in `.env`.

- [ ] **Schritt 4: Shopify-Kampagne anlegen**

Shopify-Admin → Marketing → Kampagne „Website" anlegen, damit die Berichte einen lesbaren Namen zeigen. Prüfen, ob *Total sales by referrer* und *Performance by UTM campaign* im aktuellen Tarif sichtbar sind; Ergebnis in Spec Abschnitt 5 notieren.

---

## Task 1: Filter `shopLink`

Folgt der Konvention des Repos (Stand `main` nach der Tina-Umstellung): Filter stehen in `.eleventy.js`, Tests laden die Konfiguration mit einem Stub und rufen den registrierten Filter auf (Vorbild `test/glaze-count.test.mjs`). Testnamen und Code-Kommentare auf Englisch wie im übrigen Code.

**Files:**
- Create: `test/shop-link.test.mjs`
- Modify: `.eleventy.js` (Filterblock, neben `markdownify`)

**Interfaces:**
- Produces: Nunjucks-Filter `shopLink(url: string, placement?: string): string` und `placementSlug(value: string): string`. Nicht `slug`: Eleventy bringt einen eingebauten Filter dieses Namens mit, den ein eigener still überdecken würde. Erster Parameter von `shopLink` ist die URL, zweiter die Platzierung.
- Consumes: nichts.

- [ ] **Schritt 1: Test schreiben**

`test/shop-link.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const filters = {};
const stub = new Proxy(
    { addNunjucksFilter: (name, fn) => { filters[name] = fn; } },
    { get: (target, prop) => target[prop] ?? (() => {}) }
);
require("../.eleventy.js")(stub);
const { shopLink, placementSlug } = filters;

const SHOP = "https://shop.matthewfreed.net/products/belly-mug-tofino";

test("adds source, medium and campaign to a shop link", () => {
    const url = new URL(shopLink(SHOP));
    assert.equal(url.searchParams.get("utm_source"), "matthewfreed.ca");
    assert.equal(url.searchParams.get("utm_medium"), "referral");
    assert.equal(url.searchParams.get("utm_campaign"), "website");
    assert.equal(url.pathname, "/products/belly-mug-tofino");
});

test("writes the placement as a slug into utm_content", () => {
    const url = new URL(shopLink(SHOP, "firing-Oil dispensers-tile2"));
    assert.equal(url.searchParams.get("utm_content"), "firing-oil-dispensers-tile2");
});

test("leaves links outside the shop alone", () => {
    assert.equal(shopLink("/collections.html", "nav"), "/collections.html");
    assert.equal(shopLink("https://matthewfreed.ca/faq.html"), "https://matthewfreed.ca/faq.html");
});

test("keeps parameters the link already has", () => {
    const url = new URL(shopLink(SHOP + "?variant=42", "hero"));
    assert.equal(url.searchParams.get("variant"), "42");
    assert.equal(url.searchParams.get("utm_content"), "hero");
});

test("returns empty or broken values unchanged", () => {
    assert.equal(shopLink(""), "");
    assert.equal(shopLink(undefined), undefined);
    assert.equal(shopLink("not even a url", "nav"), "not even a url");
});

test("placementSlug keeps lowercase letters, digits and hyphens", () => {
    assert.equal(placementSlug("Tree of Life"), "tree-of-life");
    assert.equal(placementSlug("  --Tofino--  "), "tofino");
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss scheitern**

Run: `npm test`
Expected: FAIL in `shop-link.test.mjs`, `shopLink is not a function`

- [ ] **Schritt 3: Filter schreiben**

In `.eleventy.js` zu den Filtern, neben `markdownify`:

```js
    // Outgoing shop links get their origin tag at build time, so the CMS
    // keeps clean URLs and nobody types parameters by hand. Shopify only
    // counts a visit as marketing when utm_campaign is present. utm_content
    // names the spot on the page, not the piece: Shopify knows the piece from
    // the landing page, and a spot keeps its name when a piece is renamed.
    const placementSlug = (value) =>
        String(value == null ? "" : value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60);
    eleventyConfig.addNunjucksFilter("placementSlug", placementSlug);
    eleventyConfig.addNunjucksFilter("shopLink", function (url, placement) {
        if (!url) return url;
        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            return url;
        }
        // Only hosts starting with "shop.": the site's own domain stays untouched.
        if (!parsed.hostname.startsWith("shop.")) return url;
        parsed.searchParams.set("utm_source", "matthewfreed.ca");
        parsed.searchParams.set("utm_medium", "referral");
        parsed.searchParams.set("utm_campaign", "website");
        const content = placementSlug(placement);
        if (content) parsed.searchParams.set("utm_content", content);
        return parsed.toString();
    });
```

`placementSlug` wird in Task 5 für den Set-Namen im HTML gebraucht. Eleventys eigene `slug`/`slugify` gehen anders mit Sonderzeichen um als die Platzierungen; Set-Name im HTML und in `utm_content` müssen gleich gerechnet werden.

- [ ] **Schritt 4: Test laufen lassen, er muss bestehen**

Run: `npm test`
Expected: PASS, `# fail 0`

- [ ] **Schritt 5: Prüfen, dass der Build den Filter kennt**

Run: `node node_modules/@11ty/eleventy/cmd.cjs --output=../tmp-utm-1 --quiet`
Expected: Build ohne Fehler.

- [ ] **Schritt 6: Commit**

```bash
git add test/shop-link.test.mjs .eleventy.js
git commit -m "feat(messung): Filter shopLink für die Herkunftsmarke

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Filter in allen Templates anwenden

**Files:**
- Modify: `src/views/_includes/partials/nav.njk` (zwei Shop-Buttons)
- Modify: `src/views/_includes/partials/hero.njk` (Shop-Button)
- Modify: `src/views/_includes/partials/collections-teaser.njk` (Glasurkarte)
- Modify: `src/views/_includes/partials/current-firing.njk` („Shop all", Featured Piece, Kachel)
- Modify: `src/views/_includes/layouts/collections-layout.njk` (Glasur-Link)
- Modify: `src/views/_includes/layouts/about-layout.njk` (Medaillen-Hinweis)

**Interfaces:**
- Consumes: `shopLink` aus Task 1 (Filter in `.eleventy.js`).
- Produces: jeder gerenderte Shop-Link trägt `utm_campaign=website` und ein `utm_content` aus Spec Abschnitt 3.

In jedem Schritt ändert sich nur das `href`; Klassen und übrige Attribute bleiben, wie sie sind. Der Studio-Button in `events-layout.njk` (`studio.cta.url`) zeigt auf `/contact.html` und bleibt unberührt; der Filter ließe ihn ohnehin durch.

- [ ] **Schritt 1: Navigation, Hero, Medaillen-Hinweis**

`nav.njk`, beide Shop-Buttons:

```njk
href="{{ (global.shop.base + global.shop.collectionsPath + "/") | shopLink("nav") }}"
```

`hero.njk`:

```njk
href="{{ (global.shop.base + global.shop.collectionsPath + "/") | shopLink("hero") }}"
```

`about-layout.njk`, Link im Medaillen-Hinweis:

```njk
href="{{ (global.shop.base + global.shop.collectionsPath + "/") | shopLink("about-medal") }}"
```

- [ ] **Schritt 2: Glasurkarten**

`collections-teaser.njk`:

```njk
href="{{ (global.shop.base + global.shop.collectionsPath + "/" + item.slug) | shopLink("home-teaser-" + item.slug) }}"
```

`collections-layout.njk`:

```njk
href="{{ (global.shop.base + global.shop.collectionsPath + "/" + item.slug) | shopLink("collections-" + item.slug) }}"
```

- [ ] **Schritt 3: Shop-Sets der Startseite**

In `current-firing.njk`. „Shop all pieces":

```njk
href="{{ (global.shop.base + global.shop.collectionsPath + "/") | shopLink("firing-shop-all") }}"
```

Featured Piece:

```njk
href="{{ piece.cta.url | shopLink("firing-" + shop_set.name + "-featured") }}"
```

Kachel, nummeriert nach Platz (`loop.index` der inneren Schleife über `shop_set.items`):

```njk
href="{{ item.cta.url | shopLink("firing-" + shop_set.name + "-tile" + loop.index) }}"
```

- [ ] **Schritt 4: Bauen und zählen**

Run:

```bash
node node_modules/@11ty/eleventy/cmd.cjs --output=../tmp-utm-2 --quiet
grep -rho 'shop\.matthewfreed\.net[^"]*' ../tmp-utm-2 --include=*.html | wc -l
grep -rho 'shop\.matthewfreed\.net[^"]*utm_campaign=website[^"]*' ../tmp-utm-2 --include=*.html | wc -l
```

Expected: beide Zahlen gleich. Ist die zweite kleiner, fehlt an einer Stelle der Filter: `grep -rn 'shop\.matthewfreed\.net' ../tmp-utm-2 --include=*.html | grep -v utm_campaign`.

- [ ] **Schritt 5: Platzierungen prüfen**

Run:

```bash
grep -o 'utm_content=[a-z0-9-]*' ../tmp-utm-2/index.html | sort -u
```

Expected: `nav`, `hero`, `firing-shop-all`, je Set `firing-<set>-featured` und `firing-<set>-tile1` bis `tile4`, je Glasur `home-teaser-<slug>`. Kein Wert enthält einen Stücknamen.

- [ ] **Schritt 6: Commit**

```bash
git add src/views/_includes
git commit -m "feat(messung): Herkunftsmarke an allen Shop-Links

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Kurzlink `/shop` reparieren

**Files:**
- Modify: `src/_redirects` (Zeilen `/shop` und `/Shop`)

**Interfaces:**
- Produces: `/shop` landet mit einem Sprung auf der Shop-Collection und trägt `utm_content=redirect-shop`.

- [ ] **Schritt 1: Ziel korrigieren**

Alt:

```
/shop                   http://shop.matthewfreed.ca 301
/Shop                   http://shop.matthewfreed.ca 301
```

Neu:

```
/shop                   https://shop.matthewfreed.net/collections/all?utm_source=matthewfreed.ca&utm_medium=referral&utm_campaign=website&utm_content=redirect-shop 301
/Shop                   https://shop.matthewfreed.net/collections/all?utm_source=matthewfreed.ca&utm_medium=referral&utm_campaign=website&utm_content=redirect-shop 301
```

- [ ] **Schritt 2: Commit**

```bash
git add src/_redirects
git commit -m "fix(messung): /shop zeigt direkt auf den Shop statt über zwei Umleitungen

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Schritt 3: Nach dem Deploy prüfen**

`_redirects` wirkt nur auf Netlify, deshalb gegen die Deploy-Vorschau:

```bash
curl -s -o /dev/null -L -w "%{url_effective} | Sprünge: %{num_redirects}\n" https://<branch>--mf-pottery.netlify.app/shop
```

Expected: Zieladresse enthält `utm_campaign=website`, ein Sprung.

---

## Task 4: Umami-Skript, nur mit Website-ID

**Files:**
- Modify: `src/views/_data/env.js`
- Modify: `src/views/_includes/layouts/base.njk` (hinter `/js/nav.js`)

**Interfaces:**
- Consumes: `UMAMI_WEBSITE_ID` aus Task 0.
- Produces: `env.umamiWebsiteId`, `env.umamiScript`; im `<head>` das Umami-Skript und `/js/analytics.js`, beide nur mit gesetzter ID.

- [ ] **Schritt 1: Werte durchreichen**

`src/views/_data/env.js`, neben `googleMapsKey`:

```js
    // Leer, solange kein Umami-Konto hinterlegt ist: dann rendert base.njk
    // weder Zählskript noch analytics.js, und die Seite lädt nichts Fremdes.
    umamiWebsiteId: process.env.UMAMI_WEBSITE_ID || "",
    umamiScript: process.env.UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js",
```

- [ ] **Schritt 2: Skripte einbinden**

In `base.njk` hinter der Zeile mit `/js/nav.js`. Beide `defer`, in dieser Reihenfolge: dann ist `window.umami` definiert, bevor `analytics.js` läuft.

```njk
    {% if env.umamiWebsiteId %}
    {# Zählt ohne Cookies. data-domains hält Vorschau-Deploys und localhost aus den Zahlen. #}
    <script defer src="{{ env.umamiScript }}" data-website-id="{{ env.umamiWebsiteId }}" data-domains="matthewfreed.ca"></script>
    <script defer src="/js/analytics.js"></script>
    {% endif %}
```

- [ ] **Schritt 3: Leere Datei anlegen, damit der Verweis nicht ins Leere zeigt**

`src/javascript/analytics.js` mit einer Zeile Kommentar; Task 5 füllt sie.

```js
// Ereignisse für Umami. Inhalt folgt in Task 5 und 6.
```

- [ ] **Schritt 4: Ohne und mit Variable bauen**

Run:

```bash
node node_modules/@11ty/eleventy/cmd.cjs --output=../tmp-utm-4 --quiet
grep -c "umami\|analytics.js" ../tmp-utm-4/index.html || echo "nichts eingebunden, richtig"
UMAMI_WEBSITE_ID=test-id node node_modules/@11ty/eleventy/cmd.cjs --output=../tmp-utm-4b --quiet
grep -o '<script[^>]*\(umami\|analytics\)[^>]*>' ../tmp-utm-4b/index.html
```

Expected: erst `nichts eingebunden, richtig`, dann genau zwei Treffer, das Umami-Skript mit `data-website-id="test-id"` vor `analytics.js`.

- [ ] **Schritt 5: Commit**

```bash
git add src/views/_data/env.js src/views/_includes/layouts/base.njk src/javascript/analytics.js
git commit -m "feat(messung): Umami-Zählskript, nur mit hinterlegter Website-ID

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: Shop-Sets messen — gezeigt, gesehen, angeklickt

**Files:**
- Modify: `src/views/_includes/partials/current-firing.njk` (Attribut am `<section>`)
- Modify: `src/javascript/analytics.js`

**Interfaces:**
- Consumes: `window.umami` und `analytics.js` aus Task 4, Platzierungen aus Task 2, Filter `placementSlug` aus Task 1. Die Rotation (Inline-Skript in `current-firing.njk`) blendet Sets über die Klasse `hidden` aus, nicht über das Attribut.
- Produces: Ereignisse `firing-shown { set }`, `firing-seen { set }`, `shop-click { piece, placement }`. Hilfsfunktion `track(name, data)` in `analytics.js`, die Task 6 weiterverwendet.

- [ ] **Schritt 1: Set-Namen ins HTML schreiben**

Am `<section … data-firing-set …>` in `current-firing.njk` ergänzen:

```njk
data-firing-name="{{ shop_set.name | placementSlug }}"
```

- [ ] **Schritt 2: Ereignisse schreiben**

`src/javascript/analytics.js` vollständig ersetzen:

```js
// Every Umami event in one place. The file is only included when a website ID
// is set; track() still checks that Umami loaded, so an ad blocker does not
// cause console errors. No cookie, no localStorage: nothing is stored on the device.
// Wrapped in a function like home-slider.js and events.js, so nothing leaks
// into the scope that all classic scripts on the page share.
(function () {
    const track = (name, data) => {
        if (typeof window.umami === "undefined") return;
        window.umami.track(name, data);
    };

    // Which shop set did the rotation show, and did it come into view?
    // Only both together make the sets' click counts comparable.
    // The rotation hides the other sets with the "hidden" class, not the attribute.
    const shownSet = document.querySelector("[data-firing-set]:not(.hidden)");
    if (shownSet) {
        const set = shownSet.dataset.firingName || "unbenannt";
        track("firing-shown", { set });
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                track("firing-seen", { set });
                observer.disconnect();
            }, { threshold: 0.3 });
            observer.observe(shownSet);
        }
    }

    const parse = (href) => {
        try {
            return new URL(href);
        } catch {
            return null;
        }
    };

    // One listener for every link instead of attributes in each template.
    // The placement is already in the URL (utm_content), set at build time.
    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        const url = link && parse(link.href);
        if (!url) return;
        if (url.hostname.startsWith("shop.")) {
            track("shop-click", {
                piece: url.pathname.replace(/^\/+|\/+$/g, ""),
                placement: url.searchParams.get("utm_content") || "unbenannt",
            });
        }
    });
})();
```

- [ ] **Schritt 3: Im Browser prüfen**

Lokal sendet Umami nichts: `data-domains="matthewfreed.ca"` lässt `localhost` aus, und genau so soll es sein. Deshalb wird `umami` in der Konsole ersetzt und `analytics.js` danach noch einmal geladen, damit auch die Ereignisse beim Laden (`firing-shown`) den Ersatz treffen.

`preview_start` mit `pottery-serve`, dabei `UMAMI_WEBSITE_ID` gesetzt (die echte ID ist unbedenklich, siehe oben). Auf der Startseite in der Konsole:

```js
window.umami = { track: (name, data) => console.log("EVENT", name, JSON.stringify(data)) };
const again = document.createElement("script");
again.src = "/js/analytics.js?again";
document.head.appendChild(again);
```

Expected sofort: `EVENT firing-shown {"set":"<name>"}`. Dann zum Shop-Teil scrollen: `EVENT firing-seen {"set":"<name>"}`. Dann:

```js
document.querySelector("[data-firing-set]:not(.hidden) a[href*='shop.']").click();
```

Expected: `EVENT shop-click {"piece":"products/…","placement":"firing-<set>-tile1"}` oder `…-featured` (der Link öffnet einen Tab, der geschlossen werden kann). Die Listener des ersten Ladens rufen dabei das echte Umami auf, das lokal nichts sendet; das ist in Ordnung.

- [ ] **Schritt 4: Commit**

```bash
git add src/views/_includes/partials/current-firing.njk src/javascript/analytics.js
git commit -m "feat(messung): Shop-Sets melden Einblendung, Sichtbarkeit und Klicks

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Übrige Ereignisse — Karte, Slider, Kontaktformular

**Files:**
- Modify: `src/javascript/analytics.js`

**Interfaces:**
- Consumes: `track()` und `parse()` aus Task 5. Markup: Karten-Links in `events-layout.njk` zeigen auf `https://www.google.com/maps/search/…`; Slider `#glaze-slider` mit Punkten `.glaze-dot` in `collections-teaser.njk`; Formular `#contact_form` in `contact-form.njk`.
- Produces: `directions { page }`, `glaze-slider { how }`, `contact-sent {}`.

- [ ] **Schritt 1: Karten-Link im bestehenden Klick-Listener**

Im Klick-Listener aus Task 5, hinter dem `shop-click`-Zweig (die Einrückung folgt der umschließenden Funktion):

```js
    if (url.hostname.endsWith("google.com") && url.pathname.startsWith("/maps")) {
        track("directions", { page: window.location.pathname });
    }
```

- [ ] **Schritt 2: Slider, nur bewusste Nutzung**

Am Ende von `analytics.js`, **innerhalb** der umschließenden Funktion, also vor der letzten Zeile `})();`, mit derselben Einrückung. Der Slider läuft von selbst weiter, deshalb zählt **kein** `scroll`-Ereignis, sondern nur Antippen, Ziehen oder ein Punkt:

```js
// First deliberate use of the glaze slider. Scrolling does not count because
// the slider advances on its own; only a tap, a drag or a dot does.
const slider = document.getElementById("glaze-slider");
if (slider) {
    let reported = false;
    const used = (how) => {
        if (reported) return;
        reported = true;
        track("glaze-slider", { how });
    };
    slider.addEventListener("pointerdown", () => used("swipe"), { once: true, passive: true });
    document.querySelectorAll(".glaze-dot").forEach((dot) => {
        dot.addEventListener("click", () => used("dot"), { once: true });
    });
}
```

- [ ] **Schritt 3: Kontaktformular**

Ebenfalls innerhalb der umschließenden Funktion, vor `})();`:

```js
// Sent, not delivered: Netlify serves the success page, which does not load
// our layout. The event can be lost if the browser cancels the request while
// it navigates. Once a success page in the site layout exists, its page view
// is the more reliable signal.
const form = document.getElementById("contact_form");
if (form) {
    form.addEventListener("submit", () => track("contact-sent", {}));
}
```

- [ ] **Schritt 4: Im Browser prüfen**

Wie in Task 5 Umami in der Konsole ersetzen, dann nacheinander: auf der Events-Seite einen „Directions"-Link per `click()` auslösen (öffnet einen Tab, der geschlossen werden kann), auf der Startseite `document.querySelector(".glaze-dot").click()`, und auf der Kontaktseite `document.getElementById("contact_form").dispatchEvent(new Event("submit", { cancelable: true }))`.

Expected: je eine Zeile `EVENT directions`, `EVENT glaze-slider {"how":"dot"}`, `EVENT contact-sent {}`. Ein zweiter Punkt-Klick erzeugt keine zweite `glaze-slider`-Zeile.

- [ ] **Schritt 5: Commit**

```bash
git add src/javascript/analytics.js
git commit -m "feat(messung): Ereignisse für Kartenlink, Glasur-Slider und Kontaktformular

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: Datenschutzerklärung an die Wirklichkeit anpassen

**Files:**
- Modify: `src/views/privacy-statement.md`

- [ ] **Schritt 1: Absatz über gesammelte Daten ersetzen**

Der heutige Text stammt aus einem Shopify-Baustein und behauptet Cookies und Logdateien, die es auf dieser Seite nicht gibt. Ersetzt werden der Abschnitt `## Personal Information We Collect` samt Unterabschnitt `### We collect Device Information using the following technologies:` (Cookies, Log files). `## How Will We Collect Personal Information?` und alles danach bleibt und wird nur in Schritt 2 geprüft. Drei Google-Dienste sind live und müssen genannt werden (geprüft 2026-09-19): Google Fonts auf jeder Seite, die eingebettete Google-Karte auf der Kontaktseite und Googles reCAPTCHA im Kontaktformular, das Netlify einsetzt. Ticket 0005 soll alle drei später überflüssig machen. Ersetzen durch:

```markdown
## What this website collects

This website itself sets no cookies and does not create a profile of you.

I use Umami, a privacy-friendly analytics service, to count how many people visit, which pages they read, and which parts of a page they use — for example whether a link to my shop was clicked or the directions to a market were opened. Umami stores no cookies, no IP addresses and nothing that identifies you, and it does not follow you to other websites. What I see are totals, never individual visitors.

Three things on this website come from Google. The fonts are loaded from Google Fonts, so Google receives your IP address when a page loads. On the contact page, the map is provided by Google Maps and the contact form is protected against spam by Google reCAPTCHA; both may set Google's own cookies when the page loads. Google's privacy policy applies to all three.

Buying happens in my shop at shop.matthewfreed.net, which is run by Shopify. Links from this website to the shop carry a short marker in the address so I can tell which part of this website sent you there. The shop has its own privacy policy and its own cookies; this policy does not cover it.
```

- [ ] **Schritt 2: Verbleibende Textbausteine durchgehen**

Die übrigen Abschnitte (Bestellungen, Weitergabe an Dritte, Kontaktformular) auf Aussagen prüfen, die nur für den Shop gelten, und dort ausdrücklich auf den Shop beziehen. Nichts erfinden: Was unklar ist, wird in Schritt 5 Matthew vorgelegt, nicht geraten.

- [ ] **Schritt 3: Round-Trip über Tina**

Dev-Server mit Tina (`pottery-dev`) starten, dann:

```bash
npm run tina:roundtrip -- privacy_statement_page privacy-statement.md
```

Expected: `ROUND-TRIP OK`. Der Body ist ein Markdown-Textfeld; `beforeSubmit` verhindert die wachsende Leerzeile.

- [ ] **Schritt 4: Commit**

```bash
git add src/views/privacy-statement.md
git commit -m "docs(datenschutz): beschreibt die Messung statt Shopify-Bausteinen

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Schritt 5: Matthew vorlegen**

Vor dem Release freigeben lassen. Es ist sein Text und seine Haftung.

---

## Task 8: Entscheidungen festhalten

**Files:**
- Create: `docs/adr/0004-messung-ohne-cookies.md`
- Modify: `CONTEXT.md`
- Modify: `docs/superpowers/specs/2026-09-17-klicks-und-verkaeufe-design.md` (Abschnitt 5 und 6)

- [ ] **Schritt 1: ADR schreiben**

Im Aufbau der ADRs 0001 bis 0003: Titel, Entscheidung in einem Absatz, `## Kontext` (kostenlos gefordert, kein Banner, zwei Domains ohne gemeinsame Cookies, Platzierung statt Stückname), `## Folgen` (Ereignis-Kontingent, sechs Monate Aufbewahrung, eigene Besuche enthalten, keine Heatmaps, Kontaktformular vorerst per Submit gezählt).

- [ ] **Schritt 2: Glossar ergänzen**

In `CONTEXT.md` hinter „Shop set":

```markdown
### Placement
Where on the website a shop link sits, written into its address as `utm_content` when the site is built — for example `firing-tofino-tile2`, `home-teaser-yaletown` or `nav`. It names the spot, not the piece: Shopify already knows the piece from the page the visitor lands on, and a spot keeps its name when a piece is renamed.
```

- [ ] **Schritt 3: Spec nachziehen**

Abschnitt 5: Ergebnis der Tarifprüfung aus Task 0. Abschnitt 6: tatsächliche Grenzen des kostenlosen Umami-Tarifs.

- [ ] **Schritt 4: Commit**

```bash
git add docs/adr/0004-messung-ohne-cookies.md CONTEXT.md docs/superpowers/specs/2026-09-17-klicks-und-verkaeufe-design.md
git commit -m "docs(messung): ADR und Begriffe zur cookiefreien Messung

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: Nach dem Release auswerten (ohne Code, Dan)

- [ ] **Schritt 1: Kommen Daten an? (nach 48 Stunden)**

Umami-Dashboard: Besuche und unter Events die sechs Namen aus den Global Constraints. Fehlt `shop-click`, obwohl Besuche gezählt werden, lädt `analytics.js` nicht — im Netzwerk-Tab prüfen. Shopify: *Total sales by referrer* mit Filter „Human or bot session" zeigt die Zeile `matthewfreed.ca`.

- [ ] **Schritt 2: Monatlich dieselben vier Blicke**

1. **Umsatz der Seite (Ziel 2):** Shopify → *Total sales by referrer* → Zeile `matthewfreed.ca`, Monatssumme notieren.
2. **Sets vergleichen (Ziel 1):** Umami → Events → je Set `shop-click` geteilt durch `firing-seen`. Das ist die Klickrate. `firing-shown` ohne `firing-seen` heißt: Set gezeigt, Shop-Teil nie erreicht.
3. **Abspringen (Ziel 3):** Umami → Pages und Events: werden Events-Seite und Karten-Links genutzt, wird der Slider angefasst, kommen Kontaktformulare an?
4. **Einzelne Wege:** eine oder zwei Bestellungen öffnen → *Conversion details*.

Ergebnis als kurzen Absatz mit Datum in Spec Abschnitt 3 unter „Auswertung" festhalten. Eigene Besuche sind enthalten; auffällige Ausschläge zuerst darauf prüfen.

- [ ] **Schritt 3: Nach einem Monat über die Rotation entscheiden**

Liegen die `shop-click`-Ereignisse aller Sets zusammen unter etwa 100 im Monat, die Rotation auf die drei Sets mit der besten Klickrate kürzen (in Tina: die übrigen auf „Hide" setzen). Darüber alle sechs laufen lassen und nach einem weiteren Monat erneut prüfen. Entscheidung und Zahlen in der Spec notieren.

---

## Self-Review

- **Spec-Abdeckung:** UTM-Schema und Platzierung (Abschnitt 3) → Task 1 und 2; Filter statt CMS → Task 1; `/shop` (Abschnitt 2) → Task 3; Umami samt Aktivierung → Task 4; Einblendungen → Task 5; weitere Ereignisse → Task 6; Zugang per Share-URL → Task 0; Datenschutz → Task 7; Rotation nach einem Monat, Auswertung von Hand → Task 9; eigene Besuche nicht ausgenommen → Global Constraints und Task 9 Schritt 2.
- **Platzhalter:** keine. Jeder Schritt nennt Datei, Code und erwartete Ausgabe.
- **Namen:** `shopLink` und `placementSlug` (beide in `.eleventy.js`) in Task 1, 2 und 5; `env.umamiWebsiteId` und `env.umamiScript` in Task 4; `track()` und `parse()` in Task 5 und 6; Ereignisnamen in den Global Constraints, Task 5, 6 und 9 gleich.
