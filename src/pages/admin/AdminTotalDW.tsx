import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTotalDW, type DateRangeParams } from "@/api/admin";
import { TableBadge } from "@/components/admin/TableBadge";

type TotalDWRow = Record<string, unknown> & {
  id?: number;
  user_id?: number;
  username?: string;
  deposit?: string;
  withdrawal?: string;
  total?: string;
};

const today = () => new Date().toISOString().slice(0, 10);

function CellClick({ value, onClick }: { value: string; onClick: () => void }) {
  return (
    <span
      className="cursor-pointer hover:underline text-primary"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {value || "—"}
    </span>
  );
}

export default function AdminTotalDW() {
  const { user } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const params: DateRangeParams = useMemo(() => ({ date_from: dateFrom, date_to: dateTo }), [dateFrom, dateTo]);
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["total-dw", role, params],
    queryFn: () => getTotalDW(role, params),
  });
  const rows: TotalDWRow[] = (Array.isArray(data) ? data : []).map((r, i) => ({ ...r, id: (r as TotalDWRow).user_id ?? i }));

  const [editModal, setEditModal] = useState<{ row: TotalDWRow; field: string; value: unknown } | null>(null);

  const columns = useMemo(
    () => [
      {
        header: "username",
        sortKey: "username",
        accessor: (row: TotalDWRow) => (
          <CellClick value={String(row.username ?? "")} onClick={() => setEditModal({ row, field: "username", value: row.username })} />
        ),
      },
      {
        header: "withdrawal",
        sortKey: "withdrawal",
        accessor: (row: TotalDWRow) => (
          <TableBadge variant="amountRed">{String(row.withdrawal ?? "—")}</TableBadge>
        ),
      },
      {
        header: "Deposit",
        sortKey: "deposit",
        accessor: (row: TotalDWRow) => (
          <TableBadge variant="amountGreen">{String(row.deposit ?? "—")}</TableBadge>
        ),
      },
      {
        header: "Total",
        sortKey: "total",
        accessor: (row: TotalDWRow) => (
          <TableBadge variant="total">{String(row.total ?? "—")}</TableBadge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Total D/W</h2>
      <ListDateRangeToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={({ dateFrom: f, dateTo: t }) => {
          setDateFrom(f);
          setDateTo(t);
        }}
        onLoad={() => refetch()}
        loading={isLoading}
      />
      <DataTable data={rows} columns={columns} pageSize={20} searchPlaceholder="Search username..." searchKey="username" variant="adminListing" />
      <Dialog open={!!editModal} onOpenChange={(open) => !open && setEditModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">{editModal ? `${editModal.field} (read-only)` : ""}</DialogTitle>
          </DialogHeader>
          {editModal && <p className="text-sm break-all">{String(editModal.value ?? "")}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
