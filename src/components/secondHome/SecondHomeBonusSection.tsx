import { Link } from "react-router-dom";
import { Gift, Wallet, Trophy, Percent, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { PromoShape } from "@/data/homePageMockData";

const variantConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; gradient: string; iconBg: string; buttonText: string }
> = {
  welcome: {
    icon: Gift,
    gradient: "from-violet-600 to-purple-700",
    iconBg: "bg-violet-600/90",
    buttonText: "text-violet-900",
  },
  deposit: {
    icon: Wallet,
    gradient: "from-amber-500 via-orange-500 to-teal-600/80",
    iconBg: "bg-amber-500/90",
    buttonText: "text-gray-800",
  },
  referral: {
    icon: Users,
    gradient: "from-emerald-600 to-teal-500",
    iconBg: "bg-emerald-600/90",
    buttonText: "text-emerald-900",
  },
  tournament: {
    icon: Trophy,
    gradient: "from-amber-500 via-yellow-600/90 to-orange-600",
    iconBg: "bg-amber-500/90",
    buttonText: "text-gray-800",
  },
  cashback: {
    icon: Percent,
    gradient: "from-cyan-600 to-blue-600",
    iconBg: "bg-cyan-600/90",
    buttonText: "text-cyan-900",
  },
};

/** Bonus card: when logged in show "Claim now", when guest show "Login to claim". Deposit type has no claim button (applied on first deposit). */
export function SecondHomeBonusCard({ promo, featured = false }: { promo: PromoShape; featured?: boolean }) {
  const { user } = useAuth();
  const variant = promo.variant ?? "welcome";
  const cfg = variantConfig[variant] ?? variantConfig.welcome;
  const Icon = cfg.icon;
  const isDeposit = variant === "deposit";
  const ctaLabel = user ? "Claim now" : "Login to claim";

  const content = (
    <>
      {/* Icon in rounded square (left) */}
      <div className={`flex-shrink-0 h-14 w-14 rounded-xl ${cfg.iconBg} flex items-center justify-center shadow-md`}>
        <Icon className="h-7 w-7 text-white" />
      </div>

      {/* Text: badge (gray) + title & value (gold) */}
      <div className="flex-1 min-w-0">
        {promo.badge && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70 mb-0.5">{promo.badge}</p>
        )}
        <p className="text-base md:text-lg font-bold leading-tight">
          <span className="text-[#FFD700]">
            {promo.title}
            {promo.highlight ? ` ${promo.highlight}` : ""}
          </span>
        </p>
      </div>

      {/* CTA: no button for deposit (applied on first deposit); otherwise Claim now / Login to claim */}
      {!isDeposit && (
        <span
          className={`flex-shrink-0 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-sm font-semibold ${cfg.buttonText}`}
        >
          {ctaLabel}
        </span>
      )}
      {isDeposit && (
        <span className="flex-shrink-0 text-sm font-medium text-white/80">Applied on first deposit</span>
      )}
    </>
  );

  if (isDeposit) {
    return (
      <div
        className={`relative flex items-center gap-4 rounded-2xl overflow-hidden bg-gradient-to-r ${cfg.gradient} p-4 md:p-5 min-h-[88px] shadow-inner border border-white/10`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={promo.href ?? "/bonus"}
      className={`relative flex items-center gap-4 rounded-2xl overflow-hidden bg-gradient-to-r ${cfg.gradient} p-4 md:p-5 min-h-[88px] shadow-inner border border-white/10 hover:opacity-95 transition-opacity`}
    >
      {content}
    </Link>
  );
}

interface SecondHomeBonusSectionProps {
  welcomeDepositPromos: PromoShape[];
  tournamentPromo: PromoShape | null;
  cashbackPromo: PromoShape | null;
}

export function SecondHomeBonusSection({ welcomeDepositPromos, tournamentPromo, cashbackPromo }: SecondHomeBonusSectionProps) {
  const hasMain = welcomeDepositPromos.length > 0;
  const hasExtras = !!tournamentPromo || !!cashbackPromo;

  if (!hasMain && !hasExtras) return null;

  return (
    <section className="container px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-lg text-foreground">Bonuses &amp; Promotions</h2>
      </div>

      {/* Welcome | Deposit grid */}
      {hasMain && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {welcomeDepositPromos.map((promo, i) => (
            <SecondHomeBonusCard key={i} promo={promo} />
          ))}
        </div>
      )}

      {/* Tournament / Cashback full-width rows */}
      {hasExtras && (
        <div className={`${hasMain ? "mt-4" : ""} flex flex-col gap-4`}>
          {tournamentPromo && <SecondHomeBonusCard promo={tournamentPromo} featured />}
          {cashbackPromo && <SecondHomeBonusCard promo={cashbackPromo} featured />}
        </div>
      )}
    </section>
  );
}
