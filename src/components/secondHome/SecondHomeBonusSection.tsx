import { Link } from "react-router-dom";
import { Gift, Wallet, Trophy, Percent, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { PromoShape } from "@/data/homePageMockData";

/** Maitidevi-matching gradients and styles for Limited Offer, Refer & Earn, Tournament, Cashback */
const MAITIDEVI_GRADIENTS: Record<string, string> = {
  welcome: "from-primary via-secondary to-primary",
  referral: "from-neon-green via-emerald-500 to-neon-green",
  tournament: "from-accent via-orange-500 to-accent",
  cashback: "from-neon-pink via-purple-500 to-neon-pink",
};

const variantConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; gradient: string; iconBg: string; buttonText: string; useMaitideviBorder: boolean }
> = {
  welcome: {
    icon: Gift,
    gradient: MAITIDEVI_GRADIENTS.welcome,
    iconBg: "bg-gradient-to-br from-primary to-secondary",
    buttonText: "text-primary-foreground",
    useMaitideviBorder: true,
  },
  deposit: {
    icon: Wallet,
    gradient: "from-amber-500 via-orange-500 to-teal-600/80",
    iconBg: "bg-amber-500/90",
    buttonText: "text-gray-800",
    useMaitideviBorder: false,
  },
  referral: {
    icon: Users,
    gradient: MAITIDEVI_GRADIENTS.referral,
    iconBg: "bg-gradient-to-br from-neon-green to-emerald-500",
    buttonText: "text-white",
    useMaitideviBorder: true,
  },
  tournament: {
    icon: Trophy,
    gradient: MAITIDEVI_GRADIENTS.tournament,
    iconBg: "bg-gradient-to-br from-accent to-orange-500",
    buttonText: "text-accent-foreground",
    useMaitideviBorder: true,
  },
  cashback: {
    icon: Percent,
    gradient: MAITIDEVI_GRADIENTS.cashback,
    iconBg: "bg-gradient-to-br from-neon-pink to-purple-500",
    buttonText: "text-white",
    useMaitideviBorder: true,
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
      {/* Icon in rounded square (left) – same as maitidevi */}
      <div className={`flex-shrink-0 h-14 w-14 rounded-xl ${cfg.iconBg} flex items-center justify-center text-white shadow-md`}>
        <Icon className="h-7 w-7" />
      </div>

      {/* Text: badge + title & highlight (maitidevi: badge bg-muted, highlight gradient-text) */}
      <div className="flex-1 min-w-0">
        {promo.badge && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{promo.badge}</p>
        )}
        <p className="text-base md:text-lg font-bold leading-tight text-foreground">
          {promo.title}
          {promo.highlight != null && (
            <>: <span className="gradient-text">{promo.highlight}</span></>
          )}
          {promo.subtitle != null && ` ${promo.subtitle}`}
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
        <span className="flex-shrink-0 text-sm font-medium text-muted-foreground">Applied on first deposit</span>
      )}
    </>
  );

  /* Deposit: keep original full gradient fill and border-white/10 (no maitidevi variant) */
  if (isDeposit) {
    return (
      <div
        className={`relative flex items-center gap-4 rounded-2xl overflow-hidden bg-gradient-to-r ${cfg.gradient} p-4 md:p-5 min-h-[88px] shadow-inner border border-white/10`}
      >
        {content}
      </div>
    );
  }

  /* Maitidevi-style: gradient as 2px border, inner bg-card, diagonal stripe overlay */
  if (cfg.useMaitideviBorder) {
    const wrapperClass = `relative rounded-2xl overflow-hidden bg-gradient-to-r ${cfg.gradient} p-[2px]`;
    const innerClass = "relative rounded-2xl bg-card min-h-[88px] overflow-hidden";
    return (
      <Link to={promo.href ?? "/bonus"} className={`block ${wrapperClass} hover:opacity-95 transition-opacity`}>
        <div className={innerClass}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
              }}
            />
          </div>
          <div className="relative z-10 flex items-center gap-4 p-4 md:p-5">
            {content}
          </div>
        </div>
      </Link>
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
