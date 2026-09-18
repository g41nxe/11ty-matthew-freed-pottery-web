const fs = require("fs");
const matter = require("gray-matter");

// Which items in the shop sets are sold out, asked from the shop at build
// time: the shop sends no CORS header, so the browser cannot ask it itself.
// The result maps an item's shop link to `true`. A request that fails or
// times out simply leaves the item without a label, so an unreachable shop
// never breaks the build. The label is as fresh as the last build.
async function check(urls, fetchImpl = fetch) {
    const soldOut = {};
    await Promise.all(urls.map(async (url) => {
        const handle = (url.match(/\/products\/([^/?#]+)/) || [])[1];
        if (!handle) return;
        try {
            const res = await fetchImpl(`${new URL(url).origin}/products/${handle}.js`, {
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return;
            const product = await res.json();
            if (product.available === false) soldOut[url] = true;
        } catch {
            // No answer, no label.
        }
    }));
    return soldOut;
}

module.exports = async function () {
    const { shop_sets = [] } = matter(fs.readFileSync("src/views/home.md", "utf8")).data;
    const urls = shop_sets.flatMap((set) => (set.items || []).map((item) => item.cta && item.cta.url).filter(Boolean));
    return check([...new Set(urls)]);
};
module.exports.check = check;
