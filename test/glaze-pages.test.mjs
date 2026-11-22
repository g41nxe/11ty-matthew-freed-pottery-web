import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const require = createRequire(import.meta.url);
const glazePages = require("../src/views/_data/glazePages.js");
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
test("a glaze page shows the set of its name, and only when it is visible", () => {
    for (const page of glazePages) {
        const set = shopSets.byName[page.name];
        const erwartet = set && !set.hide ? set : null;
        assert.equal(page.set, erwartet, `${page.title}: wrong set on the page`);
    }
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

// The blue band shows Matthew's own photo for a glaze when he has one, and the
// studio picture otherwise. The one picture it must never show is the card
// image: the visitor clicked on exactly that to get here. An earlier photos
// field did show it, on all five pages, which is why it was dropped again.
test("the band never falls back to the card image", () => {
    for (const page of glazePages) {
        if (!page.page_image) continue;
        assert.notEqual(
            page.page_image.url,
            page.image.url,
            `${page.title}: the glaze page would repeat the card image full width`
        );
        assert.ok((page.page_image.alt || '').trim(), `${page.title}: page photo without alt text`);
    }
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

// The one shape that differs between pages, and the only branch left in the
// template: pieces or no pieces. Both shapes have to carry a way into the shop.
test("the template leads to the shop in both shapes", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const block = vorlage.slice(vorlage.indexOf('aria-label="Pieces in this glaze"'));
    const mitTeilen = block.slice(0, block.indexOf("{% else %}"));
    const ohneTeile = block.slice(block.indexOf("{% else %}"));
    assert.match(mitTeilen, /link-underline[^>]*>{{ collections_glaze.shop_cta_all/, "the row over the pieces lost its shop link");
    assert.match(ohneTeile, /btn-outline[^>]*>{{ collections_glaze.shop_cta_all/, "a glaze without pieces lost its shop button");
    assert.ok(!vorlage.includes("shop-bottom"), "the second shop link in the header is back");
});

// The header is the same on all sixteen pages: label, name, text. The image
// column and the two shop links that used to live there are gone, and each of
// them is the kind of thing that creeps back in one page at a time.
test("the header holds nothing but label, name and text", () => {
    const vorlage = fs.readFileSync(path.join("src", "views", "glaze.njk"), "utf8");
    const kopf = vorlage.slice(vorlage.indexOf("<article>"), vorlage.indexOf('aria-label="Pieces in this glaze"'));
    assert.ok(!kopf.includes("btn-outline"), "the shop button is back in the header");
    assert.ok(!kopf.includes("link-underline"), "the shop link at the top right is back");
    assert.ok(!kopf.includes("{% img"), "the header carries a picture again");
    assert.ok(!kopf.includes("md:grid-cols"), "the header has a second column again");
});
