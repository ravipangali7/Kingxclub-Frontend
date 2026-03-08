import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  getPromotionsAdmin,
  createPromotion,
  createPromotionForm,
  updatePromotion,
  updatePromotionForm,
  deletePromotion,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export interface PromotionRow {
  id: number;
  title: string;
  description?: string;
  image?: string | null;
  image_url?: string | null;
  is_active: boolean;
  order: number;
}

const PowerhousePromotions = () => {
  const queryClient = useQueryClient();
  const { data: promotionsApi = [] } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: getPromotionsAdmin,
  });
  const promotions = (promotionsApi as PromotionRow[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<PromotionRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIsActive(true);
    setOrder(promotions.length);
    setImageFile(null);
    setEditingPromotion(null);
  };

  const openEdit = (row: PromotionRow) => {
    setEditingPromotion(row);
    setTitle(row.title ?? "");
    setDescription(row.description ?? "");
    setIsActive(row.is_active ?? true);
    setOrder(row.order ?? 0);
    setImageFile(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    const t = title.trim();
    if (!t) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("title", t);
        formData.append("description", description.trim());
        formData.append("is_active", String(isActive));
        formData.append("order", String(promotions.length));
        formData.append("image", imageFile);
        await createPromotionForm(formData);
      } else {
        await createPromotion({
          title: t,
          description: description.trim() || undefined,
          is_active: isActive,
          order: promotions.length,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: "Promotion created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create promotion";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPromotion?.id) return;
    const t = title.trim();
    if (!t) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const id = editingPromotion.id;
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("title", t);
        formData.append("description", description.trim());
        formData.append("is_active", String(isActive));
        formData.append("order", String(order));
        formData.append("image", imageFile);
        await updatePromotionForm(id, formData);
      } else {
        await updatePromotion(id, {
          title: t,
          description: description.trim(),
          is_active: isActive,
          order,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: "Promotion updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update promotion";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (row: PromotionRow) => {
    setPromotionToDelete(row);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete?.id) return;
    setDeleting(true);
    try {
      await deletePromotion(promotionToDelete.id);
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: "Promotion deleted." });
      setDeleteOpen(false);
      setPromotionToDelete(null);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to delete promotion";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const tableData = promotions.map((p) => ({ ...p, id: String(p.id) })) as (PromotionRow & { id: string })[];
  const imageUrl = (row: PromotionRow & { id: string }) => row.image_url ?? row.image ?? null;
  const columns = [
    { header: "Order", accessor: (row: PromotionRow & { id: string }) => row.order },
    {
      header: "Image",
      accessor: (row: PromotionRow & { id: string }) => {
        const url = imageUrl(row);
        return url ? (
          <img src={url} alt="" className="h-10 w-16 object-cover rounded border border-border" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    { header: "Title", accessor: (row: PromotionRow & { id: string }) => String(row.title ?? "").slice(0, 40) },
    { header: "Active", accessor: (row: PromotionRow & { id: string }) => (row.is_active ? "Yes" : "No") },
    {
      header: "Actions",
      accessor: (row: PromotionRow & { id: string }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:text-destructive"
            onClick={() => handleDeleteClick(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const formFields = (
    <>
      <div>
        <Label className="text-xs">Title</Label>
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Promotion description..."
          minHeight="140px"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Image (optional)</Label>
        <input
          type="file"
          accept="image/*"
          className="w-full text-sm file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-sm"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="promo-is-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-input"
        />
        <Label htmlFor="promo-is-active" className="text-xs">Active</Label>
      </div>
      <div>
        <Label className="text-xs">Order</Label>
        <Input type="number" placeholder="Order" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Promotions</h2>
      <p className="text-sm text-muted-foreground">Manage promotional offers shown on the public promotions page. Title, image, description (HTML), and active state.</p>
      <DataTable
        data={tableData}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Search by title..."
        onAdd={() => {
          resetForm();
          setOrder(promotions.length);
          setCreateOpen(true);
        }}
        addLabel="Add Promotion"
        pageSize={10}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Add Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {formFields}
            {imagePreviewUrl && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30 w-32 h-20">
                <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="gold-gradient text-primary-foreground" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {formFields}
            {(imagePreviewUrl || (editingPromotion && imageUrl(editingPromotion as PromotionRow & { id: string }))) && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30 w-32 h-20">
                <img
                  src={imagePreviewUrl ?? imageUrl(editingPromotion as PromotionRow & { id: string }) ?? ""}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="gold-gradient text-primary-foreground" onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{promotionToDelete?.title ?? ""}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PowerhousePromotions;
