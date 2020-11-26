const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const moment = require("moment/moment");
const { minify } = require("terser");
const Image = require("@11ty/eleventy-img");
const pluginPWA = require("eleventy-plugin-pwa");
const pluginSEO = require("eleventy-plugin-seo");

module.exports = function (eleventyConfig) {

    eleventyConfig.addPlugin(pluginSEO, require("./src/views/_data/seo.json"));
    eleventyConfig.addPlugin(pluginPWA);

    eleventyConfig.addNunjucksAsyncShortcode("img", async function(src, alt, sizes="",  classes="", loading="auto", format="jpg") {
        if(alt === undefined) {
          // You bet we throw an error on missing alt (alt="" works okay)
          throw new Error(`Missing \`alt\` on image from: ${src}`);
        }

        src = 'src/' + src
    
        let stats = await Image(src, {
          widths: [160, 320, 640, 768, 1024, 1280, 1536, null],
          formats: [format],
          urlPath: "/images/",
          outputDir: "./dist/images/",
        });

        let lowestSrc = stats[format][0];
    
        const srcset = stats[format].map(entry => `${entry.url} ${entry.width}w`).join(", ")
      
        const source = `<source type="image/${format}" srcset="${srcset}" sizes="${sizes}" />`;
    
        const img = `<img loading="${loading}" class="${classes}" alt="${alt}" src="${lowestSrc.url}" />`;
      
        return `<picture> ${source} ${img} </picture>`;
    });

    eleventyConfig.addPlugin(eleventyNavigationPlugin);

    eleventyConfig.addPassthroughCopy({ "src/manifest.json" : ""});
    eleventyConfig.addPassthroughCopy({ "src/admin" : "admin"});
    eleventyConfig.addPassthroughCopy({ "src/assets" : "assets"});

    eleventyConfig.addNunjucksFilter("nl2br", function(str) {
        return str.replace(/\r|\n|\r\n/g, '<br />')
    });

    eleventyConfig.addNunjucksFilter("sortByDate", function (arr, attribute="date", reverse=false) {
        return arr.sort(function(a, b) {
            return moment(b[attribute], 'MM-DD-YYYY').toDate() - moment(a[attribute], 'MM-DD-YYYY').toDate();
        })
    })

    eleventyConfig.addNunjucksFilter("date", function (date, format) {
        return moment(date, 'MM-DD-YYYY').format(format);
    });

    eleventyConfig.addNunjucksFilter("getFutureOrPast", function (date) {
        date  = moment(date, 'MM-DD-YYYY');
        today = moment();
        
        if (date.isAfter(today)) 
            return 'past';
        else   
            return 'future';
    });

    eleventyConfig.addNunjucksAsyncFilter("jsmin", async function (
        code,
        callback
        ) {
        try {
            const minified = await minify(code);
            callback(null, minified.code);
        } catch (err) {
            console.error("Terser error: ", err);
            // Fail gracefully.
            callback(null, code);
        }
    });

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