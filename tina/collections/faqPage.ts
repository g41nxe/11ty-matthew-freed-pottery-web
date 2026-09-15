import type { Collection } from "tinacms";

export const faqPage: Collection = {
  name: "faq_page",
  label: "FAQ page",
  path: "src/views",
  format: "md",
  match: { include: "faq" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
  ],
};
