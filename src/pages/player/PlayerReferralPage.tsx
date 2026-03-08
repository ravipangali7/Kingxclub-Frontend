import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getPlayerReferrals } from "@/api/player";
import { getBonusRules, type BonusRule } from "@/api/bonus";
import { Users, Share2, UserPlus, Gift, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function referralRewardDisplay(rules: BonusRule[]): string {
  const referral = rules.find((r) => (r.bonus_type || "").toLowerCase() === "referral");
  if (!referral) return "—";
  const val = referral.reward_amount ?? referral.reward_value ?? "0";
  const type = referral.reward_type === "percentage" ? "%" : " Fixed";
  return `${val}${type}`;
}

const PlayerReferralPage = () => {
  const { user } = useAuth();
  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ["player-referrals"],
    queryFn: getPlayerReferrals,
  });
  const { data: bonusRules = [] } = useQuery({
    queryKey: ["bonusRules"],
    queryFn: getBonusRules,
  });
  const referralUrl =
    typeof window !== "undefined" && user?.username
      ? `${window.location.origin}/register?ref=${encodeURIComponent(user.username)}`
      : "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast({ title: "Link copied to clipboard." });
    } catch {
      toast({ title: "Could not copy. Copy the link manually.", variant: "destructive" });
    }
  };

  const rewardLabel = referralRewardDisplay(bonusRules as BonusRule[]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header: Refer & Earn + share icon */}
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-emerald-400" />
        <h2 className="font-display font-bold text-lg text-foreground">Refer &amp; Earn</h2>
      </div>

      {/* Hero offer card – green-teal, icon + EARN + title + Claim now */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600/90 to-teal-800/90 border border-emerald-500/30 shadow-lg">
        <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">EARN</p>
              <h3 className="text-lg md:text-xl font-bold text-[#b8f0a8] mt-0.5">
                Refer &amp; Earn {rewardLabel}
              </h3>
            </div>
          </div>
          <div className="shrink-0 sm:ml-auto">
            <Button
              size="lg"
              className="bg-emerald-400/90 hover:bg-emerald-400 text-emerald-950 font-semibold border-0 rounded-xl"
              onClick={handleCopy}
            >
              Claim now
            </Button>
          </div>
        </div>
      </div>

      {/* Three-step guide – dark panels */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 md:px-8 py-5 grid grid-cols-3 gap-4">
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-col items-center text-center gap-2 group"
        >
          <div className="h-10 w-10 rounded-full bg-white/5 border border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
            <Share2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">01</p>
          <p className="text-xs text-foreground/80 group-hover:text-emerald-400 transition-colors">Share your link</p>
          <p className="text-[10px] text-emerald-500/80">Copy link</p>
        </button>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">02</p>
          <p className="text-xs text-foreground/80">Friend signs up</p>
        </div>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Gift className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">03</p>
          <p className="text-xs text-foreground/80">You both earn</p>
        </div>
      </div>

      {/* Your referral code + copy area (compact) */}
      {user?.username && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-muted-foreground mb-2">Your referral code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono font-medium text-foreground bg-muted/30 px-3 py-2 rounded-lg truncate">
              {user.username}
            </code>
            <Button size="sm" variant="secondary" className="shrink-0" onClick={handleCopy}>
              Copy link
            </Button>
          </div>
        </div>
      )}

      {/* Referred friends */}
      <Card className="gaming-card border-white/10 bg-white/[0.03]">
        <CardContent className="p-5">
          <h3 className="font-display font-semibold text-base flex items-center gap-2 mb-3 text-foreground">
            <UserPlus className="h-4 w-4 text-emerald-400" />
            Referred friends
          </h3>
          {referralsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No one has signed up with your link yet. Share your referral link to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {referrals.map((ref) => (
                <li key={ref.id}>
                  <Link
                    to={`/player/referral/${ref.id}`}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-left"
                  >
                    <div>
                      <span className="font-medium text-foreground">{ref.name || ref.username}</span>
                      <span className="text-muted-foreground text-sm ml-2 font-mono">@{ref.username}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Joined {ref.created_at ? new Date(ref.created_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerReferralPage;
