import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getProvidersAdmin, createProviderAdmin, createProviderAdminForm, updateProviderAdmin, updateProviderAdminForm, deleteProviderAdmin, getImportGameApiUrl, fetchProviderGamesFromGameApi, postImportGames, type ImportProvider, type ImportGame } from "@/api/admin";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/lib/api";

const PowerhouseProviders = () => {
  const queryClient = useQueryClient();
  const { data: gameProviders = [] } = useQuery({ queryKey: ["admin-providers"], queryFn: getProvidersAdmin });
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Record<string, unknown> | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [showApiSecrets, setShowApiSecrets] = useState(false);

  // Direct Import modal (game API called from browser; backend only gives URL and persists import)
  const [importOpen, setImportOpen] = useState(false);
  const [gameApiUrl, setGameApiUrl] = useState("");
  const [importProviders, setImportProviders] = useState<ImportProvider[]>([]);
  const [importProvidersLoading, setImportProvidersLoading] = useState(false);
  const [importProvidersError, setImportProvidersError] = useState<string | null>(null);
  const [selectedProviderCode, setSelectedProviderCode] = useState("");
  const [importGamesData, setImportGamesData] = useState<{ categories: string[]; games: ImportGame[] } | null>(null);
  const [importGamesLoading, setImportGamesLoading] = useState(false);
  const [importGamesError, setImportGamesError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const resetForm = () => {
    setName("");
    setCode("");
    setIsActive(true);
    setImageFile(null);
    setBannerFile(null);
    setEditingProvider(null);
    setImagePreviewUrl(null);
    setBannerPreviewUrl(null);
    setApiEndpoint("");
    setApiSecret("");
    setApiToken("");
  };

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(bannerFile);
    setBannerPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  const openEdit = (row: Record<string, unknown>) => {
    setEditingProvider(row);
    setName(String(row.name ?? ""));
    setCode(String(row.code ?? ""));
    setIsActive(Boolean(row.is_active));
    setImageFile(null);
    setBannerFile(null);
    setApiEndpoint(String(row.api_endpoint ?? ""));
    setApiSecret(String(row.api_secret ?? ""));
    setApiToken(String(row.api_token ?? ""));
    setEditOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this provider?")) return;
    try {
      await deleteProviderAdmin(id);
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast({ title: "Deleted." });
    } catch {
      toast({ title: "Failed to delete provider", variant: "destructive" });
    }
  };

  // When Direct Import modal opens, get game API URL only; use existing DB providers (no getProvider; games via providerGame)
  useEffect(() => {
    if (!importOpen) return;
    setImportProvidersError(null);
    setGameApiUrl("");
    setImportProvidersLoading(true);
    getImportGameApiUrl()
      .then(({ game_api_url }) => {
        if (!game_api_url) {
          setImportProvidersError("Game API URL not set. Configure in Super Settings.");
          return;
        }
        setGameApiUrl(game_api_url);
        setImportProviders(
          (gameProviders as Record<string, unknown>[]).map((p) => ({
            code: String(p?.code ?? ""),
            name: String(p?.name ?? p?.code ?? ""),
          }))
        );
        setSelectedProviderCode("");
        setImportGamesData(null);
        setSelectedCategories(new Set());
        setSelectedGames(new Set());
      })
      .catch((e) => setImportProvidersError((e as { detail?: string })?.detail ?? (e as { message?: string })?.message ?? "Failed to load config"))
      .finally(() => setImportProvidersLoading(false));
  }, [importOpen, gameProviders]);

  // When provider is selected, fetch games from game API (browser)
  useEffect(() => {
    if (!importOpen || !selectedProviderCode || !gameApiUrl) {
      if (!selectedProviderCode || !gameApiUrl) setImportGamesData(null);
      setImportGamesError(null);
      return;
    }
    setImportGamesError(null);
    setImportGamesLoading(true);
    fetchProviderGamesFromGameApi(gameApiUrl, selectedProviderCode)
      .then((data) => {
        setImportGamesData(data);
        setSelectedCategories(new Set());
        setSelectedGames(new Set());
      })
      .catch((e) => setImportGamesError((e as { detail?: string })?.detail ?? (e as { message?: string })?.message ?? "Failed to load games"))
      .finally(() => setImportGamesLoading(false));
  }, [importOpen, selectedProviderCode, gameApiUrl]);

  const selectedProviderName = importProviders.find((p) => p.code === selectedProviderCode)?.name ?? "";
  const categories = importGamesData?.categories ?? [];
  const games = importGamesData?.games ?? [];
  const selectedGamesList = games.filter((g) => selectedGames.has(g.game_uid));

  const handleImportSelectAllCategories = () => setSelectedCategories(new Set(categories));
  const handleImportDeselectAllCategories = () => setSelectedCategories(new Set());
  const handleImportSelectAllGames = () => setSelectedGames(new Set(games.map((g) => g.game_uid)));
  const handleImportDeselectAllGames = () => setSelectedGames(new Set());

  const handleImport = async () => {
    if (!selectedProviderCode || selectedGamesList.length === 0) return;
    setImporting(true);
    try {
      const result = await postImportGames({
        provider_code: selectedProviderCode,
        provider_name: selectedProviderName,
        games: selectedGamesList,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      toast({
        title: `Imported: ${result.categories_created} categories, ${result.games_created} games created, ${result.games_skipped} skipped.`,
      });
      setImportOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string; message?: string })?.detail ?? (e as { message?: string })?.message ?? "Import failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      header: "Image",
      accessor: (row: Record<string, unknown>) => {
        const img = row.image;
        if (img && typeof img === "string" && img.trim()) {
          return <img src={getMediaUrl(img.trim())} alt="" className="h-8 w-8 rounded object-fill bg-muted" />;
        }
        return <span className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</span>;
      },
    },
    {
      header: "Banner",
      accessor: (row: Record<string, unknown>) => {
        const banner = row.banner;
        if (banner && typeof banner === "string" && banner.trim()) {
          return <img src={getMediaUrl(banner.trim())} alt="" className="h-8 w-20 rounded object-fill bg-muted" />;
        }
        return <span className="h-8 w-20 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</span>;
      },
    },
    { header: "Name", accessor: (row: Record<string, unknown>) => String(row.name ?? "") },
    { header: "Code", accessor: (row: Record<string, unknown>) => String(row.code ?? "") },
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
    const c = code.trim();
    if (!n || !c) {
      toast({ title: "Name and Code are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const apiEndpointTrim = apiEndpoint.trim();
      const apiSecretTrim = apiSecret.trim();
      const apiTokenTrim = apiToken.trim();
      if (imageFile || bannerFile) {
        const formData = new FormData();
        formData.set("name", n);
        formData.set("code", c);
        formData.set("is_active", String(isActive));
        if (apiEndpointTrim) formData.set("api_endpoint", apiEndpointTrim);
        if (apiSecretTrim) formData.set("api_secret", apiSecretTrim);
        if (apiTokenTrim) formData.set("api_token", apiTokenTrim);
        if (imageFile) formData.set("image", imageFile);
        if (bannerFile) formData.set("banner", bannerFile);
        await createProviderAdminForm(formData);
      } else {
        await createProviderAdmin({
          name: n,
          code: c,
          is_active: isActive,
          ...(apiEndpointTrim && { api_endpoint: apiEndpointTrim }),
          ...(apiSecretTrim && { api_secret: apiSecretTrim }),
          ...(apiTokenTrim && { api_token: apiTokenTrim }),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast({ title: "Provider created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create provider";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProvider?.id) return;
    const n = name.trim();
    const c = code.trim();
    if (!n || !c) {
      toast({ title: "Name and Code are required", variant: "destructive" });
      return;
    }
    const id = Number(editingProvider.id);
    const apiEndpointTrim = apiEndpoint.trim();
    const apiSecretTrim = apiSecret.trim();
    const apiTokenTrim = apiToken.trim();
    setSaving(true);
    try {
      if (imageFile || bannerFile) {
        const formData = new FormData();
        formData.set("name", n);
        formData.set("code", c);
        formData.set("is_active", String(isActive));
        formData.set("api_endpoint", apiEndpointTrim);
        formData.set("api_secret", apiSecretTrim);
        formData.set("api_token", apiTokenTrim);
        if (imageFile) formData.set("image", imageFile);
        if (bannerFile) formData.set("banner", bannerFile);
        await updateProviderAdminForm(id, formData);
      } else {
        await updateProviderAdmin(id, {
          name: n,
          code: c,
          is_active: isActive,
          api_endpoint: apiEndpointTrim,
          api_secret: apiSecretTrim,
          api_token: apiTokenTrim,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast({ title: "Provider updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update provider";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Game Providers</h2>
      <DataTable
        data={gameProviders as Record<string, unknown>[]}
        columns={columns}
        searchKey="name"
        onAdd={() => setCreateOpen(true)}
        addLabel="Add Provider"
        secondaryAction={{ label: "Direct Import", onClick: () => setImportOpen(true) }}
      />
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Add Provider</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Provider Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Provider Code" value={code} onChange={(e) => setCode(e.target.value)} />
            <div className="md:col-span-2 space-y-2 pt-1 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">API (launch)</p>
              <Input
                placeholder="Launch URL e.g. https://allapi.online/launch_game1_js"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">API secret (optional)</label>
                  <Input
                    type={showApiSecrets ? "text" : "password"}
                    placeholder="API secret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">API token (optional)</label>
                  <Input
                    type={showApiSecrets ? "text" : "password"}
                    placeholder="API token"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={showApiSecrets} onChange={(e) => setShowApiSecrets(e.target.checked)} className="rounded border-border" />
                Show secret and token
              </label>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Provider image (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imageFile && <p className="text-xs text-muted-foreground mt-1">{imageFile.name}</p>}
              {imagePreviewUrl && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30 w-16 h-16">
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-fill" />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Provider banner (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground"
                onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              />
              {bannerFile && <p className="text-xs text-muted-foreground mt-1">{bannerFile.name}</p>}
              {bannerPreviewUrl && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30 w-full max-h-24">
                  <img src={bannerPreviewUrl} alt="Banner preview" className="w-full h-full object-fill" />
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Edit Provider</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Provider Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Provider Code" value={code} onChange={(e) => setCode(e.target.value)} />
            <div className="md:col-span-2 space-y-2 pt-1 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">API (launch)</p>
              <Input
                placeholder="Launch URL e.g. https://allapi.online/launch_game1_js"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">API secret (optional)</label>
                  <Input
                    type={showApiSecrets ? "text" : "password"}
                    placeholder="API secret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">API token (optional)</label>
                  <Input
                    type={showApiSecrets ? "text" : "password"}
                    placeholder="API token"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={showApiSecrets} onChange={(e) => setShowApiSecrets(e.target.checked)} className="rounded border-border" />
                Show secret and token
              </label>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Provider image (optional, leave empty to keep current)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {(imagePreviewUrl || (editingProvider?.image && typeof editingProvider.image === "string" && editingProvider.image.trim())) && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30 w-16 h-16">
                  <img
                    src={imagePreviewUrl ?? getMediaUrl((editingProvider?.image as string).trim())}
                    alt="Preview"
                    className="w-full h-full object-fill"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Provider banner (optional, leave empty to keep current)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm"
                onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              />
              {(bannerPreviewUrl || (editingProvider?.banner && typeof editingProvider.banner === "string" && editingProvider.banner.trim())) && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30 w-full max-h-24">
                  <img
                    src={bannerPreviewUrl ?? getMediaUrl((editingProvider?.banner as string).trim())}
                    alt="Banner preview"
                    className="w-full h-full object-fill"
                  />
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display">Direct Import</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
            <div>
              <label className="text-sm font-medium mb-1 block">Provider</label>
              {importProvidersLoading ? (
                <p className="text-sm text-muted-foreground">Loading providers…</p>
              ) : importProvidersError ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{importProvidersError}</p>
                  <Button variant="outline" size="sm" onClick={() => { setImportProvidersError(null); setImportProvidersLoading(true); getImportGameApiUrl().then(({ game_api_url }) => { if (!game_api_url) { setImportProvidersError("Game API URL not set. Configure in Super Settings."); return; } setGameApiUrl(game_api_url); setImportProviders((gameProviders as Record<string, unknown>[]).map((p) => ({ code: String(p?.code ?? ""), name: String(p?.name ?? p?.code ?? "") }))); setSelectedProviderCode(""); setImportGamesData(null); setSelectedCategories(new Set()); setSelectedGames(new Set()); }).catch((e) => setImportProvidersError((e as { detail?: string })?.detail ?? (e as { message?: string })?.message ?? "Failed to load config")).finally(() => setImportProvidersLoading(false)); }}>Retry</Button>
                </div>
              ) : (
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedProviderCode}
                  onChange={(e) => setSelectedProviderCode(e.target.value)}
                >
                  <option value="">Select a provider</option>
                  {importProviders.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {selectedProviderCode && (
              <>
                {importGamesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading categories and games…</p>
                ) : importGamesError ? (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">{importGamesError}</p>
                    <Button variant="outline" size="sm" onClick={() => { setImportGamesError(null); setImportGamesLoading(true); fetchProviderGamesFromGameApi(gameApiUrl, selectedProviderCode).then((data) => { setImportGamesData(data); setSelectedCategories(new Set()); setSelectedGames(new Set()); }).catch((e) => setImportGamesError((e as { detail?: string })?.detail ?? (e as { message?: string })?.message ?? "Failed to load games")).finally(() => setImportGamesLoading(false)); }}>Retry</Button>
                  </div>
                ) : importGamesData ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Categories</label>
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={handleImportSelectAllCategories}>Select all</Button>
                          <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={handleImportDeselectAllCategories}>Deselect all</Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 max-h-24 overflow-y-auto rounded border p-2">
                        {categories.map((cat) => (
                          <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={selectedCategories.has(cat)}
                              onCheckedChange={(checked) => setSelectedCategories((prev) => { const next = new Set(prev); if (checked) next.add(cat); else next.delete(cat); return next; })}
                            />
                            {cat}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Games</label>
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={handleImportSelectAllGames}>Select all</Button>
                          <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={handleImportDeselectAllGames}>Deselect all</Button>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded border p-2 space-y-1">
                        {games.map((g) => (
                          <label key={g.game_uid} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                            <Checkbox
                              checked={selectedGames.has(g.game_uid)}
                              onCheckedChange={(checked) => setSelectedGames((prev) => { const next = new Set(prev); if (checked) next.add(g.game_uid); else next.delete(g.game_uid); return next; })}
                            />
                            <span className="truncate">{g.game_name}</span>
                            {g.game_type && <span className="text-muted-foreground text-xs">({g.game_type})</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={handleImport}
              disabled={!selectedProviderCode || selectedGamesList.length === 0 || importing}
            >
              {importing ? "Importing…" : `Import ${selectedGamesList.length} game${selectedGamesList.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PowerhouseProviders;
