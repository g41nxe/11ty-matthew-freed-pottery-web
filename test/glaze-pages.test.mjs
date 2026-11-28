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
const shopSets = require("../src/views/_data/shopSets.js");
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
test("der Shop bestimmt Auswahl und Reihenfolge, höchstens vier", () => {
    const stueck = (handle) => ({ handle, title: handle, available: true, published: "2024-01-01" });
    const seite = { slug: "Jericho" };
    const nachTag = { jericho: [stueck("a"), stueck("b"), stueck("c"), stueck("d"), stueck("e")] };
    const [ergebnis] = glazeModul.mitStuecken([seite], nachTag);
    assert.deepEqual(ergebnis.pieces.map((s) => s.handle), ["a", "b", "c", "d"]);
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
    for (const feld of ["eyebrow", "pieces_title", "pieces_title_empty", "shop_cta_all", "shop_all_label", "market_title", "market_text", "market_cta", "ask_title", "ask_text", "ask_cta", "others_title", "back_label"]) {
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

// The cards at the foot of each page. Four exactly, because the grid is four
// wide and five would leave one card alone on a second row -- which is what
// Skaha's page showed the moment it became the sixth. They rotate, so no
// glaze collects all the links and none is never linked to.
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

// Skaha showed what the old template got wrong: its shop link sat inside the
// block that renders the pieces, so the one glaze with nothing curated for it
// was also the one page that led nowhere. A glaze without a set can still have
// items in the shop -- the set is Matthew's selection, not the shop's stock.
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
    assert.match(kopf, /{% if glaze.pieces.length %}<a [^>]*btn-primary/, "der Knopf zur Sammlung hängt nicht mehr an den Stücken");
    assert.match(kopf, /{% if glaze.pieces.length %}\s*<a [^>]*-feature/, "das Foto verlinkt auch eine leere Sammlung");
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
    assert.match(block, /id="glaze-markets"[^>]*md:grid-cols-4/, "die Stücke stehen nicht mehr als Viererreihe");
    assert.match(block, /img piece\.image[^%]*aspect-square[^%]*object-contain/, "die Kachelbilder haben kein festes Format mehr oder werden beschnitten");
});

// Die Reihe unter dem Kopf hat vier Plätze. Die Stücke füllen sie von vorn,
// und was frei bleibt, bekommt die Märkte: eine Kachel mit der Aussage, dann
// die nächsten Termine. Daran hängen zwei Zahlen, die leicht auseinanderlaufen
// -- wie viele Termine der Bau sichtbar lässt und wie viele events.js im
// Browser nachrücken lässt. Beide lesen dieselbe.
test("was an Stücken fehlt, füllen die Märkte auf", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const block = vorlage.slice(vorlage.indexOf('aria-label="This glaze in the shop"'));
    assert.match(block, /{% set plaetze = 3 - glaze\.pieces\.length %}/, "die freien Plätze werden nicht mehr aus der Stückzahl berechnet");
    assert.match(block, /data-slots="{{ termine }}"/, "events.js erfährt die Zahl der Termin-Plätze nicht mehr");
    // Höchstens ein Termin; was darüber hinaus frei ist, zeigt das leere Regal.
    assert.match(block, /{% set termine = 1 if plaetze > 0 else 0 %}/, "es stehen wieder mehrere Termine nebeneinander");
    assert.match(block, /{% set leer = plaetze - termine %}/, "die leeren Plätze werden nicht mehr gezählt");
    // Leere Plätze tragen ein X auf der Glasurfarbe, in Papier oder Tinte, je nachdem, was darauf lesbar ist.
    assert.match(block, /range\(0, kreuze\)[\s\S]*glaze\.swatch \| schriftAuf/, "die leeren Plätze zeigen kein X mehr in lesbarer Farbe");
    assert.ok(!block.includes("placeholder_image"), "das Platzhalter-Foto ist zurück");
    // Telefon: Eine ungerade Zahl von Stücken bekommt ein X daneben, die
    // Marktkachel steht in voller Breite darunter, die Terminkachel entfällt.
    assert.match(block, /{% set luecke = glaze\.pieces\.length % 2 %}/, "auf dem Telefon bleibt neben einem einzelnen Stück wieder ein Loch");
    assert.match(block, /href="\/events\.html" class="group col-span-2 [^"]*md:col-span-1 md:aspect-square/, "die Marktkachel steht auf dem Telefon nicht mehr in voller Breite unter den Stücken");
    assert.match(block, /data-event[\s\S]*?class="[^"]*max-md:hidden/, "die Terminkachel steht wieder auf dem Telefon");
    assert.match(block, /{% if glaze\.pieces\.length < 4 %}/, "die Marktkachel steht jetzt auch auf einer vollen Seite");
    for (const feld of ["market_title", "market_text", "market_cta"]) {
        assert.ok(block.includes("collections_glaze." + feld), `die Marktkachel holt ${feld} nicht mehr aus dem CMS`);
    }
});

// Auf den sechzehn Glasurfarben muss der Name lesbar bleiben. Die hellste,
// Jericho, trägt Papier nur mit 2,6:1 -- deshalb entscheidet der Kontrast und
// nicht ein fester Wert.
test("der Name auf dem Farbmuster bleibt lesbar", () => {
    const filter = {};
    const attrappe = new Proxy(
        { addNunjucksFilter: (name, fn) => { filter[name] = fn; } },
        { get: (ziel, name) => ziel[name] ?? (() => {}) }
    );
    require("../.eleventy.js")(attrappe);
    for (const eintrag of gallery.items) {
        const wert = filter.kontrastAuf(eintrag.swatch);
        assert.ok(wert >= 4.5, `${eintrag.title}: Kontrast nur ${wert}:1 auf ${eintrag.swatch}`);
    }
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
