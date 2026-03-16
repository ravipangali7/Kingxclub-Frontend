import { useQuery } from "@tanstack/react-query";
import { getSiteSetting, getSliderSlides, getLiveBettingSections, getTestimonials, getPublicPaymentMethods, getSecondHomeSections, type LiveBettingSectionApi, type PublicPaymentMethod, type SecondHomeSectionGame } from "@/api/site";
import { getCategories, getGameImageUrl, type Game, type GameCategory } from "@/api/games";
import { getComingSoon } from "@/api/site";
import { getBonusRules, mapBonusRulesToPromoShapes } from "@/api/bonus";
import { getMediaUrl } from "@/lib/api";
import type { ProviderShape, GameCardShape, PromoShape, TestimonialShape, ComingSoonShape } from "@/data/homePageMockData";
import { comingSoon as defaultComingSoon, testimonials as defaultTestimonials } from "@/data/homePageMockData";

export interface SliderSlide {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  ctaText: string;
  ctaHref: string;
}

export interface LiveBettingEvent {
  id: string;
  sport?: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  odds: number[];
  isLive?: boolean;
}

export interface LiveBettingSection {
  title: string;
  events: LiveBettingEvent[];
}

export interface SectionMeta {
  title?: string;
  subtitle?: string;
  svg?: string;
}

/** All categories section driven by site_categories_json. */
export interface AllCategoriesSection {
  title?: string;
  svg?: string;
  categories: GameCategory[];
}

