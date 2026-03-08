import { categories as defaultCategories } from "@/data/homePageMockData";
import { CategoryCard } from "@/components/games/CategoryCard";
import type { CategoryShape } from "@/data/homePageMockData";

interface GameCategoriesProps {
  categories?: CategoryShape[] | null;
}

export function GameCategories({ categories: categoriesProp }: GameCategoriesProps) {
  const categories = categoriesProp && categoriesProp.length > 0 ? categoriesProp : defaultCategories;

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Explore <span className="gradient-text">Game Categories</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From classic card games to thrilling live casino experiences. Find your perfect game.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
