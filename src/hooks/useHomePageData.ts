import { useQuery } from "@tanstack/react-query";
import { getSiteSetting, getTestimonials, getCmsFooterPages } from "@/api/site";
import { getGames, getCategories, getProviders, getGameImageUrl, type Game, type GameCategory, type GameProvider } from "@/api/games";
import { getComingSoon } from "@/api/site";
import { getBonusRules, mapBonusRulesToPromoShapes } from "@/api/bonus";
import { getMediaUrl } from "@/lib/api";
import type {
  HeroData,
  GameCardShape,
  PromoShape,
  CategoryShape,
  ProviderShape,
  ComingSoonShape,
  TestimonialShape,
  RecentWinShape,
} from "@/data/homePageMockData";
import {
  hero as defaultHero,
  heroStats as defaultHeroStats,
  featuredGames as defaultFeaturedGames,
  promosGrid as defaultPromosGrid,
  tournamentPromo as defaultTournamentPromo,
  cashbackPromo as defaultCashbackPromo,
  categories as defaultCategories,
  gamesByCategory as defaultGamesByCategory,
  providers as defaultProviders,
  comingSoon as defaultComingSoon,
  testimonials as defaultTestimonials,
  recentWins as defaultRecentWins,
  liveOddsTicker,
  footerContact as defaultFooterContact,
  footerLinks as defaultFooterLinks,
  paymentMethods as defaultPaymentMethods,
} from "@/data/homePageMockData";

const FEATURED_GAMES_COUNT = 12;
const PROVIDER_COLORS = [
  "from-orange-500 to-red-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-green-500 to-emerald-600",
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-500",
  "from-yellow-500 to-amber-500",
  "from-teal-500 to-cyan-500",
];

/** Map category name to slug for CategoryCard color/icon theme (crash=cyan, casino=purple, etc.). */
export function slugFromCategoryName(name: string): string {
  const map: Record<string, string> = {
    crash: "crash",
    casino: "casino",
    "live casino": "liveCasino",
    sports: "sports",
    casual: "casual",
  };
  const lower = name?.toLowerCase().trim() ?? "";
  const slugified = lower.replace(/\s+/g, "").replace(/[^a-z0-9]/gi, "") || "other";
  return map[lower] ?? slugified;
}

function mapGameToCardShape(game: Game, index: number): GameCardShape {
  const minBet = Number(game.min_bet) || 0;
  const maxBet = Number(game.max_bet) || 0;
  return {
    id: String(game.id),
    name: game.name,
    image: getGameImageUrl(game),
    category: game.category_name ?? "",
    players: 0,
    minBet,
    maxBet,
    rating: 4.5,
    isHot: index < 2,
    isNew: index < 3,
    provider: game.provider_name ?? game.provider_code ?? "",
  };
}

function mapPromoBannerToShape(item: Record<string, unknown>, index: number): PromoShape {
  const variants: PromoShape["variant"][] = ["welcome", "referral", "tournament", "cashback"];
  return {
    variant: variants[index % 4],
    badge: (item.badge as string) ?? "",
    title: (item.title as string) ?? "",
    highlight: (item.highlight as string) ?? "",
    subtitle: (item.subtitle as string) ?? "",
    description: (item.description as string) ?? "",
    cta: (item.cta_label as string) ?? (item.cta as string) ?? "Learn More",
    href: (item.cta_link as string) ?? (item.href as string) ?? "/promotions",
  };
}

function maskUser(str: string): string {
  if (!str || str.length <= 2) return str;
  return str[0] + "*".repeat(Math.min(str.length - 2, 3)) + str[str.length - 1];
}

function mapBiggestWinToRecentWin(item: Record<string, unknown>, index: number): RecentWinShape {
  const times = ["1 min ago", "2 min ago", "3 min ago", "5 min ago", "7 min ago", "9 min ago"];
  const player = (item.player as string) ?? `P${index}`;
  return {
    user: maskUser(player),
    game: (item.game as string) ?? "",
    amount: typeof item.amount === "string" ? item.amount : `₹${item.amount ?? "0"}`,
    time: (item.time as string) ?? times[index % times.length],
  };
}

/**
 * Build hero and heroStats from SiteSetting API response (models.SiteSetting fields 833–842).
 * Use for dynamic hero section when rest of page is static.
 */
