import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsOverview,
  getAnalyticsGames,
  getAnalyticsFinance,
  getAnalyticsCustomers,
  getAnalyticsUser,
  getPlayers,
  type DateRangeParams,
} from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Gamepad2, Users, DollarSign, Activity, BarChart2, Search } from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────

const PRESET_RANGES = [
  { label: "Today", days: 0 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

const PIE_COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

function buildDateRange(days: number): DateRangeParams {
  const to = new Date();
  const from = new Date();
  if (days > 0) from.setDate(from.getDate() - days + 1);
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  };
}

function fmt(v: unknown): string {
  const n = Number(v);
  if (isNaN(n)) return "0";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function fmtCurrency(v: unknown): string {
  return `₹${fmt(v)}`;
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  positive,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p
            className={`text-lg font-semibold truncate ${
              positive === true
                ? "text-green-600 dark:text-green-400"
                : positive === false
                ? "text-red-600 dark:text-red-400"
                : ""
            }`}
          >
            {value}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function DateRangePicker({
  preset,
  onPreset,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
}: {
  preset: number;
  onPreset: (d: number) => void;
  customFrom: string;
  customTo: string;
  onCustomFrom: (s: string) => void;
  onCustomTo: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      {PRESET_RANGES.map((r) => (
        <Button
          key={r.days}
          size="sm"
          variant={preset === r.days ? "default" : "outline"}
          onClick={() => onPreset(r.days)}
        >
          {r.label}
        </Button>
      ))}
      <span className="text-muted-foreground text-xs">or</span>
      <Input
        type="date"
        value={customFrom}
        onChange={(e) => onCustomFrom(e.target.value)}
        className="w-36 h-8 text-xs"
      />
      <span className="text-muted-foreground text-xs">–</span>
      <Input
        type="date"
        value={customTo}
        onChange={(e) => onCustomTo(e.target.value)}
        className="w-36 h-8 text-xs"
      />
    </div>
  );
}

function useDateState() {
  const [preset, setPreset] = useState(30);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const params = useMemo<DateRangeParams>(() => {
    if (customFrom && customTo) return { date_from: customFrom, date_to: customTo };
    return buildDateRange(preset);
  }, [preset, customFrom, customTo]);

  function handlePreset(d: number) {
    setPreset(d);
    setCustomFrom("");
    setCustomTo("");
  }

  return { preset, params, customFrom, customTo, handlePreset, setCustomFrom, setCustomTo };
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const ds = useDateState();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview", ds.params],
    queryFn: () => getAnalyticsOverview(ds.params),
  });

  const d = (data as Record<string, unknown>) ?? {};
  const series = (d.series as Record<string, unknown>[]) ?? [];

  const seriesData = series.map((s) => ({
    date: (s.date as string)?.slice(5),
    Deposits: Number(s.deposits),
    Withdrawals: Number(s.withdrawals),
    "P/L": Number(s.pl),
  }));

  const pl = Number(d.platform_pl ?? 0);

  return (
    <div className="space-y-4">
      <DateRangePicker
        preset={ds.preset}
        onPreset={ds.handlePreset}
        customFrom={ds.customFrom}
        customTo={ds.customTo}
        onCustomFrom={ds.setCustomFrom}
        onCustomTo={ds.setCustomTo}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Revenue (Net)" value={fmtCurrency(d.revenue)} icon={DollarSign} />
            <KpiCard
              title="Platform P/L"
              value={fmtCurrency(d.platform_pl)}
              icon={pl >= 0 ? TrendingUp : TrendingDown}
              positive={pl >= 0}
            />
            <KpiCard title="Total Bets" value={fmtCurrency(d.total_bet)} icon={Gamepad2} />
            <KpiCard title="Total Deposits" value={fmtCurrency(d.total_deposits)} icon={TrendingUp} />
            <KpiCard title="Total Withdrawals" value={fmtCurrency(d.total_withdrawals)} icon={TrendingDown} />
            <KpiCard title="Active Players" value={String(d.active_users ?? 0)} icon={Users} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={seriesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v) => fmtCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Deposits" stroke="#22c55e" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="Withdrawals" stroke="#ef4444" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="P/L" stroke="#a855f7" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Game Analytics Tab ────────────────────────────────────────────────────────

function GamesTab() {
  const ds = useDateState();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-games", ds.params],
    queryFn: () => getAnalyticsGames(ds.params),
  });

  const d = (data as Record<string, unknown>) ?? {};
  const topGames = (d.top_games as Record<string, unknown>[]) ?? [];
  const providers = (d.providers as Record<string, unknown>[]) ?? [];
  const categories = (d.categories as Record<string, unknown>[]) ?? [];

  const barData = topGames.map((g) => ({
    name: String(g.game_name).slice(0, 16),
    Bets: Number(g.total_bet),
    "P/L": Number(g.pl),
  }));

  const pieData = providers.slice(0, 8).map((p, i) => ({
    name: String(p.provider_name),
    value: Number(p.total_bet),
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      <DateRangePicker
        preset={ds.preset}
        onPreset={ds.handlePreset}
        customFrom={ds.customFrom}
        customTo={ds.customTo}
        onCustomFrom={ds.setCustomFrom}
        onCustomTo={ds.setCustomTo}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top 10 Games by Bet Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v) => fmtCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Bets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="P/L" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Provider Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmtCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Games P/L Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Game</th>
                        <th className="text-right py-1.5 pr-2 text-muted-foreground font-medium">Bets</th>
                        <th className="text-right py-1.5 text-muted-foreground font-medium">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topGames.map((g, i) => {
                        const pl = Number(g.pl);
                        return (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-1.5 pr-2 truncate max-w-[120px]">{String(g.game_name)}</td>
                            <td className="py-1.5 pr-2 text-right">{fmtCurrency(g.total_bet)}</td>
                            <td className={`py-1.5 text-right font-medium ${pl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                              {fmtCurrency(pl)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Finance & P/L Tab ─────────────────────────────────────────────────────────

function FinanceTab() {
  const ds = useDateState();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-finance", ds.params],
    queryFn: () => getAnalyticsFinance(ds.params),
  });

  const d = (data as Record<string, unknown>) ?? {};
  const series = (d.series as Record<string, unknown>[]) ?? [];
  const topDep = (d.top_depositors as Record<string, unknown>[]) ?? [];
  const topWd = (d.top_withdrawers as Record<string, unknown>[]) ?? [];

  const barData = series.map((s) => ({
    date: (s.date as string)?.slice(5),
    Deposits: Number(s.deposits),
    Withdrawals: Number(s.withdrawals),
    Net: Number(s.net),
    "Game P/L": Number(s.game_pl),
  }));

  // Running P/L
  let running = 0;
  const plData = series.map((s) => {
    running += Number(s.game_pl);
    return { date: (s.date as string)?.slice(5), "Running P/L": running };
  });

  return (
    <div className="space-y-4">
      <DateRangePicker
        preset={ds.preset}
        onPreset={ds.handlePreset}
        customFrom={ds.customFrom}
        customTo={ds.customTo}
        onCustomFrom={ds.setCustomFrom}
        onCustomTo={ds.setCustomTo}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard title="Total Deposits" value={fmtCurrency(d.total_deposits)} icon={TrendingUp} />
            <KpiCard title="Total Withdrawals" value={fmtCurrency(d.total_withdrawals)} icon={TrendingDown} />
            <KpiCard title="Net Cash Flow" value={fmtCurrency(d.net_cash_flow)} icon={DollarSign} positive={Number(d.net_cash_flow) >= 0} />
            <KpiCard title="Game P/L" value={fmtCurrency(d.game_pl)} icon={Gamepad2} positive={Number(d.game_pl) >= 0} />
            <KpiCard title="Bonus Paid" value={fmtCurrency(d.total_bonus_paid)} icon={Activity} />
            <KpiCard title="Bonus Count" value={String(d.bonus_count ?? 0)} icon={BarChart2} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Deposits vs Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v) => fmtCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Deposits" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Withdrawals" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Running Platform P/L</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={plData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v) => fmtCurrency(v)} />
                  <Line type="monotone" dataKey="Running P/L" stroke="#a855f7" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Depositors</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">User</th>
                      <th className="text-right py-1.5 pr-2 text-muted-foreground font-medium">Total</th>
                      <th className="text-right py-1.5 text-muted-foreground font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDep.map((r, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 truncate max-w-[120px]">{String(r.username)}</td>
                        <td className="py-1.5 pr-2 text-right">{fmtCurrency(r.total)}</td>
                        <td className="py-1.5 text-right">{String(r.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Withdrawers</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">User</th>
                      <th className="text-right py-1.5 pr-2 text-muted-foreground font-medium">Total</th>
                      <th className="text-right py-1.5 text-muted-foreground font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topWd.map((r, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 truncate max-w-[120px]">{String(r.username)}</td>
                        <td className="py-1.5 pr-2 text-right">{fmtCurrency(r.total)}</td>
                        <td className="py-1.5 text-right">{String(r.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Customer Behaviour Tab ────────────────────────────────────────────────────

function CustomersTab() {
  const ds = useDateState();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-customers", ds.params],
    queryFn: () => getAnalyticsCustomers(ds.params),
  });

  const d = (data as Record<string, unknown>) ?? {};
  const series = (d.series as Record<string, unknown>[]) ?? [];
  const topPlayers = (d.top_players as Record<string, unknown>[]) ?? [];
  const devices = (d.device_breakdown as Record<string, unknown>[]) ?? [];

  const dauData = series.map((s) => ({
    date: (s.date as string)?.slice(5),
    DAU: Number(s.dau),
    Logins: Number(s.logins),
  }));

  const devicePie = devices.slice(0, 8).map((dv, i) => ({
    name: String(dv.device).slice(0, 20),
    value: Number(dv.count),
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      <DateRangePicker
        preset={ds.preset}
        onPreset={ds.handlePreset}
        customFrom={ds.customFrom}
        customTo={ds.customTo}
        onCustomFrom={ds.setCustomFrom}
        onCustomTo={ds.setCustomTo}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard title="Total Players" value={String(d.total_players ?? 0)} icon={Users} />
            <KpiCard title="New Players" value={String(d.new_players ?? 0)} icon={TrendingUp} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Active Users (DAU)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dauData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="DAU" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="Logins" stroke="#a855f7" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Players by Bet Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">User</th>
                      <th className="text-right py-1.5 pr-2 text-muted-foreground font-medium">Total Bets</th>
                      <th className="text-right py-1.5 text-muted-foreground font-medium">Plays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPlayers.map((r, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 truncate max-w-[120px]">{String(r.username)}</td>
                        <td className="py-1.5 pr-2 text-right">{fmtCurrency(r.total_bet)}</td>
                        <td className="py-1.5 text-right">{String(r.play_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={devicePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {devicePie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ── User Analytics Tab ────────────────────────────────────────────────────────

function UserTab() {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const ds = useDateState();

  const { data: playersRaw } = useQuery({
    queryKey: ["players-for-analytics"],
    queryFn: () => getPlayers("powerhouse", { search }),
    enabled: search.length > 0,
  });

  const { data: allPlayersRaw } = useQuery({
    queryKey: ["players-list-analytics"],
    queryFn: () => getPlayers("powerhouse"),
  });

  const players = (playersRaw as Record<string, unknown>[] | undefined) ?? (allPlayersRaw as Record<string, unknown>[] | undefined) ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-user", selectedUserId, ds.params],
    queryFn: () => getAnalyticsUser(selectedUserId!, ds.params),
    enabled: selectedUserId !== null,
  });

  const ud = (data as Record<string, unknown>) ?? {};
  const bets = (ud.bet_history as Record<string, unknown>[]) ?? [];
  const txs = (ud.transactions as Record<string, unknown>[]) ?? [];
  const activity = (ud.activity as Record<string, unknown>[]) ?? [];
  const balSeries = (ud.balance_series as Record<string, unknown>[]) ?? [];

  const balData = balSeries
    .filter((s) => s.balance !== null)
    .map((s) => ({
      date: (s.date as string)?.slice(5),
      Balance: Number(s.balance),
    }));

  const filteredPlayers = search
    ? players.filter((p) =>
        String(p.username ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : players.slice(0, 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-start">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
          {filteredPlayers.length > 0 && search && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredPlayers.map((p) => (
                <button
                  key={String(p.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setSelectedUserId(Number(p.id));
                    setSearch(String(p.username ?? ""));
                  }}
                >
                  {String(p.username ?? "")}
                </button>
              ))}
            </div>
          )}
        </div>
        <DateRangePicker
          preset={ds.preset}
          onPreset={ds.handlePreset}
          customFrom={ds.customFrom}
          customTo={ds.customTo}
          onCustomFrom={ds.setCustomFrom}
          onCustomTo={ds.setCustomTo}
        />
      </div>

      {!selectedUserId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Search and select a player above to view their analytics.
          </CardContent>
        </Card>
      )}

      {selectedUserId && isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {selectedUserId && !isLoading && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard title="Total Bets" value={fmtCurrency(ud.total_bet)} icon={Gamepad2} />
            <KpiCard title="Total Wins" value={fmtCurrency(ud.total_win)} icon={TrendingUp} />
            <KpiCard
              title="Net P/L"
              value={fmtCurrency(ud.net_pl)}
              icon={Number(ud.net_pl) >= 0 ? TrendingUp : TrendingDown}
              positive={Number(ud.net_pl) >= 0}
            />
            <KpiCard title="Plays" value={String(ud.play_count ?? 0)} icon={Activity} />
          </div>

          {balData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Balance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={balData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v) => fmtCurrency(v)} />
                    <Line type="monotone" dataKey="Balance" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Bets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Game</th>
                        <th className="text-right py-1.5 pr-2 text-muted-foreground font-medium">Bet</th>
                        <th className="text-right py-1.5 pr-2 text-muted-foreground font-medium">Win</th>
                        <th className="text-right py-1.5 text-muted-foreground font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bets.map((b, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1.5 pr-2 truncate max-w-[100px]">{String(b.game ?? "-")}</td>
                          <td className="py-1.5 pr-2 text-right">{fmtCurrency(b.bet_amount)}</td>
                          <td className="py-1.5 pr-2 text-right">{fmtCurrency(b.win_amount)}</td>
                          <td className="py-1.5 text-right capitalize">{String(b.type)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Type</th>
                        <th className="text-right py-1.5 pr-2 text-muted-foreground font-medium">Amount</th>
                        <th className="text-right py-1.5 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map((t, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1.5 pr-2 truncate max-w-[100px] capitalize">{String(t.transaction_type).replace(/_/g, " ")}</td>
                          <td className="py-1.5 pr-2 text-right">{fmtCurrency(t.amount)}</td>
                          <td className="py-1.5 text-right capitalize">{String(t.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground flex-shrink-0">
                      {String(a.created_at ?? "").replace("T", " ").slice(0, 16)}
                    </span>
                    <span className="capitalize font-medium">{String(a.action).replace(/_/g, " ")}</span>
                    {a.ip && <span className="text-muted-foreground ml-auto">{String(a.ip)}</span>}
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No activity in selected range.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PowerhouseAnalytics = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Platform insights across games, finance, and players.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="games">Game Analytics</TabsTrigger>
          <TabsTrigger value="finance">Finance & P/L</TabsTrigger>
          <TabsTrigger value="customers">Customer Behaviour</TabsTrigger>
          <TabsTrigger value="user">User Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="games" className="mt-4">
          <GamesTab />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <FinanceTab />
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
          <CustomersTab />
        </TabsContent>
        <TabsContent value="user" className="mt-4">
          <UserTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PowerhouseAnalytics;
