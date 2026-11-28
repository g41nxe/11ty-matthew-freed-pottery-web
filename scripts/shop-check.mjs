// Checks every shop item on the home page against the live shop, checks that
// every glaze finds its pieces there, and writes
// an overview page: the site's photo next to the shop's, both titles, both
// prices, availability and the link. Run it shortly before a release, since
// prices and stock change in the shop, not in the CMS.
//
//   node scripts/shop-check.mjs                 writes reports/shop-check.html
//   node scripts/shop-check.mjs --out <file>    writes somewhere else
//   node scripts/shop-check.mjs --strict        exits 1 on a price difference
//                                               or an unreachable product
//
// Sold-out items are reported but never fail the check: the site labels
// them on its own (see src/views/_data/soldOut.js).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
// Dieselbe Umrechnung, die der Build benutzt: Aus dem Tag "Squamish Nights"
// und aus dem Slug "squamish-nights" wird derselbe Schlüssel.
const { tagSchluessel } = require("../src/views/_data/shopPieces.js");

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const outArg = args.indexOf("--out");
const OUT = outArg >= 0 ? args[outArg + 1] : "reports/shop-check.html";
const THUMB = 240;

const escape = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// "$165" -> 16500, the unit Shopify's product JSON uses.
const cents = (price) => {
    const m = String(price ?? "").replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
    return m ? Math.round(parseFloat(m[1]) * 100) : null;
};
const dollars = (c) => (c == null ? "–" : `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`);

async function fetchWithTimeout(url, ms = 10000) {
    return fetch(url, { signal: AbortSignal.timeout(ms), headers: { "user-agent": "matthewfreed.ca shop-check" } });
}

