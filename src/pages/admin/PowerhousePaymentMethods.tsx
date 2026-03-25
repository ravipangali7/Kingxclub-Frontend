import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  getPaymentMethods,
  createPaymentMethod,
  createPaymentMethodForm,
  updatePaymentMethod,
  updatePaymentMethodForm,
  deletePaymentMethod,
  type PaymentMethodAdmin,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/lib/api";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface FieldEntry {
  key: string;
  value: string;
}

function parseFields(raw: Record<string, unknown>): FieldEntry[] {
  return Object.entries(raw ?? {}).map(([key, value]) => ({ key, value: String(value ?? "") }));
}

function fieldsToObject(entries: FieldEntry[]): Record<string, string> {
  const obj: Record<string, string> = {};
  entries.forEach(({ key, value }) => {
    if (key.trim()) obj[key.trim()] = value;
  });
  return obj;
}

const PowerhousePaymentMethods = () => {
  const queryClient = useQueryClient();
  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: getPaymentMethods,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentMethodAdmin | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [fieldEntries, setFieldEntries] = useState<FieldEntry[]>([]);

  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetForm = () => {
    setName("");
    setOrder(0);
    setIsActive(true);
    setImageFile(null);
    setImagePreviewUrl(null);
    setFieldEntries([]);
    setEditingItem(null);
  };

  const openEdit = (item: PaymentMethodAdmin) => {
    setEditingItem(item);
    setName(item.name);
    setOrder(item.order);
    setIsActive(item.is_active);
    setImageFile(null);
    setImagePreviewUrl(null);
    setFieldEntries(parseFields(item.fields ?? {}));
    setEditOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const fieldsObj = fieldsToObject(fieldEntries);
      if (imageFile) {
        const fd = new FormData();
        fd.set("name", name.trim());
        fd.set("order", String(order));
        fd.set("is_active", String(isActive));
        fd.set("fields", JSON.stringify(fieldsObj));
        fd.set("image", imageFile);
        await createPaymentMethodForm(fd);
      } else {
        await createPaymentMethod({ name: name.trim(), order, is_active: isActive, fields: fieldsObj });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["publicPaymentMethods"] });
      toast({ title: "Payment method created." });
      setCreateOpen(false);
      resetForm();
    } catch {
      toast({ title: "Failed to create payment method", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const fieldsObj = fieldsToObject(fieldEntries);
      if (imageFile) {
        const fd = new FormData();
        fd.set("name", name.trim());
        fd.set("order", String(order));
        fd.set("is_active", String(isActive));
        fd.set("fields", JSON.stringify(fieldsObj));
        fd.set("image", imageFile);
        await updatePaymentMethodForm(editingItem.id, fd);
      } else {
        await updatePaymentMethod(editingItem.id, { name: name.trim(), order, is_active: isActive, fields: fieldsObj });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["publicPaymentMethods"] });
      toast({ title: "Payment method updated." });
      setEditOpen(false);
      resetForm();
    } catch {
      toast({ title: "Failed to update payment method", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this payment method?")) return;
    try {
      await deletePaymentMethod(id);
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["publicPaymentMethods"] });
      toast({ title: "Deleted." });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const addFieldEntry = () => setFieldEntries((f) => [...f, { key: "", value: "" }]);
  const updateFieldEntry = (i: number, field: "key" | "value", val: string) =>
    setFieldEntries((f) => f.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const removeFieldEntry = (i: number) => setFieldEntries((f) => f.filter((_, idx) => idx !== i));

  /* Form content inlined (not a nested component) so inputs keep focus while typing — see https://react.dev/learn/preserving-and-resetting-state */
  const formContent = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Name <span className="text-destructive">*</span></label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Esewa, Khalti, eSewa" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Order</label>
          <Input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="pm-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="pm-active" className="text-sm font-medium">Active</label>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Image</label>
        <input
          type="file"
          accept="image/*"
          className="w-full text-sm file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-sm"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
        {imagePreviewUrl && (
          <div className="mt-2 rounded-lg border overflow-hidden bg-muted/30 w-24 h-16">
            <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-fill" />
          </div>
        )}
        {!imagePreviewUrl && editingItem?.image_url && (
          <div className="mt-2 rounded-lg border overflow-hidden bg-muted/30 w-24 h-16">
            <img src={getMediaUrl(editingItem.image_url)} alt={editingItem.name} className="w-full h-full object-fill" />
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Extra fields (JSON)</label>
          <Button type="button" size="sm" variant="outline" onClick={addFieldEntry}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add field
          </Button>
        </div>
        {fieldEntries.length === 0 && (
          <p className="text-xs text-muted-foreground">No extra fields. These are stored as JSON and can hold any metadata (e.g. link, type).</p>
        )}
        <div className="space-y-2">
          {fieldEntries.map((entry, i) => (
            <div key={i} className="flex gap-2 items-center">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Key"
                value={entry.key}
                onChange={(e) => updateFieldEntry(i, "key", e.target.value)}
                className="w-32"
              />
              <Input
                placeholder="Value"
                value={entry.value}
                onChange={(e) => updateFieldEntry(i, "value", e.target.value)}
                className="flex-1"
              />
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeFieldEntry(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight">Payment Methods</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Site-level accepted payment methods shown on the home page and footer.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add method
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && methods.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">No payment methods yet. Add one to show on the home page.</p>
          </CardContent>
        </Card>
      )}

      {methods.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">All methods ({methods.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {methods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center gap-4 rounded-lg border p-3 bg-muted/20"
                >
                  <div className="w-14 h-10 rounded border bg-muted/30 overflow-hidden shrink-0 flex items-center justify-center">
                    {pm.image_url ? (
                      <img src={getMediaUrl(pm.image_url)} alt={pm.name} className="w-full h-full object-fill" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No img</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{pm.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Order: {pm.order} · {pm.is_active ? "Active" : "Inactive"}
                      {Object.keys(pm.fields ?? {}).length > 0 && (
                        <> · {Object.keys(pm.fields).length} extra field(s)</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => openEdit(pm)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => handleDelete(pm.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add payment method</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Edit payment method</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PowerhousePaymentMethods;
