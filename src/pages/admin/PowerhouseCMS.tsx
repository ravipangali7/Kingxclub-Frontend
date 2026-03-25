import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { getCmsPages, createCmsPage, createCmsPageForm, updateCmsPage, updateCmsPageForm, deleteCmsPage } from "@/api/admin";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/lib/api";

const PowerhouseCMS = () => {
  const queryClient = useQueryClient();
  const { data: cmsPages = [] } = useQuery({ queryKey: ["admin-cms"], queryFn: getCmsPages });
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [isHeader, setIsHeader] = useState(false);
  const [isFooter, setIsFooter] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Record<string, unknown> | null>(null);

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
    setSlug("");
    setContent("");
    setIsHeader(false);
    setIsFooter(true);
    setIsActive(true);
    setImageFile(null);
    setImagePreviewUrl(null);
    setEditingPage(null);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingPage(row);
    setTitle(String(row.title ?? ""));
    setSlug(String(row.slug ?? ""));
    setContent(String(row.content ?? ""));
    setIsHeader(Boolean(row.is_header));
    setIsFooter(Boolean(row.is_footer));
    setIsActive(Boolean(row.is_active));
    setImageFile(null);
    setEditOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this CMS page?")) return;
    try {
      await deleteCmsPage(id);
      queryClient.invalidateQueries({ queryKey: ["admin-cms"] });
      toast({ title: "Deleted." });
    } catch {
      toast({ title: "Failed to delete CMS page", variant: "destructive" });
    }
  };

  const columns = [
    { header: "Title", accessor: (row: Record<string, unknown>) => String(row.title ?? "") },
    { header: "Slug", accessor: (row: Record<string, unknown>) => String(row.slug ?? "") },
    { header: "Header", accessor: (row: Record<string, unknown>) => row.is_header ? "Yes" : "No" },
    { header: "Footer", accessor: (row: Record<string, unknown>) => row.is_footer ? "Yes" : "No" },
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
    const t = title.trim();
    const s = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || !s) {
      toast({ title: "Title and Slug are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.set("title", t);
        formData.set("slug", s);
        formData.set("content", content.trim());
        formData.set("is_header", String(isHeader));
        formData.set("is_footer", String(isFooter));
        formData.set("is_active", String(isActive));
        formData.set("image", imageFile);
        await createCmsPageForm(formData);
      } else {
        await createCmsPage({ title: t, slug: s, content: content.trim(), is_header: isHeader, is_footer: isFooter, is_active: isActive });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-cms"] });
      toast({ title: "CMS page created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create CMS page";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPage?.id) return;
    const t = title.trim();
    const s = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || !s) {
      toast({ title: "Title and Slug are required", variant: "destructive" });
      return;
    }
    const id = Number(editingPage.id);
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.set("title", t);
        formData.set("slug", s);
        formData.set("content", content.trim());
        formData.set("is_header", String(isHeader));
        formData.set("is_footer", String(isFooter));
        formData.set("is_active", String(isActive));
        formData.set("image", imageFile);
        await updateCmsPageForm(id, formData);
      } else {
        await updateCmsPage(id, { title: t, slug: s, content: content.trim(), is_header: isHeader, is_footer: isFooter, is_active: isActive });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-cms"] });
      toast({ title: "CMS page updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update CMS page";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">CMS Pages</h2>
      <DataTable data={cmsPages as Record<string, unknown>[]} columns={columns} searchKey="title" onAdd={() => setCreateOpen(true)} addLabel="Add Page" />
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Add CMS Page</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Slug (e.g., about-us)" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Textarea placeholder="Page Content" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-muted file:text-sm"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imagePreviewUrl && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30 w-24 h-24">
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-fill" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show in Header</span>
              <Switch checked={isHeader} onCheckedChange={setIsHeader} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show in Footer</span>
              <Switch checked={isFooter} onCheckedChange={setIsFooter} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Edit CMS Page</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Page Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Slug (e.g., about-us)" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Textarea placeholder="Page Content" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Image (optional, leave empty to keep current)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-muted file:text-sm"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {(imagePreviewUrl || (editingPage?.image && typeof editingPage.image === "string" && editingPage.image.trim())) && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30 w-24 h-24">
                  <img
                    src={imagePreviewUrl ?? getMediaUrl((editingPage?.image as string).trim())}
                    alt="Preview"
                    className="w-full h-full object-fill"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show in Header</span>
              <Switch checked={isHeader} onCheckedChange={setIsHeader} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show in Footer</span>
              <Switch checked={isFooter} onCheckedChange={setIsFooter} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
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

export default PowerhouseCMS;
