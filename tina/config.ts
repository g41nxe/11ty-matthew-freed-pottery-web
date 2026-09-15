import { defineConfig } from "tinacms";
import { events } from "./collections/events";
import { eventsPage } from "./collections/eventsPage";
import { about } from "./collections/about";

export default defineConfig({
  // Netlify sets HEAD to the branch being built, so a deploy preview edits
  // its own branch and production edits main. HEAD comes first: a stale
  // GITHUB_BRANCH left in the Netlify settings once pointed builds at the
  // wrong branch. Locally, where HEAD is unset, GITHUB_BRANCH picks one.
  branch: process.env.HEAD || process.env.GITHUB_BRANCH || "main",
  // The client ID is public: it ships inside the admin bundle anyway.
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "70c9fe54-ade8-4e7d-b8de-e44bc1d0f0bb",
  // Never commit the token. Netlify provides it; locally `tinacms dev`
  // works without it.
  token: process.env.TINA_TOKEN || null,
  // Decap still owns /admin until the cutover.
  build: { outputFolder: "admin-tina", publicFolder: "dist" },
  media: { tina: { publicFolder: "src", mediaRoot: "images" } },
  schema: { collections: [events, eventsPage, about] },
});
