import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getActivity } from "@/api/admin";
import { TableBadge } from "@/components/admin/TableBadge";

type ActivityRow = Record<string, unknown> & { id?: number; user_username?: string; username?: string; action?: string; details?: string; remarks?: string; ip_address?: string; ip?: string; ipAddress?: string; created_at?: string };

const today = () => new Date().toISOString().slice(0, 10);

const AdminActivityLog = () => {
  const { user } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: activityLogs = [], isLoading, refetch } = useQuery({ queryKey: ["admin-activity", role], queryFn: () => getActivity(role) });
  const rows = activityLogs as ActivityRow[];
  const [cellView, setCellView] = useState<{ label: string; value: string } | null>(null);

  const openCell = (label: string, value: string) => () => setCellView({ label, value: value || "—" });

  const columns = [
    { header: "username", sortKey: "user_username", accessor: (row: ActivityRow) => <span className="cursor-pointer hover:underline text-primary" onClick={openCell("Username", String(row.user_username ?? row.username ?? ""))}>{String(row.user_username ?? row.username ?? "")}</span> },
    { header: "action", sortKey: "action", accessor: (row: ActivityRow) => <TableBadge variant="action" onClick={openCell("Action", String(row.action ?? "").replace(/_/g, " "))}>{String(row.action ?? "").replace(/_/g, " ")}</TableBadge> },
    { header: "ip", sortKey: "ip_address", accessor: (row: ActivityRow) => <span className="cursor-pointer hover:underline text-primary" onClick={openCell("IP", String(row.ip ?? row.ip_address ?? row.ipAddress ?? ""))}>{String(row.ip ?? row.ip_address ?? row.ipAddress ?? "")}</span> },
    { header: "details", sortKey: "remarks", accessor: (row: ActivityRow) => <span className="cursor-pointer hover:underline text-primary" onClick={openCell("Details", String(row.remarks ?? row.details ?? ""))}>{String(row.remarks ?? row.details ?? "")}</span> },
    { header: "date", sortKey: "created_at", accessor: (row: ActivityRow) => <span className="cursor-pointer hover:underline text-primary" onClick={openCell("Date", row.created_at ? new Date(String(row.created_at)).toLocaleString() : "")}>{row.created_at ? new Date(String(row.created_at)).toLocaleString() : ""}</span> },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Client Activity</h2>
      <ListDateRangeToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={({ dateFrom: f, dateTo: t }) => { setDateFrom(f); setDateTo(t); }}
        onLoad={() => refetch()}
        loading={isLoading}
      />
      <DataTable data={rows} columns={columns} searchKey="user_username" searchPlaceholder="Search activity..." variant="adminListing" />
      <Dialog open={!!cellView} onOpenChange={(open) => { if (!open) setCellView(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-base">View — {cellView?.label}</DialogTitle></DialogHeader>
          {cellView && <p className="py-2 text-sm break-all">{cellView.value}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setCellView(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminActivityLog;
