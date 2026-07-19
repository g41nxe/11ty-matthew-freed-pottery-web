import type { TinaField } from "tinacms";

/** Keep a field's value in the file but hide it from the editor UI. */
export const hidden = (f: TinaField): TinaField => ({
  ...f,
  ui: { ...(f as any).ui, component: "hidden" },
});
