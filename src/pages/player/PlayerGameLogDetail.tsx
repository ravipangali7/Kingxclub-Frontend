import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/utils/currency";
import { getPlayerGameLogDetail } from "@/api/player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, Gamepad2, Receipt } from "lucide-react";

const RESTRICTED_ROLES = ["player", "master", "super"];

const PlayerGameLogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const symbol = getCurrencySymbol(user);
  const isRestricted = user != null && RESTRICTED_ROLES.includes(user.role);
  const { data, isLoading, error } = useQuery({
    queryKey: ["player-game-log-detail", id],
    queryFn: () => getPlayerGameLogDetail(id!),
    enabled: !!id && !isRestricted,
  });

  if (isRestricted && user) {
    if (user.role === "player") return <Navigate to="/player/game-results" replace />;
    if (user.role === "master") return <Navigate to="/master/players" replace />;
    if (user.role === "super") return <Navigate to="/super/masters" replace />;
  }

  if (isLoading || !data) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <p className="text-muted-foreground">{isLoading ? "Loading…" : "No data."}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <p className="text-destructive">Failed to load Bet History.</p>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link to="/player/game-results"><ArrowLeft className="h-3 w-3 mr-1" /> Back to Bet History</Link>
        </Button>
      </div>
    );
  }

  const log = data.game_log as Record<string, unknown>;
  const tx = data.transaction as Record<string, unknown> | null;

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/player/game-results" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Bet History
          </Link>
        </Button>
      </div>

      <Card className="theme-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-gaming">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Bet History details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {row("Game", String(log.game_name ?? log.game ?? "—"))}
          {row("Type", <StatusBadge status={String(log.type ?? "")} />)}
          {row("Wallet", String(log.wallet_display ?? log.wallet ?? "—"))}
          {row("Round", String(log.round ?? "—"))}
          {row("Match", String(log.match ?? "—"))}
          {row("Bet amount", `${symbol}${Number(log.bet_amount ?? 0).toLocaleString()}`)}
          {row("Win amount", `${symbol}${Number(log.win_amount ?? 0).toLocaleString()}`)}
          {row("Lose amount", `${symbol}${Number(log.lose_amount ?? 0).toLocaleString()}`)}
          {row("Balance before", `${symbol}${Number(log.before_balance ?? 0).toLocaleString()}`)}
          {row("Balance after", `${symbol}${Number(log.after_balance ?? 0).toLocaleString()}`)}
          {row("Created", log.created_at ? new Date(String(log.created_at)).toLocaleString() : "—")}
          {row("Updated", log.updated_at ? new Date(String(log.updated_at)).toLocaleString() : "—")}
          {log.provider_raw_data && Object.keys(log.provider_raw_data as object).length > 0 && (
            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-xs text-muted-foreground font-semibold mb-2">Provider round data</p>
              <div className="space-y-1 rounded-lg bg-muted/30 p-3">
                {Object.entries(log.provider_raw_data as Record<string, unknown>).map(([key, val]) => {
                  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  const display =
                    key === "timestamp" && val
                      ? new Date(String(val)).toLocaleString()
                      : (key === "bet_amount" || key === "win_amount" || key === "wallet_before" || key === "wallet_after" || key === "change") && val !== "" && val != null
                        ? `${symbol}${Number(val).toLocaleString()}`
                        : String(val ?? "—");
                  return (
                    <div key={key} className="flex justify-between py-1.5 text-sm border-b border-border/40 last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium break-all text-right max-w-[60%]">{display}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="theme-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-gaming">
            <Receipt className="h-5 w-5 text-primary" />
            Related transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tx ? (
            <div className="space-y-1">
              {row("Action", String(tx.action_type ?? "—"))}
              {row("Type", String(tx.transaction_type_display ?? tx.transaction_type ?? "—"))}
              {row("Amount", `${symbol}${Number(tx.amount ?? 0).toLocaleString()}`)}
              {row("Status", String(tx.status_display ?? tx.status ?? "—"))}
              {row("Balance before", tx.balance_before != null ? `${symbol}${Number(tx.balance_before).toLocaleString()}` : "—")}
              {row("Balance after", tx.balance_after != null ? `${symbol}${Number(tx.balance_after).toLocaleString()}` : "—")}
              {row("Remarks", String(tx.remarks ?? "—"))}
              {row("Created", tx.created_at ? new Date(String(tx.created_at)).toLocaleString() : "—")}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No linked transaction for this game round.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerGameLogDetail;
