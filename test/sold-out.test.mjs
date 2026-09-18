import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { check } = require("../src/views/_data/soldOut.js");

// A stand-in for the shop: answers per handle, or fails.
const shop = (answers) => {
    const asked = [];
    const fetchImpl = async (url) => {
        asked.push(url);
        const handle = url.match(/\/products\/([^/]+)\.js$/)[1];
        const answer = answers[handle];
        if (answer === "fail") throw new Error("network down");
        if (answer === 404) return { ok: false, json: async () => ({}) };
        return { ok: true, json: async () => ({ available: answer }) };
    };
    return { fetchImpl, asked };
};

const url = (handle) => `https://shop.example.com/products/${handle}`;

test("marks sold-out items and leaves available ones alone", async () => {
    const { fetchImpl } = shop({ teapot: false, mug: true });
    const result = await check([url("teapot"), url("mug")], fetchImpl);
    assert.deepEqual(result, { [url("teapot")]: true });
});

test("a failing or missing product gets no label", async () => {
    const { fetchImpl } = shop({ vase: "fail", tray: 404 });
    assert.deepEqual(await check([url("vase"), url("tray")], fetchImpl), {});
});

test("asks the shop the link points to, also for collection-style links", async () => {
    const { fetchImpl, asked } = shop({ bowl: false });
    const link = "https://shop.example.com/collections/all/products/bowl";
    const result = await check([link], fetchImpl);
    assert.deepEqual(asked, ["https://shop.example.com/products/bowl.js"]);
    assert.deepEqual(result, { [link]: true });
});

test("links that are not products are skipped without asking", async () => {
    const { fetchImpl, asked } = shop({});
    const result = await check(["https://shop.example.com/collections/all/Tofino"], fetchImpl);
    assert.deepEqual(result, {});
    assert.equal(asked.length, 0);
});
