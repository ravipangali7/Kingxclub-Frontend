/**
 * Allowed keys for site_theme_json (website + player dynamic colors only).
 * Used by SiteThemeApplier and Powerhouse Site Settings.
 */
/** Main color keys only: dark/light feel + brand. Used for dynamic theme and Powerhouse form. */
export const SITE_THEME_KEYS = [
  "background",
  "foreground",
  "card",
  "muted",
  "muted_foreground",
  "border",
  "primary",
  "primary_foreground",
  "accent",
  "accent_foreground",
  "ring",
  "gold",
] as const;

export type SiteThemeKey = (typeof SITE_THEME_KEYS)[number];

const ALLOWED_SET = new Set<string>(SITE_THEME_KEYS);

export function isAllowedThemeKey(key: string): key is SiteThemeKey {
  return ALLOWED_SET.has(key);
}

/** Filter theme object to only allowed keys with non-empty string values. */
export function filterAllowedTheme(theme: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of SITE_THEME_KEYS) {
    const v = theme[key];
    if (v != null && typeof v === "string" && v.trim()) out[key] = v.trim();
  }
  return out;
}
