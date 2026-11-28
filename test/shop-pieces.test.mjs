import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shopPieces = require("../src/views/_data/shopPieces.js");
const { gruppiere, preis, ohneGlasur } = shopPieces;

// Was der Shop auf /collections/all/products.json liefert, auf das
// zusammengestrichen, was die Glasurseite davon benutzt.
const produkt = (werte) => ({
    title: "Meal Bowl - Jericho",
    handle: "meal-bowl-jericho",
    tags: ["Jericho"],
    images: [{ src: "https://cdn.shopify.com/bild.jpg", alt: "Eine Schale" }],
    variants: [{ price: "40.00", available: true }],
    published_at: "2024-02-03T00:00:00-08:00",
    ...werte,
});

test("ein Produkt landet unter jedem seiner Tags, klein geschrieben", () => {
    const nachTag = gruppiere([produkt({ tags: ["Jericho", "Tree-of-life"] })]);
    assert.deepEqual(Object.keys(nachTag).sort(), ["jericho", "tree-of-life"]);
    assert.equal(nachTag.jericho[0].title, "Meal Bowl - Jericho");
});

// Der Shop ist ein Katalog der Formen, kein Verzeichnis dessen, was gerade
// da ist: Die Produkte stammen aus 2020 bis 2026, und das Anlagedatum sagt
// nichts über den letzten Brand. Verfügbar zu sein ist das einzige Signal.
test("verfügbare Stücke stehen vorn, dann die zuletzt angelegten", () => {
    const nachTag = gruppiere([
        produkt({ handle: "a", published_at: "2026-01-01", variants: [{ price: "10", available: false }] }),
        produkt({ handle: "b", published_at: "2020-01-01", variants: [{ price: "20", available: true }] }),
        produkt({ handle: "c", published_at: "2025-01-01", variants: [{ price: "30", available: false }] }),
        produkt({ handle: "d", published_at: "2021-01-01", variants: [{ price: "40", available: true }] }),
    ]);
    // Innerhalb jeder Gruppe gilt dasselbe: zuletzt angelegt zuerst.
    assert.deepEqual(nachTag.jericho.map((s) => s.handle), ["d", "b", "a", "c"]);
});

test("ein Stück gilt als verfügbar, sobald eine Variante es ist", () => {
    const nachTag = gruppiere([
        produkt({ variants: [{ price: "40", available: false }, { price: "40", available: true }] }),
    ]);
    assert.equal(nachTag.jericho[0].available, true);
});

// Matthew schreibt "$165" ins CMS, Shopify liefert "165.00". Die Kacheln
// sollen gleich aussehen, egal woher der Preis kommt.
test("Preise sehen aus wie im CMS", () => {
    assert.equal(preis("165.00"), "$165");
    assert.equal(preis("24.50"), "$24.50");
    assert.equal(preis("0.00"), "$0");
    assert.equal(preis(undefined), "");
    assert.equal(preis("keine Zahl"), "");
});

// "Medium Teapot - Jericho" steht auf der Jericho-Seite unter einer
// Überschrift, die schon Jericho heißt.
test("der Glasurname fällt aus dem Kacheltitel", () => {
    assert.equal(ohneGlasur("Medium Teapot - Jericho", "Jericho"), "Medium Teapot");
    assert.equal(ohneGlasur("Meal Bowl - Pemberton Sky", "Pemberton Sky"), "Meal Bowl");
    assert.equal(ohneGlasur("Teardrop Vase - jericho", "Jericho"), "Teardrop Vase");
    // Auch vorn und mitten im Titel: Mit dem Namen liefen elf Titel auf dem
    // Telefon über ihre zwei Zeilen und wurden abgeschnitten.
    assert.equal(ohneGlasur("Jericho Short Vase/utensil Caddy", "Jericho"), "Short Vase/utensil Caddy");
    assert.equal(ohneGlasur("Medium Serving Bowl - Yaletown Red", "Yaletown"), "Medium Serving Bowl - Red");
    assert.equal(ohneGlasur("Yaletown Red - Chopstick Bowl", "Yaletown"), "Red - Chopstick Bowl");
    assert.equal(ohneGlasur("Tofino - Belly Mug", "Tofino"), "Belly Mug");
    // Nur die eigene Glasur, nur als eigenes Wort, und nie bis nichts bleibt.
    assert.equal(ohneGlasur("Meal Bowl - Pemberton Earth", "Pemberton Sky"), "Meal Bowl - Pemberton Earth");
    assert.equal(ohneGlasur("Zenith Bowl", "Zen"), "Zenith Bowl");
    assert.equal(ohneGlasur("Jericho", "Jericho"), "Jericho");
});

