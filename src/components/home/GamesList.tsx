import { Link } from "react-router-dom";
import { ChevronRight, Dices, Rocket, Video, Gamepad2, Trophy } from "lucide-react";
import { getMediaUrl } from "@/lib/api";
import { gamesByCategory as defaultGamesByCategory, categories as defaultCategories } from "@/data/homePageMockData";
import { GameCardSmall } from "@/components/games/GameCard";
import type { CategoryShape, GameCardShape } from "@/data/homePageMockData";

const SLUG_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  crash: Rocket,
  casino: Dices,
  liveCasino: Video,
  sports: Trophy,
  casual: Gamepad2,
};

const SLUG_COLOR_CLASS: Record<string, string> = {
  crash: "bg-primary/20 text-primary",
  casino: "bg-secondary/20 text-secondary",
  liveCasino: "bg-neon-red/20 text-neon-red",
  sports: "bg-neon-green/20 text-neon-green",
  casual: "bg-accent/20 text-accent",
};

/** Resolve section icon: override (section_icon) then category icon, else slug-based Lucide icon. */
function SectionIcon({
  sectionIcon,
  categoryIcon,
  slug,
  colorClass,
  alt,
}: {
  sectionIcon?: string | null;
  categoryIcon?: string | null;
  slug: string;
  colorClass: string;
  alt: string;
}) {
  const Icon = SLUG_ICON[slug] ?? Gamepad2;
  const imageUrl = sectionIcon?.trim() ?? categoryIcon?.trim();
  if (imageUrl) {
    const src = imageUrl.startsWith("http") ? imageUrl : getMediaUrl(imageUrl);
    return (
      <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
        <img src={src} alt={alt} className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
}

interface AllGameCategoriesProps {
  gamesByCategory?: Record<string, GameCardShape[]> | null;
  categories?: CategoryShape[] | null;
  /** Per-category overrides from site_categories_game_json (section_title, section_icon). Key = category id. */
  categorySectionOverrides?: Record<number, { section_title?: string; section_icon?: string }> | null;
}

export function AllGameCategories({ gamesByCategory: gamesByCategoryProp, categories: categoriesProp, categorySectionOverrides }: AllGameCategoriesProps) {
  const gamesByCategory = gamesByCategoryProp && Object.keys(gamesByCategoryProp).length > 0 ? gamesByCategoryProp : defaultGamesByCategory;
  const categories = categoriesProp && categoriesProp.length > 0 ? categoriesProp : defaultCategories;

  return (
    <>
      {categories.map((cat) => {
        const games = gamesByCategory[cat.slug];
        if (!games?.length) return null;
        const href = cat.id != null ? `/games?category=${cat.id}&page=1` : (cat.slug === "sports" ? "/sports" : "/games?page=1");
        const colorClass = SLUG_COLOR_CLASS[cat.slug] ?? "bg-muted text-muted-foreground";
        const overrides = cat.id != null ? categorySectionOverrides?.[cat.id] : undefined;
        const sectionTitle = (overrides?.section_title?.trim() || cat.label) ?? cat.slug;
        const sectionIcon = overrides?.section_icon;
        return (
          <section key={cat.slug} className="py-2">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <SectionIcon sectionIcon={sectionIcon} categoryIcon={cat.icon} slug={cat.slug} colorClass={colorClass} alt={sectionTitle} />
                  <h2 className="text-xl md:text-2xl font-bold">{sectionTitle}</h2>
                </div>
                <Link to={href} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {games.map((game) => (
                  <div key={game.id} className="w-[160px] sm:w-[180px] flex-shrink-0 snap-start">
                    <GameCardSmall {...game} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
