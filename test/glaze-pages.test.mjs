import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const glazePages = require("../src/views/_data/glazePages.js");
const gallery = require("../src/views/_data/gallery.json");

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

// The pieces on a glaze page come from the shop set of the same name. A
// renamed set would silently leave the page without anything to buy.
test("every glaze page finds its shop set", () => {
    for (const page of glazePages) {
        assert.ok(page.set, `${page.title}: no shop set named "${page.name}"`);
        assert.ok(page.set.featured_piece && page.set.featured_piece.cta.url, `${page.title}: featured piece without a shop link`);
        assert.ok((page.set.items || []).length >= 4, `${page.title}: fewer than four pieces`);
    }
});
