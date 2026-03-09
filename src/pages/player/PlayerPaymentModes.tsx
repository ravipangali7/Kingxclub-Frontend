import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPaymentModes, createPaymentMode, createPaymentModeFormData, deletePaymentMode } from "@/api/player";
import { getPublicPaymentMethods, type PublicPaymentMethod } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Plus, Trash2, CreditCard, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

function detailsSummary(details: Record<string, unknown> | null | undefined): string {
  if (!details || typeof details !== "object") return "";
  const vals = Object.values(details).filter((v) => v != null && String(v).trim() !== "");
  if (vals.length === 0) return "";
  const s = String(vals[0]).trim();
  if (s.length <= 4) return "••••";
  return "****" + s.slice(-4);
}

const PlayerPaymentModes = () => {
  const queryClient = useQueryClient();
  const { data: paymentModes = [] } = useQuery({ queryKey: ["player-payment-modes"], queryFn: getPaymentModes });
  const { data: paymentMethodsList = [] } = useQuery({ queryKey: ["public-payment-methods"], queryFn: getPublicPaymentMethods });
  const methods = paymentMethodsList as PublicPaymentMethod[];
  const modes = paymentModes as Record<string, unknown>[];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<number | "">("");
  const [details, setDetails] = useState<Record<string, string>>({});

  const selectedMethod = selectedMethodId ? methods.find((m) => m.id === selectedMethodId) : null;
  const fieldEntries = selectedMethod?.fields ? Object.entries(selectedMethod.fields) : [];

  const buildBody = () => ({
    payment_method: selectedMethodId,
    details: { ...details },
  });

  const buildFormData = (): FormData => {
    const formData = new FormData();
    formData.append("payment_method", String(selectedMethodId));
    formData.append("details", JSON.stringify({ ...details }));
    if (qrFile) formData.append("qr_image", qrFile);
    return formData;
  };

  const resetAddForm = () => {
    setSelectedMethodId("");
    setDetails({});
    setQrFile(null);
    if (qrPreview) URL.revokeObjectURL(qrPreview);
    setQrPreview(null);
  };

  const handleAdd = async () => {
    if (!selectedMethodId) {
      toast({ title: "Select a payment method", variant: "destructive" });
      return;
    }
    const requiredKeys = selectedMethod?.fields ? Object.keys(selectedMethod.fields) : [];
    for (const key of requiredKeys) {
      if (!String(details[key] ?? "").trim()) {
        const label = selectedMethod?.fields?.[key] ?? key;
        toast({ title: `Enter ${label}`, variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    try {
      if (qrFile) {
        await createPaymentModeFormData(buildFormData());
      } else {
        await createPaymentMode(buildBody());
      }
      queryClient.invalidateQueries({ queryKey: ["player-payment-modes"] });
      toast({ title: "Payment method added." });
      setDialogOpen(false);
      resetAddForm();
    } catch (e: unknown) {
      const err = e as { detail?: string };
      toast({ title: err?.detail ?? "Failed to add.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await deletePaymentMode(id);
      queryClient.invalidateQueries({ queryKey: ["player-payment-modes"] });
      setDeleteId(null);
      toast({ title: "Payment method removed." });
    } catch (e: unknown) {
      const err = e as { detail?: string };
      toast({ title: err?.detail ?? "Failed to delete.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = (pm: Record<string, unknown>) =>
    (pm.payment_method_name as string) ?? "Payment method";
  const displayDetail = (pm: Record<string, unknown>) =>
    detailsSummary(pm.details as Record<string, unknown>) || "—";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-gaming font-bold text-xl neon-text tracking-wider">PAYMENT MODES</h2>
        <Button size="sm" className="gold-gradient text-primary-foreground gap-1 font-gaming tracking-wider" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3" /> ADD
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Pending methods are not available for withdrawal until your master approves them.</p>

      <div className="space-y-2">
        {modes.map((pm) => (
          <Card key={String(pm.id ?? "")} className="theme-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{displayName(pm)}</p>
                  <p className="text-xs text-muted-foreground">{displayDetail(pm)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={String(pm.status ?? "pending")} />
                    {pm.status === "pending" && (
                      <span className="text-[10px] text-muted-foreground">Not available for withdrawal until approved by your master.</span>
                    )}
                  </div>
                </div>
                {pm.qr_image_url && (
                  <img src={getMediaUrl(String(pm.qr_image_url))} alt="QR" className="w-12 h-12 object-contain rounded border border-border flex-shrink-0" />
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={submitting} onClick={() => setDeleteId(Number(pm.id))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {modes.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">No payment modes added yet</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetAddForm(); }}>
        <DialogContent className="max-w-sm theme-card">
          <DialogHeader>
            <DialogTitle className="font-gaming neon-text tracking-wider">ADD PAYMENT MODE</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Payment method</label>
              <select
                value={selectedMethodId}
                onChange={(e) => {
                  const id = e.target.value === "" ? "" : Number(e.target.value);
                  setSelectedMethodId(id);
                  setDetails({});
                }}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">Select method</option>
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {selectedMethod?.image_url && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={getMediaUrl(selectedMethod.image_url)} alt={selectedMethod.name} className="h-8 w-auto max-w-16 object-contain rounded border border-border" />
                  <span className="text-xs text-muted-foreground">{selectedMethod.name}</span>
                </div>
              )}
            </div>
            {fieldEntries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Details (keys from selected payment method)</p>
                {fieldEntries.map(([key, label]) => {
                  const displayLabel = typeof label === "string" ? label : key.replace(/_/g, " ");
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-muted-foreground font-medium block">
                        {displayLabel}
                        <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/80">({key})</span>
                      </label>
                      <Input
                        placeholder={displayLabel}
                        value={details[key] ?? ""}
                        onChange={(e) => setDetails((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block flex items-center gap-1">
                <Upload className="h-3 w-3" /> QR image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm mt-1 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (qrPreview) URL.revokeObjectURL(qrPreview);
                  setQrFile(f ?? null);
                  setQrPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              {qrPreview && (
                <img src={qrPreview} alt="QR preview" className="mt-2 h-24 w-24 object-contain border rounded border-border" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button className="gold-gradient text-primary-foreground font-gaming" onClick={handleAdd} disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId != null} onOpenChange={() => { if (!submitting) setDeleteId(null); }}>
        <DialogContent className="max-w-sm theme-card">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Payment Mode?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={submitting}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId != null && handleDelete(deleteId)} disabled={submitting}>{submitting ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerPaymentModes;
