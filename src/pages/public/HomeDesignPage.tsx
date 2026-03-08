import { useQuery } from "@tanstack/react-query";
import { getSiteSetting, getSecondHomeSections, type SecondHomeSectionGame, type SecondHomeSectionProvider } from "@/api/site";
import { getCategories, getComingSoonGames, type GameCategory } from "@/api/games";
import type { GameCardShape, CategoryShape, ProviderShape } from "@/data/homePageMockData";
import { slugFromCategoryName } from "@/hooks/useHomePageData";

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
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedGames } from "@/components/home/FeaturedGames";
import { PromoBannerGrid, PromoBanner } from "@/components/home/PromoBanner";
import { GameCategories } from "@/components/home/GameCategories";
import { AllGameCategories } from "@/components/home/GamesList";
import { GameProviders } from "@/components/home/GameProviders";
import { ComingSoon } from "@/components/home/ComingSoon";
import { Testimonials } from "@/components/home/Testimonials";
import { ActivePopups } from "@/components/home/ActivePopups";
import { useHomePageData, useHomePageStaticData, buildHeroFromSiteSetting } from "@/hooks/useHomePageData";
import { HOME_PAGE_VARIANT } from "@/config";

function HomePageContent({
  data,
}: {
  data: ReturnType<typeof useHomePageStaticData>["data"];
}) {
  return (
    <>
      <ActivePopups />
      <HeroSection hero={data.hero} heroStats={data.heroStats} />
      <FeaturedGames
        games={data.featuredGames}
        sectionTitle={data.featuredGamesSectionTitle}
        sectionSubtitle={data.featuredGamesSectionSubtitle}
      />
      <PromoBannerGrid promos={data.promosGrid} />
      <GameCategories categories={data.categories} />
      <AllGameCategories
        gamesByCategory={data.gamesByCategory}
        categories={data.categoriesForAllSections ?? data.categories}
        categorySectionOverrides={data.categorySectionOverrides}
      />
      <section className="container px-4 py-6">
        <PromoBanner promo={data.tournamentPromo} fullWidth />
      </section>
      <GameProviders providers={data.providers} />
      <ComingSoon comingSoon={data.comingSoon} />
      <Testimonials testimonials={data.testimonials} recentWins={data.recentWins} />
      <section className="container px-4 py-6">
        <PromoBanner promo={data.cashbackPromo} fullWidth />
      </section>
    </>
  );
}

