import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAccountStatement, type StatementParams } from "@/api/admin";
import { TableBadge } from "@/components/admin/TableBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type StatementRow = Record<string, unknown> & {
  id?: number;
  username?: string;
  transaction_id?: number;
  debit?: string;
  credit?: string;
  balance?: string;
  description?: string;
  reference_id?: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminAccountStatement() {
  const { user } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  const params: StatementParams = useMemo(
    () => ({
      date_from: dateFrom,
      date_to: dateTo,
      page,
      page_size: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [dateFrom, dateTo, page, debouncedSearch]
  );
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["account-statement", role, params],
    queryFn: () => getAccountStatement(role, params),
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
        accessor: (row: StatementRow) => {
          const ref = String(row.reference_id ?? "").trim();
          const desc = String(row.description ?? "");
          return (
            <div className="space-y-1 max-w-[260px]">
              {ref !== "" && (
                <Badge variant="secondary" className="text-[10px] font-normal whitespace-normal block w-fit">
                  Transaction/Reference Code: {ref}
                </Badge>
              )}
              <CellClick value={desc} onClick={() => setEditModal({ row, field: "description", value: row.description })} />
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Account Statement</h2>
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
      <Input
        placeholder="Search username, description, or reference ID…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-md h-9"
      />
      <DataTable data={rows} columns={columns} pageSize={20} hideSearch variant="adminListing" />
      {totalCount > 20 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Total: {totalCount}</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              className="disabled:opacity-50"
              disabled={page * 20 >= totalCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
      <Dialog open={!!editModal} onOpenChange={(open) => !open && setEditModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              {editModal ? `${editModal.field} (read-only)` : ""}
            </DialogTitle>
          </DialogHeader>
          {editModal && (
            <p className="text-sm break-all">{String(editModal.value ?? "")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

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

