import { Link } from "react-router-dom";
import type { GameCategory } from "@/api/games";

interface SecondGameCategoryBarProps {
  categories: GameCategory[];
}

export function SecondGameCategoryBar({ categories }: SecondGameCategoryBarProps) {
  if (!categories.length) return null;
  return (
    <section className="border-b border-white/10 bg-card/40 py-3">
      <div className="container px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/games?category=${cat.id}`}
              className="flex-shrink-0 px-4 py-2.5 rounded-lg glass border border-white/10 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
