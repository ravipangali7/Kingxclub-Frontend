import { Card, CardContent } from "@/components/ui/card";
import { GameImageWithFallback } from "@/components/shared/GameImageWithFallback";
import { Users } from "lucide-react";

interface GameCardProps {
  image: string;
  name: string;
  category: string;
  minBet: number;
  maxBet: number;
  plays?: number;
  onClick?: () => void;
}

export const GameCard = ({ image, name, category, minBet, maxBet, plays, onClick }: GameCardProps) => {
  return (
    <Card
      className="overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary/40 hover:neon-glow-sm transition-all duration-300 gaming-card min-w-0 w-full"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <GameImageWithFallback src={image} alt={name} className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-gaming font-semibold gold-gradient text-primary-foreground tracking-wider">
          PLAY
        </div>
        {plays && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] bg-black/50 backdrop-blur-sm text-white flex items-center gap-1">
            <Users className="h-2.5 w-2.5" /> {plays > 1000 ? `${(plays / 1000).toFixed(1)}K` : plays}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h3 className="text-white font-display font-semibold text-sm truncate">{name}</h3>
          <p className="text-white/50 text-[10px]">{category}</p>
        </div>
      </div>
      <CardContent className="p-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>₹{minBet}</span>
          <span className="text-primary font-gaming font-medium">₹{maxBet.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};
