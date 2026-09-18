import type { TinaField } from "tinacms";
import { imageField } from "./common";

// The image-and-text sections of About, Pottery and Process. Outside the
// file body Tina stores rich-text as a Markdown string, which the
// markdownify filter renders; raw HTML such as <b> shows up as a locked
// chip and is written back unchanged.
export const sectionsField: TinaField = {
  type: "object",
  name: "sections",
  label: "Sections",
  list: true,
  ui: { itemProps: (item) => ({ label: item?.image?.alt || "Section" }) },
  fields: [
    imageField("image", "Image"),
    { type: "rich-text", name: "body", label: "Text" },
  ],
};
