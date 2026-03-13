import { Link } from "react-router-dom";
import type { GameCategory } from "@/api/games";
import { getMediaUrl } from "@/lib/api";
import { LayoutGrid } from "lucide-react";

const IRREGULAR_SHAPE = "60% 40% 50% 50% / 50% 60% 40% 50%";

function sectionIconSrc(value: string): string {
  return value.trim().startsWith("http") ? value.trim() : getMediaUrl(value.trim());
}

interface SecondHomeAllCategoriesProps {
  categories: GameCategory[];
  sectionTitle?: string;
  sectionSvg?: string;
}

function categoryIconSrc(cat: GameCategory): string | null {
  const icon = cat.icon?.trim();
  if (icon) return icon.startsWith("http") ? icon : getMediaUrl(icon);
  const svg = cat.svg?.trim();
  if (svg) return svg.startsWith("http") ? svg : getMediaUrl(svg);
  return null;
}

function CategoryIcon({ cat, name }: { cat: GameCategory; name: string }) {
  const src = categoryIconSrc(cat);
  if (!src) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <LayoutGrid className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }
  return <img src={src} alt={name} className="h-full w-full object-cover" />;
}

export function SecondHomeAllCategories({ categories, sectionTitle, sectionSvg }: SecondHomeAllCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="container px-4 py-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        {sectionSvg?.trim() ? (
          <img src={sectionIconSrc(sectionSvg)} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <LayoutGrid className="h-5 w-5 text-primary" />
        )}
        <h2 className="font-display font-bold text-lg text-foreground">
          {sectionTitle || "All Categories"}
        </h2>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" style={{ WebkitOverflowScrolling: "touch" }}>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/categories/${cat.id}`}
            className="flex flex-col items-center gap-2 flex-shrink-0 group focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="h-14 w-14 flex items-center justify-center overflow-hidden transition-all" style={{ borderRadius: IRREGULAR_SHAPE }}>
              <CategoryIcon cat={cat} name={cat.name} />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium group-hover:text-foreground transition-colors text-center max-w-[64px] leading-tight line-clamp-2">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
