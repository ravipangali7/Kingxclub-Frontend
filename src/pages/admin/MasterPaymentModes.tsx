import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getMasterPaymentModes,
  createMasterPaymentMode,
  createMasterPaymentModeFormData,
  updateMasterPaymentMode,
  updateMasterPaymentModeFormData,
  deleteMasterPaymentMode,
} from "@/api/admin";
import { getPublicPaymentMethods, type PublicPaymentMethod } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Upload } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PinDialog } from "@/components/shared/PinDialog";

type PaymentModeRow = Record<string, unknown> & {
  id?: number;
  payment_method?: number;
  payment_method_name?: string;
  name?: string;
  details?: Record<string, string>;
  status?: string;
  qr_image_url?: string;
};

function detailsSummary(details: Record<string, unknown> | null | undefined): string {
  if (!details || typeof details !== "object") return "";
  const vals = Object.values(details).filter((v) => v != null && String(v).trim() !== "");
  if (vals.length === 0) return "";
  const s = String(vals[0]).trim();
  if (s.length <= 4) return "****";
  return "****" + s.slice(-4);
}

const MasterPaymentModes = () => {
  const queryClient = useQueryClient();
  const { data: modes = [] } = useQuery({ queryKey: ["master-payment-modes"], queryFn: getMasterPaymentModes });
  const { data: paymentMethodsList = [] } = useQuery({ queryKey: ["public-payment-methods"], queryFn: getPublicPaymentMethods });
  const methods = paymentMethodsList as PublicPaymentMethod[];
  const rows = modes as PaymentModeRow[];
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PaymentModeRow | null>(null);
  const [formMethodId, setFormMethodId] = useState<number | "">("");
  const [formDetails, setFormDetails] = useState<Record<string, string>>({});
  const [formQrFile, setFormQrFile] = useState<File | null>(null);
  const [formQrPreview, setFormQrPreview] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    id: number;
    formMethodId: number | "";
    formDetails: Record<string, string>;
    formQrFile: File | null;
  } | null>(null);

  const selectedMethod = formMethodId ? methods.find((m) => m.id === formMethodId) : null;
  const fieldEntries = selectedMethod?.fields ? Object.entries(selectedMethod.fields) : [];

  const resetForm = () => {
    setFormMethodId("");
    setFormDetails({});
    setFormQrFile(null);
    setFormQrPreview(null);
    setSelected(null);
  };

  const openEdit = (row: PaymentModeRow) => {
    setSelected(row);
    setFormMethodId((row.payment_method as number) ?? "");
    setFormDetails((row.details as Record<string, string>) ?? {});
    setFormQrFile(null);
    setFormQrPreview(row.qr_image_url ? getMediaUrl(String(row.qr_image_url)) : null);
    setEditOpen(true);
  };

  const displayName = (row: PaymentModeRow) => (row.payment_method_name as string) ?? "—";
  const displayDetail = (row: PaymentModeRow) => detailsSummary(row.details as Record<string, unknown>) || "—";

  const buildBody = (forCreate: boolean) => {
    const body: Record<string, unknown> = {
      payment_method: formMethodId,
      details: { ...formDetails },
    };
    if (forCreate) body.status = "approved";
    return body;
  };

  const buildFormData = (forCreate: boolean) => {
    const formData = new FormData();
    formData.append("payment_method", String(formMethodId));
    formData.append("details", JSON.stringify({ ...formDetails }));
    if (forCreate) formData.append("status", "approved");
    if (formQrFile) formData.append("qr_image", formQrFile);
    return formData;
  };

  const columns = [
    { header: "Name", accessor: (row: PaymentModeRow) => displayName(row) },
    { header: "Details", accessor: (row: PaymentModeRow) => displayDetail(row) },
    { header: "Status", accessor: (row: PaymentModeRow) => <StatusBadge status={String(row.status ?? "pending")} /> },
    {
      header: "Actions",
      accessor: (row: PaymentModeRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(row)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            title="Delete"
            onClick={async () => {
              if (!row.id || !confirm("Delete this payment method?")) return;
              try {
                await deleteMasterPaymentMode(row.id);
                queryClient.invalidateQueries({ queryKey: ["master-payment-modes"] });
                toast({ title: "Payment method deleted." });
              } catch (e: unknown) {
                toast({ title: (e as { detail?: string })?.detail ?? "Failed to delete.", variant: "destructive" });
              }
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Payment Methods</h2>
      <p className="text-sm text-muted-foreground">Manage payment methods your players use to deposit. New methods start as Approved for your own account.</p>
      <DataTable
        data={rows}
        columns={columns}
        searchKey="payment_method_name"
        searchPlaceholder="Search payment methods..."
        onAdd={() => {
          resetForm();
          setCreateOpen(true);
        }}
        addLabel="Add Payment Method"
        variant="adminListing"
      />

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Add Payment Method</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Payment method</label>
              <select
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm mt-1"
                value={formMethodId}
                onChange={(e) => {
                  setFormMethodId(e.target.value === "" ? "" : Number(e.target.value));
                  setFormDetails({});
                }}
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
                      <label className="text-xs text-muted-foreground block">
                        {displayLabel}
                        <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/80">({key})</span>
                      </label>
                      <Input
                        className="mt-1"
                        placeholder={displayLabel}
                        value={formDetails[key] ?? ""}
                        onChange={(e) => setFormDetails((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Upload className="h-3 w-3" /> QR Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm mt-1 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFormQrFile(f ?? null);
                  setFormQrPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              {formQrPreview && <img src={formQrPreview} alt="QR preview" className="mt-2 h-24 w-24 object-contain border rounded" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={async () => {
                if (!formMethodId) {
                  toast({ title: "Select a payment method", variant: "destructive" });
                  return;
                }
                try {
                  if (formQrFile) {
                    await createMasterPaymentModeFormData(buildFormData(true));
                  } else {
                    await createMasterPaymentMode(buildBody(true));
                  }
                  queryClient.invalidateQueries({ queryKey: ["master-payment-modes"] });
                  toast({ title: "Payment method added." });
                  setCreateOpen(false);
                  resetForm();
                } catch (e: unknown) {
                  toast({ title: (e as { detail?: string })?.detail ?? "Failed to add.", variant: "destructive" });
                }
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Edit Payment Method</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Payment method</label>
              <select
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm mt-1"
                value={formMethodId}
                onChange={(e) => {
                  const id = e.target.value === "" ? "" : Number(e.target.value);
                  setFormMethodId(id);
                  const m = id ? methods.find((x) => x.id === id) : null;
                  setFormDetails(m?.fields ? Object.fromEntries(Object.keys(m.fields).map((k) => [k, formDetails[k] ?? ""])) : {});
                }}
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
                      <label className="text-xs text-muted-foreground block">
                        {displayLabel}
                        <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/80">({key})</span>
                      </label>
                      <Input
                        className="mt-1"
                        placeholder={displayLabel}
                        value={formDetails[key] ?? ""}
                        onChange={(e) => setFormDetails((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Upload className="h-3 w-3" /> QR Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm mt-1 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFormQrFile(f ?? null);
                  setFormQrPreview(f ? URL.createObjectURL(f) : (selected?.qr_image_url ? getMediaUrl(String(selected.qr_image_url)) : null));
                }}
              />
              {(formQrPreview || (selected?.qr_image_url && !formQrFile)) && (
                <img src={formQrPreview || (selected?.qr_image_url ? getMediaUrl(String(selected.qr_image_url)) : "")} alt="QR preview" className="mt-2 h-24 w-24 object-contain border rounded" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                if (!selected?.id) return;
                setPendingUpdate({
                  id: selected.id,
                  formMethodId,
                  formDetails: { ...formDetails },
                  formQrFile,
                });
                setEditOpen(false);
                setPinOpen(true);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinDialog
        open={pinOpen}
        onClose={() => { setPinOpen(false); setPendingUpdate(null); resetForm(); }}
        onConfirm={async (pin) => {
          if (!pendingUpdate) return;
          try {
            const { id, formMethodId: fid, formDetails: fdet, formQrFile: fqr } = pendingUpdate;
            if (fqr) {
              const fd = new FormData();
              fd.append("payment_method", String(fid));
              fd.append("details", JSON.stringify(fdet));
              fd.append("pin", pin);
              fd.append("qr_image", fqr);
              await updateMasterPaymentModeFormData(id, fd);
            } else {
              await updateMasterPaymentMode(id, { payment_method: fid, details: fdet, pin });
            }
            queryClient.invalidateQueries({ queryKey: ["master-payment-modes"] });
            toast({ title: "Updated." });
            setPendingUpdate(null);
            setPinOpen(false);
            resetForm();
          } catch (e) {
            toast({ title: (e as { detail?: string })?.detail ?? "Failed to update", variant: "destructive" });
          }
        }}
        title="Enter PIN to confirm"
      />
    </div>
  );
};

export default MasterPaymentModes;
