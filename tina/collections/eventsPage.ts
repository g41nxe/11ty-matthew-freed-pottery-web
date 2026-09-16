import type { Collection } from "tinacms";
import { imageField, linkField } from "../fields/common";
import { datePicker } from "../fields/date";

export const eventsPage: Collection = {
  name: "events_page",
  label: "Events · Page",
  path: "src/views",
  format: "md",
  match: { include: "events" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    {
      type: "object", name: "intro", label: "Intro",
      fields: [
        { type: "string", name: "eyebrow", label: "Eyebrow" },
        { type: "string", name: "title", label: "Title" },
      ],
    },
    { type: "string", name: "rhythm", label: "Annual rhythm note", ui: { component: "textarea" } },
    {
      type: "object", name: "section_labels", label: "Section headings",
      fields: [
        { type: "string", name: "special", label: "Special events heading" },
        { type: "string", name: "markets", label: "Market schedule heading" },
        { type: "string", name: "studio_news", label: "Studio news heading" },
        { type: "string", name: "from_studio", label: "Dateline above the studio note" },
      ],
    },
    {
      type: "object", name: "studio", label: "Visit the studio card",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        linkField("cta", "Button"),
        { type: "string", name: "footnote", label: "Footnote", ui: { component: "textarea" } },
      ],
    },
    { type: "string", name: "no_events", label: "Text when no events", ui: { component: "textarea" } },
    {
      type: "object", name: "news", label: "Studio news",
      description: "Leave the title empty to hide the news",
      fields: [
        { type: "string", name: "date", label: "Date", ui: datePicker },
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "body", label: "Text", ui: { component: "textarea" } },
        imageField("image", "Image"),
      ],
    },
  ],
};
