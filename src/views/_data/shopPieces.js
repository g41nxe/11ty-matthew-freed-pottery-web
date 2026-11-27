// The pieces of each glaze, asked from the shop while the site is built.
//
// Why not from the CMS: the sets there were written once and were stale two
// months later -- fifteen of twenty tiles sold out while the shop held
// fifty-seven pieces nobody could see (ADR 0006). Shopify knows what exists,
// so Shopify is asked.
//
// A glaze finds its pieces by the tag on the product, and nothing else. The
// tag is the one place where a piece says which glaze it belongs to; where
// that is wrong, it gets fixed in the shop, not worked around here
// (docs/feature/0006-shop-tags-aufraeumen.md).
//
// The answer is cached on disk: within the hour the build does not ask again,
// and if the shop is unreachable the last good answer is used instead. Netlify
// keeps that cache between deploys (plugins/bildcache), so an outage at
// Shopify costs a stale price, not an empty page.
const Fetch = require("@11ty/eleventy-fetch");

const SHOP = "https://shop.matthewfreed.net";
// 200 products today, and the shop sends at most 250 per page.
const SEITEN = 4;

// A tag and a shop collection slug are the same name in two spellings:
// Shopify tags a piece "Squamish Nights" and serves its collection at
// /squamish-nights. Both become the same key here, so a glaze finds its
// pieces whether the CMS holds one spelling or the other.
const tagSchluessel = (wert) =>
    String(wert == null ? "" : wert)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

// "165.00" from Shopify, "$165" on the page -- the same way Matthew writes a
// price into the CMS. Half dollars stay ("$12.50"), whole ones lose the zeros.
const preis = (wert) => {
    const zahl = Number(wert);
    if (!Number.isFinite(zahl)) return "";
    return "$" + (Number.isInteger(zahl) ? String(zahl) : zahl.toFixed(2));
};

// "Medium Teapot - Jericho" is a teapot on the Jericho page; the glaze in the
// title would only repeat the heading above it.
const ohneGlasur = (titel, glasur) =>
    titel.replace(new RegExp("\\s*[-–]\\s*" + glasur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "i"), "").trim();

async function produkte() {
    const alle = [];
    for (let seite = 1; seite <= SEITEN; seite++) {
        const antwort = await Fetch(`${SHOP}/collections/all/products.json?limit=250&page=${seite}`, {
            duration: "1h",
            type: "json",
            fetchOptions: { signal: AbortSignal.timeout(15000) },
        });
        const gefunden = (antwort && antwort.products) || [];
        if (!gefunden.length) break;
        alle.push(...gefunden);
    }
    return alle;
}

// Separated from the request so it can be tested without a shop: everything
// below works on a list of products, wherever it came from.
function gruppiere(alle) {
    const nachTag = {};
    for (const produkt of alle) {
        const bild = (produkt.images || [])[0];
        const variante = (produkt.variants || [])[0] || {};
        const stueck = {
            title: produkt.title,
            handle: produkt.handle,
            url: `${SHOP}/products/${produkt.handle}`,
            price: preis(variante.price),
            image: bild ? bild.src : null,
            alt: (bild && bild.alt) || produkt.title,
            available: (produkt.variants || []).some((v) => v.available),
            published: produkt.published_at || "",
        };
        for (const tag of produkt.tags || []) {
            (nachTag[tagSchluessel(tag)] ||= []).push(stueck);
        }
    }

    // Available first, then whatever went into the shop last. The shop's own
    // order is alphabetical, which says nothing, and the publication date is
    // when a shape was first listed, not when it was last fired -- so being
    // buyable is the only signal that a piece is current.
    for (const liste of Object.values(nachTag)) {
        liste.sort((a, b) => Number(b.available) - Number(a.available) || b.published.localeCompare(a.published));
    }

    return nachTag;
}

module.exports = async function () {
    try {
        return gruppiere(await produkte());
    } catch (fehler) {
        // No answer and nothing cached: the pages show their group photo and
        // the link into the shop, and the next build fills the tiles again.
        console.warn(`[shopPieces] Der Shop hat nicht geantwortet, die Glasurseiten zeigen keine Stücke: ${fehler.message}`);
        return {};
    }
};

module.exports.preis = preis;
module.exports.ohneGlasur = ohneGlasur;
module.exports.gruppiere = gruppiere;
module.exports.tagSchluessel = tagSchluessel;
