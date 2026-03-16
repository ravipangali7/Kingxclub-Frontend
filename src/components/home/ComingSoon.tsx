import { useRef, useState } from "react";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { comingSoon as defaultComingSoon } from "@/data/homePageMockData";
import { Button } from "@/components/ui/button";
import type { ComingSoonShape } from "@/data/homePageMockData";
import { getMediaUrl } from "@/lib/api";

interface ComingSoonProps {
  comingSoon?: ComingSoonShape[] | null;
}

function getImageUrl(item: ComingSoonShape): string {
  const url = item.image ?? item.image_url;
  if (typeof url === "string" && url.startsWith("http")) return url;
  if (typeof url === "string" && url) return getMediaUrl(url);
  return "";
}

function getDateLabel(item: ComingSoonShape): string {
  const d = item.coming_date ?? item.launchDate;
  if (d) return d;
  return "Coming Soon";
}

export function ComingSoon({ comingSoon: comingSoonProp }: ComingSoonProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const comingSoon = comingSoonProp && comingSoonProp.length > 0 ? comingSoonProp : defaultComingSoon;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };
  const scrollWithAmount = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center animate-pulse">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Coming Soon</h2>
              <p className="text-muted-foreground text-sm">Exciting new games launching soon</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => scrollWithAmount("left")} disabled={!canScrollLeft} className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scrollWithAmount("right")} disabled={!canScrollRight} className="rounded-full">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {comingSoon.map((item) => (
            <div key={item.id ?? item.name} className="w-[300px] flex-shrink-0 snap-start">
              <div className="group rounded-2xl overflow-hidden glass border border-border/50 hover:border-secondary/50 transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={getImageUrl(item)} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-secondary/90 text-secondary-foreground text-xs font-bold rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getDateLabel(item)}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description ?? ""}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
