import type { Collection } from "tinacms";

export const contact: Collection = {
  name: "contact",
  label: "Contact",
  path: "src/views",
  format: "md",
  match: { include: "contact" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "__placeholder", label: "placeholder" }],
};
