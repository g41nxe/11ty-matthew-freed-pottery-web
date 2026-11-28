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
      description: 'Stands above the glaze name, followed by its group: "The field guide · Blues". The Collections page carries the same label, so a glaze page reads as a leaf out of it.',
    },
    {
      type: "string", name: "pieces_title", label: "Heading above the pieces", required: true,
      description: 'Stands over the row of four tiles. The row holds the pieces of this glaze and, where the shop has fewer than four, the market dates. ' + withName,
    },
    {
      type: "string", name: "pieces_title_empty", label: "Heading when the shop has no pieces", required: true,
      description: 'Takes the place of the heading above on a glaze with nothing in the shop. The row then holds only the market tile and the next dates, so a heading that speaks of pieces in the shop would promise what is not there. ' + withName,
    },
    {
      type: "string", name: "pieces_note", label: "Note under the pieces",
      description: "The same line stands under the pieces on the home page. Every piece links into the Shopify shop, and this says so before anyone clicks.",
    },
    {
      type: "string", name: "market_title", label: "Market tile: heading", required: true,
      description:
        "The row of pieces on a glaze page always ends with this tile and the next market date. It says that the glaze can be found at a market. " +
        withName,
    },
    {
      type: "string", name: "market_text", label: "Market tile: first sentence", required: true,
      description:
        "One sentence under the heading. The tile stands beside the pieces on every glaze page, whether the shop holds none of the glaze or a dozen, so the sentence has to be true in both cases. On a phone it stands alone, so keep it short. Without an upcoming date the tile shows the line from Settings instead. " +
        withName,
    },
    {
      type: "string", name: "market_text_more", label: "Market tile: second sentence",
      description:
        "Follows either first sentence on tablets and computers. A phone leaves it out, the tile is too small there. It stands above the blue band, so it should not repeat what the band offers: the band is about pieces made to order, this is about coming by in person.",
    },
    {
      type: "string", name: "market_cta", label: "Market tile: link to the events page", required: true,
    },
    {
      type: "string", name: "empty_note", label: "Empty places: text",
      description:
        "The row of pieces on a glaze page holds at least four cards. Where a glaze has fewer than two pieces in the shop, the gap shows a white tile with three dogwood flowers in the colour of the glaze, fading from left to right. This short line stands under the tile, where a piece carries its name; where two such tiles stand side by side, under the first only. A line break here is a line break on the page; two lines are what a name takes. Leave it empty and only the flower shows.",
      ui: { component: "textarea" },
    },
    {
      type: "string", name: "shop_all_label", label: "Link to the whole shop", required: true,
      description: 'Beside the heading above the pieces, on every glaze page: the way into the shop as a whole, like "Shop all pieces" on the home page.',
    },
    {
      type: "string", name: "shop_cta_all", label: "Button to this glaze in the shop", required: true,
      description:
        "The button under the text at the top of the page, and only while the glaze has pieces. It goes to the shop collection built from the shop address in Settings and the slug beside the glaze in Collections · Glaze gallery. " +
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