async function thumbFromBuffer(buffer) {
    const out = await sharp(buffer).resize({ width: THUMB }).jpeg({ quality: 72 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
}

async function siteThumb(url) {
    try {
        return await thumbFromBuffer(fs.readFileSync(path.join("src", url)));
    } catch {
        return null;
    }
}

async function shopThumb(src) {
    if (!src) return null;
    try {
        const url = new URL(src.startsWith("//") ? `https:${src}` : src);
        url.searchParams.set("width", String(THUMB * 2));
        const res = await fetchWithTimeout(url);
        if (!res.ok) return null;
        return await thumbFromBuffer(Buffer.from(await res.arrayBuffer()));
    } catch {
        return null;
    }
}

async function checkItem(item) {
    const url = item.cta?.url || "";
    const handle = (url.match(/\/products\/([^/?#]+)/) || [])[1];
    const row = {
        title: item.title,
        url,
        sitePrice: cents(item.price),
        siteImage: await siteThumb(item.image?.url),
    };
    if (!handle) return { ...row, status: "no-product" };
    let product;
    try {
        const res = await fetchWithTimeout(`${new URL(url).origin}/products/${handle}.js`);
        if (!res.ok) return { ...row, status: "unreachable", detail: `HTTP ${res.status}` };
        product = await res.json();
    } catch (err) {
        return { ...row, status: "unreachable", detail: err.name === "TimeoutError" ? "timeout" : err.message };
    }
    const min = product.price_min ?? product.price;
    const max = product.price_max ?? product.price;
    const priceOk = row.sitePrice != null && row.sitePrice >= min && row.sitePrice <= max;
    return {
        ...row,
        shopTitle: product.title,
        shopPrice: min === max ? dollars(min) : `${dollars(min)}–${dollars(max)}`,
        shopImage: await shopThumb(product.featured_image),
        available: product.available,
        status: !priceOk ? "price" : product.available === false ? "sold-out" : "ok",
    };
}

async function linkStatus(url) {
    if (!url) return null;
    try {
        const res = await fetchWithTimeout(url);
        return res.status;
    } catch {
        return "unreachable";
    }
}

const STATUS = {
    ok: ["OK", "ok"],
    "sold-out": ["Sold out", "warn"],
    price: ["Price differs", "bad"],
    unreachable: ["Not found in the shop", "bad"],
    "no-product": ["Link is not a product", "bad"],
};

function glazeSection(glasuren) {
    const zeile = (g) => `<tr class="${g.status}">
    <td>${escape(g.name)}</td>
    <td><code>${escape(g.slug || "–")}</code></td>
    <td>${g.tag ? escape(g.tag) : "<b>no tag in the shop</b>"}</td>
    <td>${g.anzahl}</td>
    <td>${g.verfuegbar}</td>
  </tr>`;
    return `<section>
  <h2>Glazes against the shop's tags</h2>
  <table class="glazes">
    <thead><tr><th>Glaze</th><th>Slug in the CMS</th><th>Tag in the shop</th><th>Pieces</th><th>Available</th></tr></thead>
    <tbody>${glasuren.map(zeile).join("\n")}</tbody>
  </table>
</section>`;
}

function render(sets, glasuren, checkedAt) {
    const items = sets.flatMap((s) => s.items);
    const count = (st) => items.filter((i) => i.status === st).length;
    const summary = [
        ["Items", items.length, ""],
        ["OK", count("ok"), "ok"],
        ["Sold out", count("sold-out"), "warn"],
        ["Price differs", count("price"), "bad"],
        ["Not found", count("unreachable") + count("no-product"), "bad"],
        ["Glazes without pieces", glasuren.filter((g) => g.status === "bad").length, "bad"],
    ];
    const card = (i) => {
        const [label, tone] = STATUS[i.status];
        const img = (src, alt) =>
            src ? `<img src="${src}" alt="${escape(alt)}" width="${THUMB}" loading="lazy">` : `<div class="noimg">no image</div>`;
        return `<article class="card ${tone}">
  <div class="imgs">
    <figure>${img(i.siteImage, `Site: ${i.title}`)}<figcaption>Site</figcaption></figure>
    <figure>${img(i.shopImage, `Shop: ${i.shopTitle || ""}`)}<figcaption>Shop</figcaption></figure>
  </div>
  <p class="badge ${tone}">${label}${i.detail ? ` · ${escape(i.detail)}` : ""}</p>
  <dl>
    <dt>Site</dt><dd>${escape(i.title)}</dd>
    <dt>Shop</dt><dd>${escape(i.shopTitle || "–")}</dd>
    <dt>Price</dt><dd><b>${dollars(i.sitePrice)}</b> on the site · <b>${escape(i.shopPrice || "–")}</b> in the shop</dd>
  </dl>
  <a href="${escape(i.url)}" target="_blank" rel="noopener">${escape(i.url.replace(/^https?:\/\//, ""))}</a>
</article>`;
    };
    const section = (s) => `<section>
  <header>
    <h2>${escape(s.name)}${s.hide ? ' <span class="hidden-tag">hidden</span>' : ""}</h2>
    ${s.featuredUrl ? `<p class="feat">Featured link: <a href="${escape(s.featuredUrl)}" target="_blank" rel="noopener">${escape(s.featuredUrl.replace(/^https?:\/\//, ""))}</a> <span class="${s.featuredStatus === 200 ? "ok" : "bad"}">${escape(s.featuredStatus)}</span></p>` : ""}
  </header>
  <div class="grid">${s.items.map(card).join("\n")}</div>
</section>`;

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shop check</title>
<style>
  :root { --ground:#F8F5EE; --surface:#fff; --ink:#2A2822; --muted:#6E6957; --line:#E6DFD0; --blue:#1F3A52;
          --ok:#2F6B3A; --ok-bg:#E3F0E2; --warn:#7A5A12; --warn-bg:#F6EBCF; --bad:#9B2C22; --bad-bg:#F7DEDA; }
  @media (prefers-color-scheme: dark) {
    :root { --ground:#1A1916; --surface:#23211D; --ink:#EDE8DB; --muted:#A9A18C; --line:#36322B; --blue:#9DBBD6;
            --ok:#9FD3A6; --ok-bg:#1F3324; --warn:#E3C579; --warn-bg:#3A301A; --bad:#F0A197; --bad-bg:#3D211D; }
  }
  body { margin:0; background:var(--ground); color:var(--ink); font:15px/1.5 system-ui, sans-serif; }
  main { max-width:1200px; margin:0 auto; padding:32px 16px 64px; display:grid; gap:36px; }
  h1, h2 { margin:0; color:var(--blue); }
  .meta { color:var(--muted); margin:4px 0 0; }
  .summary { display:flex; flex-wrap:wrap; gap:8px; margin:0; padding:0; list-style:none; }
  .summary li { background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:8px 14px; }
  .summary b { font-size:1.2rem; margin-right:4px; }
  section { display:grid; gap:14px; }
  .feat { margin:2px 0 0; color:var(--muted); font-size:.9rem; overflow-wrap:anywhere; }
  .hidden-tag { font-size:.8rem; font-weight:600; color:var(--muted); border:1px solid var(--line); border-radius:4px; padding:1px 6px; vertical-align:middle; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px; }
  .card { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:12px; display:grid; gap:8px; align-content:start; }
  .card.bad { border-color:var(--bad); }
  .imgs { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  figure { margin:0; }
  figure img, .noimg { width:100%; aspect-ratio:4/3; object-fit:contain; background:#fff; border-radius:6px; display:block; }
  .noimg { display:grid; place-items:center; color:#999; font-size:.8rem; }
  figcaption { font-size:.75rem; color:var(--muted); text-align:center; }
  .badge { margin:0; justify-self:start; font-weight:700; font-size:.8rem; border-radius:4px; padding:2px 8px; }
  .badge.ok, .ok { color:var(--ok); } .badge.ok { background:var(--ok-bg); }
  .badge.warn { color:var(--warn); background:var(--warn-bg); }
  .badge.bad, .bad { color:var(--bad); } .badge.bad { background:var(--bad-bg); }
  dl { margin:0; display:grid; grid-template-columns:auto 1fr; gap:2px 10px; font-size:.9rem; }
  dt { color:var(--muted); } dd { margin:0; }
  a { color:var(--blue); overflow-wrap:anywhere; font-size:.85rem; }
  table.glazes { border-collapse:collapse; width:100%; font-size:.9rem; }
  table.glazes th { text-align:left; color:var(--muted); font-weight:600; }
  table.glazes th, table.glazes td { border-bottom:1px solid var(--line); padding:4px 10px 4px 0; }
  table.glazes tr.bad td { color:var(--bad); } table.glazes tr.warn td { color:var(--warn); }
</style>
</head>
<body>
<main>
  <header>
    <h1>Shop check</h1>
    <p class="meta">Home page shop sets against shop.matthewfreed.net · ${escape(checkedAt)}</p>
  </header>
  <ul class="summary">${summary.map(([l, n, t]) => `<li class="${t}"><b>${n}</b>${l}</li>`).join("")}</ul>
  ${glazeSection(glasuren)}
  ${sets.map(section).join("\n")}
</main>
</body>
</html>
`;
}

// Jede Glasur findet ihre Stücke über genau einen Wert: den Slug neben ihr
// im CMS. Trifft er kein Tag, steht die Seite ohne Kacheln da, und ihr
// Shop-Link zeigt auf eine Sammlung, die es nicht gibt. Beides sieht man der
// Seite nicht an, solange man sie nicht aufruft.
const SHOP = "https://shop.matthewfreed.net";

async function tagsAusDemShop() {
    const nachSchluessel = {};
    for (let seite = 1; seite <= 4; seite++) {
        const res = await fetchWithTimeout(`${SHOP}/collections/all/products.json?limit=250&page=${seite}`, 15000);
        if (!res.ok) break;
        const daten = await res.json();
        if (!daten.products || !daten.products.length) break;
        for (const produkt of daten.products) {
            const zuHaben = (produkt.variants || []).some((v) => v.available);
            for (const tag of produkt.tags || []) {
                const schluessel = tagSchluessel(tag);
                const eintrag = (nachSchluessel[schluessel] ||= { tag, anzahl: 0, verfuegbar: 0 });
                eintrag.anzahl++;
                if (zuHaben) eintrag.verfuegbar++;
            }
        }
    }
    return nachSchluessel;
}

const tagsImShop = await tagsAusDemShop();
const { items: galerie } = JSON.parse(fs.readFileSync("src/views/_data/gallery.json", "utf8"));
const glasuren = galerie.map((eintrag) => {
    const name = eintrag.title.replace(" Collection", "");
    const slug = eintrag.slug || "";
    const treffer = tagsImShop[tagSchluessel(slug)];
    return {
        name,
        slug,
        tag: treffer ? treffer.tag : null,
        anzahl: treffer ? treffer.anzahl : 0,
        verfuegbar: treffer ? treffer.verfuegbar : 0,
        // Ohne Slug und ohne Treffer ist die Seite leer; vier Stücke füllen
        // ihre Kacheln, darunter springen die Märkte ein (nicht kaputt,
        // aber einen Blick wert, bevor es live geht).
        status: !slug || !treffer ? "bad" : treffer.anzahl < 4 ? "warn" : "ok",
    };
});

const { sets: shop_sets } = JSON.parse(fs.readFileSync("src/views/_data/shop_sets.json", "utf8"));
const sets = await Promise.all(
    shop_sets.map(async (set) => ({
        name: set.name,
        hide: Boolean(set.hide),
        featuredUrl: set.featured_piece?.cta?.url,
        featuredStatus: await linkStatus(set.featured_piece?.cta?.url),
        items: await Promise.all((set.items || []).map(checkItem)),
    }))
);

const checkedAt = new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, render(sets, glasuren, checkedAt));

console.log("\nGlazes against the shop's tags");
for (const g of glasuren) {
    const marke = g.status === "bad" ? "NO TAG" : g.status === "warn" ? "few" : "ok";
    console.log(`  ${marke.padEnd(7)} ${String(g.anzahl).padStart(3)} pieces (${g.verfuegbar} available)  ${g.name} -> ${g.slug || "–"}`);
}

for (const set of sets) {
    console.log(`\n${set.name}${set.hide ? " (hidden)" : ""}  featured link: ${set.featuredStatus ?? "–"}`);
    for (const i of set.items) {
        const [label] = STATUS[i.status];
        console.log(`  ${label.padEnd(22)} ${dollars(i.sitePrice).padStart(5)} / ${(i.shopPrice || "–").padEnd(10)} ${i.title}`);
    }
}
const items = sets.flatMap((s) => s.items);
const problems = items.filter((i) => ["price", "unreachable", "no-product"].includes(i.status));
const badLinks = sets.filter((s) => s.featuredUrl && s.featuredStatus !== 200);
const ohneTag = glasuren.filter((g) => g.status === "bad");
console.log(`\n${items.length} items, ${problems.length} problem(s), ${items.filter((i) => i.status === "sold-out").length} sold out, ${badLinks.length} featured link(s) not OK`);
console.log(`${glasuren.length} glazes, ${ohneTag.length} without a tag in the shop`);
console.log(`Report: ${path.resolve(OUT)}`);
if (strict && (problems.length || badLinks.length || ohneTag.length)) process.exit(1);
