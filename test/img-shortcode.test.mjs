import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Same stub as the filter tests: capture the shortcode from the config.
const require = createRequire(import.meta.url);
const shortcodes = {};
const stub = new Proxy(
    { addNunjucksAsyncShortcode: (name, fn) => { shortcodes[name] = fn; } },
    { get: (target, prop) => target[prop] ?? (() => {}) }
);
require("../.eleventy.js")(stub);

const img = (src, alt) => shortcodes.img.call({ page: { inputPath: "./src/views/test.md" } }, src, alt);
const altOf = (html) => (html.match(/alt="([^"]*)"/) || [])[1];
const IMAGE = "images/site/signature.jpg";

test("keeps the alt text from the CMS", async () => {
    assert.equal(altOf(await img(IMAGE, "Cheers, Matthew")), "Cheers, Matthew");
});

test("falls back to a generic description when alt text is missing", async () => {
    assert.equal(altOf(await img(IMAGE, undefined)), "Handmade pottery by Matthew Freed");
});

test("treats blank alt text as missing", async () => {
    assert.equal(altOf(await img(IMAGE, "   ")), "Handmade pottery by Matthew Freed");
});

test("leaves an entry without an image out instead of failing the build", async () => {
    assert.equal(await img(undefined, "A cup"), "");
    assert.equal(await img("", "A cup"), "");
});
