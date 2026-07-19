import type { Collection } from "tinacms";

export const seo: Collection = {
  name: "seo",
  label: "SEO Settings",
  path: "src/views/_data",
  format: "json",
  match: { include: "seo" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "__placeholder", label: "placeholder" }],
};
