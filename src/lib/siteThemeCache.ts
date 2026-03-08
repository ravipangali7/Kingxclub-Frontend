/**
 * Cache site_theme_json in localStorage with a TTL.
 * Used so website/player can show theme instantly on refresh and only re-fetch after TTL.
 */

const THEME_CACHE_KEY = "karnalix_site_theme_cache";
export const THEME_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export interface ThemeCacheEntry {
  theme: Record<string, string>;
  savedAt: number;
}

function parseCache(raw: string | null): ThemeCacheEntry | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("theme" in parsed) || !("savedAt" in parsed))
      return null;
    const theme = (parsed as { theme: unknown }).theme;
    const savedAt = (parsed as { savedAt: unknown }).savedAt;
    if (
      typeof theme !== "object" ||
      theme === null ||
      typeof savedAt !== "number" ||
      Number.isNaN(savedAt)
    )
      return null;
    return { theme: theme as Record<string, string>, savedAt };
  } catch {
    return null;
  }
}

/** Read cached theme from localStorage. Returns null if missing or invalid. */
export function getThemeCache(): ThemeCacheEntry | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return parseCache(window.localStorage.getItem(THEME_CACHE_KEY));
}

/** Write theme and current timestamp to localStorage. */
export function setThemeCache(theme: Record<string, string>): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      THEME_CACHE_KEY,
      JSON.stringify({ theme, savedAt: Date.now() })
    );
  } catch {
    // ignore quota or other errors
  }
}

/** True if cache exists and savedAt is within THEME_CACHE_TTL_MS. */
export function isThemeCacheValid(): boolean {
  const entry = getThemeCache();
  if (!entry) return false;
  return Date.now() - entry.savedAt <= THEME_CACHE_TTL_MS;
}
