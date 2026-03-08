import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameCard } from "@/components/shared/GameCard";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getGames, getCategories, getGameImageUrl } from "@/api/games";
import type { Game, GameCategory } from "@/api/games";
import { getMediaUrl } from "@/lib/api";
import { svgToImgSrc } from "@/lib/svg";
import { LayoutGrid, Search } from "lucide-react";

const IRREGULAR_SHAPE = "60% 40% 50% 50% / 50% 60% 40% 50%";

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
        <LayoutGrid className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }
  return <img src={src} alt={name} className="h-full w-full object-cover" />;
}

const PAGE_SIZE = 24;

const GamesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "all";
  const searchParam = searchParams.get("search") ?? "";
  const pageParam = searchParams.get("page");
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [searchInput, setSearchInput] = useState(searchParam);
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const categoryId = categoryParam === "all" ? undefined : Number(categoryParam) || undefined;
  const searchQuery = searchParam.trim() || undefined;

  const setFilters = (updates: { category?: string; search?: string; page?: number }) => {
    const next = new URLSearchParams(searchParams);
    if (updates.category !== undefined) next.set("category", updates.category);
    if (updates.search !== undefined) {
      if (updates.search) next.set("search", updates.search); else next.delete("search");
    }
    if (updates.page !== undefined) next.set("page", String(updates.page));
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchInput.trim(), page: 1 });
  };

  const { data: gamesData, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ["games", categoryId, currentPage, searchQuery],
    queryFn: () => getGames(categoryId, undefined, currentPage, PAGE_SIZE, searchQuery),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const results = gamesData?.results ?? [];
  const totalCount = gamesData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="container px-2 mobile:px-4 py-4 mobile:py-6 space-y-4 min-w-0 max-w-full">
      <div className="min-w-0">
        <h1 className="font-gaming font-bold text-xl mobile:text-2xl neon-text tracking-wide truncate">ALL GAMES</h1>
        <p className="text-xs mobile:text-sm text-muted-foreground mt-1 truncate">Discover {totalCount} exciting games to play and win</p>
      </div>

      {/* Search - uses backend API with pagination */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:max-w-md min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search games..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 min-h-[44px] touch-manipulation"
            aria-label="Search games"
          />
        </div>
        <Button type="submit" size="sm" className="h-10 min-h-[44px] shrink-0 touch-manipulation">
          Search
        </Button>
      </form>

      {/* Category row - horizontal scroll, touch-friendly */}
      <div className="flex flex-row flex-nowrap gap-2 mobile:gap-3 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide w-full min-w-0 -mx-2 mobile:mx-0 px-2 mobile:px-0" style={{ WebkitOverflowScrolling: "touch" }}>
        <button
          type="button"
          onClick={() => setFilters({ category: "all", page: 1 })}
          className={`flex flex-col items-center gap-1 flex-shrink-0 w-14 mobile:w-16 min-h-[44px] touch-manipulation transition-all focus:outline-none focus:ring-0 focus-visible:outline-none ${categoryParam === "all" ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
          style={{ borderRadius: IRREGULAR_SHAPE }}
        >
          <div className="h-12 w-12 mobile:h-14 mobile:w-14 flex items-center justify-center overflow-hidden transition-all" style={{ borderRadius: IRREGULAR_SHAPE }}>
            <LayoutGrid className={`h-5 w-5 mobile:h-6 mobile:w-6 ${categoryParam === "all" ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <span className={`text-[10px] font-medium text-center truncate w-full max-w-[56px] mobile:max-w-[64px] ${categoryParam === "all" ? "text-primary" : "text-muted-foreground"}`}>All</span>
        </button>
        {(categories as GameCategory[]).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilters({ category: String(cat.id), page: 1 })}
            className={`flex flex-col items-center gap-1 flex-shrink-0 w-14 mobile:w-16 min-h-[44px] touch-manipulation transition-all focus:outline-none focus:ring-0 focus-visible:outline-none ${categoryParam === String(cat.id) ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
            style={{ borderRadius: IRREGULAR_SHAPE }}
          >
            <div className="h-12 w-12 mobile:h-14 mobile:w-14 flex items-center justify-center overflow-hidden transition-all" style={{ borderRadius: IRREGULAR_SHAPE }}>
              <CategoryIcon cat={cat} name={cat.name} />
            </div>
            <span className={`text-[10px] font-medium text-center truncate w-full max-w-[56px] mobile:max-w-[64px] ${categoryParam === String(cat.id) ? "text-primary" : "text-muted-foreground"}`}>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Loading / error for games */}
      {gamesLoading && (
        <p className="text-center text-muted-foreground py-8 text-sm">Loading games…</p>
      )}
      {gamesError && !gamesLoading && (
        <div className="text-center py-8 space-y-2">
          <p className="text-muted-foreground text-sm">Could not load games.</p>
          <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px]" onClick={() => refetchGames()}>Retry</Button>
        </div>
      )}

      {/* Games - responsive grid on mobile, horizontal scroll optional; use grid for native feel */}
      {!gamesLoading && !gamesError && (
        <div className="grid grid-cols-2 mobile:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 mobile:gap-3 min-w-0">
          {results.map((game: Game) => (
            <div key={game.id} className="min-w-0 w-full">
              <Link to={`/games/${game.id}`} className="block min-w-0">
                <GameCard image={getGameImageUrl(game)} name={game.name} category={game.category_name ?? ""} minBet={Number(game.min_bet)} maxBet={Number(game.max_bet)} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {!gamesLoading && !gamesError && results.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No games found</p>
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

export default GamesPage;
