import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import type { CategoryShape } from "@/data/homePageMockData";
import { Gamepad2, Zap, Tv, Trophy, Sparkles } from "lucide-react";

const slugIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  crash: Zap,
  casino: Gamepad2,
  liveCasino: Tv,
  sports: Trophy,
  casual: Sparkles,
};

export function CategoryCard({ slug, label, count }: CategoryShape) {
  const href = slug === "sports" ? "/sports" : `/games/${slug}`;
  const Icon = slugIcons[slug] ?? Gamepad2;
  const displayLabel = label ?? slug;
  const displayCount = count != null ? `${count}+` : "0+";

  return (
    <Link to={href}>
      <Card className="glass border-white/10 rounded-xl p-5 h-full flex flex-col items-center text-center gap-2 hover:scale-[1.02] hover:border-primary/30 transition-all duration-300 group">
        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/30 transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <span className="font-semibold text-sm text-foreground">{displayLabel}</span>
        <span className="text-xs text-muted-foreground">{displayCount} Games</span>
      </Card>
    </Link>
  );
}
