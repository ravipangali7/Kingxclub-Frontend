import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  getSiteSettingsAdmin,
  updateSiteSettings,
  updateSiteSettingsForm,
  getLiveBettingSectionsAdmin,
  createLiveBettingSection,
  updateLiveBettingSection,
  deleteLiveBettingSection,
  createLiveBettingEvent,
  updateLiveBettingEvent,
  deleteLiveBettingEvent,
  getCategoriesAdmin,
  getProvidersAdmin,
  getGamesAdmin,
  getPaymentMethods,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/lib/api";
import { SITE_THEME_KEYS, filterAllowedTheme } from "@/lib/siteThemeKeys";
import { ChevronUp, ChevronDown, Trash2, Plus, ChevronRight } from "lucide-react";
import {
  SectionTitleSvg,
  OrderedIdSelector,
  CategoryGamesEditor,
  type CategoryGamesEntry,
} from "@/components/admin/SiteJsonSectionEditor";

interface SectionJson {
  section_title?: string;
  section_svg?: string;
  category_ids?: number[];
  game_ids?: number[];
  provider_ids?: number[];
  payment_method_ids?: number[];
  categories?: CategoryGamesEntry[];
  description?: string;
  cta?: string;
  href?: string;
  title?: string;
  subtitle?: string;
  tagline?: string;
}

export interface LiveBettingEventAdmin {
  id: number;
  section: number;
  sport?: string;
  team1: string;
  team2: string;
  event_date?: string;
  event_time?: string;
  odds: number[];
  is_live?: boolean;
  order?: number;
}

export interface LiveBettingSectionAdmin {
  id: number;
  title: string;
  order: number;
  events: LiveBettingEventAdmin[];
}

export interface PromoBannerSlide {
  title?: string;
  subtitle?: string;
  image?: string;
  cta_label?: string;
  cta_link?: string;
}

