import type { Collection } from "tinacms";

export const privacyStatementPage: Collection = {
  name: "privacy_statement_page",
  label: "Privacy statement · Page",
  path: "src/views",
  format: "md",
  match: { include: "privacy-statement" },
  ui: {
    allowedActions: { create: false, delete: false },
    // Tina writes a newline before a string body but reads that newline back
    // as part of it, so every save would add one more blank line at the top.
    beforeSubmit: async ({ values }) => ({
      ...values,
      body: typeof values.body === "string" ? values.body.replace(/^\s*\n/, "") : values.body,
    }),
  },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    // Markdown source instead of rich-text: the rich-text editor rewrites the
    // file on its first save (list markers, trailing spaces) and turns the
    // bare cookie URL into a link, which changes the published page.
    { type: "string", name: "body", label: "Text (Markdown)", isBody: true, ui: { component: "textarea" } },
  ],
};
