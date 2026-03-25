import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play, Trophy, Gift, ArrowRight } from "lucide-react";
import { hero as defaultHero, heroStats as defaultHeroStats } from "@/data/homePageMockData";
import type { HeroData } from "@/data/homePageMockData";
import { useAuth } from "@/contexts/AuthContext";

const statIconMap: Record<string, string> = {
  users: "👥",
  gamepad: "🎮",
  trophy: "💰",
  zap: "⚡",
};

interface HeroSectionProps {
  hero?: HeroData | null;
  heroStats?: { label: string; value: string; icon: string }[] | null;
  /** When set, overrides the welcome floater value line (from bonus rules). */
  welcomeFloaterValue?: string | null;
}

export function HeroSection({ hero: heroProp, heroStats: heroStatsProp, welcomeFloaterValue }: HeroSectionProps) {
  const { user } = useAuth();
  const hero = heroProp ?? defaultHero;
  const heroStats = heroStatsProp && heroStatsProp.length > 0 ? heroStatsProp : defaultHeroStats;

  const h = hero && (hero.title || hero.subtitle) ? { ...defaultHero, ...hero } : defaultHero;
  const startPlayingHref = user ? "/providers" : "/register";

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-32 pb-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />

      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-1.5s" }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
            <span className="text-sm font-medium">🎮 {h.badge}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
            {h.title?.includes("Repeat") ? (
              <>
                {(h.title || "").replace("Repeat.", "").trim()}{" "}
                <span className="gradient-text">Repeat.</span>
              </>
            ) : (
              h.title ?? (
                <>
                  Play. Win. <span className="gradient-text">Repeat.</span>
                </>
              )
            )}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {h.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Link to={startPlayingHref}>
              <Button variant="neon" size="xl" className="gap-2 w-full sm:w-auto">
                <Play className="w-5 h-5" />
                {h.ctaText ?? "Start Playing"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/games">
              <Button variant="glass" size="xl" className="gap-2 w-full sm:w-auto">
                Explore Games
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {heroStats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={statIconMap[s.icon] ?? "🎮"} />
            ))}
          </div>
        </div>

        {/* Floating Promo Cards */}
        <div className="absolute left-4 top-1/3 hidden lg:block animate-float">
          <PromoCard
            icon={<Trophy className="w-6 h-6 text-accent" />}
            title="Weekly Tournament"
            value="₹10 Lakh Prize Pool"
          />
        </div>

        <div className="absolute right-4 top-1/2 hidden lg:block animate-float" style={{ animationDelay: "-2s" }}>
          <PromoCard
            icon={<Gift className="w-6 h-6 text-neon-green" />}
            title="Welcome Bonus"
            value={welcomeFloaterValue?.trim() || "200% Up to ₹50,000"}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center hover:glow-cyan transition-all duration-300">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold gradient-text font-mono">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function PromoCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="glass-strong rounded-xl p-4 w-64 hover:glow-gold transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
