import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Guards the "every shop link carries UTM tags" result: a shop link that
// skips the shopLink filter would send visitors to the shop with no marker,
// invisible until someone checks Shopify's reports by hand.
const INCLUDES_DIR = path.join(import.meta.dirname, "..", "src", "views", "_includes");

function njkFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return njkFiles(full);
        return entry.name.endsWith(".njk") ? [full] : [];
    });
}

test("every href built from global.shop.base or a *.cta.url passes through shopLink", () => {
    const offenders = [];
    for (const file of njkFiles(INCLUDES_DIR)) {
        const name = path.basename(file);
        const content = fs.readFileSync(file, "utf8");
        for (const match of content.matchAll(/href="(\{\{[\s\S]*?\}\})"/g)) {
            const expr = match[1];
            const targetsShop = expr.includes("global.shop.base") || expr.includes(".cta.url");
            if (!targetsShop || expr.includes("| shopLink(")) continue;
            // studio.cta.url in events-layout.njk links to /contact.html, not the shop.
            if (name === "events-layout.njk" && expr.includes("studio.cta.url")) continue;
            offenders.push(`${name}: ${expr.trim()}`);
        }
    }
    assert.deepEqual(offenders, []);
});
