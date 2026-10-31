import { safeStem } from "./filename-text";

export interface OriginalName {
  stem: string;
  extension?: string | undefined;
}

export interface OriginalNames {
  // The image's own name from its address, when it has one worth keeping.
  from(url: string): OriginalName | undefined;
}

const GENERIC = new Set([
  "download",
  "default",
  "file",
  "image",
  "img",
  "index",
  "photo",
  "pic",
  "picture",
  "thumb",
  "thumbnail",
]);
const HEX_HASH = /^[0-9a-f-]{16,}$/i;
const SPLIT = /^(.+)\.([a-z0-9]{1,5})$/i;

function decoded(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

// A name with words in it, rather than a number, a hash or "image".
function meaningful(stem: string): boolean {
  const letters = stem.match(/\p{L}/gu)?.length ?? 0;
  const looksLikeToken = stem.length >= 24 && !/[ ._-]/.test(stem);
  return (
    letters >= 2 &&
    !GENERIC.has(stem.toLowerCase()) &&
    !HEX_HASH.test(stem) &&
    !looksLikeToken
  );
}

export class UrlOriginalNames implements OriginalNames {
  from(url: string): OriginalName | undefined {
    const segment = this.lastSegment(url);
    const parts = SPLIT.exec(segment);
    const stem = safeStem(parts?.[1] ?? segment);
    if (!meaningful(stem)) {
      return undefined;
    }
    return { stem, extension: parts?.[2]?.toLowerCase() };
  }

  // Only a web address has a path worth reading. Bytes the page handed over
  // arrive as data: URLs, which have none.
  private lastSegment(url: string): string {
    const parsed = URL.parse(url);
    if (parsed === null || !/^https?:$/.test(parsed.protocol)) {
      return "";
    }
    const segments = parsed.pathname.split("/").filter((part) => part !== "");
    return decoded(segments.at(-1) ?? "");
  }
}
