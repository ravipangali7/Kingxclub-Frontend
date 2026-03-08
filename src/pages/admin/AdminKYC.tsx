import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getKycList, approveKyc, rejectKyc } from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye } from "lucide-react";

type KycRow = Record<string, unknown> & { id?: number; user_username?: string; document_url?: string | null; status?: string; created_at?: string };

const AdminKYC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const { data: kycRequests = [] } = useQuery({ queryKey: ["admin-kyc", role], queryFn: () => getKycList(role) });
  const rows = kycRequests as KycRow[];
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<KycRow | null>(null);

  const columns = [
    { header: "User", accessor: (row: KycRow) => String(row.user_username ?? row.username ?? "") },
    {
      header: "Document",
      accessor: (row: KycRow) =>
        row.document_url ? (
          <a href={String(row.document_url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View</a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    { header: "Status", accessor: (row: KycRow) => <StatusBadge status={String(row.status ?? "pending")} /> },
    { header: "Submitted", accessor: (row: KycRow) => row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : "" },
    {
      header: "Actions",
      accessor: (row: KycRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedKyc(row); setViewOpen(true); }}><Eye className="h-3 w-3" /></Button>
          {String(row.status) === "pending" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-success"
                disabled={approvingId === row.id}
                onClick={async () => {
                  if (row.id == null) return;
                  setApprovingId(row.id);
                  try {
                    await approveKyc(row.id, role);
                    queryClient.invalidateQueries({ queryKey: ["admin-kyc", role] });
                    toast({ title: "KYC approved." });
                  } catch (e: unknown) {
                    const err = e as { detail?: string };
                    toast({ title: err?.detail ?? "Failed to approve.", variant: "destructive" });
                  } finally {
                    setApprovingId(null);
                  }
                }}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => { setSelectedKyc(row); setRejectReason(""); setRejectOpen(true); }}><X className="h-3 w-3" /></Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">KYC Management</h2>
      <DataTable data={rows} columns={columns} searchKey="user_username" searchPlaceholder="Search KYC requests..." />

      {/* View KYC */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">KYC Document</DialogTitle></DialogHeader>
          {selectedKyc && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground text-xs">User</span><p className="font-medium">{String(selectedKyc.user_username ?? selectedKyc.username ?? "")}</p></div>
                <div><span className="text-muted-foreground text-xs">Status</span><p><StatusBadge status={String(selectedKyc.status ?? "pending")} /></p></div>
                <div><span className="text-muted-foreground text-xs">Date</span><p className="font-medium">{selectedKyc.created_at ? new Date(String(selectedKyc.created_at)).toLocaleDateString() : ""}</p></div>
              </div>
              {selectedKyc.document_url ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Document</p>
                  <img src={String(selectedKyc.document_url)} alt="KYC document" className="w-full max-h-64 object-contain rounded-lg border border-border bg-muted/30" />
                  <a href={String(selectedKyc.document_url)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">Open in new tab</a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No document uploaded.</p>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject KYC */}
      <Dialog open={rejectOpen} onOpenChange={(open) => { setRejectOpen(open); if (!open) setRejectReason(""); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Reject KYC — {String(selectedKyc?.user_username ?? selectedKyc?.username ?? "")}</DialogTitle></DialogHeader>
          <Textarea placeholder="Rejection reason..." rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              className="bg-accent text-accent-foreground"
              disabled={rejectingId != null}
              onClick={async () => {
                if (selectedKyc?.id == null) return;
                setRejectingId(selectedKyc.id);
                try {
                  await rejectKyc(selectedKyc.id, { reason: rejectReason }, role);
                  queryClient.invalidateQueries({ queryKey: ["admin-kyc", role] });
                  setRejectOpen(false);
                  setRejectReason("");
                  toast({ title: "KYC rejected." });
                } catch (e: unknown) {
                  const err = e as { detail?: string };
                  toast({ title: err?.detail ?? "Failed to reject.", variant: "destructive" });
                } finally {
                  setRejectingId(null);
                }
              }}
            >
              {rejectingId != null ? "Rejecting…" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKYC;
