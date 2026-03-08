import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { gamesByCategory as defaultGamesByCategory, categories as defaultCategories } from "@/data/homePageMockData";
import { GameCardSmall } from "@/components/games/GameCard";
import { Gamepad2, Zap, Tv, Trophy, Sparkles } from "lucide-react";
import type { CategoryShape, GameCardShape } from "@/data/homePageMockData";

const slugIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  crash: Zap,
  casino: Gamepad2,
  liveCasino: Tv,
  sports: Trophy,
  casual: Sparkles,
};

interface AllGameCategoriesProps {
  gamesByCategory?: Record<string, GameCardShape[]> | null;
  categories?: CategoryShape[] | null;
}

export function AllGameCategories({ gamesByCategory: gamesByCategoryProp, categories: categoriesProp }: AllGameCategoriesProps) {
  const gamesByCategory = gamesByCategoryProp && Object.keys(gamesByCategoryProp).length > 0 ? gamesByCategoryProp : defaultGamesByCategory;
  const categories = categoriesProp && categoriesProp.length > 0 ? categoriesProp : defaultCategories;

  return (
    <>
      {categories.map((cat) => {
        const games = gamesByCategory[cat.slug];
        if (!games?.length) return null;
        const href = cat.id != null ? `/games?category=${cat.id}` : (cat.slug === "sports" ? "/sports" : "/games");
        const Icon = slugIcons[cat.slug] ?? Gamepad2;
        return (
          <section key={cat.slug} className="container px-4 py-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{cat.label ?? cat.slug}</h2>
              </div>
              <Link to={href} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {games.slice(0, 10).map((game) => (
                <GameCardSmall key={game.id} {...game} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
