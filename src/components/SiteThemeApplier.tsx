import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSiteSetting } from "@/api/site";
import { colorToCssHsl } from "@/lib/colorToCssHsl";
import { SITE_THEME_KEYS, filterAllowedTheme } from "@/lib/siteThemeKeys";
import { getThemeCache, setThemeCache, THEME_CACHE_TTL_MS } from "@/lib/siteThemeCache";

function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith("/powerhouse") ||
    pathname.startsWith("/super") ||
    pathname.startsWith("/master")
  );
}

function toCssVarName(key: string): string {
  const name = key.startsWith("--") ? key.slice(2) : key;
  return `--${name.replace(/_/g, "-")}`;
}

function setVarsOnElement(el: HTMLElement, theme: Record<string, string>) {
  for (const [key, value] of Object.entries(theme)) {
    if (typeof value !== "string" || !value.trim()) continue;
    el.style.setProperty(toCssVarName(key), value.trim());
  }
}

function clearVarsOnElement(el: HTMLElement) {
  for (const key of SITE_THEME_KEYS) {
    el.style.removeProperty(toCssVarName(key));
  }
}

function applyTheme(theme: Record<string, string>, runDelayed = true) {
  const root = document.documentElement;
  setVarsOnElement(root, theme);
  // Website/player content lives inside .home-design; set vars there so colors apply 100%.
  const applyToHomeDesign = () => {
    document.querySelectorAll<HTMLElement>(".home-design").forEach((el) => setVarsOnElement(el, theme));
  };
  applyToHomeDesign();
  requestAnimationFrame(applyToHomeDesign);
  if (runDelayed) {
    setTimeout(applyToHomeDesign, 100);
    setTimeout(applyToHomeDesign, 350); // Catch layouts that mount after route transition
  }
}

function clearTheme() {
  const root = document.documentElement;
  clearVarsOnElement(root);
  document.querySelectorAll<HTMLElement>(".home-design").forEach(clearVarsOnElement);
}

export interface SiteSettingTheme {
  site_theme_json?: Record<string, string>;
}

/** Convert raw theme (hex/rgb/hsl etc.) to CSS HSL and apply. */
function themeToCssAndApply(rawTheme: Record<string, unknown>): void {
  const allowed = filterAllowedTheme(rawTheme);
  const converted: Record<string, string> = {};
  for (const [key, value] of Object.entries(allowed)) {
    const cssHsl = colorToCssHsl(value);
    if (cssHsl) converted[key] = cssHsl;
  }
  if (Object.keys(converted).length > 0) applyTheme(converted);
}

/**
 * Applies site_theme_json from site_setting as CSS variables on document.documentElement
 * and all .home-design (website + player). Only when route is website or player (not admin).
 * Caches theme in localStorage with 2-minute TTL; on refresh uses cache if fresh, else fetches API.
 */
export function SiteThemeApplier() {
  const location = useLocation();
  const isAdmin = isAdminPath(location.pathname);

  // Compute from localStorage each render; no state to avoid effect loop when we write cache.
  const cacheValid = (() => {
    const c = getThemeCache();
    return c !== null && Date.now() - c.savedAt <= THEME_CACHE_TTL_MS;
  })();

  const { data: siteSetting } = useQuery({
    queryKey: ["siteSetting"],
    queryFn: getSiteSetting,
    enabled: !isAdmin && !cacheValid,
  });

  const site = siteSetting as SiteSettingTheme | undefined;
  const theme = site?.site_theme_json;

  useEffect(() => {
    if (isAdmin) {
      clearTheme();
      return;
    }
    // Resolve theme: API first, then valid cache (so it persists across navigations).
    let resolved: Record<string, unknown> | null = null;
    if (theme && typeof theme === "object" && Object.keys(theme).length > 0) {
      resolved = theme as Record<string, unknown>;
      setThemeCache(theme);
    } else {
      const c = getThemeCache();
      if (c && Date.now() - c.savedAt <= THEME_CACHE_TTL_MS && Object.keys(c.theme).length > 0) {
        resolved = c.theme as Record<string, unknown>;
      }
    }
    if (resolved) themeToCssAndApply(resolved);
  }, [isAdmin, theme, location.pathname]); // Re-apply on pathname change so new .home-design nodes get vars

  return null;
}
