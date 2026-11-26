import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

// The wording and the one photo that every glaze page shares. The glaze
// itself — name, intro, page text — lives in "Collections · Glaze gallery",
// its pieces in "Shop sets"; this is the frame around both. Without this
// collection the texts would sit in the template, where Matthew cannot reach
// them. Everything the page renders without a fallback is required here, so
// an empty field is refused in the CMS instead of leaving a hole on sixteen
// pages.
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
      type: "string", name: "eyebrow", label: "Small label above the name", required: true,
      description: 'Stands above the glaze name, followed by its group: "Glaze · Blues".',
    },
    {
      type: "string", name: "pieces_title", label: "Heading above the pieces", required: true,
      description: 'Stands over the pieces of this glaze, the way "From the current firing" does on the home page. Only shown while the glaze has pieces.',
    },
    {
      type: "string", name: "pieces_note", label: "Note under the pieces",
      description: "The same line stands under the pieces on the home page. Every piece links into the Shopify shop, and this says so before anyone clicks.",
    },
    {
      type: "string", name: "pieces_empty_label", label: "Small label on the empty tile",
      description: "Stands where the pieces would be, on a glaze that has nothing in the shop right now.",
    },
    {
      type: "string", name: "pieces_empty", label: "Text on the empty tile",
      description: "One line, beside the photo of the glaze. There is no link on this tile: the shop collection would be empty, and the blue band below already offers to make a piece. " + withName,
      ui: { component: "textarea" },
    },
    {
      type: "string", name: "shop_cta_all", label: "Link to the shop collection", required: true,
      description:
        "Beside the heading above the pieces, and the button on glazes that have none. It goes to the shop collection built from the shop address in Settings and the slug beside the glaze in Collections · Glaze gallery. " +
        withName,
    },
    {
      type: "string", name: "ask_eyebrow", label: "Blue band: small label above the heading",
      description: 'The band near the bottom of every glaze page, built like the one about you on the home page, where this line reads "Meet the maker". Leave it empty and the heading moves up.',
    },
    {
      type: "string", name: "ask_title", label: "Blue band: heading", required: true,
    },
    {
      type: "string", name: "ask_text", label: "Blue band: text", required: true,
      description: withName,
      ui: { component: "textarea" },
    },
    { type: "string", name: "ask_cta", label: "Blue band: link to the contact page", required: true, description: withName },
    imageField(
      "ask_image",
      "Blue band: photo",
      "The same photo on all sixteen glaze pages. It stands beside an offer to make a piece, so it should show work in progress rather than a finished, glazed piece — and never a photo that is also a glaze card, because the visitor clicked on that one to get here."
    ),
    {
      type: "string", name: "others_title", label: "Heading above the other glazes", required: true,
    },
    { type: "string", name: "back_label", label: "Link to all glazes", required: true },
  ],
};
