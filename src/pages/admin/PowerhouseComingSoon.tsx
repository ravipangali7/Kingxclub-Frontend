import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  getComingSoonAdmin,
  createComingSoon,
  createComingSoonForm,
  updateComingSoon,
  updateComingSoonForm,
  deleteComingSoon,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export interface ComingSoonRow {
  id: number;
  name: string;
  description?: string;
  image?: string | null;
  image_url?: string | null;
  coming_date?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const PowerhouseComingSoon = () => {
  const queryClient = useQueryClient();
  const { data: listApi = [] } = useQuery({
    queryKey: ["admin-coming-soon"],
    queryFn: getComingSoonAdmin,
  });
  const items = (listApi as ComingSoonRow[]).sort((a, b) => {
    const da = a.coming_date || "";
    const db = b.coming_date || "";
    return da.localeCompare(db) || (a.id - b.id);
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [comingDate, setComingDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComingSoonRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ComingSoonRow | null>(null);
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
    setName("");
    setDescription("");
    setComingDate("");
    setIsActive(true);
    setImageFile(null);
    setEditingItem(null);
  };

  const openEdit = (row: ComingSoonRow) => {
    setEditingItem(row);
    setName(row.name ?? "");
    setDescription(row.description ?? "");
    setComingDate(row.coming_date ?? "");
    setIsActive(row.is_active ?? true);
    setImageFile(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    const n = name.trim();
    if (!n) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("name", n);
        formData.append("description", description.trim());
        formData.append("coming_date", comingDate.trim() || "");
        formData.append("is_active", String(isActive));
        formData.append("image", imageFile);
        await createComingSoonForm(formData);
      } else {
        await createComingSoon({
          name: n,
          description: description.trim() || undefined,
          coming_date: comingDate.trim() || null,
          is_active: isActive,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-coming-soon"] });
      toast({ title: "Coming Soon created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem?.id) return;
    const n = name.trim();
    if (!n) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const id = editingItem.id;
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("name", n);
        formData.append("description", description.trim());
        formData.append("coming_date", comingDate.trim() || "");
        formData.append("is_active", String(isActive));
        formData.append("image", imageFile);
        await updateComingSoonForm(id, formData);
      } else {
        await updateComingSoon(id, {
          name: n,
          description: description.trim(),
          coming_date: comingDate.trim() || null,
          is_active: isActive,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-coming-soon"] });
      toast({ title: "Coming Soon updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (row: ComingSoonRow) => {
    setItemToDelete(row);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    setDeleting(true);
    try {
      await deleteComingSoon(itemToDelete.id);
      queryClient.invalidateQueries({ queryKey: ["admin-coming-soon"] });
      toast({ title: "Coming Soon deleted." });
      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to delete";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const tableData = items.map((p) => ({ ...p, id: String(p.id) })) as (ComingSoonRow & { id: string })[];
  const imageUrl = (row: ComingSoonRow & { id: string }) => row.image_url ?? row.image ?? null;
  const columns = [
    {
      header: "Image",
      accessor: (row: ComingSoonRow & { id: string }) => {
        const url = imageUrl(row);
        return url ? (
          <img src={url} alt="" className="h-10 w-16 object-fill rounded border border-border" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    { header: "Name", accessor: (row: ComingSoonRow & { id: string }) => String(row.name ?? "").slice(0, 40) },
    { header: "Coming date", accessor: (row: ComingSoonRow & { id: string }) => row.coming_date ?? "—" },
    { header: "Active", accessor: (row: ComingSoonRow & { id: string }) => (row.is_active ? "Yes" : "No") },
    {
      header: "Actions",
      accessor: (row: ComingSoonRow & { id: string }) => (
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
        <Label className="text-xs">Name</Label>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Description (optional)</Label>
        <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
      </div>
      <div>
        <Label className="text-xs">Coming date (optional)</Label>
        <Input type="date" value={comingDate} onChange={(e) => setComingDate(e.target.value)} />
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
          id="coming-soon-is-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-input"
        />
        <Label htmlFor="coming-soon-is-active" className="text-xs">Active</Label>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Coming Soon</h2>
      <p className="text-sm text-muted-foreground">Manage coming soon items shown on the home page.</p>
      <DataTable
        data={tableData}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search by name..."
        onAdd={() => {
          resetForm();
          setCreateOpen(true);
        }}
        addLabel="Add Coming Soon"
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
            <DialogTitle className="font-display">Add Coming Soon</DialogTitle>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Coming Soon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {formFields}
            {(imagePreviewUrl || (editingItem && imageUrl(editingItem as ComingSoonRow & { id: string }))) && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30 w-32 h-20">
                <img
                  src={imagePreviewUrl ?? imageUrl(editingItem as ComingSoonRow & { id: string }) ?? ""}
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
            <AlertDialogTitle>Delete coming soon item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{itemToDelete?.name ?? ""}&quot;. This action cannot be undone.
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

export default PowerhouseComingSoon;
