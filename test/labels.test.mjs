import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// A label a template uses but Settings lacks renders as an empty string,
// silently. And a label missing from the Tina schema cannot be edited in the
// CMS, which is the only place Matthew edits. This keeps templates, data and
// schema in step.
const ROOT = path.join(import.meta.dirname, "..");

function njkFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return njkFiles(full);
        return entry.name.endsWith(".njk") ? [full] : [];
    });
}

const used = new Set(
    njkFiles(path.join(ROOT, "src", "views")).flatMap((file) =>
        [...fs.readFileSync(file, "utf8").matchAll(/global\.labels\.([a-z_]+)/g)].map((m) => m[1])
    )
);

test("every label a template uses has a text in Settings", () => {
    const { labels } = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "views", "_data", "global.json"), "utf8"));
    assert.deepEqual([...used].filter((key) => !labels[key]), []);
});

test("every label a template uses is a field in the CMS", () => {
    const schema = fs.readFileSync(path.join(ROOT, "tina", "collections", "settings.ts"), "utf8");
    const group = schema.slice(schema.indexOf('name: "labels"'));
    const fields = new Set([...group.slice(0, group.indexOf("],")).matchAll(/name: "([a-z_]+)"/g)].map((m) => m[1]));
    assert.deepEqual([...used].filter((key) => !fields.has(key)), []);
});
