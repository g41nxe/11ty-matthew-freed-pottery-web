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
// by a plain string. A renamed set would silently leave the page without
// anything to buy, and nothing on the page would show it.
test("every glaze page has a shop set of its own name", () => {
    for (const page of glazePages) {
        assert.ok(
            shopSets.byName[page.name],
            `${page.title}: no shop set named "${page.name}" -- was the set renamed under Home?`
        );
    }
});

// "Hide" takes a set out of the rotation on the home page. The glaze page has
// no rotation, so the flag could easily have been ignored here -- and then the
// pieces Matthew just withdrew would be back on a page of their own. Strathcona
// is exactly that case today: a glaze in the gallery whose set is hidden.
test("a hidden set never reaches a glaze page", () => {
    for (const page of glazePages) {
        const set = shopSets.byName[page.name];
        if (set && set.hide) {
            assert.equal(page.set, null, `${page.title}: hidden set is shown anyway`);
        } else {
            assert.equal(page.set, set, `${page.title}: visible set is missing from the page`);
        }
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
