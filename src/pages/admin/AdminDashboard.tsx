import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboard, getDeposits, getWithdrawals, type DashboardParams } from "@/api/admin";
import { Users, Wallet, ArrowDownCircle, ArrowUpCircle, Gift, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface AdminDashboardProps {
  role: "master" | "super" | "powerhouse";
}

const AdminDashboard = ({ role }: AdminDashboardProps) => {
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d">("7d");
  const dashboardParams: DashboardParams | undefined = useMemo(() => {
    if (role !== "powerhouse") return undefined;
    const to = new Date();
    const from = new Date();
    if (dateRange === "today") {
      from.setHours(0, 0, 0, 0);
      return { date_from: from.toISOString().slice(0, 10), date_to: to.toISOString().slice(0, 10) };
    }
    if (dateRange === "7d") from.setDate(from.getDate() - 7);
    else from.setDate(from.getDate() - 30);
    return { date_from: from.toISOString().slice(0, 10), date_to: to.toISOString().slice(0, 10) };
  }, [role, dateRange]);

  const { data: dashboard = {} } = useQuery({
    queryKey: ["admin-dashboard", role, dashboardParams],
    queryFn: () => getDashboard(role, dashboardParams),
  });
  const { data: deposits = [] } = useQuery({
    queryKey: ["admin-deposits", role],
    queryFn: () => getDeposits(role),
  });
  const { data: withdrawals = [] } = useQuery({
    queryKey: ["admin-withdrawals", role],
    queryFn: () => getWithdrawals(role),
  });
  const d = dashboard as Record<string, unknown>;
  const pendingDeposits = Number(d.pending_deposits) ?? 0;
  const pendingWithdrawals = Number(d.pending_withdrawals) ?? 0;
  const pendingBonusRequests = Number(d.pending_bonus_requests) ?? 0;
  const totalPlayers = Number(d.total_players) ?? 0;
  const totalBalance = String(d.total_balance ?? "0");
  const totalMasters = Number(d.total_masters) ?? 0;
  const totalSupers = Number(d.total_supers) ?? 0;
  const recentDeposits = (d.recent_deposits as Record<string, unknown>[]) ?? (deposits as Record<string, unknown>[]).slice(0, 5);
  const recentWithdrawals = (d.recent_withdrawals as Record<string, unknown>[]) ?? (withdrawals as Record<string, unknown>[]).slice(0, 5);
  const depList = Array.isArray(recentDeposits) && recentDeposits.length > 0 ? recentDeposits : (deposits as Record<string, unknown>[]).slice(0, 5);
  const wdList = Array.isArray(recentWithdrawals) && recentWithdrawals.length > 0 ? recentWithdrawals : (withdrawals as Record<string, unknown>[]).slice(0, 5);

  const depositsTodayCount = Number(d.deposits_today_count) ?? 0;
  const depositsTodaySum = Number(d.deposits_today_sum) ?? 0;
  const withdrawalsTodayCount = Number(d.withdrawals_today_count) ?? 0;
  const withdrawalsTodaySum = Number(d.withdrawals_today_sum) ?? 0;
  const playersAdded7d = Number(d.players_added_7d) ?? 0;
  const series7d = (d.series_7d as { date: string; deposits_count: number; deposits_sum: string; withdrawals_count: number; withdrawals_sum: string }[]) ?? [];

  const chartData = series7d.map((s) => ({
    date: new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    deposits: Number(s.deposits_sum) || 0,
    withdrawals: Number(s.withdrawals_sum) || 0,
    depositsCount: s.deposits_count,
    withdrawalsCount: s.withdrawals_count,
  }));

  if (role === "powerhouse") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display font-bold text-xl">Platform Overview</h2>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Button variant={dateRange === "today" ? "default" : "outline"} size="sm" onClick={() => setDateRange("today")}>Today</Button>
            <Button variant={dateRange === "7d" ? "default" : "outline"} size="sm" onClick={() => setDateRange("7d")}>Last 7 days</Button>
            <Button variant={dateRange === "30d" ? "default" : "outline"} size="sm" onClick={() => setDateRange("30d")}>Last 30 days</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard title="Total Players" value={totalPlayers} icon={Users} />
          <StatCard title="Total Balance" value={`₹${(Number(totalBalance) / 1000).toFixed(0)}K`} icon={Wallet} />
          <StatCard title="Pending Deposits" value={pendingDeposits} icon={ArrowDownCircle} />
          <StatCard title="Pending Withdrawals" value={pendingWithdrawals} icon={ArrowUpCircle} />
          <StatCard title="Pending Bonus" value={pendingBonusRequests} icon={Gift} />
          <StatCard title="Masters" value={totalMasters} icon={Users} />
          <StatCard title="Supers" value={totalSupers} icon={Users} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Deposits today" value={`${depositsTodayCount} (₹${depositsTodaySum.toLocaleString()})`} icon={ArrowDownCircle} />
          <StatCard title="Withdrawals today" value={`${withdrawalsTodayCount} (₹${withdrawalsTodaySum.toLocaleString()})`} icon={ArrowUpCircle} />
          <StatCard title="New players (7d)" value={playersAdded7d} icon={Users} />
        </div>

        {chartData.length > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-display">Deposits & Withdrawals (last 7 days)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${Number(v).toLocaleString()}`, ""]} labelFormatter={(l) => l} />
                  <Bar dataKey="deposits" name="Deposits" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawals" name="Withdrawals" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/powerhouse/deposits">Deposits</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/powerhouse/withdrawals">Withdrawals</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/powerhouse/players">Players</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/powerhouse/masters">Masters</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/powerhouse/supers">Supers</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/powerhouse/game-log">Bet History</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/powerhouse/bonus-requests">Bonus Requests</Link></Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-display">Recent Deposits</CardTitle>
              <Button variant="link" size="sm" className="h-auto p-0" asChild><Link to="/powerhouse/deposits">View all</Link></Button>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {depList.map((row) => (
                <div key={String(row.id ?? row)} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{String(row.username ?? row.user_username ?? "-")}</p>
                    <p className="text-[10px] text-muted-foreground">{String(row.payment_mode ?? "-")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{Number(row.amount ?? 0).toLocaleString()}</p>
                    <StatusBadge status={String(row.status ?? "pending")} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-display">Recent Withdrawals</CardTitle>
              <Button variant="link" size="sm" className="h-auto p-0" asChild><Link to="/powerhouse/withdrawals">View all</Link></Button>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {wdList.map((row) => (
                <div key={String(row.id ?? row)} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{String(row.username ?? row.user_username ?? "-")}</p>
                    <p className="text-[10px] text-muted-foreground">{String(row.payment_mode ?? "-")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{Number(row.amount ?? 0).toLocaleString()}</p>
                    <StatusBadge status={String(row.status ?? "pending")} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">
        {role === "super" ? "Super Dashboard" : "Master Dashboard"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Players" value={totalPlayers} icon={Users} />
        <StatCard title="Total Balance" value={`₹${(Number(totalBalance) / 1000).toFixed(0)}K`} icon={Wallet} />
        <StatCard title="Pending Deposits" value={pendingDeposits} icon={ArrowDownCircle} />
        <StatCard title="Pending Withdrawals" value={pendingWithdrawals} icon={ArrowUpCircle} />
      </div>
      {(role === "super") && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Masters" value={totalMasters} icon={Users} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-display">Recent Deposits</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {depList.map((d) => (
              <div key={String(d.id ?? d)} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{String(d.username ?? d.user_username ?? "-")}</p>
                  <p className="text-[10px] text-muted-foreground">{String(d.payment_mode ?? "-")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">₹{Number(d.amount ?? 0).toLocaleString()}</p>
                  <StatusBadge status={String(d.status ?? "pending")} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-display">Recent Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {wdList.map((w) => (
              <div key={String(w.id ?? w)} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{String(w.username ?? w.user_username ?? "-")}</p>
                  <p className="text-[10px] text-muted-foreground">{String(w.payment_mode ?? "-")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">₹{Number(w.amount ?? 0).toLocaleString()}</p>
                  <StatusBadge status={String(w.status ?? "pending")} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
