import type { Collection } from "tinacms";

export const privacy: Collection = {
  name: "privacy",
  label: "Privacy Statement",
  path: "src/views",
  format: "md",
  match: { include: "privacy-statement" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "__placeholder", label: "placeholder" }],
};
