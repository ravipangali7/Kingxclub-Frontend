import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSiteSettingsAdmin, updateSiteSettings } from "@/api/admin";
import { filterAllowedTheme } from "@/lib/siteThemeKeys";

type SiteSettingJsonField =
  | "site_categories_json"
  | "site_top_games_json"
  | "site_providers_json"
  | "site_categories_game_json"
  | "site_popular_games_json"
  | "site_coming_soon_json"
  | "site_refer_bonus_json"
  | "site_payments_accepted_json";
type SiteSettingThemeField = "site_theme_json";

function parseSection(val: unknown): Record<string, unknown> {
  if (val != null && typeof val === "object" && !Array.isArray(val)) return val as Record<string, unknown>;
  return {};
}

function parseTheme(val: unknown): Record<string, string> {
  if (val != null && typeof val === "object" && !Array.isArray(val)) {
    const o = val as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return out;
  }
  return {};
}

export function useSiteSettingFieldJson(fieldName: SiteSettingJsonField) {
  const queryClient = useQueryClient();
  const { data: siteSettings, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: getSiteSettingsAdmin,
  });
  const [value, setValue] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = (siteSettings ?? {}) as Record<string, unknown>;
    setValue(parseSection(s[fieldName]));
  }, [siteSettings, fieldName]);

  const save = async () => {
    setSaving(true);
    try {
      await updateSiteSettings({ [fieldName]: value });
      await queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      return true;
    } finally {
      setSaving(false);
    }
  };

  return { data: siteSettings, value, setValue, save, isLoading, isSaving: saving };
}

export function useSiteSettingFieldTheme() {
  const queryClient = useQueryClient();
  const { data: siteSettings, isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: getSiteSettingsAdmin,
  });
  const [value, setValue] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = (siteSettings ?? {}) as Record<string, unknown>;
    setValue(parseTheme(s.site_theme_json));
  }, [siteSettings]);

  const save = async () => {
    setSaving(true);
    try {
      await updateSiteSettings({ site_theme_json: filterAllowedTheme(value) });
      await queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      return true;
    } finally {
      setSaving(false);
    }
  };

  return { data: siteSettings, value, setValue, save, isLoading, isSaving: saving };
}
