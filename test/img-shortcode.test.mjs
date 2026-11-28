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

// Ein Stück aus dem Shop kommt als volle Adresse, kein Pfad unter src/.
// Der erste Versuch unterschied beides mit einem regulären Ausdruck, dessen
// Schrägstriche beim Schreiben verloren gingen -- danach galt jedes Bild als
// entfernt, und keines wurde mehr gefunden.
test("ein Pfad aus dem CMS wird unter src/ gesucht, eine Adresse nicht", async () => {
    assert.notEqual(await img(IMAGE, "Eine Tasse"), "");
});

test("eine unerreichbare Adresse lässt die Kachel ohne Bild, statt den Build anzuhalten", async () => {
    assert.equal(await img("https://cdn.shopify.com/gibt-es-nicht-" + Date.now() + ".jpg", "Eine Tasse"), "");
});
