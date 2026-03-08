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

const BONUS_TYPE_BADGES: Record<string, string> = {
  welcome: "New Players",
  deposit: "Reload",
  referral: "Earn",
};

function rewardDisplay(rule: BonusRule): string {
  const val = rule.reward_amount ?? rule.reward_value ?? "0";
  const type = rule.reward_type === "percentage" ? "%" : " Fixed";
  return `${val}${type}`;
}

function metaLine(rule: BonusRule): string {
  const parts: string[] = [];
  if (rule.roll_required != null && Number(rule.roll_required) > 0) {
    parts.push(`Roll x${rule.roll_required}`);
  }
  if (rule.min_deposit != null && Number(rule.min_deposit) > 0) {
    parts.push(`Min deposit ₹${rule.min_deposit}`);
  }
  return parts.join(" · ");
}

/** Map bonus rules to PromoShape[] for home page promo grids. Order: referral (full-width), welcome, deposit (two columns below). */
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
    const variant = t as "welcome" | "deposit" | "referral";
    promos.push({
      variant,
      badge: BONUS_TYPE_BADGES[t] ?? rule.name,
      title: rule.name,
      highlight: rewardDisplay(rule),
      subtitle: metaLine(rule) || undefined,
      description: undefined,
      cta: "Claim Now",
      href: "/bonus",
    });
  }
  return promos;
}
