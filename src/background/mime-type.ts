// The type itself out of a Content-Type, without its parameters and in lower
// case: "image/svg+xml" out of "IMAGE/SVG+XML; charset=utf-8".
const PARAMETERS = ";";

export function mimeEssence(contentType: string | undefined): string {
  // Everything before the first parameter, which is all of it when it has none.
  const [type] = (contentType ?? "").split(PARAMETERS, 1);
  return String(type).trim().toLowerCase();
}
