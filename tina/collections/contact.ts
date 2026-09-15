import type { Collection } from "tinacms";

// One textarea per paragraph. Tina builds every list entry from ui.field;
// kept in a constant because the UI type does not declare `field`.
const paragraphList = { component: "list", field: { component: "textarea" } };

export const contact: Collection = {
  name: "contact",
  label: "Contact",
  path: "src/views",
  format: "md",
  match: { include: "contact" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Small label above the headline" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "subheadline", label: "Subheadline" },
    { type: "string", name: "social_title", label: "Heading above the social icons" },
    { type: "string", name: "intro", label: "Intro paragraphs", list: true, ui: paragraphList },
    { type: "string", name: "message", label: "Label above the email address" },
    { type: "string", name: "phone", label: "Label above the phone number" },
    { type: "string", name: "address", label: "Label above the address" },
    {
      type: "object", name: "contactform", label: "Contact form",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "submit", label: "Button text" },
        { type: "string", name: "info", label: "Note under the title" },
        {
          type: "object", name: "placeholders", label: "Field labels",
          description: "The asterisk on required fields is added automatically",
          fields: [
            { type: "string", name: "name", label: "Name" },
            { type: "string", name: "email", label: "Email (required field)" },
            { type: "string", name: "phone", label: "Phone" },
            { type: "string", name: "message", label: "Message (required field)" },
          ],
        },
      ],
    },
  ],
};
