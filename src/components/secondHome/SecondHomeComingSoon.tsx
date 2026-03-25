import { useRef } from "react";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { comingSoon as defaultComingSoon } from "@/data/homePageMockData";
import type { ComingSoonShape } from "@/data/homePageMockData";
import { getMediaUrl } from "@/lib/api";

function sectionIconSrc(value: string): string {
  return value.trim().startsWith("http") ? value.trim() : getMediaUrl(value.trim());
}

function getImageUrl(item: ComingSoonShape): string {
  const url = item.image ?? item.image_url;
  if (typeof url === "string" && url.startsWith("http")) return url;
  if (typeof url === "string" && url) return getMediaUrl(url);
  return "";
}

function getDateLabel(item: ComingSoonShape): string {
  const d = item.coming_date ?? item.launchDate;
  return d || "Soon";
}

interface SecondHomeComingSoonProps {
  comingSoon?: ComingSoonShape[] | null;
  sectionTitle?: string;
  sectionSvg?: string;
}

export function SecondHomeComingSoon({ comingSoon: comingSoonProp, sectionTitle, sectionSvg }: SecondHomeComingSoonProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const comingSoon = comingSoonProp && comingSoonProp.length > 0 ? comingSoonProp : defaultComingSoon;

  if (!comingSoon || comingSoon.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="container px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {sectionSvg?.trim() ? <img src={sectionIconSrc(sectionSvg)} alt="" className="h-5 w-5 object-contain" /> : <Zap className="h-5 w-5 text-amber-400" />}
          <h2 className="font-display font-bold text-lg text-foreground">{sectionTitle || "Coming Soon"}</h2>
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-400">
            New
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="h-8 w-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="h-8 w-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {comingSoon.map((item) => (
          <div
            key={item.id ?? item.name}
            className="shrink-0 w-[200px] md:w-[220px] snap-start rounded-2xl overflow-hidden border border-white/10 bg-[#0d1117] group hover:border-primary/30 transition-all"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[3/2] overflow-hidden bg-muted/80 flex items-center justify-center">
              <img
                src={getImageUrl(item)}
                alt={item.name}
                className="w-full h-full object-contain object-center group-hover:scale-[1.02] transition-transform duration-500"
                loading="lazy"
              />

              {/* Launch badge */}
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                  <Zap className="h-3 w-3" />
                  {getDateLabel(item)}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-2">
              <p className="font-semibold text-sm text-foreground leading-tight line-clamp-1">{item.name}</p>
              {item.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
