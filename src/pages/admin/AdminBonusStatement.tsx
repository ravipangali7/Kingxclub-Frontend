import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBonusStatement, type StatementParams } from "@/api/admin";
import { TableBadge } from "@/components/admin/TableBadge";

type StatementRow = Record<string, unknown> & {
  id?: number;
  username?: string;
  transaction_id?: number;
  debit?: string;
  credit?: string;
  balance?: string;
  description?: string;
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

export default function AdminBonusStatement() {
  const { user } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const params: StatementParams = useMemo(
    () => ({ date_from: dateFrom, date_to: dateTo, page, page_size: 20 }),
    [dateFrom, dateTo, page]
  );
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bonus-statement", role, params],
    queryFn: () => getBonusStatement(role, params),
  });
  const rows = (data?.results ?? []) as StatementRow[];
  const totalCount = data?.count ?? 0;

  const [editModal, setEditModal] = useState<{ row: StatementRow; field: string; value: unknown } | null>(null);

  const columns = useMemo(
    () => [
      {
        header: "username",
        sortKey: "username",
        accessor: (row: StatementRow) => (
          <CellClick value={String(row.username ?? "")} onClick={() => setEditModal({ row, field: "username", value: row.username })} />
        ),
      },
      {
        header: "transaction id",
        sortKey: "transaction_id",
        accessor: (row: StatementRow) => (
          <CellClick value={String(row.transaction_id ?? row.id ?? "")} onClick={() => setEditModal({ row, field: "transaction_id", value: row.transaction_id ?? row.id })} />
        ),
      },
      {
        header: "debit",
        sortKey: "debit",
        accessor: (row: StatementRow) => (
          <TableBadge variant="debit">{String(row.debit ?? "—")}</TableBadge>
        ),
      },
      {
        header: "credit",
        sortKey: "credit",
        accessor: (row: StatementRow) => (
          <TableBadge variant="credit">{String(row.credit ?? "—")}</TableBadge>
        ),
      },
      {
        header: "balance",
        sortKey: "balance",
        accessor: (row: StatementRow) => (
          <TableBadge variant="total">{String(row.balance ?? "—")}</TableBadge>
        ),
      },
      {
        header: "description",
        sortKey: "description",
        accessor: (row: StatementRow) => (
          <CellClick value={String(row.description ?? "")} onClick={() => setEditModal({ row, field: "description", value: row.description })} />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Bonus Statement</h2>
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
      {totalCount > 20 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Total: {totalCount}</span>
          <div className="flex gap-2">
            <button type="button" className="disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </button>
            <span>Page {page}</span>
            <button type="button" className="disabled:opacity-50" disabled={page * 20 >= totalCount} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
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
