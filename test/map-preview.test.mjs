import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { worldPixel, tileWindow, parseCoordinates } from "../scripts/map-preview.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const near = (actual, expected) => Math.abs(actual - expected) < 1e-6;

test("worldPixel puts latitude 0, longitude 0 in the middle of the world map", () => {
    assert.deepEqual(worldPixel(0, 0, 0), { x: 128, y: 128 });
    assert.deepEqual(worldPixel(0, 0, 1), { x: 256, y: 256 });
});

test("worldPixel reaches the corners at the edges of Web Mercator", () => {
    const topLeft = worldPixel(85.0511287798, -180, 2);
    const bottomRight = worldPixel(-85.0511287798, 180, 2);
    assert.ok(near(topLeft.x, 0) && near(topLeft.y, 0), JSON.stringify(topLeft));
    assert.ok(near(bottomRight.x, 1024) && near(bottomRight.y, 1024), JSON.stringify(bottomRight));
});

test("tileWindow finds the tiles around the pin and where the picture starts in them", () => {
    assert.deepEqual(tileWindow({ x: 1000, y: 1000 }, 720, 304, 0.5), {
        x0: 2, y0: 3, x1: 5, y1: 4, offsetX: 128, offsetY: 80,
    });
});

test("parseCoordinates returns numbers when both --lat and --lon are given", () => {
    assert.deepEqual(parseCoordinates(["--lat=49.2799298", "--lon=-123.0863028"]), { lat: 49.2799298, lon: -123.0863028 });
});

test("parseCoordinates returns null when neither is given", () => {
    assert.equal(parseCoordinates([]), null);
});

test("parseCoordinates throws when only one of --lat/--lon is given", () => {
    assert.throws(() => parseCoordinates(["--lat=49.2799298"]));
    assert.throws(() => parseCoordinates(["--lon=-123.0863028"]));
});

test("parseCoordinates throws when a value is not a finite number", () => {
    assert.throws(() => parseCoordinates(["--lat=abc", "--lon=-123.0863028"]));
});

// Matches the whitespace normalisation the contact page template applies
// before comparing the two addresses (ticket 0005, finding F2).
const normalise = (address) => address.replace(/\s+/g, " ").trim();

// Not a code check: a reminder. The contact page hides the picture once the
// address in Settings changes (ignoring whitespace-only edits); this tells
// Dan to make a new one.
test("the map picture was made for the current studio address (else: npm run map:preview)", () => {
    const preview = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "views", "_data", "mapPreview.json"), "utf8"));
    const { contact } = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "views", "_data", "global.json"), "utf8"));
    assert.equal(normalise(preview.address), normalise(contact.address));
    assert.ok(fs.existsSync(path.join(ROOT, "src", "images", "site", "studio-map.png")));
});
