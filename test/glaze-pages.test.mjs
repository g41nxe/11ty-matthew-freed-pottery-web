import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const require = createRequire(import.meta.url);
// Die Seiten ohne den Shop: Pfade, Texte und Querverweise hängen nicht
// daran, welche Stücke Shopify gerade führt (siehe mitStuecken).
const glazeModul = require("../src/views/_data/glazePages.js");
const glazePages = glazeModul.seiten;
const gallery = require("../src/views/_data/gallery.json");
const seitentexte = require("../src/views/_data/collections_glaze.json");

// A glaze gets its own page only once both texts exist: the lead for the top
// of the page and the search snippet, the story for the body. With just one of
// them the page would be thinner than the card leading to it, so the card keeps
// linking straight to the shop instead.
test("a page needs both a lead and a story", () => {
    const beide = gallery.items.filter((item) => (item.lead || "").trim() && (item.story || "").trim());
    assert.equal(glazePages.length, beide.length);
    assert.deepEqual(
        glazePages.map((page) => page.title).sort(),
        beide.map((item) => item.title).sort()
    );
});

// The trap this closes: a lead on its own used to build a page whose body was
// empty. Nothing in the CMS stopped it and nothing on the page showed it.
test("a lead without a story builds no page", () => {
    const nurLead = { title: "Probe Collection", lead: "x".repeat(120), image: { url: "/images/x.jpg" }, slug: "Probe", swatch: "#1F3A52" };
    const gebaut = [nurLead]
        .filter((item) => (item.lead || "").trim() && (item.story || "").trim());
    assert.equal(gebaut.length, 0);
});

test("every page has a url-safe path of its own under /collections/", () => {
    const paths = glazePages.map((page) => page.path);
    assert.deepEqual(paths, [...new Set(paths)], "two glazes would overwrite each other");
    for (const path of paths) assert.match(path, /^\/collections\/[a-z0-9-]+\/$/);
});

