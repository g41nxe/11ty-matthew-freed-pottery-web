import type { Collection } from "tinacms";

export const news: Collection = {
  name: "news",
  label: "News",
  path: "src/content/news",
  format: "md",
  ui: { allowedActions: { create: true, delete: true } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};
