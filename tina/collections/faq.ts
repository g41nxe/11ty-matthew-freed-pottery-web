import type { Collection } from "tinacms";

export const faq: Collection = {
  name: "faq",
  label: "FAQ questions",
  path: "src/views/_data",
  format: "json",
  match: { include: "faq" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
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