// Ein Produkt ohne Foto oder ohne Variante darf den Build nicht anhalten:
// Es kommt aus dem Shop, und dort kann alles passieren.
test("ein unvollständiges Produkt bricht nichts ab", () => {
    const nachTag = gruppiere([produkt({ images: [], variants: [] })]);
    const stueck = nachTag.jericho[0];
    assert.equal(stueck.image, null);
    assert.equal(stueck.price, "");
    assert.equal(stueck.available, false);
    assert.equal(stueck.alt, "");
});

// Die Bildbeschreibung des Shops wiederholt meist den Titel, der direkt unter
// dem Foto steht; ein Screenreader las dann jeden Namen zweimal. Sie bleibt
// nur, wo sie etwas Eigenes sagt. Leer heißt: Das Foto ist Schmuck, der Name
// steht im selben Link.
test("die Bildbeschreibung bleibt nur, wo sie mehr sagt als der Titel", () => {
    const alt = (images, title = "Teardrop Vase") => gruppiere([produkt({ title, images })]).jericho[0].alt;
    assert.equal(alt([{ src: "x.jpg" }]), "", "ohne Beschreibung im Shop steht wieder der Titel als Beschreibung");
    assert.equal(alt([{ src: "x.jpg", alt: "Teardrop Vase - jericho" }]), "", "eine Beschreibung, die nur den Titel wiederholt, wird wieder vorgelesen");
    assert.equal(alt([{ src: "x.jpg", alt: "Teardrop" }]), "");
    assert.equal(alt([{ src: "x.jpg", alt: "A small vase with a narrow neck, held in a hand" }]), "A small vase with a narrow neck, held in a hand");
});

test("die Adresse des Stücks zeigt in Matthews Shop", () => {
    const nachTag = gruppiere([produkt({ handle: "belly-mug-tofino" })]);
    assert.equal(nachTag.jericho[0].url, "https://shop.matthewfreed.net/products/belly-mug-tofino");
});

// Das Tag am Produkt heißt "Squamish Nights", die Sammlung im Shop liegt
// unter /squamish-nights, und im CMS steht die eine oder die andere
// Schreibweise. Neun Stücke waren damit ein Jahr lang unsichtbar, weil der
// Abgleich nur kleingeschrieben hat und nicht umgerechnet.
test("Leerzeichen und Bindestrich im Tag führen zum selben Platz", () => {
    const nachTag = gruppiere([produkt({ tags: ["Squamish Nights", "Tree of Life"] })]);
    assert.deepEqual(Object.keys(nachTag).sort(), ["squamish-nights", "tree-of-life"]);
});

// Antwortet der Shop nicht und gibt es keinen gespeicherten Stand, kämen ohne
// diese Regel sechzehn Glasurseiten ohne Stücke, ohne Knopf und mit "More
// coming soon" online. Auf Netlify bricht der Build deshalb ab, und der letzte
// Stand bleibt stehen; am eigenen Rechner baut die Seite ohne Stücke weiter.
test("ohne Shop und ohne Cache bricht der Build auf Netlify ab", () => {
    const fehler = new Error("fetch failed");
    assert.throws(() => shopPieces.beiAusfall(fehler, { NETLIFY: "true" }), /Der Shop hat nicht geantwortet/);
    const warn = console.warn;
    console.warn = () => {};
    try {
        assert.deepEqual(shopPieces.beiAusfall(fehler, {}), {});
    } finally {
        console.warn = warn;
    }
});
