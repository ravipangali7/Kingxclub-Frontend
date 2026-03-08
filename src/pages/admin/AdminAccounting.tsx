import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAccountingReport,
  type AccountingReportResponse,
  type AccountingSummary,
} from "@/api/admin";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const AdminAccounting = () => {
  const { user } = useAuth();
  const role = (user?.role === "super" || user?.role === "master" || user?.role === "powerhouse") ? user.role : "master";
  const [dateFrom, setDateFrom] = useState(todayISO);
  const [dateTo, setDateTo] = useState(todayISO);

  const params = useMemo(
    () => ({ date_from: dateFrom, date_to: dateTo }),
    [dateFrom, dateTo]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["accounting-report", role, params],
    queryFn: () => getAccountingReport(role, params),
  });

  const report = data as AccountingReportResponse | undefined;
  const summary: AccountingSummary | null = report?.summary ?? null;

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl">Accounting</h2>
        <p className="text-destructive">Failed to load accounting report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display font-bold text-xl">Accounting Report</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            className="w-40 h-9 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-40 h-9 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Report summary block */}
      {summary && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Report Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="text-muted-foreground">
              Period: {dateFrom} to {dateTo}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
              <div>
                <span className="text-muted-foreground block">P/L</span>
                <span className="font-semibold">
                  ₹{Number(summary.total_pl ?? 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Deposits</span>
                <span className="font-semibold">
                  {summary.deposits_count} (₹{Number(summary.total_deposits ?? 0).toLocaleString()})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Withdrawals</span>
                <span className="font-semibold">
                  {summary.withdrawals_count} (₹{Number(summary.total_withdrawals ?? 0).toLocaleString()})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Bet History</span>
                <span className="font-semibold">{summary.game_logs_count}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Transactions</span>
                <span className="font-semibold">{summary.transactions_count}</span>
              </div>
              {role === "super" && summary.settlements_count != null && (
                <div>
                  <span className="text-muted-foreground block">Settlements</span>
                  <span className="font-semibold">
                    {summary.settlements_count} (₹{Number(summary.settlements_total ?? 0).toLocaleString()})
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">P/L</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <span className="font-bold text-lg">
                ₹{Number(summary.total_pl ?? 0).toLocaleString()}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">Deposits</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <span className="font-bold text-lg">{summary.deposits_count}</span>
              <span className="text-muted-foreground text-xs ml-1">
                (₹{Number(summary.total_deposits ?? 0).toLocaleString()})
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">Withdrawals</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <span className="font-bold text-lg">{summary.withdrawals_count}</span>
              <span className="text-muted-foreground text-xs ml-1">
                (₹{Number(summary.total_withdrawals ?? 0).toLocaleString()})
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">Games</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <span className="font-bold text-lg">{summary.game_logs_count}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">Transactions</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <span className="font-bold text-lg">{summary.transactions_count}</span>
            </CardContent>
          </Card>
          {role === "super" && summary.settlements_count != null && (
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground">Settlements</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <span className="font-bold text-lg">{summary.settlements_count}</span>
                <span className="text-muted-foreground text-xs ml-1">
                  (₹{Number(summary.settlements_total ?? 0).toLocaleString()})
                </span>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isLoading && <p className="text-muted-foreground text-sm">Loading report...</p>}

      {report && !isLoading && (
        <>
          {/* Bet History */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Bet History</h3>
            <DataTable
              data={report.game_logs as { id: number; user_username?: string; username?: string; game_name?: string; category?: string; bet_amount?: string; type?: string; win_amount?: string; created_at?: string }[]}
              columns={[
                { header: "User", accessor: (row) => String(row.user_username ?? row.username ?? "") },
                { header: "Game", accessor: (row) => String(row.game_name ?? "") },
                { header: "Category", accessor: (row) => String(row.category ?? "") },
                { header: "Bet", accessor: (row) => `₹${Number(row.bet_amount ?? 0).toLocaleString()}` },
                { header: "Result", accessor: (row) => <StatusBadge status={String(row.type ?? "")} /> },
                { header: "Won", accessor: (row) => Number(row.win_amount ?? 0) > 0 ? `₹${Number(row.win_amount ?? 0).toLocaleString()}` : "—" },
                { header: "Date", accessor: (row) => row.created_at ? new Date(String(row.created_at)).toLocaleString() : "" },
                {
                  header: "Details",
                  accessor: (row) =>
                    row.id != null ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link to={`/${role}/game-log/${row.id}`}>View</Link>
                      </Button>
                    ) : "—",
                },
              ]}
              searchKey="user_username"
              searchPlaceholder="Search bet history..."
            />
          </div>

          {/* Transactions */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Transactions</h3>
            <DataTable
              data={report.transactions as { id: number; user_username?: string; username?: string; transaction_type?: string; amount?: string; wallet_display?: string; created_at?: string }[]}
              columns={[
                { header: "User", accessor: (row) => String(row.user_username ?? row.username ?? "") },
                { header: "Type", accessor: (row) => <span className="capitalize">{String(row.transaction_type ?? "").replace(/_/g, " ")}</span> },
                { header: "Amount", accessor: (row) => `₹${Number(row.amount ?? 0).toLocaleString()}` },
                { header: "Wallet", accessor: (row) => String(row.wallet_display ?? "") },
                { header: "Date", accessor: (row) => row.created_at ? new Date(String(row.created_at)).toLocaleString() : "" },
              ]}
              searchKey="user_username"
              searchPlaceholder="Search transactions..."
            />
          </div>

          {/* Deposits */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Deposits</h3>
            <DataTable
              data={report.deposits as { id: number; user_username?: string; username?: string; amount?: string; status?: string; created_at?: string }[]}
              columns={[
                { header: "User", accessor: (row) => String(row.user_username ?? row.username ?? "") },
                { header: "Amount", accessor: (row) => `₹${Number(row.amount ?? 0).toLocaleString()}` },
                { header: "Status", accessor: (row) => <StatusBadge status={String(row.status ?? "pending")} /> },
                { header: "Date", accessor: (row) => row.created_at ? new Date(String(row.created_at)).toLocaleString() : "" },
              ]}
              searchKey="user_username"
              searchPlaceholder="Search deposits..."
            />
          </div>

          {/* Withdrawals */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Withdrawals</h3>
            <DataTable
              data={report.withdrawals as { id: number; user_username?: string; username?: string; amount?: string; status?: string; created_at?: string }[]}
              columns={[
                { header: "User", accessor: (row) => String(row.user_username ?? row.username ?? "") },
                { header: "Amount", accessor: (row) => `₹${Number(row.amount ?? 0).toLocaleString()}` },
                { header: "Status", accessor: (row) => <StatusBadge status={String(row.status ?? "pending")} /> },
                { header: "Date", accessor: (row) => row.created_at ? new Date(String(row.created_at)).toLocaleString() : "" },
              ]}
              searchKey="user_username"
              searchPlaceholder="Search withdrawals..."
            />
          </div>

          {/* Settlements (super only) */}
          {role === "super" && report.settlements && report.settlements.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Settlement Details</h3>
              <DataTable
                data={report.settlements.map((s) => ({ ...s, id: String(s.id) }))}
                columns={[
                  { header: "From (Master)", accessor: (row) => String(row.from_user_username ?? "—") },
                  { header: "Amount", accessor: (row) => `₹${Number(row.amount ?? 0).toLocaleString()}` },
                  { header: "Date", accessor: (row) => row.created_at ? new Date(String(row.created_at)).toLocaleString() : "" },
                ]}
                searchKey="from_user_username"
                searchPlaceholder="Search settlements..."
              />
            </div>
          )}

          {role === "super" && report.settlements && report.settlements.length === 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Settlement Details</h3>
              <p className="text-muted-foreground text-sm">No settlements in this period.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAccounting;
