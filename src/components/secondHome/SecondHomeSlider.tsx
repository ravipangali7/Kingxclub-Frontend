import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import type { SliderSlide } from "@/hooks/useSecondHomePageData";

interface SecondHomeSliderProps {
  slides: SliderSlide[];
}

function isExternalHref(href: string): boolean {
  const t = href.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function hasCta(slide: SliderSlide): boolean {
  const link = (slide.ctaHref ?? "").trim();
  const label = (slide.ctaText ?? "").trim();
  return link.length > 0 && link !== "#" && label.length > 0;
}

export function SecondHomeSlider({ slides }: SecondHomeSliderProps) {
  if (!slides.length) return null;
  return (
    <section className="w-full border-b border-white/10">
      <Carousel opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {slides.map((slide) => {
            const clickable = hasCta(slide);
            const href = (slide.ctaHref ?? "").trim();
            const content = (
              <div className="relative flex min-h-[200px] md:min-h-[280px] w-full items-center justify-between gap-6 px-4 py-8 md:px-8 md:py-12 rounded-none">
                {slide.image && (
                  <div className="absolute inset-0 overflow-hidden rounded-none">
                    <img src={slide.image} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="relative z-10 flex flex-1 flex-col md:flex-row md:items-center md:justify-between gap-6 container">
                  <div className="flex-1">
                    <h2 className="font-bold text-xl md:text-2xl uppercase tracking-wide leading-tight text-primary-foreground">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-primary-foreground/90 text-sm mt-2">{slide.subtitle}</p>
                    )}
                  </div>
                  {clickable && (
                    <span className="flex-shrink-0 inline-flex">
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-8 h-12 pointer-events-none">
                        {slide.ctaText}
                      </Button>
                    </span>
                  )}
                </div>
              </div>
            );
            return (
              <CarouselItem key={slide.id}>
                {clickable ? (
                  isExternalHref(href) ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                      {content}
                    </a>
                  ) : (
                    <Link to={href} className="block cursor-pointer">
                      {content}
                    </Link>
                  )
                ) : (
                  content
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-2 glass border-white/10 text-foreground hover:bg-white/5" />
        <CarouselNext className="right-2 glass border-white/10 text-foreground hover:bg-white/5" />
      </Carousel>
    </section>
  );
}
