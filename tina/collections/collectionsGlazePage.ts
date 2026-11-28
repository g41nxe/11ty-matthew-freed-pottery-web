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
        "The glaze page shows four tiles. Where the shop holds fewer than four pieces, this tile fills the first free place and says that there is more to see at a market. " +
        withName,
    },
    {
      type: "string", name: "market_text", label: "Market tile: text", required: true,
      description:
        "Two short lines under the heading: an apology that the shop holds little of this glaze right now, and where the pieces go instead. The tile only shows when there are fewer than four. It stands above the blue band, so it should not repeat what the band already offers: the band is about pieces made to order, this one is about coming by in person. Without an upcoming date the tile shows the line from Settings instead. " +
        withName,
      ui: { component: "textarea" },
    },
    {
      type: "string", name: "market_cta", label: "Market tile: link to the events page", required: true,
    },
    imageField(
      "placeholder_image",
      "Empty places: photo",
      "A glaze page has four places. Where the shop holds fewer than three pieces, the places left after the market tile and the next date show this photo, tinted in the colour of the glaze. It should show work that is not finished yet - unglazed pots are ideal - because it stands for pieces that are still to come."
    ),
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
