import { type ReactNode } from "react";

const pillBase = "text-xs px-2 py-0.5 rounded border";

export const badgeClass = {
  balance: `${pillBase} bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/25`,
  bonus: `${pillBase} bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30 cursor-pointer hover:bg-violet-500/25`,
  total: `${pillBase} bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/25`,
  usersBal: `${pillBase} bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-pointer hover:bg-amber-500/25`,
  players: `${pillBase} bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30`,
  commission: `${pillBase} bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 cursor-pointer hover:bg-orange-500/25`,
  exposure: `${pillBase} bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-pointer hover:bg-amber-500/25`,
  plPositive: `${pillBase} bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 cursor-pointer hover:bg-green-500/20`,
  plNegative: `${pillBase} bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-500/20`,
  debit: `${pillBase} bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400`,
  credit: `${pillBase} bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400`,
  amountGreen: `${pillBase} bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/25`,
  amountRed: `${pillBase} bg-red-500/10 border-red-500/30 text-accent dark:text-red-400 cursor-pointer hover:bg-red-500/20`,
  action: `${pillBase} bg-muted text-muted-foreground border-border`,
} as const;

interface TableBadgeProps {
  variant: keyof typeof badgeClass;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableBadge({ variant, children, onClick, className = "" }: TableBadgeProps) {
  const cls = badgeClass[variant] + (className ? ` ${className}` : "");
  if (onClick) {
    return (
      <span role="button" tabIndex={0} className={cls} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick()}>
        {children}
      </span>
    );
  }
  return <span className={cls}>{children}</span>;
}

export function plBadgeClass(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return n >= 0 ? badgeClass.plPositive : badgeClass.plNegative;
}
