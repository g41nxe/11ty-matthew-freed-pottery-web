import { defineConfig } from "tinacms";
import { eventsMarkets } from "./collections/eventsMarkets";
import { eventsPage } from "./collections/eventsPage";
import { homePage } from "./collections/homePage";
import { aboutPage } from "./collections/aboutPage";
import { aboutArtPage } from "./collections/aboutArtPage";
import { aboutProcessPage } from "./collections/aboutProcessPage";
import { collectionsPage } from "./collections/collectionsPage";
import { collectionsGallery } from "./collections/collectionsGallery";
import { retailStoresPage } from "./collections/retailStoresPage";
import { contactPage } from "./collections/contactPage";
import { faqPage } from "./collections/faqPage";
import { privacyStatementPage } from "./collections/privacyStatementPage";
import { settings } from "./collections/settings";

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
  media: {
    tina: { publicFolder: "src", mediaRoot: "images" },
    // Only formats the image pipeline (sharp) can read: an iPhone HEIC
    // photo would break the build.
    accept: ["image/jpeg", "image/png", "image/webp"],
  },
  // Order of the admin sidebar: what Matthew edits most comes first.
  schema: {
    collections: [
      eventsMarkets, eventsPage,
      homePage,
      aboutPage, aboutArtPage, aboutProcessPage,
      collectionsPage, collectionsGallery,
      retailStoresPage, contactPage, faqPage, privacyStatementPage,
      settings,
    ],
  },
});
