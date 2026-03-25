import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PinDialog } from "@/components/shared/PinDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  getBonusRequests,
  approveBonusRequest,
  rejectBonusRequest,
  updateBonusRequest,
  type ListParams,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye, RefreshCw } from "lucide-react";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { TableBadge } from "@/components/admin/TableBadge";
import { RejectReasonSuggestionsRow } from "@/components/admin/RejectReasonSuggestionsRow";
import { useRejectReasonSuggestions } from "@/hooks/useRejectReasonSuggestions";

type BonusRequestRow = Record<string, unknown> & {
  id?: number;
  user_username?: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  user_whatsapp_number?: string;
  amount?: string;
  bonus_type?: string;
  bonus_type_display?: string;
  bonus_rule_name?: string;
  status?: string;
  reject_reason?: string;
  processed_at?: string;
  created_at?: string;
  remarks?: string;
};

const AdminBonusRequests = () => {
  const { user, refreshUser } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const listParams: ListParams = {};
  if (dateFrom) listParams.date_from = dateFrom;
  if (dateTo) listParams.date_to = dateTo;
  if (statusFilter) listParams.status = statusFilter;
  const { data: bonusRequests = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-bonus-requests", role, listParams],
    queryFn: () => getBonusRequests(role, listParams),
    refetchInterval: autoRefresh ? 10000 : false,
  });
  const [pinOpen, setPinOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState<BonusRequestRow | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [savingAmount, setSavingAmount] = useState(false);
  const { data: rejectSuggestionsRes } = useRejectReasonSuggestions(role);
  const rejectChips = rejectSuggestionsRes?.data ?? [];
  const rows = bonusRequests as BonusRequestRow[];

  useEffect(() => {
    if (!autoRefresh || !refreshUser) return;
    const id = setInterval(() => refreshUser(), 10000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshUser]);

  useEffect(() => {
    setEditAmount("");
  }, [selected?.id]);

  const openView = (row: BonusRequestRow) => {
    setSelected(row);
    setViewOpen(true);
  };

  const columns = [
    { header: "ID", sortKey: "id", accessor: (row: BonusRequestRow) => <span className="cursor-pointer hover:underline text-primary" onClick={() => openView(row)}>{String(row.id ?? "")}</span> },
    { header: "User", sortKey: "user_username", accessor: (row: BonusRequestRow) => <span className="cursor-pointer hover:underline text-primary" onClick={() => openView(row)}>{String(row.user_username ?? "")}</span> },
    { header: "Amount", sortKey: "amount", accessor: (row: BonusRequestRow) => <TableBadge variant="amountGreen" onClick={() => openView(row)}>₹{Number(row.amount ?? 0).toLocaleString()}</TableBadge> },
    { header: "Bonus Type", sortKey: "bonus_type", accessor: (row: BonusRequestRow) => <span className="cursor-pointer hover:underline text-primary" onClick={() => openView(row)}>{String(row.bonus_type_display ?? row.bonus_type ?? "—")}</span> },
    { header: "Status", sortKey: "status", accessor: (row: BonusRequestRow) => <span className="cursor-pointer inline-block" onClick={() => openView(row)}><StatusBadge status={String(row.status ?? "pending")} /></span> },
    { header: "Date", sortKey: "created_at", accessor: (row: BonusRequestRow) => <span className="cursor-pointer hover:underline text-primary" onClick={() => openView(row)}>{row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : "—"}</span> },
    {
      header: "Actions",
      accessor: (row: BonusRequestRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openView(row)} title="View"><Eye className="h-3 w-3" /></Button>
          {String(row.status) === "pending" && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => { setSelected(row); setPinOpen(true); }}><Check className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => { setSelected(row); setRejectOpen(true); }}><X className="h-3 w-3" /></Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Bonus Requests</h2>
      <ListDateRangeToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={({ dateFrom: f, dateTo: t }) => { setDateFrom(f); setDateTo(t); }}
        onLoad={() => refetch()}
        loading={isLoading}
      />
      <div className="flex flex-wrap items-center gap-2">
        <select className="h-9 rounded-md border border-border bg-background px-3 text-sm w-32" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          <RefreshCw className="h-4 w-4" /> Auto refresh (10s)
        </label>
      </div>
      <DataTable data={rows} columns={columns} searchKey="user_username" searchPlaceholder="Search bonus requests..." variant="adminListing" />

      {/* View */}
      <Dialog open={viewOpen} onOpenChange={(open) => { setViewOpen(open); if (!open) setEditAmount(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Bonus Request Details – Small Report</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground text-xs">Username</span><p className="font-medium">{String(selected.user_username ?? "")}</p></div>
                  <div><span className="text-muted-foreground text-xs">Name</span><p className="font-medium">{String(selected.user_name ?? "")}</p></div>
                  {(selected.user_phone != null && String(selected.user_phone) !== "") && <div className="col-span-2"><span className="text-muted-foreground text-xs">Phone</span><p className="font-medium">{String(selected.user_phone)}</p></div>}
                  {(selected.user_email != null && String(selected.user_email) !== "") && <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium">{String(selected.user_email)}</p></div>}
                  {(selected.user_whatsapp_number != null && String(selected.user_whatsapp_number) !== "") && <div><span className="text-muted-foreground text-xs">WhatsApp</span><p className="font-medium">{String(selected.user_whatsapp_number)}</p></div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground text-xs">ID</span><p className="font-medium">{String(selected.id ?? "")}</p></div>
                <div>
                  <span className="text-muted-foreground text-xs">Amount</span>
                  {String(selected.status) === "pending" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="font-bold text-success h-9"
                        value={editAmount !== "" ? editAmount : String(selected.amount ?? "0")}
                        onChange={(e) => setEditAmount(e.target.value)}
                      />
                      <Button
                        size="sm"
                        disabled={savingAmount || editAmount === "" || Number(editAmount || 0) <= 0 || String(editAmount) === String(selected.amount ?? "0")}
                        onClick={async () => {
                          if (!selected?.id || editAmount === "") return;
                          setSavingAmount(true);
                          try {
                            await updateBonusRequest(selected.id, { amount: Number(editAmount) || 0 }, role);
                            queryClient.invalidateQueries({ queryKey: ["admin-bonus-requests", role] });
                            setSelected({ ...selected, amount: editAmount });
                            setEditAmount("");
                            toast({ title: "Amount updated." });
                          } catch (e: unknown) {
                            const msg = (e as { detail?: string })?.detail ?? "Failed to update amount.";
                            toast({ title: msg, variant: "destructive" });
                          } finally {
                            setSavingAmount(false);
                          }
                        }}
                      >
                        {savingAmount ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  ) : (
                    <p className="font-bold text-success">₹{Number(selected.amount ?? 0).toLocaleString()}</p>
                  )}
                </div>
                <div><span className="text-muted-foreground text-xs">Bonus Type</span><p className="font-medium">{String(selected.bonus_type_display ?? selected.bonus_type ?? "")}</p></div>
                {selected.bonus_rule_name != null && selected.bonus_rule_name !== "" && (
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Bonus Rule</span><p className="font-medium">{String(selected.bonus_rule_name)}</p></div>
                )}
                <div><span className="text-muted-foreground text-xs">Status</span><p><StatusBadge status={String(selected.status ?? "pending")} /></p></div>
                <div><span className="text-muted-foreground text-xs">Created</span><p className="font-medium">{selected.created_at ? new Date(String(selected.created_at)).toLocaleString() : ""}</p></div>
                {selected.processed_at && (
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Processed at</span><p className="font-medium">{new Date(String(selected.processed_at)).toLocaleString()}</p></div>
                )}
                {String(selected.status) === "rejected" && selected.reject_reason && (
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Reject reason</span><p className="font-medium text-accent">{String(selected.reject_reason)}</p></div>
                )}
                {selected.remarks != null && String(selected.remarks).trim() !== "" && (
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Remarks</span><p className="font-medium">{String(selected.remarks)}</p></div>
                )}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Reject Bonus Request</DialogTitle></DialogHeader>
          <Textarea placeholder="Rejection reason..." rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <RejectReasonSuggestionsRow suggestions={rejectChips} onSelect={(text) => setRejectReason(text)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              className="bg-accent text-accent-foreground"
              onClick={async () => {
                if (!selected?.id) return;
                try {
                  await rejectBonusRequest(selected.id, { reject_reason: rejectReason }, role);
                  queryClient.invalidateQueries({ queryKey: ["admin-bonus-requests", role] });
                  queryClient.invalidateQueries({ queryKey: ["admin-dashboard", role] });
                  setRejectOpen(false);
                  setRejectReason("");
                  toast({ title: "Bonus request rejected." });
                } catch (e: unknown) {
                  const msg = (e as { detail?: string })?.detail ?? "Something went wrong.";
                  toast({ title: msg, variant: "destructive" });
                }
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinDialog
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onConfirm={async (pin) => {
          if (!selected?.id) return;
          try {
            await approveBonusRequest(selected.id, { pin }, role);
            queryClient.invalidateQueries({ queryKey: ["admin-bonus-requests", role] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard", role] });
            setPinOpen(false);
            toast({ title: "Bonus request approved." });
          } catch (e: unknown) {
            const msg = (e as { detail?: string })?.detail ?? "Invalid PIN or request failed.";
            toast({ title: msg, variant: "destructive" });
          }
        }}
        title="Enter PIN to confirm"
      />
    </div>
  );
};

export default AdminBonusRequests;
