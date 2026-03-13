import { useSecondHomePageData } from "@/hooks/useSecondHomePageData";
import {
  SecondHomeSlider,
  SecondHomeTopGamesCarousel,
  SecondHomeCategoryGames,
  SecondHomePopularGames,
  SecondHomePaymentsAccepted,
} from "@/components/secondHome";
import { GameProviders } from "@/components/home/GameProviders";
import { ActivePopups } from "@/components/home/ActivePopups";
import { SecondHomeReferBonus } from "@/components/secondHome/SecondHomeReferBonus";
import { SecondHomeBonusSection } from "@/components/secondHome/SecondHomeBonusSection";
import { SecondHomeComingSoon } from "@/components/secondHome/SecondHomeComingSoon";

export default function SecondHomePage() {
  const { data, isLoading, isError, refetch } = useSecondHomePageData();

  if (isLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center px-4 py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
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

  return (
    <div className="space-y-0 pb-8 bg-background">
      <ActivePopups />

      {/* 1. Banner */}
      <SecondHomeSlider slides={data.sliderSlides} hideTitle />

      {/* 2. Trusted Game Providers – site JSON driven; hide when no providers configured */}
      {data.providerCards.length > 0 && (
        <GameProviders
          providers={data.providerCards}
          sectionTitle={data.sectionMeta.providers.title}
          sectionSubtitle={data.sectionMeta.providers.subtitle}
          sectionSvg={data.sectionMeta.providers.svg}
        />
      )}

      {/* 3. Top Games – site JSON driven */}
      <SecondHomeTopGamesCarousel
        games={data.topGames}
        sectionTitle={data.sectionMeta.topGames.title}
        sectionSvg={data.sectionMeta.topGames.svg}
      />

      {/* 5. Category-wise game cards – site JSON driven */}
      <SecondHomeCategoryGames
        categories={data.categories}
        gamesByCategory={data.gamesByCategory}
        categorySectionOverrides={data.categorySectionOverrides}
        sectionSvg={data.sectionMeta.categoriesGame.svg}
      />

      {/* 6. Popular Games – site JSON driven */}
      <SecondHomePopularGames
        games={data.popularGames}
        sectionTitle={data.sectionMeta.popularGames.title}
        sectionSvg={data.sectionMeta.popularGames.svg}
      />

      {/* 7. Refer & Earn – no site JSON (fixed header) */}
      {data.promosGrid.length > 0 && (
        <SecondHomeReferBonus promos={data.promosGrid} />
      )}

      {/* 8. Welcome | Deposit Bonus – no site JSON */}
      <SecondHomeBonusSection
        welcomeDepositPromos={data.welcomeDepositPromos}
        tournamentPromo={data.tournamentPromo}
        cashbackPromo={data.cashbackPromo}
      />

      {/* 9. Coming Soon – no site JSON (fixed header) */}
      <SecondHomeComingSoon comingSoon={data.comingSoon} />

      {/* 10. Payments Accepted – site JSON driven */}
      <SecondHomePaymentsAccepted
        paymentMethods={data.paymentMethods}
        sectionTitle={data.sectionMeta.paymentsAccepted.title}
        sectionSvg={data.sectionMeta.paymentsAccepted.svg}
      />

      {/* Footer is in SecondPublicLayout */}
    </div>
  );
}
