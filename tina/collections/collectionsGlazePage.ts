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
    {
      type: "string", name: "pieces_title", label: "Heading above the pieces",
      description: 'Stands over the pieces of this glaze, the way "From the current firing" does on the home page. Only shown while the glaze has pieces.',
    },
    {
      type: "string", name: "pieces_note", label: "Note under the pieces",
      description: "The same line stands under the pieces on the home page. Every piece links into the Shopify shop, and this says so before anyone clicks.",
    },
    {
      type: "string", name: "shop_cta_all", label: "Link to the shop collection",
      description:
        "Beside the heading above the pieces, and the button on glazes that have none. It goes to the shop collection built from the shop address in Settings and the slug beside the glaze in Collections · Glaze gallery. " +
        withName,
    },
    {
      type: "string", name: "ask_eyebrow", label: "Blue band: small label above the heading",
      description: 'The band near the bottom of every glaze page, built like the one about you on the home page, where this line reads "Meet the maker". Leave it empty and the heading moves up.',
    },
    {
      type: "string", name: "ask_title", label: "Blue band: heading",
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