export function buildHeroFromSiteSetting(site: Record<string, unknown> | null | undefined): {
  hero: HeroData;
  heroStats: { label: string; value: string; icon: string }[];
} {
  if (!site || typeof site !== "object") {
    return { hero: defaultHero, heroStats: [...defaultHeroStats] };
  }
  const hero: HeroData = {
    badge: (site.hero_badge as string) ?? defaultHero.badge,
    title: (site.hero_title as string)?.trim() || defaultHero.title,
    subtitle: (site.hero_subtitle as string)?.trim() || defaultHero.subtitle,
    ctaText: (site.hero_cta_text as string) ?? defaultHero.ctaText,
    ctaHref: (site.hero_cta_href as string) ?? defaultHero.ctaHref,
  };
  const homeStatsRaw =
    Array.isArray(site.home_stats) && site.home_stats.length > 0
      ? (site.home_stats as { label?: string; value?: string; icon?: string }[])
      : null;
  const heroStats = homeStatsRaw?.length
    ? homeStatsRaw.map((s) => ({ label: s.label ?? "", value: s.value ?? "", icon: s.icon ?? "trophy" }))
    : [
        { label: "Active Players", value: site.active_players != null ? `${Number(site.active_players)}` : "50K+", icon: "users" },
        { label: "Games", value: site.games_available != null ? `${Number(site.games_available)}+` : "500+", icon: "gamepad" },
        { label: "Total Winnings", value: site.total_winnings != null ? `₹${Number(site.total_winnings).toLocaleString()}` : "₹10Cr+", icon: "trophy" },
        { label: "Instant Payouts", value: site.instant_payouts != null ? `${site.instant_payouts}` : "24/7", icon: "zap" },
      ];
  return { hero, heroStats };
}

export interface HomePageData {
  hero: HeroData;
  heroStats: { label: string; value: string; icon: string }[];
  featuredGames: GameCardShape[];
  /** When set (e.g. from site_top_games_json.section_title), overrides "Top Picks for You" heading */
  featuredGamesSectionTitle?: string;
  /** When set (e.g. from site config), overrides the Top Picks subtitle */
  featuredGamesSectionSubtitle?: string;
  promosGrid: PromoShape[];
  tournamentPromo: PromoShape;
  cashbackPromo: PromoShape;
  categories: CategoryShape[];
  /** When set, AllGameCategories uses this list in API order (from categories_game); else uses categories. */
  categoriesForAllSections?: CategoryShape[];
  gamesByCategory: Record<string, GameCardShape[]>;
  /** Per-category overrides from site_categories_game_json (section_title, section_icon). Key = category id. */
  categorySectionOverrides?: Record<number, { section_title?: string; section_icon?: string }>;
  providers: ProviderShape[];
  testimonials: TestimonialShape[];
  recentWins: RecentWinShape[];
  comingSoon: ComingSoonShape[];
  liveOddsTicker: typeof liveOddsTicker;
  footerContact: { phone: string; email: string; whatsapp: string; tagline: string };
  footerLinks: typeof defaultFooterLinks;
  paymentMethods: string[];
}

