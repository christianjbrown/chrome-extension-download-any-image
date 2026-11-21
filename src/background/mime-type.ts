// The type itself out of a Content-Type, without its parameters and in lower
// case: "image/svg+xml" out of "IMAGE/SVG+XML; charset=utf-8".
const PARAMETERS = ";";

export function mimeEssence(contentType: string | undefined): string {
  const raw = contentType ?? "";
  const end = raw.indexOf(PARAMETERS);
  return (end === -1 ? raw : raw.slice(0, end)).trim().toLowerCase();
}
