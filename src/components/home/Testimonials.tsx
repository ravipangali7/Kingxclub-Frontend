import { Quote, Trophy } from "lucide-react";
import { testimonials as defaultTestimonials, recentWins as defaultRecentWins } from "@/data/homePageMockData";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { TestimonialShape, RecentWinShape } from "@/data/homePageMockData";

interface TestimonialsProps {
  testimonials?: TestimonialShape[] | null;
  recentWins?: RecentWinShape[] | null;
}

export function Testimonials({ testimonials: testimonialsProp, recentWins: recentWinsProp }: TestimonialsProps) {
  const testimonials = testimonialsProp && testimonialsProp.length > 0 ? testimonialsProp : defaultTestimonials;
  const recentWins = recentWinsProp && recentWinsProp.length > 0 ? recentWinsProp : defaultRecentWins;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Quote className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Player Stories</h2>
                <p className="text-muted-foreground text-sm">Hear from our winners</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {testimonials.map((t) => (
                <div key={t.id ?? t.name} className="glass rounded-xl p-5 hover:glow-gold transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    {typeof t.avatar === "string" && (t.avatar.startsWith("http") || t.avatar.startsWith("/")) ? (
                      <img src={t.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                        {t.avatar ?? t.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{t.name}</h4>
                      {t.location && <p className="text-xs text-muted-foreground">{t.location}</p>}
                    </div>
                    <div className="flex">
                      {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.message}&rdquo;</p>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.game}</span>
                    <span className="text-primary font-semibold">{t.amount ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Live Wins</h2>
                <p className="text-muted-foreground text-sm">Recent big wins</p>
              </div>
            </div>
          <Card className="glass border-white/10">
            <CardContent className="p-0">
              <ul className="divide-y divide-white/10">
                {recentWins.map((w, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {w.user.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{w.user}</p>
                      <p className="text-xs text-muted-foreground truncate">{w.game}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-green-500">{w.amount}</p>
                      <p className="text-[10px] text-muted-foreground">{w.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
