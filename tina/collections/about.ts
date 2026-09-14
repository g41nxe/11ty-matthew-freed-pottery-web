import type { Collection } from "tinacms";

// layout, tags, permalink and eleventyNavigation stay in the file untouched:
// Tina keeps top-level frontmatter it has no field for.
export const about: Collection = {
  name: "about",
  label: "About",
  path: "src/views",
  format: "md",
  match: { include: "about" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Eyebrow" },
    {
      type: "object",
      name: "medal",
      label: "Award note (leave the text empty to hide the whole block)",
      fields: [
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "link_label", label: "Shop link text" },
      ],
    },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    { type: "string", name: "quote", label: "Pull quote (shown after the first section)", ui: { component: "textarea" } },
    {
      type: "object",
      name: "sections",
      label: "Sections",
      list: true,
      ui: { itemProps: (item) => ({ label: item?.image?.alt || "Section" }) },
      fields: [
        {
          type: "object",
          name: "image",
          label: "Image",
          fields: [
            { type: "image", name: "url", label: "Image" },
            { type: "string", name: "alt", label: "Alt text" },
          ],
        },
        // Outside the file body Tina stores rich-text as a Markdown string,
        // which the markdownify filter renders. Raw HTML such as <b> shows up
        // as a locked chip and is written back unchanged.
        { type: "rich-text", name: "body", label: "Text" },
      ],
    },
  ],
};
