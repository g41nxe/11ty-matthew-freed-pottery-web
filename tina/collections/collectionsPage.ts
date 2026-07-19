import type { Collection } from "tinacms";

export const collectionsPage: Collection = {
  name: "collections_page",
  label: "Collections Page",
  path: "src/views",
  format: "md",
  match: { include: "collections" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};
