import type { TinaField } from "tinacms";

// Tina names a nested field by its full path, e.g. shop_sets.0.items.1.image.alt,
// so a sibling's value is found by swapping the last segment.
const sibling = (values: Record<string, unknown>, path: string, name: string): unknown =>
  path
    .split(".")
    .slice(0, -1)
    .concat(name)
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], values);

const altRequiredWithImage = (value: string, allValues: Record<string, unknown>, _meta: unknown, field: unknown) => {
  const path = (field as { name?: string } | undefined)?.name;
  return !value?.trim() && path && sibling(allValues, path, "url") ? "Describe the photo in a few words" : undefined;
};

// An image the site renders through the {% img %} shortcode: the path
// Tina stores (/images/…) plus the alt text. Alt text is asked for as soon
// as an image is picked. The build still copes without it (the shortcode
// falls back to a generic description), so this is about a description
// that fits the photo, not about keeping the deploy alive.
export const imageField = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: [
    { type: "image", name: "url", label: "Image" },
    {
      type: "string",
      name: "alt",
      label: "Alt text",
      description: "Describes the image for people who cannot see it",
      ui: { validate: altRequiredWithImage },
    },
  ],
});

// Texts that mention how many glaze lines there are. The site replaces the
// placeholder with the number of entries in the glaze gallery, written out.
export const glazesHint = "{glazes} becomes the number of glaze lines (e.g. sixteen), {Glazes} the same with a capital";

export const linkField = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: [
    { type: "string", name: "label", label: "Label" },
    { type: "string", name: "url", label: "URL" },
  ],
});
