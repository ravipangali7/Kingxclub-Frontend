import { Link } from "react-router-dom";
import { Users, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GameImageWithFallback } from "@/components/shared/GameImageWithFallback";
import type { GameCardShape } from "@/data/homePageMockData";
import { cn } from "@/lib/utils";

interface GameCardBaseProps extends GameCardShape {
  variant?: "small" | "large";
}

export function GameCardSmall({ id, name, image, category, players, minBet, maxBet, rating, isHot, isNew, provider }: GameCardBaseProps) {
  return (
    <Link to={`/games/${id}`}>
      <Card className="overflow-hidden rounded-xl glass border-white/10 group hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 flex-shrink-0">
        <div className="relative aspect-[4/3] overflow-hidden">
          <GameImageWithFallback src={image} alt={name} className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute top-2 right-2 flex gap-1">
            {isHot && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/90 text-white">HOT</span>}
            {isNew && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/90 text-white">NEW</span>}
          </div>
          {players > 0 && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] bg-black/50 backdrop-blur-sm text-white flex items-center gap-1">
              <Users className="h-2.5 w-2.5" /> {players >= 1000 ? `${(players / 1000).toFixed(1)}K` : players}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm truncate">{name}</h3>
              <p className="text-white/60 text-xs">{category}</p>
            </div>
            <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-current" /> {rating}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <span className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Play Now</span>
          </div>
        </div>
        <div className="p-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{provider}</span>
          <span className="font-roboto-mono text-primary">₹{minBet} – ₹{maxBet >= 1000 ? `${(maxBet / 1000).toFixed(0)}K` : maxBet}</span>
        </div>
      </Card>
    </Link>
  );
}

export function GameCardLarge({ id, name, image, category, players, minBet, maxBet, rating, isHot, isNew, provider }: GameCardBaseProps) {
  return (
    <Link to={`/games/${id}`} className="snap-start shrink-0 w-[280px] md:w-[320px]">
      <Card className="overflow-hidden rounded-xl glass border-white/10 group h-full hover:scale-[1.02] hover:border-primary/30 transition-all duration-300">
        <div className="relative aspect-video overflow-hidden">
          <GameImageWithFallback src={image} alt={name} className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          <div className="absolute top-2 right-2 flex gap-1">
            {isHot && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/90 text-white">HOT</span>}
            {isNew && <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/90 text-white">NEW</span>}
          </div>
          {players > 0 && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs bg-black/50 backdrop-blur-sm text-white flex items-center gap-1">
              <Users className="h-3 w-3" /> {players >= 1000 ? `${(players / 1000).toFixed(1)}K` : players} playing
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-base truncate">{name}</h3>
            <p className="text-white/70 text-xs">{category}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-white/80 text-xs flex items-center gap-1"><Star className="h-3.5 w-3 fill-amber-400 text-amber-400" /> {rating}</span>
              <span className="text-xs text-white/80 font-roboto-mono">₹{minBet} – ₹{maxBet >= 1000 ? `${(maxBet / 1000).toFixed(0)}K` : maxBet}</span>
            </div>
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold glow-cyan">Play Now</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
