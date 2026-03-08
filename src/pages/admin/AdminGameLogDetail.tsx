import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getGameLogDetail } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowLeft, Gamepad2, Receipt } from "lucide-react";

type AdminRole = "powerhouse" | "super" | "master";

const AdminGameLogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const role: AdminRole =
    location.pathname.startsWith("/powerhouse") ? "powerhouse"
    : location.pathname.startsWith("/super") ? "super"
    : "master";
  const basePath = `/${role}`;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-game-log-detail", role, id],
    queryFn: () => getGameLogDetail(role, id!),
    enabled: !!id && !!user,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{isLoading ? "Loading…" : "No data."}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Failed to load Bet History.</p>
        <Button variant="outline" size="sm" asChild>
          <Link to={`${basePath}/game-log`}><ArrowLeft className="h-3 w-3 mr-1" /> Back to Bet History</Link>
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`${basePath}/game-log`} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Bet History
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Bet History details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {row("User", String(log.username ?? log.user_username ?? "—"))}
          {row("Game", String(log.game_name ?? log.game ?? "—"))}
          {row("Type", <StatusBadge status={String(log.type ?? "")} />)}
          {row("Wallet", String(log.wallet_display ?? log.wallet ?? "—"))}
          {row("Round", String(log.round ?? "—"))}
          {row("Match", String(log.match ?? "—"))}
          {row("Bet amount", `₹${Number(log.bet_amount ?? 0).toLocaleString()}`)}
          {row("Win amount", `₹${Number(log.win_amount ?? 0).toLocaleString()}`)}
          {row("Lose amount", `₹${Number(log.lose_amount ?? 0).toLocaleString()}`)}
          {row("Balance before", `₹${Number(log.before_balance ?? 0).toLocaleString()}`)}
          {row("Balance after", `₹${Number(log.after_balance ?? 0).toLocaleString()}`)}
          {row("Created", log.created_at ? new Date(String(log.created_at)).toLocaleString() : "—")}
          {row("Updated", log.updated_at ? new Date(String(log.updated_at)).toLocaleString() : "—")}
          {log.provider_raw_data && Object.keys(log.provider_raw_data as object).length > 0 && (
            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-xs text-muted-foreground font-semibold mb-2">Provider raw data</p>
              <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-48">
                {JSON.stringify(log.provider_raw_data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            Related transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tx ? (
            <div className="space-y-1">
              {row("User", String(tx.username ?? tx.user_username ?? "—"))}
              {row("Action", String(tx.action_type ?? "—"))}
              {row("Type", String(tx.transaction_type_display ?? tx.transaction_type ?? "—"))}
              {row("Amount", `₹${Number(tx.amount ?? 0).toLocaleString()}`)}
              {row("Status", String(tx.status_display ?? tx.status ?? "—"))}
              {row("Balance before", tx.balance_before != null ? `₹${Number(tx.balance_before).toLocaleString()}` : "—")}
              {row("Balance after", tx.balance_after != null ? `₹${Number(tx.balance_after).toLocaleString()}` : "—")}
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

export default AdminGameLogDetail;
