import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

// The wording that is the same on every glaze page. The glaze itself — name,
// intro, page text, photo — lives in "Collections · Glaze gallery"; this is
// the frame around it. Without this collection the texts would sit in the
// template, where Matthew cannot reach them.
const withName = 'Write {glaze} where the glaze name belongs, for example "Ask about {glaze}".';

export const collectionsGlazePage: Collection = {
  name: "collections_glaze",
  label: "Collections · Glaze page",
  path: "src/views/_data",
  format: "json",
  match: { include: "collections_glaze" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "string", name: "eyebrow", label: "Small label above the name",
      description: 'Stands above the glaze name, followed by its group: "Glaze · Blues".',
    },
    { type: "string", name: "shop_cta", label: "Button to the shop" },
    {
      type: "string", name: "ask_title", label: "Blue band: heading",
      description: "The band near the bottom of every glaze page.",
    },
    {
      type: "string", name: "ask_text", label: "Blue band: text",
      description: withName,
      ui: { component: "textarea" },
    },
    { type: "string", name: "ask_cta", label: "Blue band: button", description: withName },
    imageField("ask_image", "Blue band: photo"),
    {
      type: "string", name: "others_title", label: "Heading above the other glazes",
    },
    { type: "string", name: "back_label", label: "Link to all glazes" },
  ],
};
