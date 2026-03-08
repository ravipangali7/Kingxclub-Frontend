/**
 * Convert a stored SVG value to a valid <img src> attribute.
 *
 * - Inline SVG code (starts with `<svg`) is encoded as a data URL.
 * - Everything else (URL, relative path, data URL) is returned unchanged.
 */
export function svgToImgSrc(value: string): string {
  if (!value) return value;
  if (value.trim().startsWith("<svg")) {
    return "data:image/svg+xml," + encodeURIComponent(value);
  }
  return value;
}