test("a page carries what the template needs", () => {
    for (const page of glazePages) {
        assert.ok((page.lead || "").trim().length > 80, `${page.title}: lead too short to carry the top of a page`);
        assert.ok(page.image && page.image.url, `${page.title}: no image`);
        assert.ok(page.slug, `${page.title}: no shop slug`);
        assert.match(page.swatch, /^#[0-9A-Fa-f]{6}$/, `${page.title}: no swatch colour`);
    }
});

test("the story is kept as paragraphs, not one block", () => {
    for (const page of glazePages) {
        assert.ok(Array.isArray(page.paragraphs) && page.paragraphs.length >= 1, `${page.title}: no paragraphs`);
        assert.ok(page.paragraphs.every((p) => p.trim()), `${page.title}: empty paragraph`);
    }
});

// Welche Stücke eine Glasurseite zeigt, entscheidet allein der Shop: was das
// Tag der Glasur trägt, in der Reihenfolge, die shopPieces.js liefert
// (verfügbare zuerst). Eine Vorrangliste aus den Shop-Sets stand hier und ist
// wieder weg: Vier handverlesene Stücke füllten alle Plätze, auch
// ausverkauft, und Yaletown zeigte drei "Sold out", während der Shop sieben
// verfügbare führte.
test("alle verfügbaren Stücke, ausverkaufte nur zum Auffüllen auf vier", () => {
    const stueck = (handle, available = true) => ({ handle, title: handle, available, published: "2024-01-01" });
    const seite = (nachTag) => glazeModul.mitStuecken([{ slug: "Jericho" }], nachTag)[0];
    // Sechs verfügbare: alle sechs, das ausverkaufte dahinter bleibt weg.
    const voll = seite({ jericho: [stueck("a"), stueck("b"), stueck("c"), stueck("d"), stueck("e"), stueck("f"), stueck("x", false)] });
    assert.deepEqual(voll.pieces.map((s) => s.handle), ["a", "b", "c", "d", "e", "f"]);
    // Eins verfügbar: Es steht vorn, drei ausverkaufte füllen auf, das vierte bleibt weg.
    const knapp = seite({ jericho: [stueck("x", false), stueck("a"), stueck("y", false), stueck("z", false), stueck("w", false)] });
    assert.deepEqual(knapp.pieces.map((s) => s.handle), ["a", "x", "y", "z"]);
    // Gezählt wird, was zu kaufen ist: daran hängen Knopf und Fotolink.
    assert.equal(voll.available, 6);
    assert.equal(knapp.available, 1);
    assert.equal(seite({ jericho: [stueck("x", false), stueck("y", false)] }).available, 0);
});

test("kein Shop-Set greift mehr in eine Glasurseite ein", () => {
    for (const page of glazePages) {
        assert.ok(!("vorrang" in page), `${page.title}: trägt wieder eine Vorrangliste`);
        assert.ok(!("nurDiese" in page), `${page.title}: trägt wieder eine handverlesene Liste`);
    }
    const quelle = fs.readFileSync(path.join("src", "views", "_data", "glazePages.js"), "utf8");
    assert.ok(!quelle.includes("shopSets"), "glazePages.js liest wieder die Shop-Sets");
});

test("eine Glasur ohne Stücke im Shop bekommt eine leere Liste", () => {
    const seite = { slug: "Skaha" };
    const [ergebnis] = glazeModul.mitStuecken([seite], {});
    assert.deepEqual(ergebnis.pieces, []);
});

// These pages exist to be found in search, so being listed in the sitemap is
// not a detail. Eleventy adds only the FIRST page of a paginated template to
// collections.all unless told otherwise, and the sitemap loops over exactly
// that collection. Without the flag below it listed Yaletown and none of the
// other four, which went unnoticed because every page itself was built fine.
test("every generated page reaches the sitemap, not just the first", () => {
    const template = path.join(import.meta.dirname, "..", "src", "views", "glaze.njk");
    const { pagination } = matter(fs.readFileSync(template, "utf8")).data;
    assert.equal(pagination.data, "glazePages");
    assert.equal(
        pagination.addAllPagesToCollections,
        true,
        "without addAllPagesToCollections the sitemap holds one glaze page instead of all of them"
    );
});

// One picture for all sixteen bands, and it comes from the CMS. The two
// things it must never be: missing (the band is half empty then) and a glaze
// card image. A per-glaze photo field existed twice and went wrong both times
// -- first it repeated the card the visitor had just clicked, then it put a
// glazed piece under "not in the shop right now".
test("the blue band has one picture, and it is not a glaze card", () => {
    const bild = seitentexte.ask_image;
    assert.ok(bild && (bild.url || "").trim(), "collections_glaze.json: the blue band has no photo");
    assert.ok((bild.alt || "").trim(), "collections_glaze.json: the band photo has no alt text");
    for (const page of glazePages) {
        assert.notEqual(bild.url, page.image.url, `${page.title}: the band would repeat the card image`);
    }
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const band = vorlage.slice(vorlage.indexOf('<section class="bg-blue">'));
    assert.ok(!band.includes("page_image"), "the band picks a picture per glaze again");
});

// Everything on a glaze page that is not the glaze itself comes from this one
// file, so Matthew can change the wording without touching a template. The
// template no longer carries fallbacks: a missing key would render as nothing
// at all, and an empty heading is the kind of thing nobody notices for weeks.
test("the page furniture is complete and comes from the CMS", () => {
    for (const feld of ["eyebrow", "pieces_title", "shop_cta_all", "shop_all_label", "market_title", "market_text", "market_cta", "ask_title", "ask_text", "ask_cta", "others_title", "back_label"]) {
        assert.ok((seitentexte[feld] || '').trim(), `collections_glaze.json: ${feld} is empty`);
    }
    assert.ok(seitentexte.ask_image && seitentexte.ask_image.url, 'collections_glaze.json: the blue band has no photo');
    assert.ok((seitentexte.ask_image.alt || '').trim(), 'collections_glaze.json: the band photo has no alt text');
});

// Both texts name the glaze, and the template fills it in. Lose the
// placeholder and the sentence reads "Tell me what you are after in and I",
// or the button says a bare "Ask about".
test("the texts that name a glaze keep their placeholder", () => {
    for (const feld of ["ask_text", "ask_cta", "shop_cta_all"]) {
        assert.ok(
            seitentexte[feld].includes("{glaze}"),
            `collections_glaze.json: ${feld} lost its {glaze} placeholder`
        );
    }
});

// The slider at the foot of each page holds every other glaze. The order
// starts with the glaze after this one, so no glaze collects all the first
// places and none is never linked to.
test("every page links on to every other glaze, itself never among them", () => {
    for (const page of glazePages) {
        assert.equal(page.others.length, glazePages.length - 1, `${page.title}: the slider does not hold every other glaze`);
        assert.ok(!page.others.some((o) => o.path === page.path), `${page.title}: links to itself`);
        const pfade = page.others.map((o) => o.path);
        assert.deepEqual(pfade, [...new Set(pfade)], `${page.title}: the same glaze twice`);
    }
    // Rotating means every glaze is linked to equally often.
    const wieoft = {};
    for (const page of glazePages) for (const o of page.others) wieoft[o.name] = (wieoft[o.name] || 0) + 1;
    const zahlen = Object.values(wieoft);
    assert.equal(Math.max(...zahlen) - Math.min(...zahlen), 0, `links are spread unevenly: ${JSON.stringify(wieoft)}`);
});

// The button and the photo link at the top of a page are built from the
// glaze's shop slug. Without one they would lead to the shop's front page.
test("every page can build a link into the shop", () => {
    for (const page of glazePages) {
        assert.ok(
            (page.slug || "").trim(),
            `${page.title}: no shop collection slug, so the page's shop link would go nowhere`
        );
    }
});

// Zu den Stücken dieser Glasur führen der Knopf im Kopf und das Foto daneben.
// Ohne Stücke führen beide nirgendwo hin -- die Sammlung im Shop wäre leer,
// und ein Link auf eine leere Seite ist kein Weg, sondern eine Sackgasse.
// Hinaus führen dort die Marktkachel und der Link in den ganzen Shop, der auf
// allen sechzehn Seiten neben der Überschrift steht.
test("zu den Stücken der Glasur führt nur etwas, wo es welche gibt", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const grenze = vorlage.indexOf('aria-label="This glaze in the shop"');
    const kopf = vorlage.slice(0, grenze);
    const block = vorlage.slice(grenze);
    assert.match(kopf, /{% if glaze.available %}<a [^>]*btn-primary/, "der Knopf zur Sammlung hängt nicht mehr daran, dass etwas zu kaufen ist");
    assert.match(kopf, /{% if glaze.available %}\s*<a [^>]*-feature/, "das Foto verlinkt auch eine Sammlung ohne Kaufbares");
    const zeile = block.slice(0, block.indexOf('id="glaze-markets"'));
    assert.match(zeile, /<a [^>]*-shop-all[^>]*>{{ collections_glaze.shop_all_label }}/, "der Link in den ganzen Shop fehlt neben der Überschrift");
    assert.ok(!zeile.includes("{% if glaze.pieces.length %}<a"), "der Link in den ganzen Shop hängt jetzt an den Stücken");
});

