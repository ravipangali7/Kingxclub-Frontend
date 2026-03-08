import { Link } from "react-router-dom";
import { Users, Share2, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { PromoShape } from "@/data/homePageMockData";
import { promosGrid as defaultPromos } from "@/data/homePageMockData";
import { SecondHomeBonusCard } from "./SecondHomeBonusSection";

interface SecondHomeReferBonusProps {
  promos?: PromoShape[] | null;
  sectionTitle?: string;
  sectionSvg?: string;
}

export function SecondHomeReferBonus({ promos: promosProp, sectionTitle, sectionSvg }: SecondHomeReferBonusProps) {
  const { user } = useAuth();
  const promos = promosProp && promosProp.length > 0 ? promosProp : defaultPromos;
  const primary = promos[0];
  const rest = promos.slice(1);

  const referralUrl =
    typeof window !== "undefined" && user?.username
      ? `${window.location.origin}/register?ref=${encodeURIComponent(user.username)}`
      : "";

  const handleCopyReferralLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast({ title: "Referral link copied to clipboard." });
    } catch {
      toast({ title: "Could not copy. Copy the link manually.", variant: "destructive" });
    }
  };

  if (!primary) return null;

  const referPageHref = user ? "/player/referral" : "/login?next=/player/referral";
  const primaryWithReferHref = { ...primary, href: referPageHref };

  return (
    <section className="container px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <Share2 className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-lg text-foreground">Refer &amp; Earn</h2>
      </div>

      {/* Primary card – click goes to player refer page (or login then refer) */}
      <SecondHomeBonusCard promo={primaryWithReferHref} />

      {/* Steps row */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-6 md:px-8 py-5 grid grid-cols-3 gap-4">
        {/* Step 01: when logged in = copy link button; when guest = link to login */}
        {user ? (
          <button
            type="button"
            onClick={handleCopyReferralLink}
            className="flex flex-col items-center text-center gap-2 group"
          >
            <div className="h-10 w-10 rounded-full bg-white/5 border border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
              <Share2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">01</p>
            <p className="text-xs text-foreground/80 group-hover:text-emerald-400 transition-colors">Share your link</p>
            <p className="text-[10px] text-emerald-500/80">Copy link</p>
          </button>
        ) : (
          <Link
            to="/login?next=/player/referral"
            className="flex flex-col items-center text-center gap-2 group"
          >
            <div className="h-10 w-10 rounded-full bg-white/5 border border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
              <Share2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">01</p>
            <p className="text-xs text-foreground/80 group-hover:text-emerald-400 transition-colors">Share your link</p>
            <p className="text-[10px] text-emerald-500/80">Login to get link</p>
          </Link>
        )}

        {/* Step 02 & 03: informational */}
        {[
          { icon: Users, label: "Friend signs up", step: "02" },
          { icon: Gift, label: "You both earn", step: "03" },
        ].map(({ icon: Icon, label, step }) => (
          <div key={step} className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{step}</p>
            <p className="text-xs text-foreground/80">{label}</p>
          </div>
        ))}
      </div>

      {/* Secondary promos – same card design, same layout (grid) */}
      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {rest.map((promo, i) => (
            <SecondHomeBonusCard key={i} promo={promo} />
          ))}
        </div>
      )}
    </section>
  );
}
