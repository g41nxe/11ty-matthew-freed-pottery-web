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

// The pieces on a glaze page come from the shop set of the same name, matched
// by a plain string. Three outcomes, and all three are legitimate:
//
//   visible set of that name -> the page shows it
//   hidden set               -> the page shows nothing (hide means withdrawn)
//   no set at all            -> the page shows nothing (Skaha, a new glaze
//                               with a story but nothing in the shop yet)
//
// The earlier version of this test demanded that a set exist, which was true
// until Skaha and would have blocked every glaze that gets a text before it
// gets pieces. What it also did was catch a renamed set; that guard is gone,
// and in its place the CMS now says at the name field: "Must match the glaze
// name exactly, otherwise that glaze page finds no pieces."
// Vom Shop-Set bleibt eine Reihenfolge: welche Adressen zuerst stehen sollen.
// Ein verstecktes Set zählt wie keins -- "hide" ist Matthews Griff, Stücke aus
// der Auslage zu nehmen, und er darf nicht dadurch wirkungslos werden, dass
// die Stücke jetzt aus dem Shop kommen.
test("ein verstecktes Shop-Set gibt keinen Vorrang", () => {
    for (const page of glazePages) {
        const set = shopSets.byName[page.name];
        const erwartet = set && !set.hide ? (set.items || []).length : 0;
        assert.equal(page.vorrang.length, erwartet, `${page.title}: falsche Vorrangliste`);
    }
});

// Die Vorrangliste bestimmt nur den Anfang, der Shop den Rest -- und mehr als
// vier Kacheln zeigt die Seite nie.
test("die Vorrangliste steht vorn, der Shop füllt auf", () => {
    const stueck = (handle, verfuegbar = true) => ({ handle, title: handle, available: verfuegbar, published: "2024-01-01" });
    const seite = { slug: "Jericho", vorrang: ["https://shop.matthewfreed.net/products/c"] };
    const nachTag = { jericho: [stueck("a"), stueck("b"), stueck("c"), stueck("d"), stueck("e")] };
    const [ergebnis] = glazeModul.mitStuecken([seite], nachTag);
    assert.deepEqual(ergebnis.pieces.map((s) => s.handle), ["c", "a", "b", "d"]);
});

test("eine Glasur ohne Stücke im Shop bekommt eine leere Liste", () => {
    const seite = { slug: "Skaha", vorrang: [] };
    const [ergebnis] = glazeModul.mitStuecken([seite], {});
    assert.deepEqual(ergebnis.pieces, []);
});

