import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { getGameLog } from "@/api/admin";
import { TableBadge } from "@/components/admin/TableBadge";

type GameLogRow = Record<string, unknown> & {
  id?: number;
  user_username?: string;
  username?: string;
  game_name?: string;
  game?: string;
  bet_amount?: string;
  win_amount?: string;
  lose_amount?: string;
  result?: string;
  type?: string;
  created_at?: string;
};

const AdminGameLog = () => {
  const { user } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const { data: gameLogs = [] } = useQuery({ queryKey: ["admin-game-log", role], queryFn: () => getGameLog(role) });
  const rows = gameLogs as GameLogRow[];

  const columns = [
    { header: "User", sortKey: "user_username", accessor: (row: GameLogRow) => String(row.user_username ?? row.username ?? "—") },
    { header: "Game", sortKey: "game_name", accessor: (row: GameLogRow) => String(row.game_name ?? row.game ?? "—") },
    { header: "Bet", sortKey: "bet_amount", accessor: (row: GameLogRow) => `₹${Number(row.bet_amount ?? 0).toLocaleString()}` },
    {
      header: "Win/Loss",
      sortKey: "win_amount",
      accessor: (row: GameLogRow) => {
        const win = Number(row.win_amount ?? 0);
        const lose = Number(row.lose_amount ?? 0);
        const net = win - lose;
        return (
          <TableBadge variant={net >= 0 ? "plPositive" : "plNegative"}>
            {net >= 0 ? "+" : ""}₹{net.toLocaleString()}
          </TableBadge>
        );
      },
    },
    { header: "Result", sortKey: "type", accessor: (row: GameLogRow) => <StatusBadge status={String(row.result ?? row.type ?? "—")} /> },
    { header: "Time", sortKey: "created_at", accessor: (row: GameLogRow) => (row.created_at ? new Date(String(row.created_at)).toLocaleString() : "—") },
    {
      header: "Details",
      accessor: (row: GameLogRow) =>
        row.id != null ? (
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <Link to={`/${role}/game-log/${row.id}`}>View</Link>
          </Button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Bet History</h2>
      <DataTable
        data={rows}
        columns={columns}
        searchKey="user_username"
        searchPlaceholder="Search by user or game..."
        variant="adminListing"
      />
    </div>
  );
};

export default AdminGameLog;
