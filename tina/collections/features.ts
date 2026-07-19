import type { Collection } from "tinacms";

export const features: Collection = {
  name: "features",
  label: "Featured Items",
  path: "src/content/features",
  format: "md",
  ui: { allowedActions: { create: true, delete: true } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};
