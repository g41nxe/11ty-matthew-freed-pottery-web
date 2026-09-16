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
    {
      type: "object", name: "sections", label: "Sections", list: true,
      ui: { itemProps: (item) => ({ label: item?.title || "New section" }) },
      fields: [
        { type: "string", name: "title", label: "Section title" },
        {
          type: "object", name: "questions", label: "Questions", list: true,
          ui: { itemProps: (item) => ({ label: item?.title || "New question" }) },
          fields: [
            { type: "string", name: "title", label: "Question" },
            { type: "string", name: "body", label: "Answer", ui: { component: "textarea" } },
          ],
        },
      ],
    },
  ],
};
