import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getCategoriesAdmin, createCategoryAdminForm, updateCategoryAdminForm, deleteCategoryAdmin } from "@/api/admin";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ImageUploadWithPreview } from "@/components/shared/ImageUploadWithPreview";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/lib/api";

function categoryIconUrl(row: Record<string, unknown>): string | null {
  const icon = row.icon;
  if (icon && typeof icon === "string" && icon.trim()) return getMediaUrl(icon.trim());
  const svg = row.svg;
  if (svg && typeof svg === "string" && svg.trim() && !svg.trim().startsWith("<svg")) return getMediaUrl(svg.trim());
  return null;
}

const PowerhouseCategories = () => {
  const queryClient = useQueryClient();
  const { data: gameCategories = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: getCategoriesAdmin });
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Record<string, unknown> | null>(null);

  const resetForm = () => {
    setName("");
    setIconFile(null);
    setIsActive(true);
    setEditingCategory(null);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingCategory(row);
    setName(String(row.name ?? ""));
    setIconFile(null);
    setIsActive(Boolean(row.is_active));
    setEditOpen(true);
  };

  const buildFormData = (n: string) => {
    const formData = new FormData();
    formData.set("name", n);
    formData.set("is_active", String(isActive));
    if (iconFile) {
      formData.set("icon", iconFile, iconFile.name || "icon");
    }
    return formData;
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategoryAdmin(id);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: "Deleted." });
    } catch {
      toast({ title: "Failed to delete category", variant: "destructive" });
    }
  };

  const columns = [
    {
      header: "Icon",
      accessor: (row: Record<string, unknown>) => {
        const src = categoryIconUrl(row);
        if (src) return <img src={src} alt="" className="h-6 w-6 object-fill" />;
        return <span className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">—</span>;
      },
    },
    { header: "Name", accessor: (row: Record<string, unknown>) => String(row.name ?? "") },
    { header: "Status", accessor: (row: Record<string, unknown>) => <StatusBadge status={row.is_active ? "active" : "suspended"} /> },
    {
      header: "Actions",
      accessor: (row: Record<string, unknown>) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-xs text-crimson" onClick={() => handleDelete(Number(row.id))}>Delete</Button>
        </div>
      ),
    },
  ];

  const handleSave = async () => {
    const n = name.trim();
    if (!n) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createCategoryAdminForm(buildFormData(n));
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: "Category created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create category";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCategory?.id) return;
    const n = name.trim();
    if (!n) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    const id = Number(editingCategory.id);
    setSaving(true);
    try {
      await updateCategoryAdminForm(id, buildFormData(n));
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: "Category updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update category";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Game Categories</h2>
      <DataTable data={gameCategories as Record<string, unknown>[]} columns={columns} searchKey="name" onAdd={() => setCreateOpen(true)} addLabel="Add Category" />
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Add Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Category Name" value={name} onChange={(e) => setName(e.target.value)} />
            <ImageUploadWithPreview
              value={undefined}
              onChange={(file) => setIconFile(file)}
              label="Icon (image)"
              previewClassName="h-16 w-16 object-fill border rounded bg-muted/30"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-border" />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="gold-gradient text-primary-foreground" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
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
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Category Name" value={name} onChange={(e) => setName(e.target.value)} />
            <ImageUploadWithPreview
              value={editingCategory ? (categoryIconUrl(editingCategory) ?? undefined) : undefined}
              onChange={(file) => setIconFile(file)}
              label="Icon (image — leave empty to keep current)"
              previewClassName="h-16 w-16 object-fill border rounded bg-muted/30"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-border" />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="gold-gradient text-primary-foreground" onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PowerhouseCategories;
