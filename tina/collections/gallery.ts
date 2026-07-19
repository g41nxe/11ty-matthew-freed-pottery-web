import type { Collection } from "tinacms";

export const gallery: Collection = {
  name: "gallery",
  label: "Gallery Items",
  path: "src/content/gallery",
  format: "md",
  ui: { allowedActions: { create: true, delete: true } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};
