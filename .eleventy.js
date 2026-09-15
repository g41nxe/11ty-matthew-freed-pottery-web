const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const { generateHTML } = require("@11ty/eleventy-img");
const pluginSEO = require("eleventy-plugin-seo");
const markdownIt = require("markdown-it");
const md = markdownIt({ html: true }); // html:true is required — process.md's paragraphs include raw <b> tags

module.exports = function (eleventyConfig) {
    eleventyConfig.addWatchTarget("src/javascript/*.js");

    eleventyConfig.addPassthroughCopy({ "src/admin" : "admin"});
    eleventyConfig.addPassthroughCopy({ "src/assets" : "assets"});
    eleventyConfig.addPassthroughCopy({ "src/javascript" : "js"});
    eleventyConfig.addPassthroughCopy({ "src/_redirects" : "_redirects"});
    eleventyConfig.addPassthroughCopy({ "src/netlify.toml" : "netlify.toml"});


    eleventyConfig.addPassthroughCopy({ "src/assets/favicon.ico" : "favicon.ico"});
    eleventyConfig.addPassthroughCopy({ "src/assets/apple-icon-180x180.png" : "apple-touch-icon.png"});
    eleventyConfig.addPassthroughCopy({ "src/assets/apple-icon-180x180.png" : "apple-touch-icon-retina.png"});

    // Serve the original images at /images/ so the Decap CMS editor can render
    // preview thumbnails (it loads the stored /images/... path). Needed in both
    // dev and production builds, since the deployed CMS resolves previews via
    // the public URL too. The live site itself uses the {% img %} shortcode
    // (hashed variants) and never references these originals.
    eleventyConfig.addPassthroughCopy({ "src/images" : "images" });

    eleventyConfig.addPlugin(pluginSEO, require("./src/views/_data/seo.json"));
    eleventyConfig.addPlugin(eleventyNavigationPlugin);

    // Serve a self-destroying worker at the old SW URL so any previously
    // installed service worker unregisters itself (see src/service-worker.js).
    eleventyConfig.addPassthroughCopy({ "src/service-worker.js": "service-worker.js" });


    eleventyConfig.addNunjucksAsyncShortcode("img", async function(src, alt, sizes="", classes="", loading="lazy") {
        if(alt === undefined) {
          throw new Error(`Missing \`alt\` on image from: ${src}`);
        }

        let metadata = await Image('src/' + src, {
          widths: [160, 320, 640, 768, 1024, 1280, 1536, 1920],
          formats: ["avif", "webp", "jpg"],
          urlPath: "/images/",
          outputDir: "./dist/images/",
        });

        return generateHTML(metadata, { alt, sizes, loading, class: classes });
      });

    eleventyConfig.addNunjucksFilter("sortByDate", function (arr, attribute="date") {
        return arr.slice().sort(function(a, b) {
            return DateTime.fromFormat(b[attribute], 'MM-dd-yyyy').toJSDate()
                 - DateTime.fromFormat(a[attribute], 'MM-dd-yyyy').toJSDate();
        });
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
    function lastDay(event) {
        const start = DateTime.fromFormat(event.date, 'MM-dd-yyyy');
        if (!event.end_date) return start;
        const end = DateTime.fromFormat(event.end_date, 'MM-dd-yyyy');
        return end > start ? end : start;
    }
    eleventyConfig.addNunjucksFilter("filterUpcoming", function(array) {
        const today = DateTime.now().startOf('day');
        return array.filter(el => lastDay(el) >= today);
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
    // Every upcoming event oldest-first. Note the direction: sortByDate above
    // sorts newest-first. The home band renders all of them so events.js can
    // refill the grid in the browser when a date has passed since the build.
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
