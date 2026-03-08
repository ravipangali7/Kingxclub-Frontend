import type { User } from "@/contexts/AuthContext";

/**
 * Return currency symbol for display based on user's country (from API).
 * Falls back to ₹ if user is null or currency_symbol not set.
 */
export function getCurrencySymbol(user: User | null): string {
  return user?.currency_symbol ?? "₹";
}
