import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { featuredGames as defaultFeaturedGames } from "@/data/homePageMockData";
import { GameCardLarge } from "@/components/games/GameCard";
import type { GameCardShape } from "@/data/homePageMockData";

interface FeaturedGamesProps {
  games?: GameCardShape[] | null;
  loading?: boolean;
}

export function FeaturedGames({ games: gamesProp, loading }: FeaturedGamesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const games = gamesProp && gamesProp.length > 0 ? gamesProp : defaultFeaturedGames;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Section Header */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-red to-orange-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Top Picks for You</h2>
              <p className="text-muted-foreground text-sm">Most popular games right now</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Games Carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto scrollbar-hide px-4 pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="w-4 flex-shrink-0" />
        {loading ? (
          <div className="flex gap-6 px-4 text-muted-foreground">Loading...</div>
        ) : (
          games.map((game) => (
            <div key={game.id} className="w-[400px] flex-shrink-0 snap-start">
              <GameCardLarge {...game} />
            </div>
          ))
        )}
        <div className="w-4 flex-shrink-0" />
      </div>
    </section>
  );
}
