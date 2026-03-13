import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { GameCardSmall } from "@/components/games/GameCard";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getSecondHomeSections } from "@/api/site";
import { mapSectionGameToCardShape } from "@/hooks/useSecondHomePageData";
import { Gamepad2 } from "lucide-react";

const PAGE_SIZE = 24;

const TopGamesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get("page");
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const setPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["second-home-sections"],
    queryFn: getSecondHomeSections,
  });

  const allCards = (data?.top_games?.items ?? []).map((g, i) => mapSectionGameToCardShape(g, i));
  const totalCount = allCards.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageItems = allCards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 min-w-0 max-w-full">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Top Games</h1>
        <p className="text-muted-foreground">
          {isLoading ? "Loading..." : `${totalCount} top games to play`}
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
          {pageItems.map((card) => (
            <GameCardSmall key={card.id} {...card} />
          ))}
        </div>
      )}

      {!isLoading && !isError && pageItems.length === 0 && (
        <div className="text-center py-16">
          <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No top games found</h3>
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

export default TopGamesPage;
