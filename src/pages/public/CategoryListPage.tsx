import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/api/games";
import type { GameCategory } from "@/api/games";
import { getMediaUrl } from "@/lib/api";
import { svgToImgSrc } from "@/lib/svg";
import { LayoutGrid, ChevronRight } from "lucide-react";

function categoryIconSrc(cat: GameCategory): string | null {
  const icon = cat.icon?.trim();
  if (icon) return icon.startsWith("http") ? icon : getMediaUrl(icon);
  const svg = cat.svg?.trim();
  if (svg) return svg.startsWith("<svg") ? svgToImgSrc(svg) : getMediaUrl(svg);
  return null;
}

const CategoryListPage = () => {
  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const list = categories as GameCategory[];

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 min-w-0 max-w-full">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Game Categories</h1>
        <p className="text-muted-foreground">
          Browse games by category
        </p>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-muted-foreground">Loading categories...</div>
      )}
      {isError && (
        <div className="text-center py-8 text-muted-foreground">Could not load categories.</div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((cat) => {
            const iconSrc = categoryIconSrc(cat);
            return (
              <Link
                key={cat.id}
                to={`/categories/${cat.id}`}
                className="glass rounded-xl p-6 flex items-center gap-4 hover:glow-cyan transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {iconSrc ? (
                    <img src={iconSrc} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <LayoutGrid className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary truncate">{cat.name}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">No categories available.</div>
      )}
    </div>
  );
};

export default CategoryListPage;