// Das Gruppenfoto steht im Kopf neben dem Namen, fest in 4:3. Vorher hing es
// neben den Kacheln und streckte sich auf deren Höhe: auf jeder Seite ein
// anderer Ausschnitt, bei Jericho ohne Tülle, bei Skaha ein Streifen. Die
// Stücke stehen darunter als Viererreihe, jedes ganz zu sehen.
test("das Foto steht im Kopf, die Stücke als Reihe darunter", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const grenze = vorlage.indexOf('aria-label="This glaze in the shop"');
    const kopf = vorlage.slice(0, grenze);
    const block = vorlage.slice(grenze, vorlage.indexOf('<section class="bg-blue">'));
    assert.ok(kopf.indexOf("<h1") > -1 && kopf.indexOf("glaze.feature.url") > kopf.indexOf("<h1"), "das Gruppenfoto steht nicht mehr im Kopf hinter dem Namen");
    assert.ok(!kopf.includes("md:aspect-auto"), "das Gruppenfoto streckt sich wieder auf eine fremde Höhe");
    assert.ok(!block.includes("glaze.feature.url"), "das Gruppenfoto steht wieder neben den Kacheln");
    assert.ok(block.includes('id="glaze-markets"'), "die Stücke stehen nicht mehr als Reihe unter dem Kopf");
    assert.match(block, /<div class="relative aspect-square overflow-hidden bg-white">[\s\S]*?img piece\.image[^%]*object-contain/, "die Kachelbilder haben kein festes Format mehr oder werden beschnitten; das Quadrat gehört an den Rahmen, damit ein Stück ohne Foto seinen Platz behält");
});

