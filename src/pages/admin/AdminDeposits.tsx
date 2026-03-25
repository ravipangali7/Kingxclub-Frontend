import { useState, useEffect, useMemo, type ReactNode, type MouseEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PinDialog } from "@/components/shared/PinDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getDeposits, approveDeposit, rejectDeposit, updateDeposit, type ListParams } from "@/api/admin";
import { getPublicPaymentMethods } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { TableBadge } from "@/components/admin/TableBadge";
import { RejectReasonSuggestionsRow } from "@/components/admin/RejectReasonSuggestionsRow";
import { useRejectReasonSuggestions } from "@/hooks/useRejectReasonSuggestions";
import { PaymentDetailsPanel } from "@/components/PaymentDetailsPanel";
import { buildDepositRowCopyText } from "@/lib/copyDepositWithdrawDetail";
import { Check, X, Eye, RefreshCw, ClipboardCopy } from "lucide-react";

type PaymentModeDetail = Record<string, unknown> & { payment_method?: number; payment_method_name?: string; details?: Record<string, unknown>; status_display?: string; qr_image_url?: string };
type DepositRow = Record<string, unknown> & { id?: number; user_username?: string; user_name?: string; user_phone?: string; user_email?: string; user_whatsapp_number?: string; amount?: string; payment_mode?: string; payment_mode_name?: string; payment_mode_qr_image?: string; payment_mode_detail?: PaymentModeDetail | null; status?: string; created_at?: string; screenshot?: string; remarks?: string; reference_id?: string };

