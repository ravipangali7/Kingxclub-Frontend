import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { GameCardSmall } from "@/components/games/GameCard";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getGames, getCategories, getGameImageUrl } from "@/api/games";
import type { Game, GameCategory } from "@/api/games";
import { Gamepad2 } from "lucide-react";

const PAGE_SIZE = 24;

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

const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get("page");
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const id = categoryId ? parseInt(categoryId, 10) : undefined;

  const setPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
  };

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: gamesData, isLoading, isError, refetch } = useQuery({
    queryKey: ["games", "category", id, currentPage],
    queryFn: () => getGames(id, undefined, currentPage, PAGE_SIZE),
    enabled: id != null && !Number.isNaN(id),
  });

  const categoryName =
    id != null
      ? (categories as GameCategory[]).find((c) => c.id === id)?.name ?? `Category ${id}`
      : "Category";
  const results = gamesData?.results ?? [];
  const totalCount = gamesData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (categoryId && (id == null || Number.isNaN(id))) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        Invalid category.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 min-w-0 max-w-full">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">
          <Link to="/categories" className="hover:text-primary">Categories</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{categoryName}</span>
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{categoryName}</h1>
        <p className="text-muted-foreground">
          {isLoading ? "Loading..." : `${totalCount} games in this category`}
        </p>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-muted-foreground">Loading games...</div>
      )}
      {isError && !isLoading && (
        <div className="text-center py-8 space-y-2">
          <p className="text-muted-foreground">Could not load games.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {(results as Game[]).map((game) => (
            <GameCardSmall key={game.id} {...gameToCardShape(game)} />
          ))}
        </div>
      )}

      {!isLoading && !isError && results.length === 0 && (
        <div className="text-center py-16">
          <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No games in this category</h3>
        </div>
      )}

      {!isLoading && !isError && totalPages > 1 && (
        <Pagination className="pt-6">
          <PaginationContent className="gap-2 flex-wrap">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(currentPage - 1);
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
                  setPage(currentPage + 1);
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

export default CategoryPage;
