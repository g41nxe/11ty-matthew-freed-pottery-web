import { defineConfig } from "tinacms";
import { collections } from "./collections";

const branch = process.env.GITHUB_BRANCH || "feat/tinacms-migration";

export default defineConfig({
  branch,
  clientId: null,
  token: null,
  contentApiUrlOverride: "/api/tina/gql",
  build: { outputFolder: "admin-tina", publicFolder: "dist" },
  media: { tina: { publicFolder: "src", mediaRoot: "images" } },
  schema: { collections },
});
