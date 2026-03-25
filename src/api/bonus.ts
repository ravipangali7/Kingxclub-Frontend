import { apiGet } from "@/lib/api";
import type { PromoShape } from "@/data/homePageMockData";

export interface BonusRule {
  id: number;
  name: string;
  bonus_type: string;
  reward_type: string;
  /** Backend returns reward_amount */
  reward_amount?: string;
  reward_value?: string;
  min_deposit?: string;
  roll_required?: number;
  is_active?: boolean;
  created_at?: string;
}

export async function getBonusRules(): Promise<BonusRule[]> {
  const res = await apiGet<BonusRule[]>("/public/bonus-rules/");
  return (res as unknown as BonusRule[]) ?? [];
}

function numericReward(rule: BonusRule): number {
  const raw = rule.reward_amount ?? rule.reward_value ?? "0";
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Whole numbers without .00; otherwise up to 2 decimal places. */
export function formatBonusAmountDisplay(rule: BonusRule): string {
  const n = numericReward(rule);
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/** Single-line reward for cards and bonus page: `200%` or `₹5,000`. */
export function rewardDisplay(rule: BonusRule): string {
  const isPct = (rule.reward_type || "").toLowerCase() === "percentage";
  const val = formatBonusAmountDisplay(rule);
  if (isPct) return `${val}%`;
  return `₹${Number(numericReward(rule)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function bonusRuleMetaLine(rule: BonusRule): string {
  const parts: string[] = [];
  if (rule.roll_required != null && Number(rule.roll_required) > 0) {
    parts.push(`Roll x${rule.roll_required}`);
  }
  if (rule.min_deposit != null && Number(rule.min_deposit) > 0) {
    parts.push(`Min deposit ₹${rule.min_deposit}`);
  }
  return parts.join(" · ");
}

/** Right-hand hero floater line from welcome rule (best-effort from model fields). */
export function formatWelcomeHeroFloater(rule: BonusRule): string {
  const isPct = (rule.reward_type || "").toLowerCase() === "percentage";
  const roll =
    rule.roll_required != null && Number(rule.roll_required) > 0 ? ` · Roll x${rule.roll_required}` : "";
  if (isPct) {
    return `${formatBonusAmountDisplay(rule)}%${roll}`.trim();
  }
  const rupee = Number(numericReward(rule)).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return `Up to ₹${rupee}${roll}`;
}

function welcomePromoFromRule(rule: BonusRule): PromoShape {
  const isPct = (rule.reward_type || "").toLowerCase() === "percentage";
  const meta = bonusRuleMetaLine(rule);
  const title = rule.name?.trim() || "Welcome Bonus";
  if (isPct) {
    return {
      variant: "welcome",
      badge: "🎁 LIMITED OFFER",
      title,
      highlight: `${formatBonusAmountDisplay(rule)}%`,
      subtitle: meta || undefined,
      description: undefined,
      cta: "Claim Now",
      href: "/bonus",
    };
  }
  const rupee = Number(numericReward(rule)).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return {
    variant: "welcome",
    badge: "🎁 LIMITED OFFER",
    title,
    highlight: `₹${rupee}`,
    subtitle: meta || undefined,
    description: undefined,
    cta: "Claim Now",
    href: "/bonus",
  };
}

function referralPromoFromRule(rule: BonusRule): PromoShape {
  const rupee = Number(numericReward(rule)).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const meta = bonusRuleMetaLine(rule);
  return {
    variant: "referral",
    badge: "👥 REFER & EARN",
    title: rule.name?.trim() || "Invite Friends",
    highlight: `₹${rupee}`,
    subtitle: meta || "Per Referral",
    description: undefined,
    cta: "Get Your Link",
    href: "/bonus",
  };
}

function depositPromoFromRule(rule: BonusRule): PromoShape {
  const isPct = (rule.reward_type || "").toLowerCase() === "percentage";
  const meta = bonusRuleMetaLine(rule);
  return {
    variant: "deposit",
    badge: "💰 DEPOSIT BONUS",
    title: rule.name?.trim() || "Deposit Bonus",
    highlight: isPct ? `${formatBonusAmountDisplay(rule)}%` : rewardDisplay(rule),
    subtitle: meta || undefined,
    description: undefined,
    cta: "Claim Now",
    href: "/bonus",
  };
}

/** Map bonus rules to PromoShape[] for home page. Order: referral, welcome, deposit (grid picks by variant). */
export function mapBonusRulesToPromoShapes(rules: BonusRule[]): PromoShape[] {
  const byType: Record<string, BonusRule> = {};
  for (const r of rules) {
    const t = (r.bonus_type || "").toLowerCase();
    if (t === "welcome" || t === "deposit" || t === "referral") {
      if (!byType[t]) byType[t] = r;
    }
  }
  const order: ("referral" | "welcome" | "deposit")[] = ["referral", "welcome", "deposit"];
  const promos: PromoShape[] = [];
  for (const t of order) {
    const rule = byType[t];
    if (!rule) continue;
    if (t === "welcome") promos.push(welcomePromoFromRule(rule));
    else if (t === "referral") promos.push(referralPromoFromRule(rule));
    else promos.push(depositPromoFromRule(rule));
  }
  return promos;
}