const PowerhouseSiteSettings = () => {
  const queryClient = useQueryClient();
  const { data: siteSettings } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: getSiteSettingsAdmin,
  });
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [favicon, setFavicon] = useState("");
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(null);
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email1, setEmail1] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [scrollingText, setScrollingText] = useState("");
  const [activePlayers, setActivePlayers] = useState("");
  const [gamesAvailable, setGamesAvailable] = useState("");
  const [totalWinnings, setTotalWinnings] = useState("");
  const [instantPayouts, setInstantPayouts] = useState("");
  const [footerDescription, setFooterDescription] = useState("");
  const [promoBanners, setPromoBanners] = useState<PromoBannerSlide[]>([]);
  const [saving, setSaving] = useState(false);

  // Home page section JSON states
  const [siteCategoriesJson, setSiteCategoriesJson] = useState<SectionJson>({});
  const [siteTopGamesJson, setSiteTopGamesJson] = useState<SectionJson>({});
  const [siteProvidersJson, setSiteProvidersJson] = useState<SectionJson>({});
  const [siteCategoriesGameJson, setSiteCategoriesGameJson] = useState<SectionJson>({});
  const [sitePopularGamesJson, setSitePopularGamesJson] = useState<SectionJson>({});
  const [siteComingSoonJson, setSiteComingSoonJson] = useState<SectionJson>({});
  const [siteReferBonusJson, setSiteReferBonusJson] = useState<SectionJson>({});
  const [sitePaymentsAcceptedJson, setSitePaymentsAcceptedJson] = useState<SectionJson>({});
  const [siteFooterJson, setSiteFooterJson] = useState<SectionJson>({});
  const [siteWelcomeDepositJson, setSiteWelcomeDepositJson] = useState<SectionJson>({});
  const [siteThemeJson, setSiteThemeJson] = useState<Record<string, string>>({});

  // Data for selectors
  const { data: allCategoriesRaw = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: getCategoriesAdmin });
  const { data: allProvidersRaw = [] } = useQuery({ queryKey: ["admin-providers"], queryFn: getProvidersAdmin });
  const { data: allGamesRaw = [] } = useQuery({ queryKey: ["admin-games"], queryFn: getGamesAdmin });
  const { data: allPaymentMethodsRaw = [] } = useQuery({ queryKey: ["admin-payment-methods"], queryFn: getPaymentMethods });

  const allCategories = (allCategoriesRaw as { id: number; name: string }[]).map((c) => ({ id: c.id, name: c.name }));
  const allProviders = (allProvidersRaw as { id: number; name: string }[]).map((p) => ({ id: p.id, name: p.name }));
  const allGames = (allGamesRaw as { id: number; name: string }[]).map((g) => ({ id: g.id, name: g.name }));
  const allPaymentMethods = (allPaymentMethodsRaw as { id: number; name: string }[]).map((m) => ({ id: m.id, name: m.name }));

  const { data: liveBettingSectionsApi = [] } = useQuery({
    queryKey: ["admin-live-betting-sections"],
    queryFn: getLiveBettingSectionsAdmin,
  });
  const liveBettingSections = (liveBettingSectionsApi as LiveBettingSectionAdmin[]).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const [liveBettingSaving, setLiveBettingSaving] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [addingEventSectionId, setAddingEventSectionId] = useState<number | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!faviconFile) {
      setFaviconPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(faviconFile);
    setFaviconPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [faviconFile]);

  useEffect(() => {
    const s = (siteSettings ?? {}) as Record<string, unknown>;
    const phones = (s.phones as string[]) ?? [];
    const emails = (s.emails as string[]) ?? [];
    setName(String(s.name ?? ""));
    setLogo(String(s.logo ?? ""));
    setFavicon(String(s.favicon ?? ""));
    setPhone1(phones[0] ?? "");
    setPhone2(phones[1] ?? "");
    setEmail1(emails[0] ?? "");
    setWhatsappNumber(String(s.whatsapp_number ?? ""));
    setHeroTitle(String(s.hero_title ?? ""));
    setHeroSubtitle(String(s.hero_subtitle ?? ""));
    setScrollingText(String(s.scrolling_text ?? ""));
    setActivePlayers(s.active_players != null ? String(s.active_players) : "");
    setGamesAvailable(s.games_available != null ? String(s.games_available) : "");
    setTotalWinnings(s.total_winnings != null ? String(s.total_winnings) : "");
    setInstantPayouts(s.instant_payouts != null ? String(s.instant_payouts) : "");
    setFooterDescription(String(s.footer_description ?? ""));
    const banners = s.promo_banners as PromoBannerSlide[] | undefined;
    setPromoBanners(Array.isArray(banners) ? banners.map((b) => ({ ...b })) : []);
    // Load new JSON section fields
    const parseSection = (val: unknown): SectionJson => (val && typeof val === "object" && !Array.isArray(val) ? (val as SectionJson) : {});
    setSiteCategoriesJson(parseSection(s.site_categories_json));
    setSiteTopGamesJson(parseSection(s.site_top_games_json));
    setSiteProvidersJson(parseSection(s.site_providers_json));
    setSiteCategoriesGameJson(parseSection(s.site_categories_game_json));
    setSitePopularGamesJson(parseSection(s.site_popular_games_json));
    setSiteComingSoonJson(parseSection(s.site_coming_soon_json));
    setSiteReferBonusJson(parseSection(s.site_refer_bonus_json));
    setSitePaymentsAcceptedJson(parseSection(s.site_payments_accepted_json));
    setSiteFooterJson(parseSection(s.site_footer_json));
    setSiteWelcomeDepositJson(parseSection(s.site_welcome_deposit_json));
    const theme = s.site_theme_json;
    setSiteThemeJson(
      theme && typeof theme === "object" && !Array.isArray(theme)
        ? filterAllowedTheme(theme as Record<string, unknown>)
        : {}
    );
  }, [siteSettings]);

  const buildPayload = () => {
    const a = activePlayers.trim();
    const g = gamesAvailable.trim();
    const t = totalWinnings.trim();
    const i = instantPayouts.trim();
    return {
      name: name.trim(),
      phones: [phone1.trim(), phone2.trim()].filter(Boolean),
      emails: [email1.trim()].filter(Boolean),
      whatsapp_number: whatsappNumber.trim(),
      hero_title: heroTitle.trim(),
      hero_subtitle: heroSubtitle.trim(),
      scrolling_text: scrollingText,
      active_players: a ? parseInt(a, 10) : 0,
      games_available: g ? parseInt(g, 10) : 0,
      total_winnings: t ? t : "0",
      instant_payouts: i ? parseInt(i, 10) : 0,
      footer_description: footerDescription.trim(),
      promo_banners: promoBanners,
      site_categories_json: siteCategoriesJson,
      site_top_games_json: siteTopGamesJson,
      site_providers_json: siteProvidersJson,
      site_categories_game_json: siteCategoriesGameJson,
      site_popular_games_json: sitePopularGamesJson,
      site_coming_soon_json: siteComingSoonJson,
      site_refer_bonus_json: siteReferBonusJson,
      site_payments_accepted_json: sitePaymentsAcceptedJson,
      site_footer_json: siteFooterJson,
      site_welcome_deposit_json: siteWelcomeDepositJson,
      site_theme_json: filterAllowedTheme(siteThemeJson),
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (logoFile || faviconFile) {
        const formData = new FormData();
        formData.set("name", name.trim());
        formData.set("phone1", phone1.trim());
        formData.set("phone2", phone2.trim());
        formData.set("email1", email1.trim());
        formData.set("whatsapp_number", whatsappNumber.trim());
        formData.set("hero_title", heroTitle.trim());
        formData.set("hero_subtitle", heroSubtitle.trim());
        formData.set("scrolling_text", scrollingText);
        formData.set("footer_description", footerDescription.trim());
        formData.set("promo_banners", JSON.stringify(promoBanners));
        formData.set("active_players", activePlayers.trim());
        formData.set("games_available", gamesAvailable.trim());
        formData.set("total_winnings", totalWinnings.trim());
        formData.set("instant_payouts", instantPayouts.trim());
        formData.set("site_categories_json", JSON.stringify(siteCategoriesJson));
        formData.set("site_top_games_json", JSON.stringify(siteTopGamesJson));
        formData.set("site_providers_json", JSON.stringify(siteProvidersJson));
        formData.set("site_categories_game_json", JSON.stringify(siteCategoriesGameJson));
        formData.set("site_popular_games_json", JSON.stringify(sitePopularGamesJson));
        formData.set("site_coming_soon_json", JSON.stringify(siteComingSoonJson));
        formData.set("site_refer_bonus_json", JSON.stringify(siteReferBonusJson));
        formData.set("site_payments_accepted_json", JSON.stringify(sitePaymentsAcceptedJson));
        formData.set("site_footer_json", JSON.stringify(siteFooterJson));
        formData.set("site_welcome_deposit_json", JSON.stringify(siteWelcomeDepositJson));
        formData.set("site_theme_json", JSON.stringify(filterAllowedTheme(siteThemeJson)));
        if (logoFile) formData.set("logo", logoFile);
        if (faviconFile) formData.set("favicon", faviconFile);
        await updateSiteSettingsForm(formData);
      } else {
        await updateSiteSettings(buildPayload());
      }
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["siteSetting"] });
      toast({ title: "Site settings saved." });
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to save settings";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLiveBettingAddSection = async () => {
    setLiveBettingSaving(true);
    try {
      await createLiveBettingSection({ title: "New Section", order: liveBettingSections.length });
      queryClient.invalidateQueries({ queryKey: ["admin-live-betting-sections"] });
      queryClient.invalidateQueries({ queryKey: ["liveBettingSections"] });
      toast({ title: "Section added." });
    } catch (e) {
      toast({ title: (e as { detail?: string })?.detail ?? "Failed", variant: "destructive" });
    } finally {
      setLiveBettingSaving(false);
    }
  };

  const handleLiveBettingUpdateSection = async (id: number, data: { title?: string }) => {
    setLiveBettingSaving(true);
    try {
      await updateLiveBettingSection(id, data);
      queryClient.invalidateQueries({ queryKey: ["admin-live-betting-sections"] });
      queryClient.invalidateQueries({ queryKey: ["liveBettingSections"] });
      setEditingSectionId(null);
      toast({ title: "Section updated." });
    } catch (e) {
      toast({ title: (e as { detail?: string })?.detail ?? "Failed", variant: "destructive" });
    } finally {
      setLiveBettingSaving(false);
    }
  };

  const handleLiveBettingDeleteSection = async (id: number) => {
    if (!confirm("Delete this section and all its events?")) return;
    setLiveBettingSaving(true);
    try {
      await deleteLiveBettingSection(id);
      queryClient.invalidateQueries({ queryKey: ["admin-live-betting-sections"] });
      queryClient.invalidateQueries({ queryKey: ["liveBettingSections"] });
      setEditingSectionId(null);
      setAddingEventSectionId(null);
      toast({ title: "Section deleted." });
    } catch (e) {
      toast({ title: (e as { detail?: string })?.detail ?? "Failed", variant: "destructive" });
    } finally {
      setLiveBettingSaving(false);
    }
  };

  const handleLiveBettingAddEvent = async (
    sectionId: number,
    data: {
      team1: string;
      team2: string;
      sport?: string;
      event_date?: string;
      event_time?: string;
      odds?: number[];
      is_live?: boolean;
    }
  ) => {
    setLiveBettingSaving(true);
    try {
      await createLiveBettingEvent({ section: sectionId, ...data });
      queryClient.invalidateQueries({ queryKey: ["admin-live-betting-sections"] });
      queryClient.invalidateQueries({ queryKey: ["liveBettingSections"] });
      setAddingEventSectionId(null);
      toast({ title: "Event added." });
    } catch (e) {
      toast({ title: (e as { detail?: string })?.detail ?? "Failed", variant: "destructive" });
    } finally {
      setLiveBettingSaving(false);
    }
  };

  const handleLiveBettingUpdateEvent = async (id: number, data: Partial<LiveBettingEventAdmin>) => {
    setLiveBettingSaving(true);
    try {
      await updateLiveBettingEvent(id, data);
      queryClient.invalidateQueries({ queryKey: ["admin-live-betting-sections"] });
      queryClient.invalidateQueries({ queryKey: ["liveBettingSections"] });
      setEditingEventId(null);
      toast({ title: "Event updated." });
    } catch (e) {
      toast({ title: (e as { detail?: string })?.detail ?? "Failed", variant: "destructive" });
    } finally {
      setLiveBettingSaving(false);
    }
  };

  const handleLiveBettingDeleteEvent = async (id: number) => {
    if (!confirm("Delete this event?")) return;
    setLiveBettingSaving(true);
    try {
      await deleteLiveBettingEvent(id);
      queryClient.invalidateQueries({ queryKey: ["admin-live-betting-sections"] });
      queryClient.invalidateQueries({ queryKey: ["liveBettingSections"] });
      setEditingEventId(null);
      toast({ title: "Event deleted." });
    } catch (e) {
      toast({ title: (e as { detail?: string })?.detail ?? "Failed", variant: "destructive" });
    } finally {
      setLiveBettingSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-bold text-2xl tracking-tight">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Branding, contact, hero, stats, footer and promo banners. Slider slides:{" "}
          <Link to="/powerhouse/slider" className="text-primary underline">Slider</Link>. CMS:{" "}
          <Link to="/powerhouse/cms" className="text-primary underline">CMS Pages</Link>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Site name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. KarnaliX" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Logo</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-sm"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              {(logoPreviewUrl || (logo && logo.trim())) && (
                <div className="mt-2 rounded-lg border overflow-hidden bg-muted/30 w-24 h-24">
                  <img src={logoPreviewUrl ?? getMediaUrl(logo.trim())} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Favicon</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-sm"
                onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)}
              />
              {(faviconPreviewUrl || (favicon && favicon.trim())) && (
                <div className="mt-2 rounded-lg border overflow-hidden bg-muted/30 w-12 h-12">
                  <img src={faviconPreviewUrl ?? getMediaUrl(favicon.trim())} alt="Favicon" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone 1</label>
              <Input value={phone1} onChange={(e) => setPhone1(e.target.value)} placeholder="+977 ..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone 2</label>
              <Input value={phone2} onChange={(e) => setPhone2(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input type="email" value={email1} onChange={(e) => setEmail1(e.target.value)} placeholder="support@..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">WhatsApp number</label>
              <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+977 ..." />
            </div>
          </CardContent>
        </Card>

        {/* Hero */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Hero section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Hero title</label>
              <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Main headline" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Hero subtitle</label>
              <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Supporting line" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Scrolling text (header ticker)</label>
              <Textarea
                value={scrollingText}
                onChange={(e) => setScrollingText(e.target.value)}
                rows={3}
                placeholder="This text scrolls below the header exactly as entered."
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats (home / hero stats) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Stats (home page)</CardTitle>
            <p className="text-xs text-muted-foreground">Shown on hero or home. Leave empty to use defaults.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Active players</label>
              <Input type="number" min={0} value={activePlayers} onChange={(e) => setActivePlayers(e.target.value)} placeholder="e.g. 50000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Games available</label>
              <Input type="number" min={0} value={gamesAvailable} onChange={(e) => setGamesAvailable(e.target.value)} placeholder="e.g. 500" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Total winnings (₹)</label>
              <Input value={totalWinnings} onChange={(e) => setTotalWinnings(e.target.value)} placeholder="e.g. 10000000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Instant payouts</label>
              <Input value={instantPayouts} onChange={(e) => setInstantPayouts(e.target.value)} placeholder="e.g. 24/7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Footer</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="text-sm font-medium mb-1.5 block">Footer description / tagline</label>
          <Textarea value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} rows={2} placeholder="Short tagline under logo" />
        </CardContent>
      </Card>

      {/* Theme / Colors (website and player only; hex, rgb, hsl, cmyk, hsv) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Theme / Colors</CardTitle>
          <p className="text-xs text-muted-foreground">Supports hex (#ff0000), rgb, hsl, cmyk, hsv. Applied on website and player only. Leave empty for default theme.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SITE_THEME_KEYS.map((key) => (
              <div key={key}>
                <label className="text-sm font-medium mb-1.5 block">{key.replace(/_/g, " ")}</label>
                <Input
                  value={siteThemeJson[key] ?? ""}
                  onChange={(e) => setSiteThemeJson((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="e.g. #c00 or 220 90% 56% or rgb(255,0,0)"
                  className="font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Promo banners (SiteSetting only; slider slides are on /powerhouse/slider) */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-display">Promo banners</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setPromoBanners((p) => [...p, { title: "", subtitle: "", image: "", cta_label: "Join Now", cta_link: "/register" }])}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {promoBanners.length === 0 && <p className="text-sm text-muted-foreground">No promo slides. Add one to show on the home layout.</p>}
          {promoBanners.map((slide, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">Slide {i + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => setPromoBanners((p) => { const n = [...p]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}><ChevronUp className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={i === promoBanners.length - 1} onClick={() => setPromoBanners((p) => { const n = [...p]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; })}><ChevronDown className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setPromoBanners((p) => p.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Title</label><Input value={slide.title ?? ""} onChange={(e) => setPromoBanners((p) => { const n = [...p]; n[i] = { ...n[i], title: e.target.value }; return n; })} placeholder="Title" /></div>
                <div><label className="text-xs text-muted-foreground">Subtitle</label><Input value={slide.subtitle ?? ""} onChange={(e) => setPromoBanners((p) => { const n = [...p]; n[i] = { ...n[i], subtitle: e.target.value }; return n; })} placeholder="Subtitle" /></div>
                <div><label className="text-xs text-muted-foreground">Image URL</label><Input value={slide.image ?? ""} onChange={(e) => setPromoBanners((p) => { const n = [...p]; n[i] = { ...n[i], image: e.target.value }; return n; })} placeholder="Optional" /></div>
                <div><label className="text-xs text-muted-foreground">CTA label</label><Input value={slide.cta_label ?? ""} onChange={(e) => setPromoBanners((p) => { const n = [...p]; n[i] = { ...n[i], cta_label: e.target.value }; return n; })} placeholder="Join Now" /></div>
                <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">CTA link</label><Input value={slide.cta_link ?? ""} onChange={(e) => setPromoBanners((p) => { const n = [...p]; n[i] = { ...n[i], cta_link: e.target.value }; return n; })} placeholder="/register" /></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live Betting (header ticker + second home) – only managed here */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-display">Live betting / ticker</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={handleLiveBettingAddSection} disabled={liveBettingSaving}>
            <Plus className="h-4 w-4 mr-1" /> Add section
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Events appear in the header ticker and on the second home page. When empty, mock data is shown.</p>
          {liveBettingSections.length === 0 && <p className="text-sm text-muted-foreground">No sections. Add a section (e.g. Cricket), then add events (team1 vs team2, odds).</p>}
          {liveBettingSections.map((sec) => (
            <div key={sec.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                {editingSectionId === sec.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input id={`lb-sec-title-${sec.id}`} defaultValue={sec.title} placeholder="Section title" className="flex-1" />
                    <Button size="sm" onClick={() => handleLiveBettingUpdateSection(sec.id, { title: (document.getElementById(`lb-sec-title-${sec.id}`) as HTMLInputElement)?.value ?? "" })}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingSectionId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium flex items-center gap-1"><ChevronRight className="h-4 w-4" /> {sec.title || "(No title)"}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingSectionId(sec.id)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleLiveBettingDeleteSection(sec.id)} disabled={liveBettingSaving}>Delete</Button>
                      <Button size="sm" variant="outline" onClick={() => setAddingEventSectionId(addingEventSectionId === sec.id ? null : sec.id)}><Plus className="h-3 w-3 mr-1" /> Event</Button>
                    </div>
                  </>
                )}
              </div>
              {addingEventSectionId === sec.id && (
                <div className="rounded bg-muted/50 p-3 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <Input id={`lb-ev-team1-${sec.id}`} placeholder="Team 1" />
                    <Input id={`lb-ev-team2-${sec.id}`} placeholder="Team 2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input id={`lb-ev-sport-${sec.id}`} placeholder="Sport (optional)" />
                    <Input id={`lb-ev-odds-${sec.id}`} placeholder="Odds e.g. 1.92,1.92,2.1" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" id={`lb-ev-live-${sec.id}`} /> Live</label>
                    <Button size="sm" onClick={() => {
                      const t1 = (document.getElementById(`lb-ev-team1-${sec.id}`) as HTMLInputElement)?.value?.trim();
                      const t2 = (document.getElementById(`lb-ev-team2-${sec.id}`) as HTMLInputElement)?.value?.trim();
                      if (!t1 || !t2) { toast({ title: "Team 1 and Team 2 required", variant: "destructive" }); return; }
                      const oddsStr = (document.getElementById(`lb-ev-odds-${sec.id}`) as HTMLInputElement)?.value?.trim();
                      const odds = oddsStr ? oddsStr.split(",").map((n) => parseFloat(n.trim())).filter((n) => !Number.isNaN(n)) : [];
                      handleLiveBettingAddEvent(sec.id, { team1: t1, team2: t2, odds: odds.length ? odds : undefined, is_live: (document.getElementById(`lb-ev-live-${sec.id}`) as HTMLInputElement)?.checked });
                    }}>Add event</Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingEventSectionId(null)}>Cancel</Button>
                  </div>
                </div>
              )}
              <ul className="text-sm space-y-1 pl-2">
                {(sec.events ?? []).map((ev) => (
                  <li key={ev.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                    {editingEventId === ev.id ? (
                      <div className="flex flex-wrap gap-2 items-center flex-1">
                        <Input id={`lb-ed-team1-${ev.id}`} defaultValue={ev.team1} placeholder="Team 1" className="w-28" />
                        <Input id={`lb-ed-team2-${ev.id}`} defaultValue={ev.team2} placeholder="Team 2" className="w-28" />
                        <Input id={`lb-ed-odds-${ev.id}`} defaultValue={ev.odds?.join(", ")} placeholder="Odds" className="w-32" />
                        <Button size="sm" onClick={() => {
                          const t1 = (document.getElementById(`lb-ed-team1-${ev.id}`) as HTMLInputElement)?.value;
                          const t2 = (document.getElementById(`lb-ed-team2-${ev.id}`) as HTMLInputElement)?.value;
                          const o = (document.getElementById(`lb-ed-odds-${ev.id}`) as HTMLInputElement)?.value;
                          handleLiveBettingUpdateEvent(ev.id, { team1: t1, team2: t2, odds: o ? o.split(",").map((n) => parseFloat(n.trim())).filter((n) => !Number.isNaN(n)) : [] });
                        }}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingEventId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <span>{ev.team1} vs {ev.team2} {ev.is_live && "(Live)"}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingEventId(ev.id)}>Edit</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleLiveBettingDeleteEvent(ev.id)}>Delete</Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ---- HOME PAGE SECTION CONFIG ---- */}
      <div className="pt-4">
        <h2 className="font-display font-bold text-lg tracking-tight mb-1">Home page section config</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Configure which categories, games, and providers appear in each home page section, and their titles/icons.
          Link to <Link to="/powerhouse/payment-methods" className="text-primary underline">Payment Methods</Link> to add new methods.
        </p>
      </div>

      {/* All Categories – horizontal slides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">All Categories (horizontal slides)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Select categories to show as horizontal slides, with their SVG and name.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionTitleSvg
            sectionTitle={siteCategoriesJson.section_title ?? ""}
            sectionSvg={siteCategoriesJson.section_svg ?? ""}
            onTitleChange={(v) => setSiteCategoriesJson((s) => ({ ...s, section_title: v }))}
            onSvgChange={(v) => setSiteCategoriesJson((s) => ({ ...s, section_svg: v }))}
          />
          <OrderedIdSelector
            label="categories"
            allItems={allCategories}
            selectedIds={siteCategoriesJson.category_ids ?? []}
            onChange={(ids) => setSiteCategoriesJson((s) => ({ ...s, category_ids: ids }))}
          />
        </CardContent>
      </Card>

      {/* Top Games – big cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Top Games (big cards)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Show name, provider, category with full card images. If empty, falls back to is_top_game flag.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionTitleSvg
            sectionTitle={siteTopGamesJson.section_title ?? ""}
            sectionSvg={siteTopGamesJson.section_svg ?? ""}
            onTitleChange={(v) => setSiteTopGamesJson((s) => ({ ...s, section_title: v }))}
            onSvgChange={(v) => setSiteTopGamesJson((s) => ({ ...s, section_svg: v }))}
          />
          <OrderedIdSelector
            label="games"
            allItems={allGames}
            selectedIds={siteTopGamesJson.game_ids ?? []}
            onChange={(ids) => setSiteTopGamesJson((s) => ({ ...s, game_ids: ids }))}
          />
        </CardContent>
      </Card>

      {/* Providers – horizontal slides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Providers (horizontal slides)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Select providers in order. Shown with irregular shape image and name. Falls back to all providers.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionTitleSvg
            sectionTitle={siteProvidersJson.section_title ?? ""}
            sectionSvg={siteProvidersJson.section_svg ?? ""}
            onTitleChange={(v) => setSiteProvidersJson((s) => ({ ...s, section_title: v }))}
            onSvgChange={(v) => setSiteProvidersJson((s) => ({ ...s, section_svg: v }))}
          />
          <OrderedIdSelector
            label="providers"
            allItems={allProviders}
            selectedIds={siteProvidersJson.provider_ids ?? []}
            onChange={(ids) => setSiteProvidersJson((s) => ({ ...s, provider_ids: ids }))}
          />
        </CardContent>
      </Card>

      {/* Categories as section titles with game card lists */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Categories → Game Card Lists</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Each category becomes a section title (with SVG icon). Mobile: 2 cards visible, rest slide. Select categories and their games in order.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionTitleSvg
            sectionTitle={siteCategoriesGameJson.section_title ?? ""}
            sectionSvg={siteCategoriesGameJson.section_svg ?? ""}
            onTitleChange={(v) => setSiteCategoriesGameJson((s) => ({ ...s, section_title: v }))}
            onSvgChange={(v) => setSiteCategoriesGameJson((s) => ({ ...s, section_svg: v }))}
          />
          <CategoryGamesEditor
            allCategories={allCategories}
            allGames={allGames}
            value={siteCategoriesGameJson.categories ?? []}
            onChange={(cats) => setSiteCategoriesGameJson((s) => ({ ...s, categories: cats }))}
          />
        </CardContent>
      </Card>

      {/* Popular Games – big cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Popular Games (big cards)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Show name, provider, category with full card images. Falls back to is_popular_game flag.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionTitleSvg
            sectionTitle={sitePopularGamesJson.section_title ?? ""}
            sectionSvg={sitePopularGamesJson.section_svg ?? ""}
            onTitleChange={(v) => setSitePopularGamesJson((s) => ({ ...s, section_title: v }))}
            onSvgChange={(v) => setSitePopularGamesJson((s) => ({ ...s, section_svg: v }))}
          />
          <OrderedIdSelector
            label="games"
            allItems={allGames}
            selectedIds={sitePopularGamesJson.game_ids ?? []}
            onChange={(ids) => setSitePopularGamesJson((s) => ({ ...s, game_ids: ids }))}
          />
        </CardContent>
      </Card>

      {/* Payments Accepted */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Payments Accepted</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Select payment methods to show. Home page shows only images; footer shows names + images.
            Manage methods at <Link to="/powerhouse/payment-methods" className="text-primary underline">Payment Methods</Link>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionTitleSvg
            sectionTitle={sitePaymentsAcceptedJson.section_title ?? ""}
            sectionSvg={sitePaymentsAcceptedJson.section_svg ?? ""}
            onTitleChange={(v) => setSitePaymentsAcceptedJson((s) => ({ ...s, section_title: v }))}
            onSvgChange={(v) => setSitePaymentsAcceptedJson((s) => ({ ...s, section_svg: v }))}
          />
          <OrderedIdSelector
            label="payment methods"
            allItems={allPaymentMethods}
            selectedIds={sitePaymentsAcceptedJson.payment_method_ids ?? []}
            onChange={(ids) => setSitePaymentsAcceptedJson((s) => ({ ...s, payment_method_ids: ids }))}
          />
        </CardContent>
      </Card>

      <Button className="w-full max-w-xs font-display" size="lg" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save all settings"}
      </Button>
    </div>
  );
};

export default PowerhouseSiteSettings;
