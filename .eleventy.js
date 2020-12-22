const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const moment = require("moment/moment");
const Image = require("@11ty/eleventy-img");
const pluginPWA = require("eleventy-plugin-pwa");
const pluginSEO = require("eleventy-plugin-seo");

module.exports = function (eleventyConfig) {
    eleventyConfig.addWatchTarget("src/javascript/*.js");

    eleventyConfig.addPassthroughCopy({ "src/admin" : "admin"});
    eleventyConfig.addPassthroughCopy({ "src/assets" : "assets"});
    eleventyConfig.addPassthroughCopy({ "src/javascript" : "js"});
    eleventyConfig.addPassthroughCopy({ "src/_redirects" : "_redirects"});

    eleventyConfig.addPassthroughCopy({ "src/assets/favicon.ico" : "favicon.ico"});
    eleventyConfig.addPassthroughCopy({ "src/assets/apple-icon-180x180.png" : "apple-touch-icon.png"});

    eleventyConfig.addPlugin(pluginSEO, require("./src/views/_data/seo.json"));
    eleventyConfig.addPlugin(pluginPWA);
    eleventyConfig.addPlugin(eleventyNavigationPlugin);


    eleventyConfig.addNunjucksAsyncShortcode("img", async function(src, alt, sizes="",  classes="", loading="auto") {
        if(alt === undefined) {
          // You bet we throw an error on missing alt (alt="" works okay)
          throw new Error(`Missing \`alt\` on image from: ${src}`);
        }

        src = 'src/' + src

        let formats = ["webp", "jpg"];
        let stats = await Image(src, {
          widths: [160, 320, 640, 768, 1024, 1280, 1536, 1920],
          formats: formats,
          urlPath: "/images/",
          outputDir: "./dist/images/",
        });

        let lowestSrc = stats[formats[0]][0];

        // Iterate over formats and widths
        return `<picture>
            ${Object.values(stats).map(imageFormat => {
                return `<source type="image/${imageFormat[0].format}" srcset="${imageFormat.map(entry => `${entry.url} ${entry.width}w`).join(", ")}" sizes="${sizes}">`;
            }).join("\n")}
            <img loading="${loading}" class="${classes}" src="${lowestSrc.url}" alt="${alt}"/>
            </picture>`;
      });

    eleventyConfig.addNunjucksFilter("sortByDate", function (arr, attribute="date", reverse=false) {
        return arr.sort(function(a, b) {
            return moment(b[attribute], 'MM-DD-YYYY').toDate() - moment(a[attribute], 'MM-DD-YYYY').toDate();
        })
    });
    eleventyConfig.addNunjucksFilter("hashtagURL", function (hashtag) {
        return `https://www.instagram.com/explore/tags/${hashtag}/`;
    });
    eleventyConfig.addNunjucksFilter("date", function (date, format) {
        return moment(date, 'MM-DD-YYYY').format(format);
    });
    eleventyConfig.addNunjucksFilter("removeFirst", function (array) {
        return array.slice(1,array.length);
    });
    eleventyConfig.addNunjucksFilter("filterFuture", function(array) {
        return array.filter(el => {
            date  = moment(el.date, 'MM-DD-YYYY');
            return date.isAfter(moment());
        })
    });
    eleventyConfig.addNunjucksFilter("filterPast", function(array) {
        return array.filter(el => {
            date  = moment(el.date, 'MM-DD-YYYY');
            return !date.isAfter(moment());
        })
    });
    eleventyConfig.addNunjucksFilter("filterFeatured", function(array) {
        return array.filter(el => {
            return el.featured
        })
    })
    eleventyConfig.addNunjucksFilter("uuid", function() {
        return uuidv4();
    })

    return {
        dir: {
            input: "src/views",
            output: "dist",
            includes: "_includes/partials",
            layouts: "_includes/layouts"
        },
        templateFormats: ["md", "njk"],
        markdownTemplateEngine: "njk",
        passthroughFileCopy: true
    };
};

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }