import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  getPaymentModeVerificationList,
  approvePaymentModeVerification,
  rejectPaymentModeVerification,
} from "@/api/admin";
import { getMediaUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RejectReasonSuggestionsRow } from "@/components/admin/RejectReasonSuggestionsRow";
import { useRejectReasonSuggestions } from "@/hooks/useRejectReasonSuggestions";

type PaymentModeRow = Record<string, unknown> & {
  id?: number;
  payment_method_name?: string;
  details?: Record<string, unknown>;
  status?: string;
  status_display?: string;
  user?: number;
  user_username?: string;
  qr_image_url?: string;
  reject_reason?: string;
  action_by?: number;
  action_at?: string;
  created_at?: string;
  updated_at?: string;
};

const AdminPaymentModeVerification = () => {
  const { user } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: list = [] } = useQuery({
    queryKey: ["payment-mode-verification", role, statusFilter],
    queryFn: () => getPaymentModeVerificationList(role, { status: statusFilter }),
  });
  const rows = list as PaymentModeRow[];
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState<PaymentModeRow | null>(null);
  const [statusEdit, setStatusEdit] = useState<PaymentModeRow | null>(null);
  const [statusEditValue, setStatusEditValue] = useState("");
  const [statusEditRejectReason, setStatusEditRejectReason] = useState("");
  const [statusEditSaving, setStatusEditSaving] = useState(false);
  const { data: rejectSuggestionsRes } = useRejectReasonSuggestions(role);
  const rejectChips = rejectSuggestionsRes?.data ?? [];

  const displayName = (row: PaymentModeRow) => String(row.payment_method_name ?? "—");

  const openStatusEdit = (row: PaymentModeRow) => {
    setStatusEdit(row);
    setStatusEditValue(String(row.status ?? "pending"));
    setStatusEditRejectReason("");
  };

  const columns = [
    { header: "ID", sortKey: "id", accessor: (row: PaymentModeRow) => String(row.id ?? "") },
    { header: "Name", sortKey: "payment_method_name", accessor: (row: PaymentModeRow) => displayName(row) },
    { header: "Owner", sortKey: "user_username", accessor: (row: PaymentModeRow) => String((row as { user_username?: string }).user_username ?? row.user ?? "") },
    {
      header: "Status",
      sortKey: "status",
      accessor: (row: PaymentModeRow) => (
        <span
          className="cursor-pointer inline-block text-xs px-2 py-0.5 rounded border bg-muted/50 border-border hover:bg-muted"
          onClick={() => openStatusEdit(row)}
        >
          <StatusBadge status={String(row.status ?? "pending")} />
        </span>
      ),
    },
    { header: "Created", sortKey: "created_at", accessor: (row: PaymentModeRow) => row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : "" },
    {
      header: "Actions",
      accessor: (row: PaymentModeRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => { setSelected(row); setViewOpen(true); }}>
            <Eye className="h-3 w-3" />
          </Button>
          {String(row.status) === "pending" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-success"
                title="Approve"
                onClick={async () => {
                  if (!row.id) return;
                  try {
                    await approvePaymentModeVerification(row.id, role);
                    queryClient.invalidateQueries({ queryKey: ["payment-mode-verification", role, statusFilter] });
                    toast({ title: "Payment method approved." });
                  } catch (e: unknown) {
                    const msg = (e as { detail?: string })?.detail ?? "Failed to approve.";
                    toast({ title: msg, variant: "destructive" });
                  }
                }}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-accent"
                title="Reject"
                onClick={() => { setSelected(row); setRejectReason(""); setRejectOpen(true); }}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Payment Mode Verification</h2>
      <p className="text-sm text-muted-foreground">Approve or reject pending payment methods. Only approved methods can be used for deposits/withdrawals.</p>
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Status:</span>
        <select
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>
      <DataTable
        data={rows}
        columns={columns}
        searchKey="user_username"
        searchPlaceholder="Search by username..."
        variant="adminListing"
      />

      {/* Edit status (approve/reject via modal) */}
      <Dialog open={!!statusEdit} onOpenChange={(open) => { if (!open) setStatusEdit(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Edit Status</DialogTitle>
            {statusEdit && <p className="text-xs text-muted-foreground">ID: {statusEdit.id} — {displayName(statusEdit)}</p>}
          </DialogHeader>
          {statusEdit && (
            <div className="py-2 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  value={statusEditValue}
                  onChange={(e) => setStatusEditValue(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {statusEditValue === "rejected" && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Reject reason (optional)</label>
                  <Textarea placeholder="Reason..." rows={2} value={statusEditRejectReason} onChange={(e) => setStatusEditRejectReason(e.target.value)} />
                  <RejectReasonSuggestionsRow suggestions={rejectChips} onSelect={(text) => setStatusEditRejectReason(text)} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusEdit(null)} disabled={statusEditSaving}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              disabled={statusEditSaving || (statusEditValue !== "approved" && statusEditValue !== "rejected")}
              onClick={async () => {
                if (!statusEdit?.id) return;
                setStatusEditSaving(true);
                try {
                  if (statusEditValue === "approved") {
                    await approvePaymentModeVerification(statusEdit.id, role);
                    toast({ title: "Payment method approved." });
                  } else if (statusEditValue === "rejected") {
                    await rejectPaymentModeVerification(statusEdit.id, { reject_reason: statusEditRejectReason }, role);
                    toast({ title: "Payment method rejected." });
                  }
                  queryClient.invalidateQueries({ queryKey: ["payment-mode-verification", role, statusFilter] });
                  setStatusEdit(null);
                } catch (e: unknown) {
                  const msg = (e as { detail?: string })?.detail ?? "Failed.";
                  toast({ title: msg, variant: "destructive" });
                } finally {
                  setStatusEditSaving(false);
                }
              }}
            >
              {statusEditSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Payment Method – Full Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div><span className="text-muted-foreground text-xs block">Name</span><p className="font-medium">{displayName(selected)}</p></div>
                <div><span className="text-muted-foreground text-xs block">Owner</span><p className="font-medium">{String(selected.user_username ?? selected.user ?? "")}</p></div>
                <div><span className="text-muted-foreground text-xs block">Status</span><p><StatusBadge status={String(selected.status ?? "pending")} /></p></div>
                {selected.details != null && typeof selected.details === "object" && Object.keys(selected.details).length > 0 && (
                  <div className="col-span-2 space-y-1">
                    <span className="text-muted-foreground text-xs block">Details</span>
                    <div className="flex flex-col gap-0.5">
                      {Object.entries(selected.details as Record<string, unknown>).map(([k, v]) => (
                        <p key={k} className="font-medium"><span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span> {String(v ?? "")}</p>
                      ))}
                    </div>
                  </div>
                )}
                {selected.reject_reason != null && String(selected.reject_reason).trim() !== "" && (
                  <div className="col-span-2"><span className="text-muted-foreground text-xs block">Reject reason</span><p className="font-medium">{String(selected.reject_reason)}</p></div>
                )}
                {selected.action_at && (
                  <div className="col-span-2"><span className="text-muted-foreground text-xs block">Action at</span><p className="font-medium">{new Date(String(selected.action_at)).toLocaleString()}</p></div>
                )}
                <div><span className="text-muted-foreground text-xs block">Created</span><p className="font-medium">{selected.created_at ? new Date(String(selected.created_at)).toLocaleString() : "—"}</p></div>
                <div><span className="text-muted-foreground text-xs block">Updated</span><p className="font-medium">{selected.updated_at ? new Date(String(selected.updated_at)).toLocaleString() : "—"}</p></div>
              </div>
              {selected.qr_image_url && (
                <div>
                  <span className="text-muted-foreground text-xs block mb-1">QR Image</span>
                  <img src={getMediaUrl(String(selected.qr_image_url))} alt="QR" className="w-36 h-36 object-contain rounded-lg border border-border" />
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Reject Payment Method</DialogTitle></DialogHeader>
          <Textarea placeholder="Rejection reason (optional)..." rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <RejectReasonSuggestionsRow suggestions={rejectChips} onSelect={(text) => setRejectReason(text)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              className="bg-accent text-accent-foreground"
              onClick={async () => {
                if (!selected?.id) return;
                try {
                  await rejectPaymentModeVerification(selected.id, { reject_reason: rejectReason }, role);
                  queryClient.invalidateQueries({ queryKey: ["payment-mode-verification", role, statusFilter] });
                  setRejectOpen(false);
                  setRejectReason("");
                  toast({ title: "Payment method rejected." });
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
    </div>
  );
};

export default AdminPaymentModeVerification;
