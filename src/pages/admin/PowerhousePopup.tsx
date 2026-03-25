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
  getPopups,
  createPopup,
  createPopupForm,
  updatePopup,
  updatePopupForm,
  deletePopup,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export interface PopupRow {
  id: number;
  title: string;
  content?: string;
  image?: string | null;
  cta_label: string;
  cta_link: string;
  is_active: boolean;
  order: number;
}

const PowerhousePopup = () => {
  const queryClient = useQueryClient();
  const { data: popupsApi = [] } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: getPopups,
  });
  const popups = (popupsApi as PopupRow[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ctaLabel, setCtaLabel] = useState("OK");
  const [ctaLink, setCtaLink] = useState("#");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PopupRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [popupToDelete, setPopupToDelete] = useState<PopupRow | null>(null);
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
    setContent("");
    setCtaLabel("OK");
    setCtaLink("#");
    setIsActive(true);
    setOrder(popups.length);
    setImageFile(null);
    setEditingPopup(null);
  };

  const openEdit = (row: PopupRow) => {
    setEditingPopup(row);
    setTitle(row.title ?? "");
    setContent(row.content ?? "");
    setCtaLabel(row.cta_label ?? "OK");
    setCtaLink(row.cta_link ?? "#");
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
        formData.append("content", content.trim());
        formData.append("cta_label", ctaLabel.trim() || "OK");
        formData.append("cta_link", ctaLink.trim() || "#");
        formData.append("is_active", String(isActive));
        formData.append("order", String(popups.length));
        formData.append("image_file", imageFile);
        await createPopupForm(formData);
      } else {
        await createPopup({
          title: t,
          content: content.trim() || undefined,
          cta_label: ctaLabel.trim() || "OK",
          cta_link: ctaLink.trim() || "#",
          is_active: isActive,
          order: popups.length,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      toast({ title: "Popup created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create popup";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPopup?.id) return;
    const t = title.trim();
    if (!t) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const id = editingPopup.id;
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("title", t);
        formData.append("content", content.trim());
        formData.append("cta_label", ctaLabel.trim() || "OK");
        formData.append("cta_link", ctaLink.trim() || "#");
        formData.append("is_active", String(isActive));
        formData.append("order", String(order));
        formData.append("image_file", imageFile);
        await updatePopupForm(id, formData);
      } else {
        await updatePopup(id, {
          title: t,
          content: content.trim(),
          cta_label: ctaLabel.trim() || "OK",
          cta_link: ctaLink.trim() || "#",
          is_active: isActive,
          order,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      toast({ title: "Popup updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update popup";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (row: PopupRow) => {
    setPopupToDelete(row);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!popupToDelete?.id) return;
    setDeleting(true);
    try {
      await deletePopup(popupToDelete.id);
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      toast({ title: "Popup deleted." });
      setDeleteOpen(false);
      setPopupToDelete(null);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to delete popup";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const tableData = popups.map((p) => ({ ...p, id: String(p.id) })) as (PopupRow & { id: string })[];
  const columns = [
    { header: "Order", accessor: (row: PopupRow & { id: string }) => row.order },
    {
      header: "Image",
      accessor: (row: PopupRow & { id: string }) =>
        row.image ? (
          <img src={row.image} alt="" className="h-10 w-16 object-fill rounded border border-border" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    { header: "Title", accessor: (row: PopupRow & { id: string }) => String(row.title ?? "").slice(0, 40) },
    { header: "Active", accessor: (row: PopupRow & { id: string }) => (row.is_active ? "Yes" : "No") },
    {
      header: "Actions",
      accessor: (row: PopupRow & { id: string }) => (
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
        <Label className="text-xs">Content (optional)</Label>
        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
      <div>
        <Label className="text-xs">CTA Label</Label>
        <Input placeholder="CTA Label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">CTA Link</Label>
        <Input placeholder="CTA Link" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="popup-is-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-input"
        />
        <Label htmlFor="popup-is-active" className="text-xs">Active</Label>
      </div>
      <div>
        <Label className="text-xs">Order</Label>
        <Input type="number" placeholder="Order" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Popups</h2>
      <p className="text-sm text-muted-foreground">Manage site popups / modals. Title, content, image, CTA, and active state.</p>
      <DataTable
        data={tableData}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Search by title..."
        onAdd={() => {
          resetForm();
          setOrder(popups.length);
          setCreateOpen(true);
        }}
        addLabel="Add Popup"
        pageSize={10}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Popup</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {formFields}
            {imagePreviewUrl && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30 w-32 h-20">
                <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-fill" />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Popup</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {formFields}
            {(imagePreviewUrl || (editingPopup?.image && editingPopup.image.trim())) && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30 w-32 h-20">
                <img
                  src={imagePreviewUrl ?? editingPopup?.image ?? ""}
                  alt="Preview"
                  className="w-full h-full object-fill"
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
            <AlertDialogTitle>Delete popup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{popupToDelete?.title ?? ""}&quot;. This action cannot be undone.
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

export default PowerhousePopup;