// A set that is shown has to be worth showing: the featured piece needs a link
// into the shop, and the grid beside it holds four tiles.
test("a set on the page is complete", () => {
    for (const page of glazePages.filter((p) => p.set)) {
        assert.ok(page.set.featured_piece && page.set.featured_piece.cta.url, `${page.title}: featured piece without a shop link`);
        assert.ok((page.set.items || []).length >= 4, `${page.title}: fewer than four pieces`);
    }
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
    for (const feld of ["eyebrow", "pieces_title", "shop_cta_all", "ask_title", "ask_text", "ask_cta", "others_title", "back_label"]) {
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
test("every page links on to four other glazes, itself never among them", () => {
    for (const page of glazePages) {
        assert.equal(page.others.length, Math.min(4, glazePages.length - 1), `${page.title}: wrong number of cards`);
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

// Mit Stücken führt die Zeile über ihnen in den Shop. Ohne Stücke führt sie
// nirgendwo hin -- die Sammlung im Shop wäre leer. Das ist eine Abkehr von
// "jede Seite führt in den Shop": Ein Link auf eine leere Seite ist kein Weg,
// sondern eine Sackgasse. Hinaus führt dort die Marktkachel.
test("der Shop-Link steht nur da, wo es auch Stücke gibt", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const block = vorlage.slice(vorlage.indexOf('aria-label="This glaze in the shop"'));
    const zeile = block.slice(0, block.indexOf("grid grid-cols-2"));
    assert.match(zeile, /{% if glaze.pieces.length %}<a [^>]*link-underline/, "der Shop-Link hängt nicht mehr an den Stücken");
    assert.ok(!vorlage.includes("shop-bottom"), "der zweite Shop-Link im Kopf ist zurück");
});

// Zweimal beim Umbau verschwunden, zweimal erst im Browser aufgefallen: Das
// Gruppenfoto und der Wrapper, der die beiden Spalten nebeneinander stellt.
// Ohne sie rutscht das Kachelraster in die Überschriftzeile und die Seite
// steht ohne Bild da.
test("das Gruppenfoto steht neben den Kacheln", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const block = vorlage.slice(vorlage.indexOf('aria-label="This glaze in the shop"'));
    const raster = block.indexOf("md:grid-cols-2");
    const foto = block.indexOf("glaze.feature.url");
    const kacheln = block.indexOf('id="glaze-markets"');
    assert.ok(raster > -1, "die beiden Spalten stehen nicht mehr nebeneinander");
    assert.ok(foto > raster, "das Gruppenfoto steht nicht mehr in der ersten Spalte");
    assert.ok(kacheln > foto, "die Kacheln stehen nicht mehr hinter dem Foto");
});

// Die Spalte neben dem Foto hat vier Plätze. Die Stücke füllen sie von vorn,
// und was frei bleibt, bekommt die Märkte: eine Kachel mit der Aussage, dann
// die nächsten Termine. Daran hängen zwei Zahlen, die leicht auseinanderlaufen
// -- wie viele Termine der Bau sichtbar lässt und wie viele events.js im
// Browser nachrücken lässt. Beide lesen dieselbe.
test("was an Stücken fehlt, füllen die Märkte auf", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const block = vorlage.slice(vorlage.indexOf('aria-label="This glaze in the shop"'));
    assert.match(block, /{% set plaetze = 3 - glaze\.pieces\.length %}/, "die freien Plätze werden nicht mehr aus der Stückzahl berechnet");
    assert.match(block, /data-slots="{{ plaetze }}"/, "events.js erfährt die Zahl der Plätze nicht mehr");
    assert.match(block, /{% if glaze\.pieces\.length < 4 %}/, "die Marktkachel steht jetzt auch auf einer vollen Seite");
    for (const feld of ["market_title", "market_text", "market_cta"]) {
        assert.ok(block.includes("collections_glaze." + feld), `die Marktkachel holt ${feld} nicht mehr aus dem CMS`);
    }
    assert.ok(!block.includes("glaze.swatch | schriftAuf"), "das Farbmuster ist zurück, wo jetzt die Märkte stehen");
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

// The header is the same on all sixteen pages: label, name, text. The image
// column and the two shop links that used to live there are gone, and each of
// them is the kind of thing that creeps back in one page at a time.
test("the header holds nothing but label, name and text", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const kopf = vorlage.slice(vorlage.indexOf("<article>"), vorlage.indexOf('aria-label="This glaze in the shop"'));
    assert.ok(!kopf.includes("btn-outline"), "the shop button is back in the header");
    assert.ok(!kopf.includes("link-underline"), "the shop link at the top right is back");
    assert.ok(!kopf.includes("{% img"), "the header carries a picture again");
    assert.ok(!kopf.includes("md:grid-cols"), "the header has a second column again");
});

// Squamish Nights stand mit dem Slug "Squamish" im CMS und zeigte kein
// einziges Stück, obwohl neun das Tag tragen. Der Slug ist jetzt richtig,
// aber beide Schreibweisen müssen treffen: Sonst fällt derselbe Fehler bei
// der nächsten zweiteiligen Glasur wieder niemandem auf.
test("der Slug findet seine Stücke in jeder Schreibweise", () => {
    const stueck = (handle) => ({ handle, title: handle, url: "", price: "", image: null, alt: "", available: true, published: "" });
    const nachTag = { "squamish-nights": [stueck("a"), stueck("b")] };
    for (const slug of ["squamish-nights", "Squamish Nights", "Squamish-Nights"]) {
        const [seite] = glazeModul.mitStuecken([{ slug, name: "Squamish Nights", vorrang: [] }], nachTag);
        assert.equal(seite.pieces.length, 2, `Slug "${slug}" findet die Stücke nicht`);
    }
});
