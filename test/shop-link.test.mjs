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
