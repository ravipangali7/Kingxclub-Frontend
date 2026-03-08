import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedGames } from "@/components/home/FeaturedGames";
import { PromoBannerGrid, PromoBanner } from "@/components/home/PromoBanner";
import { GameCategories } from "@/components/home/GameCategories";
import { AllGameCategories } from "@/components/home/GamesList";
import { GameProviders } from "@/components/home/GameProviders";
import { ComingSoon } from "@/components/home/ComingSoon";
import { Testimonials } from "@/components/home/Testimonials";
import { ActivePopups } from "@/components/home/ActivePopups";
import { useHomePageData, useHomePageStaticData } from "@/hooks/useHomePageData";
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
      <FeaturedGames games={data.featuredGames} />
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
  const { data, isLoading, isError, refetch } =
    HOME_PAGE_VARIANT === "first" ? staticResult : apiResult;

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