export function useHomePageData(): {
  data: HomePageData;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { data: siteSetting = {}, isLoading: siteLoading, isError: siteError, refetch: refetchSite } = useQuery({
    queryKey: ["siteSetting"],
    queryFn: getSiteSetting,
  });
  const { data: gamesResp, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ["games", "home-data"],
    queryFn: () => getGames(undefined, undefined, 1, 200),
  });
  const games: Game[] = Array.isArray(gamesResp?.results) ? (gamesResp.results as Game[]) : [];
  const { data: categoriesRaw = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const categories = Array.isArray(categoriesRaw) ? (categoriesRaw as GameCategory[]) : [];
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });
  const { data: testimonialsApi = [], isLoading: testimonialsLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: getTestimonials,
  });
  const { data: cmsFooter = [] } = useQuery({
    queryKey: ["cmsFooter"],
    queryFn: getCmsFooterPages,
  });
  const { data: comingSoonApi } = useQuery({
    queryKey: ["comingSoon"],
    queryFn: getComingSoon,
  });
  const { data: bonusRules = [] } = useQuery({
    queryKey: ["bonusRules"],
    queryFn: getBonusRules,
  });

  const isLoading = siteLoading || gamesLoading || categoriesLoading || providersLoading || testimonialsLoading;
  const isError = siteError || gamesError;

  const site = siteSetting as Record<string, unknown>;

  const hero: HeroData = {
    badge: (site.hero_badge as string) ?? defaultHero.badge,
    title: (site.hero_title as string)?.trim() || defaultHero.title,
    subtitle: (site.hero_subtitle as string)?.trim() || defaultHero.subtitle,
    ctaText: (site.hero_cta_text as string) ?? defaultHero.ctaText,
    ctaHref: (site.hero_cta_href as string) ?? defaultHero.ctaHref,
  };

  const homeStatsRaw = Array.isArray(site.home_stats) && site.home_stats.length > 0
    ? (site.home_stats as { label?: string; value?: string; icon?: string }[])
    : null;
  const heroStats = homeStatsRaw?.length
    ? homeStatsRaw.map((s) => ({ label: s.label ?? "", value: s.value ?? "", icon: s.icon ?? "trophy" }))
    : [
        { label: "Active Players", value: site.active_players != null ? `${Number(site.active_players)}` : "50K+", icon: "users" },
        { label: "Games", value: site.games_available != null ? `${Number(site.games_available)}+` : "500+", icon: "gamepad" },
        { label: "Total Winnings", value: site.total_winnings != null ? `₹${Number(site.total_winnings).toLocaleString()}` : "₹10Cr+", icon: "trophy" },
        { label: "Instant Payouts", value: site.instant_payouts != null ? `${site.instant_payouts}` : "24/7", icon: "zap" },
      ];
  if (!heroStats[0]?.value) {
    heroStats.splice(0, heroStats.length, ...defaultHeroStats);
  }

  const featuredGames: GameCardShape[] =
    games.length > 0
      ? games.slice(0, FEATURED_GAMES_COUNT).map((g, i) => mapGameToCardShape(g as Game, i))
      : defaultFeaturedGames as GameCardShape[];

  const bonusPromos =
    bonusRules.length > 0 ? mapBonusRulesToPromoShapes(bonusRules) : [];
  const promoBannersRaw = Array.isArray(site.promo_banners) ? (site.promo_banners as Record<string, unknown>[]) : [];
  const promosGrid: PromoShape[] =
    bonusPromos.length > 0
      ? bonusPromos
      : promoBannersRaw.length >= 2
        ? promoBannersRaw.slice(0, 2).map(mapPromoBannerToShape)
        : defaultPromosGrid;
  const tournamentPromo: PromoShape =
    promoBannersRaw.length >= 3 ? mapPromoBannerToShape(promoBannersRaw[2], 2) : defaultTournamentPromo;
  const cashbackPromo: PromoShape =
    promoBannersRaw.length >= 4 ? mapPromoBannerToShape(promoBannersRaw[3], 3) : defaultCashbackPromo;

  const categoryIdToSlug: Record<number, string> = {};
  const categoriesMapped: CategoryShape[] =
    categories.length > 0
      ? (categories as GameCategory[]).map((c) => {
          const slug = slugFromCategoryName(c.name);
          categoryIdToSlug[c.id] = slug;
          const count = typeof (c as GameCategory).games_count === "number"
            ? (c as GameCategory).games_count
            : games.filter((g: Game) => g.category === c.id).length;
          const iconPath = c.icon?.trim() || c.svg?.trim();
          const icon = iconPath ? getMediaUrl(iconPath) : undefined;
          return { slug, label: c.name, count, id: c.id, icon };
        })
      : defaultCategories;

  const GAMES_PER_CATEGORY = 10;
  const gamesByCategory: Record<string, GameCardShape[]> = {};
  if (games.length > 0 && categories.length > 0) {
    (categories as GameCategory[]).forEach((c) => {
      const slug = categoryIdToSlug[c.id] ?? slugFromCategoryName(c.name);
      const catGames = games.filter((g: Game) => g.category === c.id).slice(0, GAMES_PER_CATEGORY);
      gamesByCategory[slug] = catGames.map((g, i) => mapGameToCardShape(g as Game, i));
    });
  }
  const gamesByCategoryFinal =
    Object.keys(gamesByCategory).length > 0 ? gamesByCategory : defaultGamesByCategory;

  const providerGamesCount: Record<number, number> = {};
  (games as Game[]).forEach((g) => {
    providerGamesCount[g.provider] = (providerGamesCount[g.provider] ?? 0) + 1;
  });
  const providersMapped: ProviderShape[] =
    providers.length > 0
      ? (providers as GameProvider[]).map((p, i) => ({
          id: p.id,
          name: p.name,
          logo: (p.code ?? p.name.slice(0, 2).toUpperCase()).slice(0, 2),
          logoImage: p.image?.trim() ? getMediaUrl(p.image.trim()) : undefined,
          games: providerGamesCount[p.id] ?? 0,
          color: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
          single_game_id: p.single_game_id ?? undefined,
        }))
      : defaultProviders;

  const testimonialsMapped: TestimonialShape[] =
    testimonialsApi.length > 0
      ? (testimonialsApi as { id?: number; name?: string; testimonial_from?: string; message?: string; stars?: number; game_name?: string; image?: string }[]).map((t, i) => ({
          id: t.id ?? i,
          name: t.name ?? "Player",
          avatar: t.image ? getMediaUrl(t.image) : (t.name ?? "P").slice(0, 2).toUpperCase(),
          location: (t as { testimonial_from?: string }).testimonial_from,
          game: t.game_name,
          amount: undefined,
          message: t.message ?? "",
          rating: t.stars ?? 5,
        }))
      : defaultTestimonials;

  const biggestWinsRaw = Array.isArray(site.biggest_wins) ? (site.biggest_wins as Record<string, unknown>[]) : [];
  const recentWins: RecentWinShape[] =
    biggestWinsRaw.length > 0
      ? biggestWinsRaw.map(mapBiggestWinToRecentWin)
      : defaultRecentWins;

  const footerContact = {
    phone: Array.isArray(site.phones) && site.phones.length > 0 ? String(site.phones[0]) : defaultFooterContact.phone,
    email: Array.isArray(site.emails) && site.emails.length > 0 ? String(site.emails[0]) : defaultFooterContact.email,
    whatsapp: (site.whatsapp_number as string)?.trim() || defaultFooterContact.whatsapp,
    tagline: (site.footer_description as string)?.trim() || defaultFooterContact.tagline,
  };

  const cmsPages = cmsFooter as { id?: number; title?: string; slug?: string }[];
  const footerLinks =
    cmsPages.length > 0
      ? {
          games: defaultFooterLinks.games,
          support: defaultFooterLinks.support,
          legal: cmsPages.map((p) => ({ label: p.title ?? "", href: `/page/${p.slug ?? ""}` })),
          about: defaultFooterLinks.about,
        }
      : defaultFooterLinks;

  const data: HomePageData = {
    hero,
    heroStats,
    featuredGames,
    promosGrid,
    tournamentPromo,
    cashbackPromo,
    categories: categoriesMapped,
    gamesByCategory: gamesByCategoryFinal,
    providers: providersMapped,
    testimonials: testimonialsMapped,
    recentWins,
    comingSoon: Array.isArray(comingSoonApi) && comingSoonApi.length > 0 ? (comingSoonApi as ComingSoonShape[]) : defaultComingSoon,
    liveOddsTicker,
    footerContact,
    footerLinks,
    paymentMethods: defaultPaymentMethods,
  };

  const refetch = () => {
    refetchSite();
    refetchGames();
  };

  return { data, isLoading, isError, refetch };
}

/**
 * Static-only home page data (no API). Use for first home variant (maitidevi clone).
 */
export function useHomePageStaticData(): {
  data: HomePageData;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const data: HomePageData = {
    hero: defaultHero,
    heroStats: defaultHeroStats,
    featuredGames: defaultFeaturedGames,
    promosGrid: defaultPromosGrid,
    tournamentPromo: defaultTournamentPromo,
    cashbackPromo: defaultCashbackPromo,
    categories: defaultCategories,
    gamesByCategory: defaultGamesByCategory,
    providers: defaultProviders,
    testimonials: defaultTestimonials,
    recentWins: defaultRecentWins,
    comingSoon: defaultComingSoon,
    liveOddsTicker,
    footerContact: defaultFooterContact,
    footerLinks: defaultFooterLinks,
    paymentMethods: defaultPaymentMethods,
  };
  return {
    data,
    isLoading: false,
    isError: false,
    refetch: () => {},
  };
}