export default function HomeDesignPage() {
  const staticResult = useHomePageStaticData();
  const apiResult = useHomePageData();
  const isFirstVariant = HOME_PAGE_VARIANT === "first";
  const { data: siteSetting } = useQuery({
    queryKey: ["siteSetting"],
    queryFn: getSiteSetting,
    enabled: isFirstVariant,
  });
  const { data: secondHomeSections } = useQuery({
    queryKey: ["secondHomeSections"],
    queryFn: getSecondHomeSections,
    enabled: isFirstVariant,
  });
  const { data: categoriesApi = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: isFirstVariant,
  });
  const { data: comingSoonApi = [] } = useQuery({
    queryKey: ["comingSoonGames"],
    queryFn: getComingSoonGames,
    enabled: isFirstVariant,
  });
  const categoriesList = (categoriesApi as GameCategory[]) ?? [];

  const { data: baseData, isLoading, isError, refetch } = isFirstVariant ? staticResult : apiResult;

  // Map backend top_games item to GameCardShape (same design as second home)
  const mapTopGameToCardShape = (item: SecondHomeSectionGame, index: number): GameCardShape => ({
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
  });

  // For first variant: merge dynamic hero + Top Picks (site_top_games_json) into static page data
  let data = baseData;
  if (isFirstVariant && siteSetting && typeof siteSetting === "object") {
    data = { ...data, ...buildHeroFromSiteSetting(siteSetting as Record<string, unknown>) };
  }
  if (isFirstVariant && secondHomeSections?.top_games?.items?.length) {
    const topGames = secondHomeSections.top_games.items.map(mapTopGameToCardShape);
    data = {
      ...data,
      featuredGames: topGames,
      featuredGamesSectionTitle: secondHomeSections.top_games.section_title?.trim() || undefined,
      featuredGamesSectionSubtitle: undefined,
    };
  }

  // Providers: dynamic from second-home-sections (site_providers_json)
  if (isFirstVariant && secondHomeSections?.providers?.items?.length) {
    const providersFromApi: ProviderShape[] = secondHomeSections.providers.items.map((p: SecondHomeSectionProvider, i: number) => ({
      id: p.id,
      name: p.name,
      logo: p.logo ?? p.name?.slice(0, 2).toUpperCase() ?? "",
      logoImage: p.logo_image?.trim() ? p.logo_image.trim() : undefined,
      games: p.games ?? 0,
      color: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
      link: p.link ?? `/providers/${p.id}`,
      single_game_id: p.single_game_id ?? undefined,
    }));
    data = { ...data, providers: providersFromApi };
  }

  // Coming Soon: dynamic from getComingSoonGames API
  if (isFirstVariant && Array.isArray(comingSoonApi) && comingSoonApi.length > 0) {
    data = { ...data, comingSoon: comingSoonApi };
  }

  // Explore Game Categories + All Game Categories (crash, casino, etc.): dynamic from site_categories_json + site_categories_game_json
  if (isFirstVariant && siteSetting && typeof siteSetting === "object") {
    const site = siteSetting as Record<string, unknown>;
    const siteCategoriesJson = (site.site_categories_json as { category_ids?: number[] } | null) ?? {};
    const categoryIds = Array.isArray(siteCategoriesJson.category_ids) ? siteCategoriesJson.category_ids : [];
    const categoriesGame = secondHomeSections?.categories_game?.categories ?? [];
    if (categoryIds.length > 0 && categoriesList.length > 0) {
      const builtCategories: CategoryShape[] = categoryIds
        .map((id) => {
          const cat = categoriesList.find((c) => c.id === id);
          const sec = categoriesGame.find((c) => c.category_id === id);
          const name = cat?.name ?? sec?.section_title ?? "";
          const slug = slugFromCategoryName(name);
          const label = (sec?.section_title?.trim() || cat?.name?.trim() || name) || String(id);
          const count = sec?.games?.length ?? 0;
          return { slug, label, count, id };
        })
        .filter((c) => c.slug);
      if (builtCategories.length > 0) {
        data = { ...data, categories: builtCategories };
      }
    }

    // site_categories_game_json: category-wise sections in API order (same as second-home-sections)
    if (categoriesGame.length > 0 && categoriesList.length > 0) {
      const gamesByCategoryFromApi: Record<string, GameCardShape[]> = {};
      const categorySectionOverrides: Record<number, { section_title?: string; section_icon?: string }> = {};
      const categoriesForAllSections: CategoryShape[] = [];
      const usedSlugs = new Set<string>();
      for (const sec of categoriesGame) {
        const cat = categoriesList.find((c) => c.id === sec.category_id);
        const baseSlug = slugFromCategoryName(cat?.name ?? sec.section_title ?? "");
        const slug = baseSlug ? (usedSlugs.has(baseSlug) ? `${baseSlug}-${sec.category_id}` : baseSlug) : `cat-${sec.category_id}`;
        if (baseSlug) usedSlugs.add(baseSlug);
        usedSlugs.add(slug);
        const label = (sec.section_title?.trim() || cat?.name?.trim() || "") || String(sec.category_id);
        categoriesForAllSections.push({
          slug,
          label,
          count: sec.games?.length ?? 0,
          id: sec.category_id,
        });
        gamesByCategoryFromApi[slug] = (sec.games ?? []).map((g, i) => mapTopGameToCardShape(g, i));
        categorySectionOverrides[sec.category_id] = {
          ...(sec.section_title?.trim() && { section_title: sec.section_title.trim() }),
          ...(sec.section_icon?.trim() && { section_icon: sec.section_icon.trim() }),
        };
      }
      if (categoriesForAllSections.length > 0) {
        data = {
          ...data,
          categoriesForAllSections,
          gamesByCategory: { ...data.gamesByCategory, ...gamesByCategoryFromApi },
          categorySectionOverrides: { ...data.categorySectionOverrides, ...categorySectionOverrides },
        };
      }
    }
  }

  if (isLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center px-4 py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading home page...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center px-4 py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">Something went wrong loading the page.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <HomePageContent data={data} />;
}
