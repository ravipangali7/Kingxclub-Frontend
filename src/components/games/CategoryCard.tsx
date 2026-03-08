import { Link } from "react-router-dom";
import { Dices, Trophy, Video, Gamepad2, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryShape } from "@/data/homePageMockData";

const SLUG_ICON: Record<string, LucideIcon> = {
  crash: Rocket,
  casino: Dices,
  liveCasino: Video,
  sports: Trophy,
  casual: Gamepad2,
};

const SLUG_COLOR: Record<string, "cyan" | "purple" | "gold" | "green" | "red" | "pink"> = {
  crash: "cyan",
  casino: "purple",
  liveCasino: "red",
  sports: "green",
  casual: "gold",
};

const colorClasses: Record<string, string> = {
  cyan: "from-primary to-primary/50 hover:glow-cyan border-primary/30",
  purple: "from-secondary to-secondary/50 hover:glow-purple border-secondary/30",
  gold: "from-accent to-orange-500/50 hover:glow-gold border-accent/30",
  green: "from-neon-green to-emerald-500/50 border-neon-green/30",
  red: "from-neon-red to-rose-500/50 border-neon-red/30",
  pink: "from-neon-pink to-pink-500/50 border-neon-pink/30",
};

const iconColorClasses: Record<string, string> = {
  cyan: "text-primary",
  purple: "text-secondary",
  gold: "text-accent",
  green: "text-neon-green",
  red: "text-neon-red",
  pink: "text-neon-pink",
};

function slugToHref(slug: string): string {
  if (slug === "sports") return "/sports";
  return `/games?category=${slug}`;
}

export function CategoryCard({ slug, label, count }: CategoryShape) {
  const href = slugToHref(slug);
  const Icon = SLUG_ICON[slug] ?? Gamepad2;
  const color = SLUG_COLOR[slug] ?? "purple";
  const displayLabel = label ?? slug;
  const gameCount = count != null ? count : 0;

  return (
    <Link to={href} className="group">
      <div
        className={`relative rounded-2xl overflow-hidden glass border ${colorClasses[color]} transition-all duration-300 hover:scale-105`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-10 group-hover:opacity-20 transition-opacity`}
        />
        <div className="relative p-6 flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{displayLabel}</h3>
          <p className="text-sm text-muted-foreground">{gameCount}+ Games</p>
        </div>
      </div>
    </Link>
  );
}
