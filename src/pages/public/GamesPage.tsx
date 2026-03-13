import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameCardSmall } from "@/components/games/GameCard";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getGames, getCategories, getProviders, getGameImageUrl } from "@/api/games";
import type { Game, GameCategory, GameProvider } from "@/api/games";
import { getMediaUrl } from "@/lib/api";
import { svgToImgSrc } from "@/lib/svg";
import { LayoutGrid, Search, Grid3X3, LayoutList, ChevronDown, Gamepad2 } from "lucide-react";

function categoryIconSrc(cat: GameCategory): string | null {
  const icon = cat.icon?.trim();
  if (icon) return icon.startsWith("http") ? icon : getMediaUrl(icon);
  const svg = cat.svg?.trim();
  if (svg) return svg.startsWith("<svg") ? svgToImgSrc(svg) : getMediaUrl(svg);
  return null;
}

function CategoryIcon({ cat, name }: { cat: GameCategory; name: string }) {
  const src = categoryIconSrc(cat);
  if (!src) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }
  return <img src={src} alt={name} className="h-full w-full object-cover" />;
}

const PAGE_SIZE = 24;

type SortOption = "popular" | "rating" | "name" | "minBet";

function sortGames(games: Game[], sortBy: SortOption): Game[] {
  const arr = [...games];
  switch (sortBy) {
    case "popular":
      return arr.sort((a, b) => {
        const aPop = (a.is_popular_game ? 2 : 0) + (a.is_top_game ? 1 : 0);
        const bPop = (b.is_popular_game ? 2 : 0) + (b.is_top_game ? 1 : 0);
        return bPop - aPop;
      });
    case "rating":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "minBet":
      return arr.sort((a, b) => Number(a.min_bet) - Number(b.min_bet));
    default:
      return arr;
  }
}

function gameToCardShape(game: Game) {
  return {
    id: String(game.id),
    name: game.name,
    image: getGameImageUrl(game),
    category: game.category_name ?? "",
    players: 0,
    minBet: Number(game.min_bet) || 10,
    maxBet: Number(game.max_bet) || 5000,
    rating: 4.5,
    isHot: !!(game.is_popular_game ?? game.is_top_game),
    isNew: false,
    provider: game.provider_name ?? "",
  };
}

const GamesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "all";
  const searchParam = searchParams.get("search") ?? "";
  const providerParam = searchParams.get("provider") ?? "all";
  const pageParam = searchParams.get("page");
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [searchInput, setSearchInput] = useState(searchParam);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (searchParams.get("focus") !== "search") return;
    const t = setTimeout(() => {
      searchInputRef.current?.focus();
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });
    }, 100);
    return () => clearTimeout(t);
  }, [searchParams, setSearchParams]);

  const categoryId = categoryParam === "all" ? undefined : Number(categoryParam) || undefined;
  const providerId = providerParam === "all" ? undefined : Number(providerParam) || undefined;
  const searchQuery = searchParam.trim() || undefined;

  const setFilters = (updates: { category?: string; search?: string; page?: number; provider?: string }) => {
    const next = new URLSearchParams(searchParams);
    if (updates.category !== undefined) next.set("category", updates.category);
    if (updates.search !== undefined) {
      if (updates.search) next.set("search", updates.search);
      else next.delete("search");
    }
    if (updates.page !== undefined) next.set("page", String(updates.page));
    if (updates.provider !== undefined) next.set("provider", updates.provider);
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchInput.trim(), page: 1 });
  };

  const { data: gamesData, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ["games", categoryId, providerId, currentPage, searchQuery],
    queryFn: () => getGames(categoryId, providerId, currentPage, PAGE_SIZE, searchQuery),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: providers = [] } = useQuery({ queryKey: ["providers"], queryFn: getProviders });

  const results = gamesData?.results ?? [];
  const totalCount = gamesData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const sortedResults = useMemo(() => sortGames(results as Game[], sortBy), [results, sortBy]);

  const categoryList = categories as GameCategory[];
  const providerList = providers as GameProvider[];
  const selectedCategoryName =
    categoryParam === "all"
      ? "All Games"
      : categoryList.find((c) => String(c.id) === categoryParam)?.name ?? "Games";

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 min-w-0 max-w-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{selectedCategoryName}</h1>
        <p className="text-muted-foreground">
          Discover {gamesLoading ? "..." : totalCount} exciting games to play and win
        </p>
      </div>

      {/* Filters Bar */}
      <div className="glass rounded-xl p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search games..."
                className="pl-10 h-12 bg-input border-border"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search games"
              />
            </div>
            <Button type="submit" size="sm" className="h-12 shrink-0">
              Search
            </Button>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <Button
              variant={categoryParam === "all" ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0 gap-2"
              onClick={() => setFilters({ category: "all", page: 1 })}
            >
              <LayoutGrid className="w-4 h-4" />
              All Games
            </Button>
            {categoryList.map((cat) => (
              <Button
                key={cat.id}
                variant={categoryParam === String(cat.id) ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0 gap-2"
                onClick={() => setFilters({ category: String(cat.id), page: 1 })}
              >
                <div className="w-4 h-4 flex items-center justify-center overflow-hidden rounded flex-shrink-0">
                  <CategoryIcon cat={cat} name={cat.name} />
                </div>
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="relative shrink-0 w-[min(100%,130px)] min-w-[6.5rem]">
              <select
                className="appearance-none bg-input border border-border rounded-lg px-2.5 py-2 pr-7 text-sm w-full min-w-0"
                value={providerParam}
                onChange={(e) => setFilters({ provider: e.target.value, page: 1 })}
              >
                <option value="all">All Providers</option>
                {providerList.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative shrink-0 w-[min(100%,130px)] min-w-[7.5rem]">
              <select
                className="appearance-none bg-input border border-border rounded-lg px-2.5 py-2 pr-7 text-sm w-full min-w-0"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="name">A-Z</option>
                <option value="minBet">Min Bet</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground whitespace-nowrap">{sortedResults.length} games</span>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {gamesLoading && (
        <div className="py-16 text-center text-muted-foreground">Loading games...</div>
      )}
      {gamesError && !gamesLoading && (
        <div className="text-center py-8 space-y-2">
          <p className="text-muted-foreground">Could not load games.</p>
          <Button variant="outline" size="sm" onClick={() => refetchGames()}>
            Retry
          </Button>
        </div>
      )}

      {!gamesLoading && !gamesError && (
        <div
          className={`grid gap-4 ${
            viewMode === "grid"
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              : "grid-cols-1 md:grid-cols-2"
          }`}
        >
          {sortedResults.map((game: Game) => (
            <GameCardSmall key={game.id} {...gameToCardShape(game)} />
          ))}
        </div>
      )}

      {!gamesLoading && !gamesError && sortedResults.length === 0 && (
        <div className="text-center py-16">
          <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No games found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      )}

      {!gamesLoading && !gamesError && totalPages > 1 && (
        <Pagination className="pt-6">
          <PaginationContent className="gap-2 flex-wrap">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setFilters({ page: currentPage - 1 });
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                aria-disabled={currentPage <= 1}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 py-2 text-sm text-muted-foreground whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setFilters({ page: currentPage + 1 });
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                aria-disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default GamesPage;
