import { Quote, Trophy, Star } from "lucide-react";
import { testimonials as defaultTestimonials, recentWins as defaultRecentWins } from "@/data/homePageMockData";
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
                        {t.avatar ?? (t.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{t.name}</h4>
                      {t.location && <p className="text-xs text-muted-foreground">{t.location}</p>}
                    </div>
                    <div className="flex">
                      {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-accent fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">&ldquo;{t.message}&rdquo;</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{t.game}</span>
                    <span className="text-sm font-bold gradient-text-gold">{t.amount ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-neon-green/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Live Wins</h2>
                <p className="text-muted-foreground text-sm">Real-time winners</p>
              </div>
            </div>
            <div className="glass rounded-xl overflow-hidden">
              {recentWins.map((win, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {win.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{win.user}</p>
                      <p className="text-xs text-muted-foreground">{win.game}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-neon-green">{win.amount}</p>
                    <p className="text-xs text-muted-foreground">{win.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
