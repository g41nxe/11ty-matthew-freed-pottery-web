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
// title would only repeat the heading above it. The name goes wherever it
// stands as a word of its own, not only at the end: "Medium Serving Bowl -
// Yaletown Red" becomes "Medium Serving Bowl - Red" and "Jericho Short Vase"
// becomes "Short Vase". With the name left in, eleven titles ran past their
// two lines on a phone and were cut off. Another glaze's name stays, and so
// does a title that would be empty without the name.
const istWortzeichen = (zeichen) => zeichen !== undefined && /[a-z0-9]/i.test(zeichen);
const ohneGlasur = (titel, glasur) => {
    const text = String(titel == null ? "" : titel);
    const klein = text.toLowerCase();
    const name = String(glasur == null ? "" : glasur).toLowerCase().trim();
    let rest = "";
    let i = 0;
    while (name && i < text.length) {
        const j = klein.indexOf(name, i);
        if (j < 0) break;
        const eigenesWort = !istWortzeichen(text[j - 1]) && !istWortzeichen(text[j + name.length]);
        rest += text.slice(i, eigenesWort ? j : j + name.length);
        i = j + name.length;
    }
    rest += text.slice(i);
    // What the cut leaves behind: double spaces, a dash with nothing before or after it.
    const sauber = rest.replace(/\s+/g, " ").replace(/^[\s\-–/]+|[\s\-–/]+$/g, "");
    return sauber || text.trim();
};

// The shop's image description is used only where it says something the title
// does not. Mostly it repeats the title ("Teardrop Vase - jericho" on the photo
// of the "Teardrop Vase"), and a screen reader then read every piece's name
// twice. An empty description marks the photo as decoration; the name stands
// right below it in the same link.
const kern = (text) => String(text == null ? "" : text).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const eigeneBeschreibung = (beschreibung, titel) => {
    const b = kern(beschreibung);
    const t = kern(titel);
    return b && !(b.startsWith(t) || t.startsWith(b)) ? String(beschreibung).trim() : "";
};

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
            alt: eigeneBeschreibung(bild && bild.alt, produkt.title),
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

// Der Shop antwortet nicht, und es gibt keinen gespeicherten Stand. Auf
// Netlify bricht der Build dann ab, und die Seite bleibt, wie sie ist: Ohne
// Stücke verlöre jede der sechzehn Glasurseiten ihren Knopf und ihren Fotolink
// in den Shop und zeigte "More coming soon" -- sechzehn falsche Seiten sind
// schlechter als ein Deploy, der einen Moment wartet. Am eigenen Rechner baut
// die Seite weiter, damit man auch ohne Netz an ihr arbeiten kann.
function beiAusfall(fehler, umgebung) {
    if (umgebung.NETLIFY) {
        throw new Error(`[shopPieces] Der Shop hat nicht geantwortet und es gibt keinen gespeicherten Stand; der Build bricht ab, damit keine Glasurseiten ohne Stücke online gehen: ${fehler.message}`);
    }
    console.warn(`[shopPieces] Der Shop hat nicht geantwortet, die Glasurseiten zeigen keine Stücke: ${fehler.message}`);
    return {};
}

module.exports = async function () {
    try {
        return gruppiere(await produkte());
    } catch (fehler) {
        return beiAusfall(fehler, process.env);
    }
};
module.exports.beiAusfall = beiAusfall;

module.exports.preis = preis;
module.exports.ohneGlasur = ohneGlasur;
module.exports.gruppiere = gruppiere;
module.exports.tagSchluessel = tagSchluessel;
