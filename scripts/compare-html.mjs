// Compares the HTML pages of two Eleventy builds. Structured data is
// compared as data with its @graph sorted, because a change may list the
// same events in a different order without changing what they say. Line
// endings are ignored: templates check out as CRLF on Windows, Tina writes
// content with LF.
import fs from "node:fs";
import path from "node:path";

const [beforeDir, afterDir] = process.argv.slice(2);
if (!beforeDir || !afterDir) {
  console.error("usage: node scripts/compare-html.mjs <before-dir> <after-dir>");
  process.exit(2);
}

const pages = (dir) =>
  fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith(".html")).sort();

const normalize = (html) =>
  html.replace(/\r\n/g, "\n").replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (_, json) => {
    const data = JSON.parse(json);
    if (Array.isArray(data["@graph"])) {
      data["@graph"].sort((a, b) => `${a.name}|${a.startDate}`.localeCompare(`${b.name}|${b.startDate}`));
    }
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  });

let differing = 0;
const all = new Set([...pages(beforeDir), ...pages(afterDir)]);
for (const page of all) {
  const a = path.join(beforeDir, page);
  const b = path.join(afterDir, page);
  if (!fs.existsSync(a) || !fs.existsSync(b)) {
    console.log(`FEHLT: ${page} (${fs.existsSync(a) ? "nachher" : "vorher"})`);
    differing++;
    continue;
  }
  const left = normalize(fs.readFileSync(a, "utf8"));
  const right = normalize(fs.readFileSync(b, "utf8"));
  if (left !== right) {
    let i = 0;
    while (left[i] === right[i]) i++;
    console.log(`ABWEICHUNG: ${page}\n  vorher:  ${JSON.stringify(left.slice(Math.max(0, i - 60), i + 80))}\n  nachher: ${JSON.stringify(right.slice(Math.max(0, i - 60), i + 80))}`);
    differing++;
  }
}
if (differing) {
  console.log(`${differing} Seite(n) weichen ab`);
  process.exit(1);
}
console.log(`IDENTISCH (${all.size} Seiten)`);
