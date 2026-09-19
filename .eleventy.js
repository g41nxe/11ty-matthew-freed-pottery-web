const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const { generateHTML } = require("@11ty/eleventy-img");
const pluginSEO = require("eleventy-plugin-seo");
const markdownIt = require("markdown-it");
const md = markdownIt({ html: true }); // html:true is required — process.md's paragraphs include raw <b> tags

const FALLBACK_ALT = "Handmade pottery by Matthew Freed";

// 16 -> "sixteen", as the site's copy writes numbers. Above 99 it keeps digits.
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function numberWord(n) {
    if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
    if (n < 20) return ONES[n];
    return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
}

module.exports = function (eleventyConfig) {
    eleventyConfig.addWatchTarget("src/javascript/*.js");

    eleventyConfig.addPassthroughCopy({ "src/assets" : "assets"});
    eleventyConfig.addPassthroughCopy({ "src/javascript" : "js"});
    eleventyConfig.addPassthroughCopy({ "src/_redirects" : "_redirects"});


    eleventyConfig.addPassthroughCopy({ "src/assets/favicon.ico" : "favicon.ico"});
    eleventyConfig.addPassthroughCopy({ "src/assets/apple-icon-180x180.png" : "apple-touch-icon.png"});
    eleventyConfig.addPassthroughCopy({ "src/assets/apple-icon-180x180.png" : "apple-touch-icon-retina.png"});

    // Serve the original images at /images/. The pages use the {% img %}
    // shortcode (hashed variants); the originals are for what needs a fixed
    // address, such as the share image (/images/share/, set in Settings).
    eleventyConfig.addPassthroughCopy({ "src/images" : "images" });

    eleventyConfig.addPlugin(pluginSEO, require("./src/views/_data/global.json").seo);
    eleventyConfig.addPlugin(eleventyNavigationPlugin);

    // Serve a self-destroying worker at the old SW URL so any previously
    // installed service worker unregisters itself (see src/service-worker.js).
    eleventyConfig.addPassthroughCopy({ "src/service-worker.js": "service-worker.js" });


    // Content comes from the CMS, so a missing image or alt text must not stop
    // the deploy: one incomplete entry would block every later change. The
    // image is left out or gets a generic description, and the build log
    // names the page so it can be fixed.
    eleventyConfig.addNunjucksAsyncShortcode("img", async function(src, alt, sizes="", classes="", loading="lazy") {
        const page = this.page?.inputPath || "unknown page";
        if (typeof src !== "string" || !src.trim()) {
          console.warn(`[img] Image without a file on ${page}, left out`);
          return "";
        }
        if (typeof alt !== "string" || !alt.trim()) {
          console.warn(`[img] No alt text for ${src} on ${page}, using "${FALLBACK_ALT}"`);
          alt = FALLBACK_ALT;
        }

        let metadata = await Image('src/' + src, {
          widths: [160, 320, 640, 768, 1024, 1280, 1536, 1920],
          formats: ["avif", "webp", "jpg"],
          urlPath: "/images/",
          outputDir: "./dist/images/",
        });

        return generateHTML(metadata, { alt, sizes, loading, class: classes });
      });

    // An optional CMS date field left empty arrives as "" or undefined.
    // Luxon throws on undefined, which would fail the whole build, so an
    // empty date renders as an empty string instead.
    eleventyConfig.addNunjucksFilter("date", function (date, format) {
        if (!date) return "";
        return DateTime.fromFormat(date, 'MM-dd-yyyy').toFormat(format);
    });
    // "Upcoming", not "future": an event stays in this list until the end of
    // its last day, so a multi-day show is still listed while it is running
    // and a market still shows on the morning it happens. Comparing against
    // the start of today rather than the current instant is what keeps
    // today's date in. `lastDay` guards against an end_date that predates
    // the start.
    // An entry without a readable date is left out rather than failing the
    // build: Luxon throws on a missing date, and one bad entry would stop
    // every deploy until someone fixed the file (seen 2026-09-18, when the
    // CMS saved two events without a date).
    function lastDay(event) {
        if (typeof event.date !== 'string') return null;
        const start = DateTime.fromFormat(event.date, 'MM-dd-yyyy');
        if (!start.isValid) return null;
        if (typeof event.end_date !== 'string' || !event.end_date) return start;
        const end = DateTime.fromFormat(event.end_date, 'MM-dd-yyyy');
        return end.isValid && end > start ? end : start;
    }
    eleventyConfig.addNunjucksFilter("filterUpcoming", function(array) {
        const today = DateTime.now().startOf('day');
        return array.filter(el => {
            const last = lastDay(el);
            return last !== null && last >= today;
        });
    });
    // One entry per day something is on: every date of every market, then
    // every event, shaped like the flat list the templates were written
    // for. Market dates carry a `market` key so the schedule groups them
    // without comparing names.
    eleventyConfig.addNunjucksFilter("occurrences", function (data) {
        const markets = (data.markets || []).flatMap((market, index) => {
            const { dates, ...details } = market;
            return (dates || [])
                .filter(Boolean)
                .map(date => ({ ...details, date, market: `market-${index}` }));
        });
        return markets.concat(data.events || []);
    });
    // Special events: everything that is not a market date, soonest first.
    // These get the large date-block treatment on the events page.
    eleventyConfig.addNunjucksFilter("specialEvents", function(array) {
        return array
            .filter(e => !e.market)
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'));
    });
    // Upcoming market dates grouped by market, soonest market first. The
    // dates are sorted before grouping, so `first` is each market's next
    // date: the object the template compares with the soonest event.
    eleventyConfig.addNunjucksFilter("marketSchedule", function(array) {
        const groups = new Map();
        array
            .filter(e => e.market)
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'))
            .forEach(e => {
                if (!groups.has(e.market)) groups.set(e.market, { name: e.name, first: e, dates: [] });
                groups.get(e.market).dates.push(e.date);
            });
        return Array.from(groups.values());
    });
    // Every upcoming event oldest-first. The home band renders all of them so
    // events.js can refill the grid in the browser when a date has passed
    // since the build.
    eleventyConfig.addNunjucksFilter("byDateAsc", function(array) {
        return array.slice()
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'));
    });
    // One entry per event name (its next occurrence), soonest first.
    // Used by the homepage events band to avoid listing the same market twice.
    eleventyConfig.addNunjucksFilter("nextUp", function(array) {
        const seen = new Set();
        return array.slice()
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'))
            .filter(e => {
                const key = e.name.trim();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    });
    eleventyConfig.addNunjucksFilter("markdownify", (s) => (s ? md.render(s) : ""));
    // Outgoing shop links get their origin tag at build time, so the CMS
    // keeps clean URLs and nobody types parameters by hand. Shopify only
    // counts a visit as marketing when utm_campaign is present. utm_content
    // names the spot on the page, not the piece: Shopify knows the piece from
    // the landing page, and a spot keeps its name when a piece is renamed.
    const placementSlug = (value) =>
        String(value == null ? "" : value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60);
    eleventyConfig.addNunjucksFilter("placementSlug", placementSlug);
    eleventyConfig.addNunjucksFilter("shopLink", function (url, placement) {
        if (!url) return url;
        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            return url;
        }
        // Only hosts starting with "shop.": the site's own domain stays untouched.
        if (!parsed.hostname.startsWith("shop.")) return url;
        parsed.searchParams.set("utm_source", "matthewfreed.ca");
        parsed.searchParams.set("utm_medium", "referral");
        parsed.searchParams.set("utm_campaign", "website");
        const content = placementSlug(placement);
        if (content) parsed.searchParams.set("utm_content", content);
        return parsed.toString();
    });
    // CMS texts write {glazes} (or {Glazes} to start a sentence) instead of
    // a number, so "fifteen glazes" stays right when a glaze line is added
    // to or removed from the gallery.
    eleventyConfig.addNunjucksFilter("glazeCount", (text, count) => {
        if (typeof text !== "string" || !text.includes("{")) return text;
        const word = numberWord(count);
        return text
            .replace(/\{glazes\}/g, word)
            .replace(/\{Glazes\}/g, word.charAt(0).toUpperCase() + word.slice(1));
    });

    return {
        dir: {
            input: "src/views",
            output: "dist",
            includes: "_includes/partials",
            layouts: "_includes/layouts"
        },
        templateFormats: ["md", "njk"],
        markdownTemplateEngine: "njk"
    };
};
