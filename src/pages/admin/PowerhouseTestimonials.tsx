import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { getTestimonialsAdmin, createTestimonial, createTestimonialForm, updateTestimonial, updateTestimonialForm, deleteTestimonial } from "@/api/admin";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/lib/api";

const PowerhouseTestimonials = () => {
  const queryClient = useQueryClient();
  const { data: testimonials = [] } = useQuery({ queryKey: ["admin-testimonials"], queryFn: getTestimonialsAdmin });
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [stars, setStars] = useState(5);
  const [testimonialFrom, setTestimonialFrom] = useState("");
  const [gameName, setGameName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Record<string, unknown> | null>(null);

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
    setMessage("");
    setStars(5);
    setTestimonialFrom("");
    setGameName("");
    setImageFile(null);
    setImagePreviewUrl(null);
    setEditingTestimonial(null);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingTestimonial(row);
    setName(String(row.name ?? ""));
    setMessage(String(row.message ?? ""));
    setStars(Number(row.stars ?? 5));
    setTestimonialFrom(String(row.testimonial_from ?? ""));
    setGameName(String(row.game_name ?? ""));
    setImageFile(null);
    setEditOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await deleteTestimonial(id);
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Deleted." });
    } catch {
      toast({ title: "Failed to delete testimonial", variant: "destructive" });
    }
  };

  const columns = [
    {
      header: "Avatar",
      accessor: (row: Record<string, unknown>) => {
        const img = row.image;
        if (img && typeof img === "string" && img.trim()) {
          return <img src={getMediaUrl(img.trim())} alt="" className="h-8 w-8 rounded-full object-fill" />;
        }
        return <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">{(String(row.name ?? ""))[0] || "?"}</span>;
      },
    },
    { header: "Name", accessor: (row: Record<string, unknown>) => String(row.name ?? "") },
    { header: "Rating", accessor: (row: Record<string, unknown>) => (
      <div className="flex text-primary">{Array.from({ length: Number(row.stars ?? 5) }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
    )},
    { header: "Review", accessor: (row: Record<string, unknown>) => <span className="text-xs truncate max-w-[200px] block">{String(row.message ?? "")}</span> },
    { header: "Status", accessor: () => <StatusBadge status="active" /> },
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
    const m = message.trim();
    if (!n || !m) {
      toast({ title: "Name and Review text are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.set("name", n);
        formData.set("message", m);
        formData.set("stars", String(Number(stars) || 5));
        formData.set("testimonial_from", testimonialFrom.trim());
        formData.set("game_name", gameName.trim());
        formData.set("image", imageFile);
        await createTestimonialForm(formData);
      } else {
        await createTestimonial({
          name: n,
          message: m,
          stars: Number(stars) || 5,
          testimonial_from: testimonialFrom.trim() || "",
          game_name: gameName.trim() || "",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Testimonial created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create testimonial";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTestimonial?.id) return;
    const n = name.trim();
    const m = message.trim();
    if (!n || !m) {
      toast({ title: "Name and Review text are required", variant: "destructive" });
      return;
    }
    const id = Number(editingTestimonial.id);
    setSaving(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.set("name", n);
        formData.set("message", m);
        formData.set("stars", String(Number(stars) || 5));
        formData.set("testimonial_from", testimonialFrom.trim());
        formData.set("game_name", gameName.trim());
        formData.set("image", imageFile);
        await updateTestimonialForm(id, formData);
      } else {
        await updateTestimonial(id, {
          name: n,
          message: m,
          stars: Number(stars) || 5,
          testimonial_from: testimonialFrom.trim() || "",
          game_name: gameName.trim() || "",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Testimonial updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update testimonial";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Testimonials</h2>
      <DataTable data={testimonials as Record<string, unknown>[]} columns={columns} searchKey="name" onAdd={() => setCreateOpen(true)} addLabel="Add Testimonial" />
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Add Testimonial</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="From (optional)" value={testimonialFrom} onChange={(e) => setTestimonialFrom(e.target.value)} />
            <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" value={stars} onChange={(e) => setStars(Number(e.target.value))}>
              <option value={5}>5 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={3}>3 Stars</option>
            </select>
            <Textarea placeholder="Review text" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            <Input placeholder="Game name (optional)" value={gameName} onChange={(e) => setGameName(e.target.value)} />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Avatar image (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-muted file:text-sm"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imagePreviewUrl && (
                <div className="mt-2 rounded-full border border-border overflow-hidden bg-muted/30 w-14 h-14">
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-fill" />
                </div>
              )}
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
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Edit Testimonial</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="From (optional)" value={testimonialFrom} onChange={(e) => setTestimonialFrom(e.target.value)} />
            <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" value={stars} onChange={(e) => setStars(Number(e.target.value))}>
              <option value={5}>5 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={3}>3 Stars</option>
            </select>
            <Textarea placeholder="Review text" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            <Input placeholder="Game name (optional)" value={gameName} onChange={(e) => setGameName(e.target.value)} />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Avatar image (optional, leave empty to keep current)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-muted file:text-sm"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {(imagePreviewUrl || (editingTestimonial?.image && typeof editingTestimonial.image === "string" && editingTestimonial.image.trim())) && (
                <div className="mt-2 rounded-full border border-border overflow-hidden bg-muted/30 w-14 h-14">
                  <img
                    src={imagePreviewUrl ?? getMediaUrl((editingTestimonial?.image as string).trim())}
                    alt="Preview"
                    className="w-full h-full object-fill"
                  />
                </div>
              )}
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

export default PowerhouseTestimonials;
