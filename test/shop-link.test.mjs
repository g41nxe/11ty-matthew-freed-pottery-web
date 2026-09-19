import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const filters = {};
const transforms = {};
const stub = new Proxy(
    {
        addNunjucksFilter: (name, fn) => { filters[name] = fn; },
        addTransform: (name, fn) => { transforms[name] = fn; },
    },
    { get: (target, prop) => target[prop] ?? (() => {}) }
);
require("../.eleventy.js")(stub);
const { shopLink, placementSlug } = filters;

// Runs the shop link transform the way Eleventy does: once per written page,
// with that page as `this.page`.
const renderPage = (url, outputPath, html) =>
    transforms.shopLinks.call({ page: { url, outputPath } }, html);
const hrefOf = (html) => new URL(html.match(/href="([^"]+)"/)[1].replace(/&amp;/g, "&"));

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

test("treats the myshopify address as the shop", () => {
    const url = new URL(shopLink("https://matthew-freed-pottery.myshopify.com/products/belly-mug-tofino", "nav"));
    assert.equal(url.searchParams.get("utm_campaign"), "website");
    assert.equal(url.searchParams.get("utm_content"), "nav");
});

test("tags a shop link written into page text with the page's name", () => {
    const html = renderPage("/events.html", "dist/events.html", `<p>See <a href="${SHOP}?variant=42&amp;x=1">the mug</a>.</p>`);
    const url = hrefOf(html);
    assert.equal(url.searchParams.get("utm_campaign"), "website");
    assert.equal(url.searchParams.get("utm_content"), "text-events");
    assert.equal(url.searchParams.get("variant"), "42");
    assert.match(html, /\?variant=42&amp;x=1&amp;utm_source=/, "ampersands stay escaped like the rest of the page");
});

test("names page text by its path, and the home page as home", () => {
    const link = `<a href="${SHOP}">mug</a>`;
    assert.equal(hrefOf(renderPage("/", "dist/index.html", link)).searchParams.get("utm_content"), "text-home");
    assert.equal(hrefOf(renderPage("/about/pottery.html", "dist/about/pottery.html", link)).searchParams.get("utm_content"), "text-about-pottery");
});

test("leaves links the templates already tagged exactly as they are", () => {
    const tagged = shopLink(SHOP, "firing-tofino-tile2").replace(/&/g, "&amp;");
    const html = `<a href="${tagged}" class="group">mug</a>`;
    assert.equal(renderPage("/", "dist/index.html", html), html);
});

test("leaves other links and pages that are not HTML alone", () => {
    const html = `<a href="https://www.google.com/maps/place/x">map</a> <a href="/collections.html">glazes</a>`;
    assert.equal(renderPage("/contact.html", "dist/contact.html", html), html);
    const text = `<a href="${SHOP}">mug</a>`;
    assert.equal(renderPage("/build.txt", "dist/build.txt", text), text);
});

test("placementSlug keeps lowercase letters, digits and hyphens", () => {
    assert.equal(placementSlug("Tree of Life"), "tree-of-life");
    assert.equal(placementSlug("  --Tofino--  "), "tofino");
});