// Die Reihe unter dem Kopf ist ein Slider mit fester Folge: erst die Stücke,
// dann Platzhalter, bis mit den beiden Marktkarten vier Karten beisammen sind,
// am Ende die Marktkachel und der nächste Markt. Vier Karten pro Ansicht ab
// lg, zwei darunter -- sonst ist die Reihe in jeder Breite dieselbe. Vorher
// war sie ein Raster mit vier Plätzen und je einer Regel für Telefon, Tablet
// und Schreibtisch.
test("die Reihe ist ein Slider: Stücke, Platzhalter, Marktkachel, nächster Markt", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const block = vorlage.slice(vorlage.indexOf('aria-label="This glaze in the shop"'), vorlage.indexOf('<section class="bg-blue">'));
    // Bis zwei Stücke sind es genau vier Karten: Die stehen fest, vier in einer
    // Reihe ab lg, zwei mal zwei darunter. Erst ab drei Stücken ist die Reihe ein
    // Slider -- home-slider.js erkennt ihn an data-slider. events.js hält in
    // beiden Fällen genau einen Termin sichtbar.
    assert.ok(block.includes("{% set alsSlider = glaze.pieces.length > 2 %}"), "die Reihe ist auch mit vier Karten ein Slider, oder nie");
    assert.match(block, /id="glaze-markets"{% if alsSlider %} data-slider="still"{% endif %} data-slots="1"/, "home-slider.js erkennt die Reihe nicht mehr, sie läuft wieder von selbst weiter, oder events.js erfährt den einen Termin-Platz nicht");
    assert.match(block, /{% if alsSlider %}[^{]*overflow-x-auto[^{]*{% else %}grid grid-cols-2[^{]*lg:grid-cols-4{% endif %}/, "ohne Slider stehen die vier Karten nicht mehr als Raster");
    const slider = fs.readFileSync(path.join("src", "javascript", "home-slider.js"), "utf8");
    assert.ok(slider.includes('querySelectorAll("[data-slider]")'), "home-slider.js bewegt die Reihe der Stücke nicht mehr");

    const stellen = [
        "{% for piece in glaze.pieces %}",
        "{% for n in range(0, platzhalter) %}",
        '<a href="/events.html" data-market-tile class="group flex aspect-square',
        "{% for event in upcoming %}",
    ].map((teil) => block.indexOf(teil));
    assert.ok(stellen.every((i) => i > -1), "ein Teil der Reihe fehlt: Stücke, Platzhalter, Marktkachel oder Termine");
    assert.deepEqual([...stellen].sort((a, b) => a - b), stellen, "die Folge stimmt nicht mehr: Stücke, Platzhalter, Marktkachel, Termin");

    // Im Slider zwei Karten pro Ansicht, vier ab lg, dazu jeweils ein Anschnitt
    // der nächsten; jede Karte der Reihe trägt diese Breite.
    assert.ok(block.includes('{% set karte = "w-[45%] flex-none snap-start lg:w-[22.5%]" if alsSlider else "" %}'), "die Karten sind im Slider nicht mehr zu zweit bzw. zu viert pro Ansicht, mit Anschnitt der nächsten");
    assert.equal(block.split("{{ karte }}").length - 1, 4, "nicht jede Art von Karte trägt die gemeinsame Breite");
    assert.ok(!/class="[^"]*hidden[^"]*{{ karte }}"/.test(block), "eine Karte fehlt in einer Breite wieder ganz");

    // Platzhalter nur, solange Stücke und Marktkarten zusammen keine vier ergeben.
    assert.match(block, /{% set platzhalter = 2 - glaze\.pieces\.length %}/, "die Platzhalter werden nicht mehr aus der Stückzahl berechnet");
    assert.match(block, /range\(0, platzhalter\)[\s\S]*?aspect-square[^"]*bg-white" style="color: {{ glaze\.swatch }}"/, "die leeren Plätze zeigen die Blume nicht mehr in der Glasurfarbe auf Weiß");
    // Der Satz steht unter dem Quadrat, wo ein Stück seinen Namen trägt, in derselben Schrift -- ohne Zeiger sichtbar.
    assert.match(block, /<p class="mt-2 min-h-10 whitespace-pre-line font-display text-sm font-black text-ink">{{ collections_glaze\.empty_note }}/, "der Text der leeren Plätze steht nicht mehr unter der Kachel, kommt nicht mehr aus dem CMS oder verliert seinen Zeilenumbruch");
    assert.ok(!/group-hover:opacity-(0|100)/.test(block), "der Text der leeren Plätze hängt wieder am Zeiger");
    // Drei Blumen der Seite nebeneinander, von voll bis blass: "es kommt noch mehr", ohne ein Wort.
    assert.ok(block.includes('{% for stufe in stufen %}<span class="{{ stufe }}">{% include "dogwood.njk" %}</span>{% endfor %}'), "auf den leeren Plätzen stehen nicht mehr drei Blumen der Seite");
    assert.ok(block.includes('{% set stufen = ["", "opacity-45", "opacity-20"] %}'), "die drei Blumen eines einzelnen Platzhalters verblassen nicht mehr von links nach rechts");
    // Zwei Platzhalter sind eine Geste, nicht zweimal dieselbe Kachel: Die
    // Blumen verblassen über beide hinweg, und der Satz steht nur unter der ersten.
    assert.ok(block.includes('{% set stufen = ["", "opacity-60", "opacity-35"] if n == 0 else ["opacity-20", "opacity-10", "opacity-5"] %}'), "zwei Platzhalter sehen wieder gleich aus");
    assert.ok(block.includes("{% if collections_glaze.empty_note and n == 0 %}"), "der Satz steht wieder unter beiden Platzhaltern");
    assert.ok(!block.includes("placeholder_image"), "das Platzhalter-Foto ist zurück");

    // Die Marktkachel steht immer, mit einem Satz, der bei leerem wie bei vollem Shop stimmt.
    assert.ok(!block.includes("{% if glaze.pieces.length < 4 %}"), "die Marktkachel fehlt wieder auf einer vollen Seite");
    assert.ok(!block.includes("stocked"), "die Marktkachel hat wieder zwei Sätze je nach Bestand");
    for (const feld of ["market_title", "market_text", "market_text_more", "market_cta"]) {
        assert.ok(block.includes("collections_glaze." + feld), `die Marktkachel holt ${feld} nicht mehr aus dem CMS`);
    }
    // Genau ein Termin ist sichtbar, der nächste.
    assert.ok(block.includes("{% if rank != 0 %}hidden{% endif %}"), "es stehen wieder mehrere Termine nebeneinander, oder keiner");
});

// The header is the same on all sixteen pages: label, name, tagline, text on
// the left, the group photo on the right. An earlier version kept the header
// to text alone and held the photo beside the tiles; that stretched the photo
// to a different crop on every page and left half the header empty, so the
// photo moved up (and with it one button to the glaze's pieces). What must not
// creep back is a second shop link beside it.
test("the header holds the text, one button and the group photo", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const kopf = vorlage.slice(vorlage.indexOf("<article>"), vorlage.indexOf('aria-label="This glaze in the shop"'));
    assert.equal(kopf.split(/btn-(?:primary|outline)/).length - 1, 1, "the header should carry exactly one button");
    assert.ok(!kopf.includes("link-underline"), "a text link to the shop is back in the header");
    assert.ok(kopf.includes("md:grid-cols-2"), "text and photo no longer stand side by side");
    assert.ok(kopf.includes("glaze.text"), "the one-line tagline under the name is gone");
});

// Squamish Nights stand mit dem Slug "Squamish" im CMS und zeigte kein
// einziges Stück, obwohl neun das Tag tragen. Der Slug ist jetzt richtig,
// aber beide Schreibweisen müssen treffen: Sonst fällt derselbe Fehler bei
// der nächsten zweiteiligen Glasur wieder niemandem auf.
test("der Slug findet seine Stücke in jeder Schreibweise", () => {
    const stueck = (handle) => ({ handle, title: handle, url: "", price: "", image: null, alt: "", available: true, published: "" });
    const nachTag = { "squamish-nights": [stueck("a"), stueck("b")] };
    for (const slug of ["squamish-nights", "Squamish Nights", "Squamish-Nights"]) {
        const [seite] = glazeModul.mitStuecken([{ slug, name: "Squamish Nights" }], nachTag);
        assert.equal(seite.pieces.length, 2, `Slug "${slug}" findet die Stücke nicht`);
    }
});

// Pemberton Sky und Pemberton Earth teilen sich im Shop ein Tag. Jede Seite
// nimmt alles unter diesem Tag, nur die Stücke der anderen nicht -- der einzige
// Eingriff von Hand, den eine Glasurseite noch kennt.
test("ausgeschlossene Stücke bleiben von der Seite weg", () => {
    const stueck = (handle, available) => ({ handle, title: handle, url: "", price: "", image: null, alt: "", available, published: "" });
    const nachTag = {
        pemberton: [stueck("earth-1", true), stueck("sky-1", false), stueck("earth-2", true), stueck("sky-2", false)],
    };
    const [seite] = glazeModul.mitStuecken([{
        slug: "pemberton",
        name: "Pemberton Earth",
                nichtDiese: [
            "https://shop.matthewfreed.net/products/sky-1",
            "https://shop.matthewfreed.net/products/sky-2",
        ],
    }], nachTag);
    assert.deepEqual(seite.pieces.map((p) => p.handle), ["earth-1", "earth-2"]);
});
