import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/utils/currency";
import { getPlayerTransactions } from "@/api/player";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const typeColors: Record<string, string> = {
  deposit: "text-success",
  withdrawal: "text-accent",
  bet: "text-warning",
  win: "text-success",
  bonus: "text-neon",
  transfer: "text-primary",
};

const PlayerTransactions = () => {
  const { user } = useAuth();
  const symbol = getCurrencySymbol(user);
  const { data: transactions = [] } = useQuery({ queryKey: ["player-transactions"], queryFn: getPlayerTransactions });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const types = ["all", "deposit", "withdrawal", "bet", "win", "bonus", "transfer"];

  const myTxns = (transactions as Record<string, unknown>[])
    .filter((t) => typeFilter === "all" || (t.transaction_type ?? t.type) === typeFilter)
    .filter((t) => String(t.description ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-2 mobile:p-4 md:p-6 space-y-4 max-w-4xl mx-auto min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h2 className="font-gaming font-bold text-lg mobile:text-xl neon-text tracking-wider truncate">TRANSACTIONS</h2>
        <Button variant="outline" size="sm" className="gap-1 text-xs shrink-0 min-h-[44px] touch-manipulation">
          <Download className="h-3 w-3" /> Export
        </Button>
      </div>

      <div className="flex gap-2 mobile:gap-3 flex-col md:flex-row min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 min-h-[44px] touch-manipulation" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide min-w-0 pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
          {types.map((t) => (
            <Button
              key={t}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(t)}
              className={`text-xs capitalize whitespace-nowrap shrink-0 min-h-[40px] touch-manipulation ${typeFilter === t ? "gold-gradient text-primary-foreground" : ""}`}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-5 gap-2 text-xs text-muted-foreground px-4 py-2 font-semibold border-b border-border">
        <span>Type</span><span>Description</span><span>Date</span><span className="text-right">Before → After</span><span className="text-right">Amount</span>
      </div>

      <div className="space-y-2">
        {myTxns.map((t: Record<string, unknown>, i: number) => {
          const type = String(t.transaction_type ?? t.type ?? "");
          const isIn = ["deposit", "win", "bonus"].includes(type);
          return (
          <Card key={String(t.id ?? i)} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between md:hidden">
                <div>
                  <p className="text-sm font-medium">{String(t.description ?? "")}</p>
                  <p className="text-[10px] text-muted-foreground">{t.created_at ? new Date(String(t.created_at)).toLocaleString() : ""}</p>
                </div>
                <span className={`font-gaming font-bold text-sm ${isIn ? "text-success" : "text-accent"}`}>
                  {isIn ? "+" : "-"}{symbol}{Number(t.amount ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="hidden md:grid grid-cols-5 gap-2 items-center">
                <span className={`text-xs font-gaming font-bold uppercase ${typeColors[type] || "text-foreground"}`}>{type || "—"}</span>
                <span className="text-sm">{String(t.description ?? "")}</span>
                <span className="text-xs text-muted-foreground">{t.created_at ? new Date(String(t.created_at)).toLocaleString() : ""}</span>
                <span className="text-xs text-muted-foreground text-right">{symbol}{Number(t.balance_before ?? 0).toLocaleString()} → {symbol}{Number(t.balance_after ?? 0).toLocaleString()}</span>
                <span className={`font-gaming font-bold text-sm text-right ${isIn ? "text-success" : "text-accent"}`}>
                  {isIn ? "+" : "-"}{symbol}{Number(t.amount ?? 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        );})}
      </div>

      {myTxns.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">No transactions found</p>
      )}
    </div>
  );
};

export default PlayerTransactions;
