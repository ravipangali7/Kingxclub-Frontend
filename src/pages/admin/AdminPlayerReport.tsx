import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPlayerReport, resetPassword, type AdminRole } from "@/api/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Key, User, Wallet, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";

function getRoleFromPath(pathname: string): AdminRole {
  const segment = pathname.split("/")[1];
  if (segment === "super" || segment === "powerhouse") return segment;
  return "master";
}

export default function AdminPlayerReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = getRoleFromPath(window.location.pathname);
  const playerId = id ? parseInt(id, 10) : NaN;
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const params =
    dateFrom || dateTo ? { date_from: dateFrom || undefined, date_to: dateTo || undefined } : undefined;
  const { data: report, isLoading } = useQuery({
    queryKey: ["player-report", role, playerId, params],
    queryFn: () => getPlayerReport(role, playerId, params),
    enabled: !Number.isNaN(playerId),
  });

  const handleResetPassword = async () => {
    if (!pin || !newPassword || newPassword.length < 6) {
      toast({ title: "PIN and new password (6+ chars) required", variant: "destructive" });
      return;
    }
    try {
      await resetPassword(playerId, { pin, new_password: newPassword }, role, "players");
      toast({ title: "Password reset successfully." });
      setResetPwOpen(false);
      setPin("");
      setNewPassword("");
    } catch (err: unknown) {
      toast({ title: (err as { detail?: string })?.detail ?? "Failed", variant: "destructive" });
    }
  };

  if (Number.isNaN(playerId)) {
    return (
      <div className="p-4">
        <p className="text-destructive">Invalid player ID.</p>
        <Button variant="link" onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  if (isLoading || !report) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  const user = (report as Record<string, unknown>).user as Record<string, unknown>;
  const totalBalance = String((report as Record<string, unknown>).total_balance ?? "0");
  const totalWinLoss = String((report as Record<string, unknown>).total_win_loss ?? "0");
  const deposits = ((report as Record<string, unknown>).deposits as Record<string, unknown>[]) ?? [];
  const withdrawals = ((report as Record<string, unknown>).withdrawals as Record<string, unknown>[]) ?? [];
  const gameLogs = ((report as Record<string, unknown>).game_logs as Record<string, unknown>[]) ?? [];
  const transactions = ((report as Record<string, unknown>).transactions as Record<string, unknown>[]) ?? [];
  const activityLogs = ((report as Record<string, unknown>).activity_logs as Record<string, unknown>[]) ?? [];

  const depColumns = [
    { header: "ID", accessor: (r: Record<string, unknown>) => String(r.id ?? "") },
    { header: "Amount", accessor: (r: Record<string, unknown>) => `₹${Number(r.amount ?? 0).toLocaleString()}` },
    { header: "Status", accessor: (r: Record<string, unknown>) => String(r.status ?? "") },
    { header: "Date", accessor: (r: Record<string, unknown>) => (r.created_at ? new Date(String(r.created_at)).toLocaleString() : "") },
  ];
  const wdColumns = [
    { header: "ID", accessor: (r: Record<string, unknown>) => String(r.id ?? "") },
    { header: "Amount", accessor: (r: Record<string, unknown>) => `₹${Number(r.amount ?? 0).toLocaleString()}` },
    { header: "Status", accessor: (r: Record<string, unknown>) => String(r.status ?? "") },
    { header: "Date", accessor: (r: Record<string, unknown>) => (r.created_at ? new Date(String(r.created_at)).toLocaleString() : "") },
  ];
  const glColumns = [
    { header: "Game", accessor: (r: Record<string, unknown>) => String(r.game_name ?? r.game ?? "") },
    { header: "Type", accessor: (r: Record<string, unknown>) => String(r.type_display ?? r.type ?? "") },
    { header: "Bet", accessor: (r: Record<string, unknown>) => `₹${Number(r.bet_amount ?? 0).toLocaleString()}` },
    { header: "Win", accessor: (r: Record<string, unknown>) => `₹${Number(r.win_amount ?? 0).toLocaleString()}` },
    { header: "Lose", accessor: (r: Record<string, unknown>) => `₹${Number(r.lose_amount ?? 0).toLocaleString()}` },
    { header: "Date", accessor: (r: Record<string, unknown>) => (r.created_at ? new Date(String(r.created_at)).toLocaleString() : "") },
  ];
  const txColumns = [
    { header: "Type", accessor: (r: Record<string, unknown>) => String(r.transaction_type_display ?? r.transaction_type ?? "") },
    { header: "Amount", accessor: (r: Record<string, unknown>) => `₹${Number(r.amount ?? 0).toLocaleString()}` },
    { header: "Status", accessor: (r: Record<string, unknown>) => String(r.status_display ?? r.status ?? "") },
    { header: "Date", accessor: (r: Record<string, unknown>) => (r.created_at ? new Date(String(r.created_at)).toLocaleString() : "") },
  ];
  const actColumns = [
    { header: "Action", accessor: (r: Record<string, unknown>) => String(r.action_display ?? r.action ?? "") },
    { header: "Game", accessor: (r: Record<string, unknown>) => String(r.game ?? "") },
    { header: "Date", accessor: (r: Record<string, unknown>) => (r.created_at ? new Date(String(r.created_at)).toLocaleString() : "") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-display font-bold text-xl">Player Report – {user?.username ?? id}</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" className="w-40 h-9 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" className="w-40 h-9 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <span className="text-xs text-muted-foreground">Date filter (optional)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Total Balance</span>
            </div>
            <p className="font-display font-bold text-lg mt-1">₹{Number(totalBalance).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Win/Loss</span>
            </div>
            <p className="font-display font-bold text-lg mt-1">₹{Number(totalWinLoss).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm">User</span>
              </div>
              <p className="font-display font-semibold mt-1">{String(user?.name ?? user?.username ?? "")}</p>
              <p className="text-xs text-muted-foreground">{String(user?.phone ?? "")} {user?.email ? ` • ${user.email}` : ""}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setResetPwOpen(true)}>
              <Key className="h-3 w-3 mr-1" /> Reset password
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Deposits</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={deposits} columns={depColumns} searchKey="" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Withdrawals</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={withdrawals} columns={wdColumns} searchKey="" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Bet History</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={gameLogs} columns={glColumns} searchKey="" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Transactions</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={transactions} columns={txColumns} searchKey="" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Activity Logs</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={activityLogs} columns={actColumns} searchKey="" />
        </CardContent>
      </Card>

      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset player password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Admin PIN</label>
              <Input
                type="password"
                maxLength={6}
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">New password</label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={pin.length < 4 || newPassword.length < 6}>
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
