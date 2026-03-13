import { Link } from "react-router-dom";
import { GameImageWithFallback } from "@/components/shared/GameImageWithFallback";
import type { GameCardShape } from "@/data/homePageMockData";
import { getMediaUrl } from "@/lib/api";
import { ChevronRight, Star, Zap, Trophy } from "lucide-react";

function sectionIconSrc(value: string): string {
  return value.trim().startsWith("http") ? value.trim() : getMediaUrl(value.trim());
}

const TOTAL = 16;

interface SecondHomeTopGamesCarouselProps {
  games: GameCardShape[];
  sectionTitle?: string;
  sectionSvg?: string;
}

export function SecondHomeTopGamesCarousel({ games, sectionTitle, sectionSvg }: SecondHomeTopGamesCarouselProps) {
  const list = games.slice(0, TOTAL);
  if (list.length === 0) return null;

  return (
    <section className="container px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
          {sectionSvg?.trim()
            ? <img src={sectionIconSrc(sectionSvg)} alt="" className="h-6 w-6 object-contain" />
            : <Trophy className="h-6 w-6 text-primary" />
          }
          {sectionTitle || "Top Games"}
        </h2>
        <Link to="/games/top" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal scroll — big portrait cards with overlay details */}
      <div
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {list.map((game, idx) => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="relative flex-shrink-0 snap-start rounded-2xl overflow-hidden group"
            style={{ width: "calc(45vw - 24px)", maxWidth: "200px", minWidth: "150px" }}
          >
            {/* Full-bleed portrait image */}
            <div className="relative" style={{ paddingBottom: "140%" }}>
              <GameImageWithFallback
                src={game.image}
                alt={game.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient overlay — stronger at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Hot / New badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {game.isHot && (
                  <span className="flex items-center gap-0.5 rounded-full bg-red-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                    <Zap className="h-2.5 w-2.5" /> HOT
                  </span>
                )}
                {game.isNew && (
                  <span className="rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                    NEW
                  </span>
                )}
              </div>

              {/* Rank number top-right */}
              <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white leading-none">#{idx + 1}</span>
              </div>

              {/* Bottom info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1">
                {/* Rating */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-2.5 w-2.5 ${s <= Math.round(game.rating ?? 4) ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
                    />
                  ))}
                </div>

                {/* Game name */}
                <p className="text-xs font-bold text-white leading-tight line-clamp-1 drop-shadow">
                  {game.name}
                </p>

                {/* Provider + Category chips */}
                <div className="flex items-center gap-1 flex-wrap">
                  {game.provider && (
                    <span className="rounded-full bg-white/10 border border-white/15 px-1.5 py-0.5 text-[9px] text-white/80 leading-none truncate max-w-[80px]">
                      {game.provider}
                    </span>
                  )}
                  {game.category && (
                    <span className="rounded-full bg-primary/20 border border-primary/30 px-1.5 py-0.5 text-[9px] text-primary leading-none truncate max-w-[70px]">
                      {game.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hover ring */}
            <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-primary/60 transition-all duration-200 pointer-events-none" />
          </Link>
        ))}
      </div>
    </section>
  );
}
