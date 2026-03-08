import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  type CountryAdmin,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

const PowerhouseCountries = () => {
  const queryClient = useQueryClient();
  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: getCountries,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CountryAdmin | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setCountryCode("");
    setCurrencySymbol("₹");
    setIsActive(true);
    setEditingItem(null);
  };

  const openEdit = (item: CountryAdmin) => {
    setEditingItem(item);
    setName(item.name);
    setCountryCode(item.country_code);
    setCurrencySymbol(item.currency_symbol);
    setIsActive(item.is_active);
    setEditOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!countryCode.trim()) {
      toast({ title: "Country code is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createCountry({
        name: name.trim(),
        country_code: countryCode.trim(),
        currency_symbol: currencySymbol.trim() || "₹",
        is_active: isActive,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      toast({ title: "Country created." });
      setCreateOpen(false);
      resetForm();
    } catch {
      toast({ title: "Failed to create country", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !name.trim() || !countryCode.trim()) {
      toast({ title: "Name and country code are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateCountry(editingItem.id, {
        name: name.trim(),
        country_code: countryCode.trim(),
        currency_symbol: currencySymbol.trim() || "₹",
        is_active: isActive,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      toast({ title: "Country updated." });
      setEditOpen(false);
      resetForm();
    } catch {
      toast({ title: "Failed to update country", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this country? Users with this country code will keep it but currency may fall back to default.")) return;
    try {
      await deleteCountry(id);
      queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
      toast({ title: "Deleted." });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const formContent = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Name <span className="text-destructive">*</span></label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nepal, India" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Country code <span className="text-destructive">*</span></label>
        <Input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder="e.g. 977, 91" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Currency symbol</label>
        <Input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} placeholder="e.g. Rs., ₹" />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="country-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <label htmlFor="country-active" className="text-sm font-medium">Active</label>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight">Countries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage countries for register/login and currency symbol (country code → currency).
          </p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add country
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && countries.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">No countries yet. Add one to drive currency by country code.</p>
          </CardContent>
        </Card>
      )}

      {countries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">All countries ({countries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {countries.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-lg border p-3 bg-muted/20"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      +{c.country_code} · {c.currency_symbol} · {c.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add country</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Edit country</DialogTitle>
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

export default PowerhouseCountries;
