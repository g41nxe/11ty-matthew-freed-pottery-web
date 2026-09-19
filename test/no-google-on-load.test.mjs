import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Guards "opening a page sends nothing to Google" (ticket 0005): the fonts
// ship with the site, and Google Maps is a link, not an embed. reCAPTCHA is
// the accepted exception; Netlify injects it into the contact form at
// deploy time, so it never appears in these files.
const ROOT = path.join(import.meta.dirname, "..");
const VIEWS = path.join(ROOT, "src", "views");
const STYLES = path.join(ROOT, "src", "styles");
const JS = path.join(ROOT, "src", "javascript");

function files(dir, ext) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return files(full, ext);
        return entry.name.endsWith(ext) ? [full] : [];
    });
}

// Includes src/views/_data/*.json (CMS content such as event descriptions,
// rendered through markdownify with raw HTML allowed) and the site scripts
// in src/javascript/*.js, alongside the templates and stylesheets.
const sources = () => [
    ...files(VIEWS, ".njk"),
    ...files(VIEWS, ".md"),
    ...files(VIEWS, ".json"),
    ...files(STYLES, ".css"),
    ...files(JS, ".js"),
];
const offendersOf = (pattern) =>
    sources()
        .filter((file) => pattern.test(fs.readFileSync(file, "utf8")))
        .map((file) => path.relative(ROOT, file));

test("no template or stylesheet loads Google Fonts", () => {
    assert.deepEqual(offendersOf(/fonts\.(googleapis|gstatic)\.com/), []);
});

test("every font the stylesheet declares ships with the site, next to its licence", () => {
    const css = fs.readFileSync(path.join(STYLES, "main.css"), "utf8");
    const urls = [...css.matchAll(/@font-face\s*\{[^}]*?url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
    assert.ok(urls.length >= 2, "expected @font-face rules for Fraunces and Karla");
    for (const url of urls) {
        assert.match(url, /^\/assets\/fonts\//);
        assert.ok(fs.existsSync(path.join(ROOT, "src", url)), `${url} is missing`);
    }
    for (const licence of ["OFL-Fraunces.txt", "OFL-Karla.txt"]) {
        assert.ok(fs.existsSync(path.join(ROOT, "src", "assets", "fonts", licence)), `${licence} is missing`);
    }
});

test("no page embeds Google Maps; the contact page links to it instead", () => {
    assert.deepEqual(offendersOf(/google\.com\/maps\/embed|maps\.googleapis\.com/), []);
});
