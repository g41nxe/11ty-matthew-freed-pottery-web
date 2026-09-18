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
const glazeCount = filters.glazeCount;

test("writes the number of glaze lines out in words", () => {
    assert.equal(glazeCount("Functional stoneware in {glazes} glazes", 16), "Functional stoneware in sixteen glazes");
});

test("capitalises {Glazes} to start a sentence", () => {
    assert.equal(glazeCount("{Glazes} glazes, {glazes} stories", 16), "Sixteen glazes, sixteen stories");
});

test("handles counts above twenty and leaves other text alone", () => {
    assert.equal(glazeCount("all {glazes} glazes", 21), "all twenty-one glazes");
    assert.equal(glazeCount("No placeholder here", 16), "No placeholder here");
    assert.equal(glazeCount(undefined, 16), undefined);
});
