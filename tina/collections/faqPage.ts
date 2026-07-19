import type { Collection } from "tinacms";

export const faqPage: Collection = {
  name: "faq_page",
  label: "FAQ Page",
  path: "src/views",
  format: "md",
  match: { include: "faq" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};
