import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getPlayerReferrals } from "@/api/player";
import { getBonusRules, type BonusRule } from "@/api/bonus";
import {
  Users,
  Gift,
  Copy,
  Share2,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ReferralItem } from "@/api/player";

function referralRewardDisplay(rules: BonusRule[]): string {
  const referral = rules.find((r) => (r.bonus_type || "").toLowerCase() === "referral");
  if (!referral) return "₹100";
  const val = referral.reward_amount ?? referral.reward_value ?? "100";
  const type = referral.reward_type === "percentage" ? "%" : "";
  return type ? `${val}${type}` : `₹${val}`;
}

function maskName(name: string): string {
  if (!name || name.length < 4) return name || "—";
  return `${name.slice(0, 2)}***${name.slice(-2)}`;
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

  const rewardLabel = referralRewardDisplay(bonusRules as BonusRule[]);
  const referralUrl =
    typeof window !== "undefined" && user?.username
      ? `${window.location.origin}/register?ref=${encodeURIComponent(user.username)}`
      : "";
  const displayCode = user?.username ?? "—";
  const displayLink = referralUrl || (typeof window !== "undefined" ? `${window.location.origin}/register` : "");

  const referralStats = {
    totalReferrals: referrals.length,
    activeReferrals: referrals.length,
    totalEarnings: 0,
    pendingEarnings: 0,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard." });
  };

  const shareLink = () => {
    if (navigator.share && displayLink) {
      navigator.share({
        title: "Join and play!",
        text: `Use my referral link and earn ${rewardLabel} bonus!`,
        url: displayLink,
      });
    } else if (displayLink) {
      copyToClipboard(displayLink);
    }
  };

  const recentReferralsList = referrals.map((ref: ReferralItem) => ({
    id: ref.id,
    name: maskName(ref.name || ref.username || ""),
    date: ref.created_at ? new Date(ref.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—",
    status: "active" as const,
    earned: "—",
    earnings: 0,
  }));

  return (
    <div className="container mx-auto px-4 pb-8">
      {/* Hero */}
      <div className="glass rounded-2xl p-8 md:p-12 mb-8 bg-gradient-to-r from-neon-green/10 via-primary/10 to-secondary/10 border-neon-green/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-neon-green/30 mb-6">
            <Gift className="w-5 h-5 text-neon-green" />
            <span className="text-sm font-medium">Refer & Earn Program</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Earn <span className="gradient-text">{rewardLabel}</span> for Every Friend!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Share your referral link and earn when your friends join and play. No limits on how much you can earn!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto">
            <div className="flex-1 w-full flex items-center gap-2 bg-input rounded-lg px-4 py-3 border border-border">
              <Input
                value={displayLink}
                readOnly
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 flex-1 min-w-0"
              />
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(displayLink)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="neon" size="lg" onClick={shareLink} className="gap-2 w-full sm:w-auto">
              <Share2 className="w-5 h-5" />
              Share Link
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <span>Your Code:</span>
            <code className="px-2 py-1 bg-muted rounded font-mono">{displayCode}</code>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(displayCode)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
          <p className="text-2xl font-bold">{referralStats.totalReferrals}</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-neon-green" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Active Referrals</p>
          <p className="text-2xl font-bold text-neon-green">{referralStats.activeReferrals}</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
          <p className="text-2xl font-bold font-mono gradient-text-gold">₹{referralStats.totalEarnings.toLocaleString()}</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Pending Earnings</p>
          <p className="text-2xl font-bold font-mono">₹{referralStats.pendingEarnings.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Referral transactions (dynamic) */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Referral transactions</h2>
            {referralsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referral transactions yet. Share your link to get started.</p>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {referrals.map((ref) => (
                  <Link
                    key={ref.id}
                    to={`/player/referral/${ref.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{ref.name || ref.username}</p>
                      <p className="text-xs text-muted-foreground font-mono">@{ref.username}</p>
                    </div>
                    <div className="text-right flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {ref.created_at ? new Date(ref.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Referrals + How It Works */}
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Recent Referrals</h2>
            {referralsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : recentReferralsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has signed up with your link yet. Share your referral link to get started.</p>
            ) : (
              <div className="space-y-3">
                {recentReferralsList.map((ref) => (
                  <Link
                    key={ref.id}
                    to={`/player/referral/${ref.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{ref.name}</p>
                      <p className="text-xs text-muted-foreground">{ref.date}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-neon-green/20 text-neon-green">{ref.status}</span>
                      <span className="text-sm font-mono font-medium">{ref.earned}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">How It Works</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: "Share Your Link", desc: "Send your unique referral link to friends" },
                { step: 2, title: "Friend Signs Up", desc: "They register using your link" },
                { step: 3, title: "You Get Paid", desc: `Earn ${rewardLabel} when they join and play` },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerReferralPage;
