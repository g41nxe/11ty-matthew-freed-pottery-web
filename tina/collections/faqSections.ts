import type { Collection } from "tinacms";

export const faqSections: Collection = {
  name: "faq_sections",
  label: "FAQ Sections",
  path: "src/content/faq",
  format: "md",
  ui: { allowedActions: { create: true, delete: true } },
  fields: [{ type: "string", name: "placeholder", label: "Placeholder" }],
};
