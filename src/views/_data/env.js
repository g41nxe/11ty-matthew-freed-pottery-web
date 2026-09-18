// Values that must not live in the repo. Netlify passes its environment
// variables into the build; locally they come from the shell. A missing
// value is an empty string, so templates can simply test for it.
module.exports = {
    googleMapsKey: process.env.GMAPS_API_KEY || "",
    // The commit Netlify builds, published as /build.txt so a script can
    // tell when a deploy with that commit is online (scripts/go-live.mjs).
    commit: process.env.COMMIT_REF || "",
};
