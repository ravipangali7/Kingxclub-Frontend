import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getBonusRules, type BonusRule, rewardDisplay, bonusRuleMetaLine } from "@/api/bonus";
import { getPlayerWallet, bonusRequestCreate } from "@/api/player";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Gift, UserPlus, Wallet, Sparkles } from "lucide-react";

const BONUS_TYPE_LABELS: Record<string, string> = {
  welcome: "Welcome",
  deposit: "Deposit",
  referral: "Refer",
};

const BONUS_TYPE_BADGES: Record<string, string> = {
  welcome: "New Players",
  deposit: "Reload",
  referral: "Earn",
};

const BONUS_TYPE_ICONS: Record<string, typeof Gift> = {
  welcome: Sparkles,
  deposit: Wallet,
  referral: UserPlus,
};

const VARIANT_STYLES: Record<string, string> = {
  welcome: "from-violet-600/90 to-purple-800/90 border-violet-500/30",
  deposit: "from-amber-600/90 to-cyan-800/90 border-amber-500/30",
  referral: "from-emerald-600/90 to-teal-800/90 border-emerald-500/30",
};

type BonusRequestStatus =
  | { status: "pending" }
  | { status: "rejected"; reject_reason?: string }
  | null;

const BonusPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const { data: bonusRules = [] } = useQuery({ queryKey: ["bonusRules"], queryFn: getBonusRules });
  const { data: wallet } = useQuery({
    queryKey: ["player-wallet"],
    queryFn: getPlayerWallet,
    enabled: user?.role === "player",
  });

  const bonusRequestsByRuleId = useMemo(() => {
    const list = (wallet as Record<string, unknown>)?.["bonus_requests"] as Array<Record<string, unknown>> | undefined;
    if (!list?.length) return new Map<number, BonusRequestStatus>();
    const map = new Map<number, BonusRequestStatus>();
    for (const br of list) {
      const ruleId = br.bonus_rule != null ? Number(br.bonus_rule) : null;
      if (ruleId == null) continue;
      const st = String(br.status ?? "").toLowerCase();
      if (st === "pending") {
        map.set(ruleId, { status: "pending" });
      } else if (st === "rejected") {
        const existing = map.get(ruleId);
        if (existing?.status !== "pending") {
          map.set(ruleId, { status: "rejected", reject_reason: String(br.reject_reason ?? "").trim() || undefined });
        }
      }
    }
    return map;
  }, [wallet]);

  const approvedBonusTypes = useMemo(() => {
    const list = (wallet as Record<string, unknown>)?.["bonus_requests"] as Array<Record<string, unknown>> | undefined;
    if (!list?.length) return new Set<string>();
    const set = new Set<string>();
    for (const br of list) {
      if (String(br.status ?? "").toLowerCase() !== "approved") continue;
      const t = String(br.bonus_type ?? "").toLowerCase();
      if (t === "welcome" || t === "deposit") set.add(t);
    }
    return set;
  }, [wallet]);

  const byType = useMemo(() => {
    const welcome: BonusRule[] = [];
    const deposit: BonusRule[] = [];
    const referral: BonusRule[] = [];
    for (const r of bonusRules as BonusRule[]) {
      const t = (r.bonus_type || "").toLowerCase();
      if (t === "welcome") welcome.push(r);
      else if (t === "deposit") deposit.push(r);
      else if (t === "referral") referral.push(r);
    }
    return [
      { type: "welcome", label: "Welcome", rules: welcome },
      { type: "deposit", label: "Deposit", rules: deposit },
      { type: "referral", label: "Refer", rules: referral },
    ];
  }, [bonusRules]);

  const isPlayer = user?.role === "player";

  const handleClaim = async (rule: BonusRule) => {
    if (!isPlayer) {
      toast({ title: "Login as player to claim bonus.", variant: "destructive" });
      return;
    }
    const ruleType = (rule.bonus_type ?? "").toLowerCase();
    if ((ruleType === "welcome" || ruleType === "deposit") && approvedBonusTypes.has(ruleType)) {
      toast({ title: "You have already claimed this type of bonus.", variant: "destructive" });
      return;
    }
    const amount = Number(rule.reward_amount ?? rule.reward_value ?? 0);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid reward amount.", variant: "destructive" });
      return;
    }
    setClaimingId(rule.id);
    try {
      await bonusRequestCreate({
        amount,
        bonus_type: (rule.bonus_type || "").toLowerCase(),
        bonus_rule: rule.id,
        remarks: rule.name ? `Claim: ${rule.name}` : undefined,
      });
      toast({ title: "Bonus request submitted. It will be reviewed shortly." });
      queryClient.invalidateQueries({ queryKey: ["player-wallet"] });
    } catch (e: unknown) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to submit bonus request.";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="container px-4 py-8 space-y-10">
      <header className="space-y-2">
        <h1 className="font-display font-bold text-3xl tracking-tight text-foreground">
          Bonuses & Promotions
        </h1>
        <p className="text-muted-foreground">
          Claim exclusive rewards — Welcome, Deposit and Refer bonuses
        </p>
      </header>

      {byType.map(({ type, label, rules }) => {
        const IconComponent = BONUS_TYPE_ICONS[type] ?? Gift;
        const variantStyle = VARIANT_STYLES[type] ?? VARIANT_STYLES.welcome;
        const badge = BONUS_TYPE_BADGES[type] ?? label;

        return (
          <section key={type} className="space-y-4">
            {/* <h2 className="font-display font-bold text-lg flex items-center gap-2 text-foreground">
              <IconComponent className="h-5 w-5 text-primary" />
              {BONUS_TYPE_LABELS[type] ?? label}
            </h2> */}
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active {label.toLowerCase()} bonuses at the moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map((bonus) => {
                  const bonusType = (bonus.bonus_type ?? "").toLowerCase();
                  const isApprovedForType =
                    (bonusType === "welcome" || bonusType === "deposit") && approvedBonusTypes.has(bonusType);
                  const requestStatus = isPlayer ? bonusRequestsByRuleId.get(bonus.id) : null;
                  const isPending = requestStatus?.status === "pending";
                  const isRejected = requestStatus?.status === "rejected";
                  const rejectReason = isRejected ? (requestStatus.reject_reason ?? "Request was rejected.") : null;
                  return (
                    <div
                      key={bonus.id}
                      className={`rounded-xl border border-border overflow-hidden bg-gradient-to-r ${variantStyle} hover:border-primary/50 transition-all ${rules.length === 1 ? "md:col-span-2" : ""}`}
                    >
                      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <IconComponent className="h-7 w-7 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                              {badge}
                            </p>
                            <h3 className="text-white font-bold text-xl mt-0.5">
                              {bonus.name}
                              <span className="text-amber-300 ml-1">{rewardDisplay(bonus)}</span>
                            </h3>
                            {bonusRuleMetaLine(bonus) ? (
                              <p className="text-white/90 text-sm mt-1">{bonusRuleMetaLine(bonus)}</p>
                            ) : null}
                            {isRejected && rejectReason && (
                              <p className="text-white/80 text-sm mt-2 italic">Reason: {rejectReason}</p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {type === "deposit" ? (
                            <span className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white/90">
                              Applied on first deposit
                            </span>
                          ) : !isPlayer ? (
                            <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                              <Link to={type === "referral" ? "/login?next=/player/referral" : "/login"}>
                                Login to claim
                              </Link>
                            </Button>
                          ) : type === "referral" ? (
                            <Button variant="gold" size="lg" className="text-white border-0" asChild>
                              <Link to="/player/referral">Go to Refer &amp; Earn</Link>
                            </Button>
                          ) : isApprovedForType ? (
                            <span className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-white/20 text-white">
                              Already claimed
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-white/20 text-white">
                              Pending
                            </span>
                          ) : isRejected ? (
                            <Button
                              variant="gold"
                              size="lg"
                              className="text-white border-0"
                              disabled={claimingId === bonus.id}
                              onClick={() => handleClaim(bonus)}
                            >
                              {claimingId === bonus.id ? "Submitting..." : "Retry claim"}
                            </Button>
                          ) : (
                            <Button
                              variant="gold"
                              size="lg"
                              className="text-white border-0"
                              disabled={claimingId === bonus.id}
                              onClick={() => handleClaim(bonus)}
                            >
                              {claimingId === bonus.id ? "Submitting..." : "Claim Bonus"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default BonusPage;
