import { useQuery } from "@tanstack/react-query";
import { getSiteSetting, getSecondHomeSections, type SecondHomeSectionGame } from "@/api/site";
import { getCategories, type GameCategory } from "@/api/games";
import type { GameCardShape, CategoryShape } from "@/data/homePageMockData";
import { slugFromCategoryName } from "@/hooks/useHomePageData";
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
      <AllGameCategories gamesByCategory={data.gamesByCategory} categories={data.categories} />
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

  // Explore Game Categories: dynamic from site_categories_json (order + labels) with same slug-based color theme
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
