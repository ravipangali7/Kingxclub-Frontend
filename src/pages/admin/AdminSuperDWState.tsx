import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSuperDWState, type DateRangeParams } from "@/api/admin";
import { TableBadge } from "@/components/admin/TableBadge";

type Row = Record<string, unknown> & {
  id?: number;
  user_id?: number;
  username?: string;
  no_of_deposit?: number;
  total_deposit?: string;
  no_of_withdrawal?: number;
  total_withdrawal?: string;
  net_d_w?: string;
  total_d_w?: string;
};

const today = () => new Date().toISOString().slice(0, 10);

function CellClick({ value, onClick }: { value: string | number; onClick: () => void }) {
  return (
    <span
      className="cursor-pointer hover:underline text-primary"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {value ?? "—"}
    </span>
  );
}

export default function AdminSuperDWState() {
  const { user } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super") ? user.role : "super";
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const params: DateRangeParams = useMemo(() => ({ date_from: dateFrom, date_to: dateTo }), [dateFrom, dateTo]);
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["super-dw-state", role, params],
    queryFn: () => getSuperDWState(role, params),
  });
  const rows: Row[] = (Array.isArray(data) ? data : []).map((r, i) => ({ ...r, id: (r as Row).user_id ?? i }));

  const [editModal, setEditModal] = useState<{ row: Row; field: string; value: unknown } | null>(null);

  const columns = useMemo(
    () => [
      {
        header: "username",
        sortKey: "username",
        accessor: (row: Row) => (
          <CellClick value={String(row.username ?? "")} onClick={() => setEditModal({ row, field: "username", value: row.username })} />
        ),
      },
      {
        header: "No of Deposit",
        sortKey: "no_of_deposit",
        accessor: (row: Row) => (
          <TableBadge variant="players">{row.no_of_deposit ?? "—"}</TableBadge>
        ),
      },
      {
        header: "Total Deposit",
        sortKey: "total_deposit",
        accessor: (row: Row) => (
          <TableBadge variant="amountGreen">{String(row.total_deposit ?? "—")}</TableBadge>
        ),
      },
      {
        header: "No of Withdrawal",
        sortKey: "no_of_withdrawal",
        accessor: (row: Row) => (
          <TableBadge variant="players">{row.no_of_withdrawal ?? "—"}</TableBadge>
        ),
      },
      {
        header: "Total Withdrawal",
        sortKey: "total_withdrawal",
        accessor: (row: Row) => (
          <TableBadge variant="amountRed">{String(row.total_withdrawal ?? "—")}</TableBadge>
        ),
      },
      {
        header: "Net D/W",
        sortKey: "net_d_w",
        accessor: (row: Row) => (
          <TableBadge variant="total">{String(row.net_d_w ?? "—")}</TableBadge>
        ),
      },
      {
        header: "Total D/W",
        sortKey: "total_d_w",
        accessor: (row: Row) => (
          <TableBadge variant="total">{String(row.total_d_w ?? "—")}</TableBadge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Super D/W State</h2>
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