export interface SecondHomePageData {
  sliderSlides: SliderSlide[];
  categories: GameCategory[];
  /** Ordered categories list for All Categories section (from site_categories_json). */
  allCategoriesSection: AllCategoriesSection;
  providers: GameProvider[];
  providerCards: ProviderShape[];
  liveBettingSections: LiveBettingSection[];
  topLiveGames: GameCardShape[];
  otherGames: GameCardShape[];
  /** All top games from admin list (second-home-sections), same order as configured. */
  topGames: GameCardShape[];
  /** Games marked is_popular_game for Popular Games section. */
  popularGames: GameCardShape[];
  /** Games grouped by category id for category-wise rows. */
  gamesByCategory: Record<number, GameCardShape[]>;
  /** Per-category overrides for section title and icon (from site_categories_game_json). */
  categorySectionOverrides: Record<number, { section_title?: string; section_icon?: string }>;
  sportsIframeUrl: string;
  /** Welcome + Deposit promos (Bonus section). */
  welcomeDepositPromos: PromoShape[];
  /** Refer & Earn promos. */
  promosGrid: PromoShape[];
  tournamentPromo: PromoShape | null;
  cashbackPromo: PromoShape | null;
  comingSoon: ComingSoonShape[];
  testimonials: TestimonialShape[];
  /** Payment methods accepted (from public API, filtered/ordered by backend using site_payments_accepted_json). */
  paymentMethods: PublicPaymentMethod[];
  /** Section meta (title, svg) for site-JSON-driven sections only. */
  sectionMeta: {
    allCategories: SectionMeta;
    topGames: SectionMeta;
    providers: SectionMeta;
    categoriesGame: SectionMeta;
    popularGames: SectionMeta;
    paymentsAccepted: SectionMeta;
  };
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

/** Map backend second-home section game to GameCardShape (direct from API). Exported for TopGamesPage. */
export function mapSectionGameToCardShape(item: SecondHomeSectionGame, index: number): GameCardShape {
  return {
    id: String(item.id),
    name: item.name,
    image: item.image ?? "",
    category: item.category ?? "",
    players: 0,
    minBet: item.min_bet ?? 0,
    maxBet: item.max_bet ?? 0,
    rating: 4.5,
    isHot: index < 2,
    isNew: index < 3,
    provider: item.provider ?? "",
    link: item.link ?? "",
  };
}

const TOP_LIVE_COUNT = 12;
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

function mapSliderApiToSlide(s: { id: number; title: string; subtitle?: string; image?: string; cta_label?: string | null; cta_link?: string | null }): SliderSlide {
  const ctaLabel = (s.cta_label != null && s.cta_label !== undefined) ? String(s.cta_label).trim() : "";
  const ctaLink = (s.cta_link != null && s.cta_link !== undefined) ? String(s.cta_link).trim() : "";
  return {
    id: String(s.id),
    title: s.title ?? "",
    subtitle: s.subtitle,
    image: (s.image as string)?.trim() ? getMediaUrl((s.image as string).trim()) : undefined,
    ctaText: ctaLabel,
    ctaHref: ctaLink,
  };
}

function defaultSliderSlides(site: Record<string, unknown>): SliderSlide[] {
  const heroTitle = (site.hero_title as string)?.trim() || "CRICKET CHAMPIONSHIP - T20 WORLD CUP MADNESS BEGINS - THE COUNTDOWN IS OVER";
  const promoBanners = Array.isArray(site.promo_banners) ? (site.promo_banners as Record<string, unknown>[]) : [];
  if (promoBanners.length > 0) {
    return promoBanners.slice(0, 5).map((p, i) => {
      const ctaLabel = (p.cta_label != null && p.cta_label !== undefined) ? String(p.cta_label).trim() : (p.cta != null && p.cta !== undefined) ? String(p.cta).trim() : "";
      const ctaLink = (p.cta_link != null && p.cta_link !== undefined) ? String(p.cta_link).trim() : (p.href != null && p.href !== undefined) ? String(p.href).trim() : "";
      return {
        id: `slide-${i}`,
        title: (p.title as string) ?? heroTitle,
        subtitle: (p.subtitle as string) ?? "Join now and enjoy live sports betting and casino games.",
        image: (p.image as string)?.trim() ? getMediaUrl((p.image as string).trim()) : undefined,
        ctaText: ctaLabel,
        ctaHref: ctaLink,
      };
    });
  }
  return [
    {
      id: "slide-default",
      title: heroTitle,
      subtitle: "Join now and enjoy live sports betting and casino games.",
      ctaText: "",
      ctaHref: "",
    },
  ];
}

function mapLiveBettingApiToSections(sections: LiveBettingSectionApi[]): LiveBettingSection[] {
  return sections.slice(0, 10).map((sec) => ({
    title: sec.title ?? "",
    events: (sec.events ?? []).map((ev) => ({
      id: String(ev.id),
      sport: ev.sport,
      team1: ev.team1 ?? "",
      team2: ev.team2 ?? "",
      date: ev.event_date ?? "",
      time: ev.event_time ?? "",
      odds: Array.isArray(ev.odds) ? ev.odds : [],
      isLive: !!ev.is_live,
    })),
  }));
}

function defaultLiveBettingSections(site: Record<string, unknown>): LiveBettingSection[] {
  const raw = site.live_betting ?? site.home_live_events;
  if (Array.isArray(raw) && raw.length >= 3) {
    return (raw as LiveBettingSection[]).slice(0, 3).map((s, i) => ({
      title: s.title ?? `Live Betting ${i + 1}`,
      events: Array.isArray(s.events) ? s.events : [],
    }));
  }
  return [
    {
      title: "Cricket",
      events: [
        { id: "c1", sport: "Cricket", team1: "Pakistan", team2: "Sri Lanka", date: "19 Mar 2026", time: "23:00", odds: [1.92, 1.92, 2.1], isLive: true },
        { id: "c2", sport: "Cricket", team1: "India", team2: "Australia", date: "20 Mar 2026", time: "14:30", odds: [1.7, 1.9, 1.9] },
      ],
    },
    {
      title: "Football",
      events: [
        { id: "f1", sport: "Soccer", team1: "Team A", team2: "Team B", date: "19 Mar 2026", time: "20:00", odds: [2.0, 3.2, 3.5], isLive: true },
        { id: "f2", sport: "Soccer", team1: "Team C", team2: "Team D", date: "19 Mar 2026", time: "22:00", odds: [1.85, 3.4, 4.0] },
      ],
    },
    {
      title: "Tennis",
      events: [
        { id: "t1", sport: "Tennis", team1: "Player 1", team2: "Player 2", date: "19 Mar 2026", time: "18:00", odds: [1.85, 2.0, 2.1], isLive: true },
        { id: "t2", sport: "Tennis", team1: "Player 3", team2: "Player 4", date: "20 Mar 2026", time: "12:00", odds: [1.9, 1.95, 2.05] },
      ],
    },
  ];
}

export function useSecondHomePageData(): {
  data: SecondHomePageData;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { data: siteSetting = {}, isLoading: siteLoading, isError: siteError, refetch: refetchSite } = useQuery({
    queryKey: ["siteSetting"],
    queryFn: getSiteSetting,
  });
  const { data: sliderSlidesApi = [], isLoading: sliderLoading } = useQuery({
    queryKey: ["sliderSlides"],
    queryFn: getSliderSlides,
  });
  const { data: liveBettingApi = [], isLoading: liveBettingLoading } = useQuery({
    queryKey: ["liveBettingSections"],
    queryFn: getLiveBettingSections,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  /** Single source for second-home providers, top games, category-wise games, popular games (names, image URLs, links from backend). */
  const { data: sectionsData, isLoading: sectionsLoading, isError: sectionsError, refetch: refetchSections } = useQuery({
    queryKey: ["second-home-sections"],
    queryFn: getSecondHomeSections,
  });
  const { data: testimonialsApi = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: getTestimonials,
  });
  const { data: comingSoonApi } = useQuery({
    queryKey: ["comingSoon"],
    queryFn: getComingSoon,
  });
  const { data: bonusRules = [] } = useQuery({
    queryKey: ["bonusRules"],
    queryFn: getBonusRules,
  });
  const { data: publicPaymentMethodsApi = [] } = useQuery({
    queryKey: ["publicPaymentMethods"],
    queryFn: getPublicPaymentMethods,
  });
  const categoriesList = Array.isArray(categories) ? (categories as GameCategory[]) : [];

  const isLoading = siteLoading || sliderLoading || liveBettingLoading || categoriesLoading || sectionsLoading;
  const site = (siteSetting as Record<string, unknown>) ?? {};

  // Parse site JSON section configs
  const parseSiteSection = (key: string): Record<string, unknown> => {
    const val = site[key];
    return (val && typeof val === "object" && !Array.isArray(val)) ? (val as Record<string, unknown>) : {};
  };
  const siteCategoriesJson = parseSiteSection("site_categories_json");
  const siteTopGamesJson = parseSiteSection("site_top_games_json");
  const siteProvidersJson = parseSiteSection("site_providers_json");
  const siteCategoriesGameJson = parseSiteSection("site_categories_game_json");
  const sitePopularGamesJson = parseSiteSection("site_popular_games_json");
  const siteComingSoonJson = parseSiteSection("site_coming_soon_json");
  const siteReferBonusJson = parseSiteSection("site_refer_bonus_json");
  const sitePaymentsAcceptedJson = parseSiteSection("site_payments_accepted_json");
  const siteWelcomeDepositJson = parseSiteSection("site_welcome_deposit_json");

  const getSectionMeta = (json: Record<string, unknown>): SectionMeta => ({
    title: (json.section_title as string) || undefined,
    subtitle: (json.section_subtitle as string) || (json.subtitle as string) || undefined,
    svg: (json.section_svg as string) || undefined,
  });

  const liveBettingSections: LiveBettingSection[] =
    Array.isArray(liveBettingApi) && liveBettingApi.length > 0
      ? mapLiveBettingApiToSections(liveBettingApi)
      : defaultLiveBettingSections(site);
  const sliderSlides: SliderSlide[] =
    Array.isArray(sliderSlidesApi) && sliderSlidesApi.length > 0
      ? sliderSlidesApi.map(mapSliderApiToSlide)
      : defaultSliderSlides(site);

  // Build provider/top/category-wise/popular sections directly from backend second-home-sections API (exact names, image URLs, links).
  const providerCards: ProviderShape[] = sectionsData?.providers?.items?.length
    ? (sectionsData.providers.items.map((p, i) => ({
        id: p.id,
        name: p.name,
        logo: p.logo ?? (p.name?.slice(0, 2).toUpperCase() || ""),
        logoImage: p.logo_image ?? undefined,
        games: p.games ?? 0,
        color: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
        single_game_id: p.single_game_id ?? undefined,
        link: p.link ?? undefined,
      })) as ProviderShape[])
    : [];
  const topGames: GameCardShape[] = sectionsData?.top_games?.items?.length
    ? sectionsData.top_games.items.map((g, i) => mapSectionGameToCardShape(g, i))
    : [];
  const popularGames: GameCardShape[] = sectionsData?.popular_games?.items?.length
    ? sectionsData.popular_games.items.map((g, i) => mapSectionGameToCardShape(g, i))
    : [];
  const gamesByCategory: Record<number, GameCardShape[]> = {};
  const categorySectionOverrides: Record<number, { section_title?: string; section_icon?: string }> = {};
  let orderedCategoriesList: GameCategory[] = [];
  if (sectionsData?.categories_game?.categories?.length) {
    for (const cat of sectionsData.categories_game.categories) {
      orderedCategoriesList.push({
        id: cat.category_id,
        name: cat.section_title || String(cat.category_id),
        is_active: true,
      } as GameCategory);
      gamesByCategory[cat.category_id] = cat.games.map((g, i) => mapSectionGameToCardShape(g, i));
      if (cat.section_title?.trim() || cat.section_icon?.trim()) {
        categorySectionOverrides[cat.category_id] = {
          ...(cat.section_title?.trim() && { section_title: cat.section_title }),
          ...(cat.section_icon?.trim() && { section_icon: cat.section_icon }),
        };
      }
    }
  }
  const topLiveGames: GameCardShape[] = [];
  const otherGames: GameCardShape[] = [];

  // Payment methods: filtered/ordered by backend (payment_methods_list respects site_payments_accepted_json)
  const paymentMethods: PublicPaymentMethod[] = publicPaymentMethodsApi as PublicPaymentMethod[];

  // Section meta from backend response (or fallback from site JSON when no sections API)
  const sectionMetaFromSections = sectionsData
    ? {
        providers: {
          title: sectionsData.providers?.section_title,
          subtitle: sectionsData.providers?.section_subtitle,
          svg: sectionsData.providers?.section_svg,
        },
        topGames: { title: sectionsData.top_games?.section_title, svg: sectionsData.top_games?.section_svg },
        categoriesGame: { title: sectionsData.categories_game?.section_title, svg: sectionsData.categories_game?.section_svg },
        popularGames: { title: sectionsData.popular_games?.section_title, svg: sectionsData.popular_games?.section_svg },
      }
    : null;

  // All Categories: show only selected categories in configured order
  const siteCategoryIds = Array.isArray(siteCategoriesJson.category_ids) ? (siteCategoriesJson.category_ids as number[]) : [];
  const allCategoriesOrdered: GameCategory[] = siteCategoryIds.length > 0
    ? siteCategoryIds.map((id) => categoriesList.find((c) => c.id === id)).filter(Boolean) as GameCategory[]
    : categoriesList;
  const allCategoriesMeta = getSectionMeta(siteCategoriesJson);
  const allCategoriesSection = {
    title: allCategoriesMeta.title,
    svg: allCategoriesMeta.svg,
    categories: allCategoriesOrdered,
  };

  const sportsIframeUrl = (site.sports_iframe_url as string)?.trim() || "https://sprodm.uni247.xyz/?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNWRmOTZiZjUtNGU2ZC00MWIyLWFmOGMtMTU5MTRmZjgyZjBjIiwicGxheWVyX2lkIjoiaGI1ZjQ5MTI2U1RBUiIsIm1lcmNoYW50X2NvZGUiOiJjbXQtaGQtc3ViLTg4MHIyYmYiLCJpc3N1ZWRfYXQiOiIyMDI2LTAyLTIzVDEwOjM5OjQyLjAyNjgyMDA2MloiLCJleHBpcmVzX2F0IjoiMjAyNi0wMi0yM1QxMzozOTo0Mi4wMjY4MjAxMjJaIiwibGFuZ3VhZ2UiOiJlbiJ9.5W0ZztMElPLnVqvFwaqh3ehaIhQYVieBe2FwnDMNNDw#/";

  const bonusPromos = bonusRules.length > 0 ? mapBonusRulesToPromoShapes(bonusRules) : [];
  const welcomeDepositPromos: PromoShape[] = bonusPromos.filter(
    (p) => p.variant === "welcome" || p.variant === "deposit"
  );
  const referOnlyPromos: PromoShape[] = bonusPromos.filter((p) => p.variant === "referral");
  const promoBannersRaw = Array.isArray(site.promo_banners) ? (site.promo_banners as Record<string, unknown>[]) : [];
  const promosGrid: PromoShape[] =
    bonusPromos.length > 0
      ? referOnlyPromos
      : promoBannersRaw.length >= 2
        ? promoBannersRaw.slice(0, 2).map((p, i) => ({
            variant: (["welcome", "deposit", "referral", "tournament", "cashback"] as const)[i % 5],
            badge: (p.badge as string) ?? "",
            title: (p.title as string) ?? "",
            highlight: (p.highlight as string) ?? "",
            subtitle: (p.subtitle as string) ?? "",
            description: (p.description as string) ?? "",
            cta: (p.cta_label as string) ?? (p.cta as string) ?? "Learn More",
            href: (p.cta_link as string) ?? (p.href as string) ?? "/promotions",
          }))
        : [];
  const tournamentPromo: PromoShape | null = promoBannersRaw.length >= 3
    ? {
        variant: "tournament",
        badge: (promoBannersRaw[2].badge as string) ?? "",
        title: (promoBannersRaw[2].title as string) ?? "",
        highlight: (promoBannersRaw[2].highlight as string) ?? "",
        subtitle: (promoBannersRaw[2].subtitle as string) ?? "",
        description: (promoBannersRaw[2].description as string) ?? "",
        cta: (promoBannersRaw[2].cta_label as string) ?? "Join Now",
        href: (promoBannersRaw[2].cta_link as string) ?? "/tournaments",
      }
    : null;
  const cashbackPromo: PromoShape | null = promoBannersRaw.length >= 4
    ? {
        variant: "cashback",
        badge: (promoBannersRaw[3].badge as string) ?? "",
        title: (promoBannersRaw[3].title as string) ?? "",
        highlight: (promoBannersRaw[3].highlight as string) ?? "",
        subtitle: (promoBannersRaw[3].subtitle as string) ?? "",
        description: (promoBannersRaw[3].description as string) ?? "",
        cta: (promoBannersRaw[3].cta_label as string) ?? "Learn More",
        href: (promoBannersRaw[3].cta_link as string) ?? "/promotions",
      }
    : null;

  const testimonialsMapped: TestimonialShape[] = Array.isArray(testimonialsApi) && testimonialsApi.length > 0
    ? (testimonialsApi as { id?: number; name?: string; testimonial_from?: string; message?: string; stars?: number; game_name?: string; image?: string }[]).map((t, i) => ({
        id: t.id ?? i,
        name: t.name ?? "Player",
        avatar: t.image ? getMediaUrl(t.image) : undefined,
        location: t.testimonial_from,
        game: t.game_name,
        message: t.message ?? "",
        rating: t.stars ?? 5,
      }))
    : defaultTestimonials;

  const data: SecondHomePageData = {
    sliderSlides,
    categories: orderedCategoriesList,
    allCategoriesSection,
    providers: [], // not used when using second-home-sections API; providerCards is the source
    providerCards,
    liveBettingSections,
    topLiveGames,
    otherGames,
    topGames,
    popularGames,
    gamesByCategory,
    categorySectionOverrides,
    sportsIframeUrl,
    welcomeDepositPromos,
    promosGrid,
    tournamentPromo,
    cashbackPromo,
    comingSoon: Array.isArray(comingSoonApi) && comingSoonApi.length > 0 ? (comingSoonApi as ComingSoonShape[]) : defaultComingSoon,
    testimonials: testimonialsMapped,
    paymentMethods,
    sectionMeta: {
      allCategories: getSectionMeta(siteCategoriesJson),
      topGames: sectionMetaFromSections?.topGames ?? getSectionMeta(siteTopGamesJson),
      providers: sectionMetaFromSections?.providers ?? getSectionMeta(siteProvidersJson),
      categoriesGame: sectionMetaFromSections?.categoriesGame ?? getSectionMeta(siteCategoriesGameJson),
      popularGames: sectionMetaFromSections?.popularGames ?? getSectionMeta(sitePopularGamesJson),
      paymentsAccepted: getSectionMeta(sitePaymentsAcceptedJson),
    },
  };

  const refetch = () => {
    refetchSite();
    refetchSections();
  };
  return { data, isLoading, isError: !!siteError || !!sectionsError, refetch };
}

export { PROVIDER_COLORS };
