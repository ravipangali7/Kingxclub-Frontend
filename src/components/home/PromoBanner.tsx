import { Link } from "react-router-dom";
import { Gift, Users, Trophy, Percent, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PromoShape } from "@/data/homePageMockData";
import { promosGrid as defaultPromos } from "@/data/homePageMockData";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const GRADIENTS: Record<string, string> = {
  welcome: "from-primary via-secondary to-primary",
  deposit: "from-amber-500 via-cyan-500 to-amber-500",
  referral: "from-neon-green via-emerald-500 to-neon-green",
  tournament: "from-accent via-orange-500 to-accent",
  cashback: "from-neon-pink via-purple-500 to-neon-pink",
};

const variantIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  welcome: Gift,
  deposit: Wallet,
  referral: Users,
  tournament: Trophy,
  cashback: Percent,
};

interface PromoBannerProps {
  promo: PromoShape;
  className?: string;
  fullWidth?: boolean;
}

export function PromoBanner({ promo, className, fullWidth }: PromoBannerProps) {
  const variant = (promo.variant ?? "welcome") as keyof typeof GRADIENTS;
  const gradient = GRADIENTS[variant] ?? GRADIENTS.welcome;
  const Icon = variantIcons[variant] ?? Gift;
  const href = promo.href ?? "/promotions";
  const cta = promo.cta ?? "Learn More";

  const content = (
    <div className={cn("relative rounded-2xl overflow-hidden bg-gradient-to-r p-[2px]", gradient, className)}>
      <div className="relative rounded-2xl bg-card overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
            }}
          />
        </div>
        <div className={cn("relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6", fullWidth && "md:px-10")}>
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white flex-shrink-0 animate-float`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            {promo.badge && (
              <span className="inline-block px-3 py-1 rounded-full bg-muted text-xs font-semibold mb-3">
                {promo.badge}
              </span>
            )}
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">
              {promo.title}
              {promo.highlight != null && (
                <>: <span className="gradient-text">{promo.highlight}</span></>
              )}
              {promo.subtitle != null && ` ${promo.subtitle}`}
            </h3>
            {promo.description && <p className="text-muted-foreground">{promo.description}</p>}
          </div>
          <Link to={href} className="flex-shrink-0">
            <Button variant="gold" size="lg">
              {cta}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return content;
}

function withReferralHref(promo: PromoShape, user: { username?: string } | null): PromoShape {
  if ((promo.variant || "").toLowerCase() !== "referral") return promo;
  const referPageHref = user ? "/player/referral" : "/login?next=/player/referral";
  return { ...promo, href: referPageHref };
}

export function PromoBannerGrid({ promos: promosProp }: { promos?: PromoShape[] | null }) {
  const { user } = useAuth();
  const promos = promosProp && promosProp.length > 0 ? promosProp : defaultPromos;
  const welcomePromo = promos.find((p) => (p.variant || "").toLowerCase() === "welcome") ?? promos[0];
  const referralRaw = promos.find((p) => (p.variant || "").toLowerCase() === "referral") ?? promos[1];
  const referralPromo = referralRaw ? withReferralHref(referralRaw, user) : defaultPromos[1];
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          <PromoBanner promo={welcomePromo ?? defaultPromos[0]} />
          <PromoBanner promo={referralPromo ?? defaultPromos[1]} />
        </div>
      </div>
    </section>
  );
}
