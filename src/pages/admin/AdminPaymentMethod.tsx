import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPaymentMethodList } from "@/api/admin";
import { getMediaUrl } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";

type Row = Record<string, unknown> & {
  id?: number;
  user_username?: string;
  username?: string;
  payment_method_name?: string;
  details?: Record<string, unknown>;
  status?: string;
  qr_image_url?: string;
};

const today = () => new Date().toISOString().slice(0, 10);

function CellClick({ value, onClick }: { value: React.ReactNode; onClick: () => void }) {
  return (
    <span
      className="cursor-pointer hover:underline text-primary inline-block"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {value ?? "—"}
    </span>
  );
}

export default function AdminPaymentMethod() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["payment-method-list"],
    queryFn: () => getPaymentMethodList(),
  });
  const rows: Row[] = (Array.isArray(data) ? data : []).map((r, i) => ({ ...r, id: (r as Row).id ?? i }));

  const [editModal, setEditModal] = useState<{ row: Row; field: string; value: unknown } | null>(null);

  const detailsStr = (row: Row) => {
    const parts = [];
    if (row.name) parts.push(String(row.name));
    if (row.type) parts.push(String(row.type));
    if (row.wallet_phone) parts.push(String(row.wallet_phone));
    if (row.bank_name) parts.push(String(row.bank_name));
    if (row.bank_account_no) parts.push("****" + String(row.bank_account_no).slice(-4));
    return parts.join(" · ") || "—";
  };

  const columns = useMemo(
    () => [
      {
        header: "username",
        sortKey: "user_username",
        accessor: (row: Row) => (
          <CellClick
            value={String(row.user_username ?? row.username ?? "")}
            onClick={() => setEditModal({ row, field: "username", value: row.user_username ?? row.username })}
          />
        ),
      },
      {
        header: "details",
        sortKey: "payment_method_name",
        accessor: (row: Row) => (
          <CellClick value={detailsStr(row)} onClick={() => setEditModal({ row, field: "details", value: detailsStr(row) })} />
        ),
      },
      {
        header: "qr",
        sortKey: "qr_image_url",
        accessor: (row: Row) => {
          const url = row.qr_image_url ? getMediaUrl(String(row.qr_image_url)) : null;
          return (
            <CellClick
              value={url ? <img src={url} alt="QR" className="h-8 w-8 object-contain inline" /> : "—"}
              onClick={() => setEditModal({ row, field: "qr", value: url })}
            />
          );
        },
      },
      {
        header: "status",
        sortKey: "status",
        accessor: (row: Row) => (
          <CellClick
            value={<StatusBadge status={String(row.status ?? "pending")} />}
            onClick={() => setEditModal({ row, field: "status", value: row.status })}
          />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Payment method</h2>
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
      <DataTable data={rows} columns={columns} pageSize={20} searchPlaceholder="Search username..." searchKey="user_username" variant="adminListing" />
      <Dialog open={!!editModal} onOpenChange={(open) => !open && setEditModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">{editModal ? `${editModal.field} (read-only)` : ""}</DialogTitle>
          </DialogHeader>
          {editModal && (
            <p className="text-sm break-all">{String(editModal.value ?? "")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
