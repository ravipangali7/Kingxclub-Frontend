import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  getSliderSlidesAdmin,
  createSliderSlide,
  createSliderSlideForm,
  updateSliderSlide,
  updateSliderSlideForm,
  deleteSliderSlide,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

export interface SliderSlideRow {
  id: number;
  title: string;
  subtitle?: string;
  image?: string | null;
  cta_label: string;
  cta_link: string;
  order: number;
}

const PowerhouseSlider = () => {
  const queryClient = useQueryClient();
  const { data: slidesApi = [] } = useQuery({
    queryKey: ["admin-slider-slides"],
    queryFn: getSliderSlidesAdmin,
  });
  const sliderSlides = (slidesApi as SliderSlideRow[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [order, setOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SliderSlideRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<SliderSlideRow | null>(null);
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
    setSubtitle("");
    setCtaLabel("");
    setCtaLink("");
    setOrder(sliderSlides.length);
    setImageFile(null);
    setEditingSlide(null);
  };

  const openEdit = (row: SliderSlideRow) => {
    setEditingSlide(row);
    setTitle(row.title ?? "");
    setSubtitle(row.subtitle ?? "");
    setCtaLabel(row.cta_label ?? "");
    setCtaLink(row.cta_link ?? "");
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
        formData.append("subtitle", subtitle.trim());
        formData.append("cta_label", ctaLabel.trim());
        formData.append("cta_link", ctaLink.trim());
        formData.append("order", String(sliderSlides.length));
        formData.append("image_file", imageFile);
        await createSliderSlideForm(formData);
      } else {
        await createSliderSlide({
          title: t,
          subtitle: subtitle.trim() || undefined,
          cta_label: ctaLabel.trim(),
          cta_link: ctaLink.trim(),
          order: sliderSlides.length,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-slider-slides"] });
      queryClient.invalidateQueries({ queryKey: ["sliderSlides"] });
      toast({ title: "Slide created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create slide";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSlide?.id) return;
    const t = title.trim();
    if (!t) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const id = editingSlide.id;
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("title", t);
        formData.append("subtitle", subtitle.trim());
        formData.append("cta_label", ctaLabel.trim());
        formData.append("cta_link", ctaLink.trim());
        formData.append("order", String(order));
        formData.append("image_file", imageFile);
        await updateSliderSlideForm(id, formData);
      } else {
        await updateSliderSlide(id, {
          title: t,
          subtitle: subtitle.trim(),
          cta_label: ctaLabel.trim(),
          cta_link: ctaLink.trim(),
          order,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-slider-slides"] });
      queryClient.invalidateQueries({ queryKey: ["sliderSlides"] });
      toast({ title: "Slide updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update slide";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (row: SliderSlideRow) => {
    setSlideToDelete(row);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!slideToDelete?.id) return;
    setDeleting(true);
    try {
      await deleteSliderSlide(slideToDelete.id);
      queryClient.invalidateQueries({ queryKey: ["admin-slider-slides"] });
      queryClient.invalidateQueries({ queryKey: ["sliderSlides"] });
      toast({ title: "Slide deleted." });
      setDeleteOpen(false);
      setSlideToDelete(null);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to delete slide";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sliderSlides.length) return;
    const slide = sliderSlides[index];
    const other = sliderSlides[newIndex];
    try {
      await Promise.all([
        updateSliderSlide(slide.id, { order: newIndex }),
        updateSliderSlide(other.id, { order: index }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["admin-slider-slides"] });
      queryClient.invalidateQueries({ queryKey: ["sliderSlides"] });
      toast({ title: "Order updated." });
    } catch (e) {
      toast({ title: "Failed to reorder", variant: "destructive" });
    }
  };

  const tableData = sliderSlides.map((s) => ({ ...s, id: String(s.id) })) as (SliderSlideRow & { id: string })[];
  const columns = [
    { header: "Order", accessor: (row: SliderSlideRow & { id: string }) => row.order },
    {
      header: "Image",
      accessor: (row: SliderSlideRow & { id: string }) =>
        row.image ? (
          <img src={row.image} alt="" className="h-10 w-16 object-cover rounded border border-border" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    { header: "Title", accessor: (row: SliderSlideRow & { id: string }) => String(row.title ?? "").slice(0, 40) },
    { header: "Subtitle", accessor: (row: SliderSlideRow & { id: string }) => String(row.subtitle ?? "").slice(0, 30) },
    {
      header: "Actions",
      accessor: (row: SliderSlideRow & { id: string }) => {
        const idx = sliderSlides.findIndex((s) => s.id === row.id);
        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={idx <= 0}
              onClick={() => handleReorder(idx, "up")}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={idx < 0 || idx >= sliderSlides.length - 1}
              onClick={() => handleReorder(idx, "down")}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(row)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive"
              onClick={() => handleDeleteClick(row)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const formFields = (
    <>
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          className="w-full text-sm file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-sm"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Input placeholder="CTA Label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
      <Input placeholder="CTA Link" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
      <Input type="number" placeholder="Order" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
    </>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Slider (Second Home)</h2>
      <p className="text-sm text-muted-foreground">Slides for the second home page banner. Use image file upload for each slide.</p>
      <DataTable
        data={tableData}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Search by title..."
        onAdd={() => {
          resetForm();
          setOrder(sliderSlides.length);
          setCreateOpen(true);
        }}
        addLabel="Add Slide"
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
            <DialogTitle className="font-display">Add Slide</DialogTitle>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Slide</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {formFields}
            {(imagePreviewUrl || (editingSlide?.image && editingSlide.image.trim())) && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30 w-32 h-20">
                <img
                  src={imagePreviewUrl ?? editingSlide?.image ?? ""}
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
            <AlertDialogTitle>Delete slide?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{slideToDelete?.title ?? ""}&quot; from the slider. This action cannot be undone.
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

export default PowerhouseSlider;
