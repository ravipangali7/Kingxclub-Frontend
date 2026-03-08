import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/shared/GameCard";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getProviderDetail, getGames, getGameImageUrl } from "@/api/games";
import type { Game, ProviderDetailCategory } from "@/api/games";
import { getMediaUrl } from "@/lib/api";
import { LayoutGrid } from "lucide-react";

const IRREGULAR_SHAPE = "60% 40% 50% 50% / 50% 60% 40% 50%";

function categoryIconSrc(cat: ProviderDetailCategory): string | null {
  const icon = cat.icon?.trim();
  if (icon) return icon.startsWith("http") ? icon : getMediaUrl(icon);
  const svg = cat.svg?.trim();
  if (svg) return svg.startsWith("http") ? svg : getMediaUrl(svg);
  return null;
}

function CategoryIcon({ cat, name }: { cat: ProviderDetailCategory; name: string }) {
  const src = categoryIconSrc(cat);
  if (!src) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LayoutGrid className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }
  return <img src={src} alt={name} className="h-full w-full object-cover" />;
}

const PAGE_SIZE = 24;

const ProviderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "all";
  const pageParam = searchParams.get("page");
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const providerId = id ? parseInt(id, 10) : NaN;
  const categoryId = categoryParam === "all" ? undefined : Number(categoryParam) || undefined;

  const { data: provider, isLoading: providerLoading, isError: providerError } = useQuery({
    queryKey: ["provider-detail", providerId],
    queryFn: () => getProviderDetail(providerId),
    enabled: Number.isInteger(providerId) && providerId > 0,
  });

  const { data: gamesData, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ["games", providerId, categoryId, currentPage],
    queryFn: () => getGames(categoryId, providerId, currentPage, PAGE_SIZE),
    enabled: Number.isInteger(providerId) && providerId > 0,
  });

  const setFilters = (updates: { category?: string; page?: number }) => {
    const next = new URLSearchParams(searchParams);
    if (updates.category !== undefined) next.set("category", updates.category);
    if (updates.page !== undefined) next.set("page", String(updates.page));
    setSearchParams(next);
  };

  const results = gamesData?.results ?? [];
  const totalCount = gamesData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const categories = provider?.categories ?? [];

  if (!id || !Number.isInteger(providerId) || providerId <= 0) {
    return (
      <div className="container px-2 mobile:px-4 py-6 min-w-0">
        <p className="text-muted-foreground text-sm">Invalid provider.</p>
        <Link to="/games" className="text-primary hover:underline mt-2 inline-block text-sm">Back to games</Link>
      </div>
    );
  }

  if (providerError || (provider && !providerLoading && !provider)) {
    return (
      <div className="container px-2 mobile:px-4 py-6 min-w-0">
        <p className="text-muted-foreground text-sm">Provider not found.</p>
        <Link to="/games" className="text-primary hover:underline mt-2 inline-block text-sm">Back to games</Link>
      </div>
    );
  }

  return (
    <div className="container px-2 mobile:px-4 py-4 mobile:py-6 space-y-4 mobile:space-y-6 min-w-0 max-w-full">
      {/* Banner + name + total games */}
      <div className="space-y-3">
        {providerLoading ? (
          <div className="h-32 md:h-48 rounded-xl bg-muted animate-pulse" />
        ) : (
          <div className="relative w-full rounded-xl overflow-hidden bg-muted aspect-[3/1] max-h-48 md:max-h-56">
            {(provider?.banner || provider?.image) ? (
              <img
                src={provider.banner || provider.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-display text-lg">
                {provider?.name ?? "Provider"}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {provider && (provider.image || provider.banner) && (
            <div
              className="h-12 w-12 md:h-14 md:w-14 overflow-hidden flex-shrink-0"
              style={{ borderRadius: "60% 40% 50% 50% / 50% 60% 40% 50%" }}
            >
              <img
                src={provider.image || provider.banner}
                alt=""
                className="h-full w-full object-cover"
                style={{ borderRadius: "60% 40% 50% 50% / 50% 60% 40% 50%" }}
              />
            </div>
          )}
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-gaming font-bold text-2xl neon-text tracking-wide">
              {providerLoading ? "…" : provider?.name ?? ""}
            </h1>
            {provider && (
              <span className="text-sm text-muted-foreground">
                {provider.games_count} game{provider.games_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category filters — single-row horizontal scroll, never wraps */}
      {categories.length > 0 && (
        <div
          className="scrollbar-hide pb-2"
          style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap", overflowX: "auto", overflowY: "hidden", gap: "12px", width: "100%", WebkitOverflowScrolling: "touch" }}
        >
          {/* All chip — irregular shape like provider, no border/bg */}
          <button
            onClick={() => setFilters({ category: "all", page: 1 })}
            className={`transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${categoryParam === "all" ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0, flexGrow: 0, width: "64px", minWidth: "64px" }}
          >
            <div className="h-14 w-14 flex items-center justify-center overflow-hidden transition-all" style={{ borderRadius: IRREGULAR_SHAPE }}>
              <LayoutGrid className={`h-6 w-6 ${categoryParam === "all" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-[10px] font-medium text-center ${categoryParam === "all" ? "text-primary" : "text-muted-foreground"}`} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>All</span>
          </button>
          {(categories as ProviderDetailCategory[]).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters({ category: String(cat.id), page: 1 })}
              className={`transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${categoryParam === String(cat.id) ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0, flexGrow: 0, width: "64px", minWidth: "64px" }}
            >
              <div className="h-14 w-14 flex items-center justify-center overflow-hidden transition-all" style={{ borderRadius: IRREGULAR_SHAPE }}>
                <CategoryIcon cat={cat} name={cat.name} />
              </div>
              <span className={`text-[10px] font-medium text-center ${categoryParam === String(cat.id) ? "text-primary" : "text-muted-foreground"}`} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Games — single-row horizontal scroll, never wraps */}
      {gamesLoading && <p className="text-center text-muted-foreground py-8">Loading games…</p>}
      {gamesError && !gamesLoading && (
        <div className="text-center py-8 space-y-2">
          <p className="text-muted-foreground">Could not load games.</p>
          <Button variant="outline" size="sm" onClick={() => refetchGames()}>Retry</Button>
        </div>
      )}
      {!gamesLoading && !gamesError && (
        <div className="grid grid-cols-2 mobile:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 mobile:gap-3 min-w-0">
          {results.map((game: Game) => (
            <div key={game.id} className="min-w-0 w-full">
              <Link to={`/games/${game.id}`} className="block min-w-0">
                <GameCard
                  image={getGameImageUrl(game)}
                  name={game.name}
                  category={game.category_name ?? ""}
                  minBet={Number(game.min_bet)}
                  maxBet={Number(game.max_bet)}
                />
              </Link>
            </div>
          ))}
        </div>
      )}

      {!gamesLoading && !gamesError && results.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No games in this category</p>
      )}

      {/* Pagination - touch-friendly */}
      {!gamesLoading && !gamesError && totalPages > 1 && (
        <Pagination className="pt-4">
          <PaginationContent className="gap-1 mobile:gap-2 flex-wrap">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); setFilters({ page: currentPage - 1 }); }}
                className={`min-h-[44px] touch-manipulation ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
                aria-disabled={currentPage <= 1}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 mobile:px-3 py-2 text-xs mobile:text-sm text-muted-foreground whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); setFilters({ page: currentPage + 1 }); }}
                className={`min-h-[44px] touch-manipulation ${currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
                aria-disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ProviderPage;
