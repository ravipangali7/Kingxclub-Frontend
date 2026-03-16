import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import {
  getGamesAdmin, getCategoriesAdmin, getProvidersAdmin,
  createGame, createGameForm, updateGame, updateGameForm, deleteGame,
} from "@/api/admin";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/lib/api";
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

type GameRow = Record<string, unknown>;

// ─── Single-field inline edit modal ─────────────────────────────────────────

interface InlineEditState {
  row: GameRow;
  field: string;
  label: string;
  value: unknown;
}

function InlineEditModal({
  state, onClose, categories, providers,
}: {
  state: InlineEditState | null;
  onClose: () => void;
  categories: { id: number; name: string }[];
  providers: { id: number; name: string; code: string }[];
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state) setValue(state.value);
  }, [state]);

  if (!state) return null;

  const handleSave = async () => {
    const id = Number(state.row.id);
    setSaving(true);
    try {
      await updateGame(id, { [state.field]: value === "" ? null : value });
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      toast({ title: `${state.label} updated.` });
      onClose();
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderField = () => {
    const f = state.field;
    if (["is_active", "is_lobby", "is_top_game", "is_popular_game"].includes(f)) {
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setValue(e.target.checked)}
            className="rounded border-border h-4 w-4"
          />
          {state.label}
        </label>
      );
    }
    if (f === "category") {
      return (
        <select
          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
          value={String(value ?? "")}
          onChange={(e) => setValue(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">Select Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      );
    }
    if (f === "provider") {
      return (
        <select
          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
          value={String(value ?? "")}
          onChange={(e) => setValue(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">Select Provider</option>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
      );
    }
    if (f === "min_bet" || f === "max_bet") {
      return (
        <Input
          type="number"
          value={String(value ?? "")}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
    return (
      <Input
        value={String(value ?? "")}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            Edit — {String(state.row.name ?? state.row.id)}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{state.label}</p>
        </DialogHeader>
        <div className="py-2">{renderField()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className="gold-gradient text-primary-foreground" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PowerhouseGames = () => {
  const queryClient = useQueryClient();
  const [providerFilter, setProviderFilter] = useState<number | "">("");
  const { data: gamesRaw } = useQuery({
    queryKey: ["admin-games", providerFilter],
    queryFn: () => getGamesAdmin(providerFilter ? { provider_id: providerFilter } : undefined),
  });
  const { data: categoriesRaw } = useQuery({ queryKey: ["admin-categories"], queryFn: getCategoriesAdmin });
  const { data: providersRaw } = useQuery({ queryKey: ["admin-providers"], queryFn: getProvidersAdmin });

  const games = Array.isArray(gamesRaw) ? gamesRaw : [];
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const providers = Array.isArray(providersRaw) ? providersRaw : [];

  const cats = categories as { id: number; name: string }[];
  const provs = providers as { id: number; name: string; code: string }[];

  // ── Form state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [gameToDelete, setGameToDelete] = useState<GameRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [gameUid, setGameUid] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [providerId, setProviderId] = useState<number | "">("");
  const [minBet, setMinBet] = useState("10");
  const [maxBet, setMaxBet] = useState("5000");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isLobby, setIsLobby] = useState(false);
  const [isTopGame, setIsTopGame] = useState(false);
  const [isPopularGame, setIsPopularGame] = useState(false);

  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetForm = () => {
    setName(""); setGameUid(""); setCategoryId(""); setProviderId("");
    setMinBet("10"); setMaxBet("5000"); setImageFile(null);
    setIsActive(true); setIsLobby(false);
    setIsTopGame(false); setIsPopularGame(false);
    setEditingGame(null);
  };

  const openEdit = (row: GameRow) => {
    setEditingGame(row);
    setName(String(row.name ?? ""));
    setGameUid(String(row.game_uid ?? ""));
    setCategoryId(typeof row.category === "number" ? row.category : "");
    setProviderId(typeof row.provider === "number" ? row.provider : "");
    setMinBet(String(row.min_bet ?? "10"));
    setMaxBet(String(row.max_bet ?? "5000"));
    setIsActive(Boolean(row.is_active));
    setIsLobby(Boolean(row.is_lobby));
    setIsTopGame(Boolean(row.is_top_game));
    setIsPopularGame(Boolean(row.is_popular_game));
    setImageFile(null);
    setEditOpen(true);
  };

  // ── Cell click → inline edit ──
  const EDITABLE_CELLS: Record<string, string> = {
    name: "Name",
    game_uid: "Game UID",
    category: "Category",
    provider: "Provider",
    min_bet: "Min Bet",
    max_bet: "Max Bet",
    is_active: "Active",
    is_lobby: "Lobby",
    is_top_game: "Top Game",
    is_popular_game: "Popular Game",
  };

  const handleCellClick = (row: GameRow, field: string) => {
    if (!EDITABLE_CELLS[field]) return;
    setInlineEdit({ row, field, label: EDITABLE_CELLS[field], value: row[field] ?? null });
  };

  // ── Column definitions with colorful styling ──
  const columns = [
    {
      header: "ID",
      accessor: (row: GameRow) => <span className="text-xs text-muted-foreground">{String(row.id ?? "")}</span>,
      sortKey: "id",
    },
    {
      header: "Image",
      accessor: (row: GameRow) => (
        row.image || row.image_url
          ? <img
              src={row.image ? getMediaUrl(String(row.image)) : String(row.image_url)}
              alt=""
              className="w-8 h-8 rounded object-cover border border-border"
            />
          : <div className="w-8 h-8 rounded bg-muted border border-border" />
      ),
    },
    {
      header: "Name",
      accessor: (row: GameRow) => (
        <span
          className="font-semibold text-primary cursor-pointer hover:underline"
          onClick={() => handleCellClick(row, "name")}
        >
          {String(row.name ?? "")}
        </span>
      ),
      sortKey: "name",
    },
    {
      header: "UID",
      accessor: (row: GameRow) => (
        <span
          className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-muted/80"
          onClick={() => handleCellClick(row, "game_uid")}
        >
          {String(row.game_uid ?? "")}
        </span>
      ),
      sortKey: "game_uid",
    },
    {
      header: "Category",
      accessor: (row: GameRow) => (
        <span
          className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 cursor-pointer hover:bg-blue-500/25"
          onClick={() => handleCellClick(row, "category")}
        >
          {String(row.category_name ?? "")}
        </span>
      ),
      sortKey: "category_name",
    },
    {
      header: "Provider",
      accessor: (row: GameRow) => (
        <span
          className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 cursor-pointer hover:bg-purple-500/25"
          onClick={() => handleCellClick(row, "provider")}
        >
          {String(row.provider_name ?? "")}
        </span>
      ),
      sortKey: "provider_name",
    },
    {
      header: "Min Bet",
      accessor: (row: GameRow) => (
        <span
          className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/25"
          onClick={() => handleCellClick(row, "min_bet")}
        >
          ₹{row.min_bet ?? ""}
        </span>
      ),
      sortKey: "min_bet",
    },
    {
      header: "Max Bet",
      accessor: (row: GameRow) => (
        <span
          className="text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-pointer hover:bg-amber-500/25"
          onClick={() => handleCellClick(row, "max_bet")}
        >
          ₹{Number(row.max_bet ?? 0).toLocaleString()}
        </span>
      ),
      sortKey: "max_bet",
    },
    {
      header: "Flags",
      accessor: (row: GameRow) => (
        <div className="flex gap-1 flex-wrap">
          {row.is_top_game && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-pointer"
              onClick={() => handleCellClick(row, "is_top_game")}
            >
              Top
            </span>
          )}
          {row.is_popular_game && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 cursor-pointer"
              onClick={() => handleCellClick(row, "is_popular_game")}
            >
              Popular
            </span>
          )}
          {row.is_lobby && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 cursor-pointer"
              onClick={() => handleCellClick(row, "is_lobby")}
            >
              Lobby
            </span>
          )}
          {false && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 cursor-pointer"
              onClick={() => handleCellClick(row, "is_active")}
            >
              Soon
            </span>
          )}
          {!row.is_top_game && !row.is_popular_game && !row.is_lobby && (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row: GameRow) => (
        <span className="cursor-pointer" onClick={() => handleCellClick(row, "is_active")}>
          <StatusBadge status={row.is_active ? "active" : "suspended"} />
        </span>
      ),
      sortKey: "is_active",
    },
    {
      header: "Created",
      accessor: (row: GameRow) => (
        <span className="text-xs text-muted-foreground">
          {row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : ""}
        </span>
      ),
      sortKey: "created_at",
    },
    {
      header: "Actions",
      accessor: (row: GameRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => setGameToDelete(row)}>Delete</Button>
        </div>
      ),
    },
  ];

  const handleDeleteGame = async () => {
    if (!gameToDelete?.id) return;
    setDeleting(true);
    try {
      await deleteGame(Number(gameToDelete.id));
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      toast({ title: "Game deleted." });
      setGameToDelete(null);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to delete game";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // ── Create handler ──
  const buildPayload = () => ({
    name: name.trim(),
    game_uid: gameUid.trim(),
    category: categoryId,
    provider: providerId,
    min_bet: minBet || "0",
    max_bet: maxBet || "0",
    is_active: isActive,
    is_lobby: isLobby,
    is_top_game: isTopGame,
    is_popular_game: isPopularGame,
  });

  const buildFormData = () => {
    const fd = new FormData();
    const p = buildPayload();
    fd.append("name", p.name);
    fd.append("game_uid", p.game_uid);
    fd.append("category", String(p.category));
    fd.append("provider", String(p.provider));
    fd.append("min_bet", p.min_bet);
    fd.append("max_bet", p.max_bet);
    fd.append("is_active", String(p.is_active));
    fd.append("is_lobby", String(p.is_lobby));
    fd.append("is_top_game", String(p.is_top_game));
    fd.append("is_popular_game", String(p.is_popular_game));
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const validate = () => {
    if (!name.trim() || !gameUid.trim()) {
      toast({ title: "Game name and Game UID are required", variant: "destructive" });
      return false;
    }
    if (categoryId === "" || providerId === "") {
      toast({ title: "Please select Category and Provider", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (imageFile) {
        await createGameForm(buildFormData());
      } else {
        await createGame(buildPayload());
      }
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      toast({ title: "Game created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create game";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingGame?.id || !validate()) return;
    const id = Number(editingGame.id);
    setSaving(true);
    try {
      if (imageFile) {
        await updateGameForm(id, buildFormData());
      } else {
        await updateGame(id, buildPayload());
      }
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
      toast({ title: "Game updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update game";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Shared form body ──
  const formBody = (isEdit: boolean) => (
    <div className="overflow-y-auto max-h-[70vh] px-1 pb-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Row 1 */}
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground block mb-1">Game Name *</label>
          <Input placeholder="Game Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground block mb-1">Game UID (provider code) *</label>
          <Input placeholder="Game UID" value={gameUid} onChange={(e) => setGameUid(e.target.value)} />
        </div>

        {/* Category & Provider */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Category *</label>
          <select
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Select Category</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Provider *</label>
          <select
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Select Provider</option>
            {provs.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </div>

        {/* Bets */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Min Bet</label>
          <Input placeholder="Min Bet" type="number" value={minBet} onChange={(e) => setMinBet(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Max Bet</label>
          <Input placeholder="Max Bet" type="number" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} />
        </div>

        {/* Image */}
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground block mb-1">
            Game image {isEdit ? "(leave empty to keep current)" : "(optional)"}
          </label>
          <input
            key={isEdit ? (editOpen ? "e-open" : "e-closed") : (createOpen ? "c-open" : "c-closed")}
            type="file"
            accept="image/*"
            className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-sm"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          {(imagePreviewUrl || (isEdit && editingGame?.image && typeof editingGame.image === "string" && editingGame.image.trim())) && (
            <div className="mt-2 rounded-lg border border-border overflow-hidden bg-muted/30 w-20 h-20">
              <img
                src={imagePreviewUrl ?? getMediaUrl((editingGame?.image as string).trim())}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Flags section */}
        <div className="sm:col-span-2 border-t border-border pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status &amp; Flags</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-border" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isLobby} onChange={(e) => setIsLobby(e.target.checked)} className="rounded border-border" />
              Lobby
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isTopGame} onChange={(e) => setIsTopGame(e.target.checked)} className="rounded border-border" />
              Top Game
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPopularGame} onChange={(e) => setIsPopularGame(e.target.checked)} className="rounded border-border" />
              Popular Game
            </label>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Games Management</h2>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">Provider:</label>
        <select
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm min-w-[180px]"
          value={providerFilter === "" ? "" : String(providerFilter)}
          onChange={(e) => setProviderFilter(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">All providers</option>
          {provs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </div>
      <DataTable
        data={games as GameRow[]}
        columns={columns}
        searchKey="name"
        onAdd={() => setCreateOpen(true)}
        addLabel="Add Game"
        pageSize={15}
      />

      {/* Inline single-field edit */}
      <InlineEditModal
        state={inlineEdit}
        onClose={() => setInlineEdit(null)}
        categories={cats}
        providers={provs}
      />

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Add Game</DialogTitle></DialogHeader>
          {formBody(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="gold-gradient text-primary-foreground" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Edit Game</DialogTitle></DialogHeader>
          {formBody(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="gold-gradient text-primary-foreground" onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete game confirmation */}
      <AlertDialog open={!!gameToDelete} onOpenChange={(open) => { if (!open) setGameToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the game &quot;{gameToDelete ? String(gameToDelete.name ?? gameToDelete.id) : ""}&quot;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGame} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PowerhouseGames;
