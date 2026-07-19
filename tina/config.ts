import { defineConfig } from "tinacms";
import { UsernamePasswordAuthJSProvider } from "tinacms-authjs/dist/tinacms";
import { collections } from "./collections";

const branch = process.env.GITHUB_BRANCH || "feat/tinacms-migration";

export default defineConfig({
  branch,
  clientId: null,
  token: null,
  contentApiUrlOverride: "/api/tina/gql",
  // Without this, the admin client defaults to a popup-based OAuth flow
  // (TinaCloud-style) instead of the username/password form our Auth.js
  // credentials backend (netlify/functions/tina.ts) actually expects.
  authProvider: new UsernamePasswordAuthJSProvider(),
  build: { outputFolder: "admin-tina", publicFolder: "dist" },
  media: { tina: { publicFolder: "src", mediaRoot: "images" } },
  schema: { collections },
});