const AdminDeposits = () => {
  const { user, refreshUser } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [debouncedListSearch, setDebouncedListSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedListSearch(listSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [listSearch]);
  const listParams: ListParams = useMemo(() => {
    const p: ListParams = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    if (statusFilter) p.status = statusFilter;
    if (debouncedListSearch) p.search = debouncedListSearch;
    return p;
  }, [dateFrom, dateTo, statusFilter, debouncedListSearch]);
  const { data: rejectSuggestionsRes } = useRejectReasonSuggestions(role);
  const rejectChips = rejectSuggestionsRes?.data ?? [];
  const { data: deposits = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-deposits", role, listParams],
    queryFn: () => getDeposits(role, listParams),
    refetchInterval: autoRefresh ? 10000 : false,
  });
  const [pinOpen, setPinOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [snapOpen, setSnapOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRow | null>(null);
  const [snapDeposit, setSnapDeposit] = useState<DepositRow | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [cellView, setCellView] = useState<{ label: string; value: ReactNode } | null>(null);
  const [depositEdit, setDepositEdit] = useState<{ row: DepositRow; field: "status" | "amount" } | null>(null);
  const [depositEditValue, setDepositEditValue] = useState("");
  const [depositEditSaving, setDepositEditSaving] = useState(false);
  const { data: publicPaymentMethods = [] } = useQuery({ queryKey: ["publicPaymentMethods"], queryFn: getPublicPaymentMethods });
  const paymentMethodImageMap = (publicPaymentMethods as { id: number; image_url?: string | null }[]).reduce(
    (acc, pm) => {
      if (pm.image_url) acc[pm.id] = pm.image_url;
      return acc;
    },
    {} as Record<number, string>
  );
  const rows = deposits as DepositRow[];

  useEffect(() => {
    if (!autoRefresh || !refreshUser) return;
    const id = setInterval(() => refreshUser(), 10000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshUser]);

  const openCell = (label: string, value: ReactNode) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setCellView({ label, value });
  };

  const openDepositEdit = (row: DepositRow, field: "status" | "amount") => {
    setDepositEdit({ row, field });
    setDepositEditValue(field === "status" ? String(row.status ?? "pending") : String(row.amount ?? ""));
  };

  const columns = [
    { header: "username", sortKey: "user_username", accessor: (row: DepositRow) => <span className="cursor-pointer hover:underline text-primary" onClick={openCell("Username", String(row.user_username ?? row.username ?? ""))}>{String(row.user_username ?? row.username ?? "")}</span> },
    { header: "transaction id", sortKey: "id", accessor: (row: DepositRow) => <span className="cursor-pointer hover:underline text-primary" onClick={openCell("Transaction ID", String(row.id ?? ""))}>{String(row.id ?? "")}</span> },
    {
      header: "reference id",
      sortKey: "reference_id",
      accessor: (row: DepositRow) => {
        const ref = String(row.reference_id ?? "").trim();
        return ref ? (
          <span className="cursor-pointer hover:underline text-primary max-w-[100px] truncate block" onClick={openCell("Reference ID", ref)} title={ref}>
            {ref}
          </span>
        ) : (
          "—"
        );
      },
    },
    {
      header: "status",
      sortKey: "status",
      accessor: (row: DepositRow) => (
        <span className="cursor-pointer inline-block" onClick={() => openDepositEdit(row, "status")}>
          <span className="text-xs px-2 py-0.5 rounded border bg-muted/50 border-border inline-flex items-center">
            <StatusBadge status={String(row.status ?? "pending")} />
          </span>
        </span>
      ),
    },
    { header: "request date", sortKey: "created_at", accessor: (row: DepositRow) => <span className="cursor-pointer hover:underline text-primary" onClick={openCell("Request date", row.created_at ? new Date(String(row.created_at)).toLocaleString() : "—")}>{row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : ""}</span> },
    { header: "snap", accessor: (row: DepositRow) => row.screenshot ? <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSnapDeposit(row); setSnapOpen(true); }} title="View screenshot"><Eye className="h-3 w-3" /></Button> : "—" },
    { header: "remarks", sortKey: "remarks", accessor: (row: DepositRow) => {
      const remarks = String(row.remarks ?? "").trim();
      return remarks ? <span className="cursor-pointer hover:underline text-primary max-w-[120px] truncate block" onClick={openCell("Remarks", remarks)} title={remarks}>{remarks}</span> : "—";
    } },
    {
      header: "amount",
      sortKey: "amount",
      accessor: (row: DepositRow) => (
        <TableBadge variant="amountGreen" onClick={() => openDepositEdit(row, "amount")}>
          ₹{Number(row.amount ?? 0).toLocaleString()}
        </TableBadge>
      ),
    },
    {
      header: "Actions",
      accessor: (row: DepositRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedDeposit(row); setViewOpen(true); }} title="View full details"><Eye className="h-3 w-3" /></Button>
          {String(row.status) === "pending" && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => { setSelectedDeposit(row); setPinOpen(true); }}><Check className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => { setSelectedDeposit(row); setRejectOpen(true); }}><X className="h-3 w-3" /></Button>
            </>
          )}
        </div>
      ),
    },
    {
      header: "Copy",
      accessor: (row: DepositRow) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Copy full deposit details"
          onClick={async (e) => {
            e.stopPropagation();
            const text = buildDepositRowCopyText(row);
            try {
              await navigator.clipboard.writeText(text);
              toast({ title: "Copied deposit details." });
            } catch {
              toast({ title: "Could not copy", variant: "destructive" });
            }
          }}
        >
          <ClipboardCopy className="h-3 w-3" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Deposits</h2>
      <ListDateRangeToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={({ dateFrom: f, dateTo: t }) => { setDateFrom(f); setDateTo(t); }}
        onLoad={() => refetch()}
        loading={isLoading}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search username / reference ID…"
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
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
      <DataTable data={rows} columns={columns} hideSearch variant="adminListing" />

      {/* Edit deposit (status / amount) */}
      <Dialog open={!!depositEdit} onOpenChange={(open) => { if (!open) setDepositEdit(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Edit — {depositEdit?.field === "status" ? "Status" : "Amount"}</DialogTitle>
            {depositEdit && <p className="text-xs text-muted-foreground">ID: {depositEdit.row.id}</p>}
          </DialogHeader>
          {depositEdit && (
            <div className="py-2">
              {depositEdit.field === "status" ? (
                <select
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  value={depositEditValue}
                  onChange={(e) => setDepositEditValue(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              ) : (
                <Input
                  type="number"
                  placeholder="Amount"
                  value={depositEditValue}
                  onChange={(e) => setDepositEditValue(e.target.value)}
                />
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositEdit(null)} disabled={depositEditSaving}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              disabled={depositEditSaving}
              onClick={async () => {
                if (!depositEdit?.row?.id) return;
                setDepositEditSaving(true);
                try {
                  const body = depositEdit.field === "status"
                    ? { status: depositEditValue }
                    : { amount: Number(depositEditValue) };
                  await updateDeposit(depositEdit.row.id, body, role);
                  queryClient.invalidateQueries({ queryKey: ["admin-deposits", role] });
                  setDepositEdit(null);
                  toast({ title: "Updated." });
                } catch (e: unknown) {
                  const msg = (e as { detail?: string })?.detail ?? "Update failed. Backend may not support PATCH for deposits yet.";
                  toast({ title: msg, variant: "destructive" });
                } finally {
                  setDepositEditSaving(false);
                }
              }}
            >
              {depositEditSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View-only cell modal */}
      <Dialog open={!!cellView} onOpenChange={(open) => { if (!open) setCellView(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-base">View — {cellView?.label}</DialogTitle></DialogHeader>
          {cellView && <div className="py-2 text-sm">{cellView.value}</div>}
          <DialogFooter><Button variant="outline" onClick={() => setCellView(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View screenshot only (from snap column) */}
      <Dialog open={snapOpen} onOpenChange={(open) => { setSnapOpen(open); if (!open) setSnapDeposit(null); }}>
        <DialogContent className="max-w-lg p-2">
          <DialogHeader><DialogTitle className="font-display text-sm">Payment screenshot</DialogTitle></DialogHeader>
          {snapDeposit?.screenshot && (
            <img src={getMediaUrl(String(snapDeposit.screenshot))} alt="Deposit screenshot" className="w-full max-h-[85vh] object-contain rounded-lg border border-border" />
          )}
          <DialogFooter><Button variant="outline" onClick={() => { setSnapOpen(false); setSnapDeposit(null); }}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Deposit – full report (from Actions) */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Deposit Details – Small Report</DialogTitle></DialogHeader>
          {selectedDeposit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground text-xs">Username</span><p className="font-medium">{String(selectedDeposit.user_username ?? selectedDeposit.username ?? "")}</p></div>
                    <div><span className="text-muted-foreground text-xs">Name</span><p className="font-medium">{String(selectedDeposit.user_name ?? "")}</p></div>
                    {(selectedDeposit.user_phone != null && String(selectedDeposit.user_phone) !== "") && <div className="col-span-2"><span className="text-muted-foreground text-xs">Phone</span><p className="font-medium">{String(selectedDeposit.user_phone)}</p></div>}
                    {(selectedDeposit.user_email != null && String(selectedDeposit.user_email) !== "") && <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium">{String(selectedDeposit.user_email)}</p></div>}
                    {(selectedDeposit.user_whatsapp_number != null && String(selectedDeposit.user_whatsapp_number) !== "") && <div><span className="text-muted-foreground text-xs">WhatsApp</span><p className="font-medium">{String(selectedDeposit.user_whatsapp_number)}</p></div>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground text-xs">ID</span><p className="font-medium">{String(selectedDeposit.id ?? "")}</p></div>
                  <div><span className="text-muted-foreground text-xs">Amount</span><p className="font-bold text-success">₹{Number(selectedDeposit.amount ?? 0).toLocaleString()}</p></div>
                  <div><span className="text-muted-foreground text-xs">Method</span><p className="font-medium">{String(selectedDeposit.payment_mode_name ?? selectedDeposit.payment_mode ?? "")}</p></div>
                  <div><span className="text-muted-foreground text-xs">Status</span><p><StatusBadge status={String(selectedDeposit.status ?? "pending")} /></p></div>
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Date</span><p className="font-medium">{selectedDeposit.created_at ? new Date(String(selectedDeposit.created_at)).toLocaleString() : ""}</p></div>
                  {(selectedDeposit.remarks != null && String(selectedDeposit.remarks).trim() !== "") && <div className="col-span-2"><span className="text-muted-foreground text-xs">Remarks</span><p className="font-medium whitespace-pre-wrap">{String(selectedDeposit.remarks)}</p></div>}
                  {(selectedDeposit.reference_id != null && String(selectedDeposit.reference_id).trim() !== "") && <div className="col-span-2"><span className="text-muted-foreground text-xs">Reference ID</span><p className="font-medium">{String(selectedDeposit.reference_id)}</p></div>}
                </div>
              </div>
              <div className="space-y-3">
                {selectedDeposit.payment_mode_qr_image && (
                  <div>
                    <span className="text-muted-foreground text-xs">Payment QR</span>
                    <img src={getMediaUrl(String(selectedDeposit.payment_mode_qr_image))} alt="Payment QR" className="w-32 h-32 object-contain rounded-lg mt-1 border border-border" />
                  </div>
                )}
                {selectedDeposit.screenshot && (
                  <div>
                    <span className="text-muted-foreground text-xs">Screenshot</span>
                    <img src={getMediaUrl(String(selectedDeposit.screenshot))} alt="Screenshot" className="w-full h-40 object-cover rounded-lg mt-1 border border-border" />
                  </div>
                )}
                {selectedDeposit.payment_mode_detail && (
                  <div className="border-t pt-3 mt-3 md:border-t-0 md:pt-0 md:mt-0">
                    {(() => {
                      const pmId = selectedDeposit.payment_mode_detail?.payment_method != null ? Number(selectedDeposit.payment_mode_detail.payment_method) : null;
                      const pmImageUrl = pmId != null ? paymentMethodImageMap[pmId] : null;
                      return (
                        <div className="flex items-center gap-2 mb-2">
                          {pmImageUrl && (
                            <img src={getMediaUrl(pmImageUrl)} alt="" className="h-8 w-auto max-w-14 object-contain rounded border border-border" />
                          )}
                        </div>
                      );
                    })()}
                    <PaymentDetailsPanel
                      methodName={String(selectedDeposit.payment_mode_detail.payment_method_name ?? selectedDeposit.payment_mode_name ?? "")}
                      details={
                        selectedDeposit.payment_mode_detail.details != null && typeof selectedDeposit.payment_mode_detail.details === "object"
                          ? (selectedDeposit.payment_mode_detail.details as Record<string, unknown>)
                          : undefined
                      }
                      qrUrl={selectedDeposit.payment_mode_detail.qr_image_url ? String(selectedDeposit.payment_mode_detail.qr_image_url) : null}
                      showQrImage
                    />
                  </div>
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
          <DialogHeader><DialogTitle className="font-display">Reject Deposit</DialogTitle></DialogHeader>
          <Textarea placeholder="Rejection reason..." rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <RejectReasonSuggestionsRow suggestions={rejectChips} onSelect={(text) => setRejectReason(text)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              className="bg-accent text-accent-foreground"
              onClick={async () => {
                if (!selectedDeposit?.id) return;
                try {
                  await rejectDeposit(selectedDeposit.id, { reject_reason: rejectReason }, role);
                  queryClient.invalidateQueries({ queryKey: ["admin-deposits", role] });
                  setRejectOpen(false);
                  setRejectReason("");
                  toast({ title: "Deposit rejected." });
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
          if (!selectedDeposit?.id) return;
          try {
            await approveDeposit(selectedDeposit.id, { pin }, role);
            queryClient.invalidateQueries({ queryKey: ["admin-deposits", role] });
            setPinOpen(false);
            toast({ title: "Deposit approved." });
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

export default AdminDeposits;
