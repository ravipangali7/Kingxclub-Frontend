import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getSupers,
  getMasters,
  createMaster,
  updateMaster,
  deleteMaster,
  directDeposit,
  directWithdraw,
  regeneratePin,
  resetPassword,
  settleMaster,
  setDefaultMaster,
  type ListParams,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { ArrowDownCircle, ArrowUpCircle, Key, Eye, Edit, RefreshCw, ArrowRightLeft, Trash2 } from "lucide-react";
import { PinDialog } from "@/components/shared/PinDialog";
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
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { TableBadge } from "@/components/admin/TableBadge";

const fmt = (v: string | number | null | undefined) => (v != null ? `₹${Number(v).toLocaleString()}` : "₹0");
const fmtPL = (v: string | number | null | undefined) => (v != null ? `₹${Number(v).toLocaleString()}` : "₹0");

type MasterRow = Record<string, unknown> & {
  id?: number; username?: string; name?: string;
  main_balance?: string; pl_balance?: string; bonus_balance?: string;
  exposure_balance?: string; exposure_limit?: string;
  players_count?: number; users_balance?: string;
  total_balance?: string; total_win_loss?: string;
  status?: string; created_at?: string; pin?: string;
  commission_percentage?: string;
  whatsapp_number?: string | null;
  whatsapp_deposit?: string | null;
  whatsapp_withdraw?: string | null;
  is_default_master?: boolean;
};

type PendingAction = "deposit" | "withdraw" | "resetPassword" | "regeneratePin" | "settlement" | "setDefaultMaster" | null;

interface InlineEditState {
  row: MasterRow;
  field: string;
  label: string;
  value: unknown;
}

// ── Single-field inline edit ──────────────────────────────────────────────────

function InlineEditModal({
  state, onClose, onSave,
}: {
  state: InlineEditState | null;
  onClose: () => void;
  onSave: (id: number, field: string, value: unknown) => void | Promise<void>;
}) {
  const [value, setValue] = useState<unknown>(state?.value ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(state?.value ?? null);
  }, [state?.row?.id, state?.field, state?.value]);

  if (!state) return null;

  const handleSave = async () => {
    const id = Number(state.row.id);
    setSaving(true);
    try {
      await onSave(id, state.field, value);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isStatus = state.field === "status";

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-base">
            Edit — {String(state.row.username ?? state.row.id)}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{state.label}</p>
        </DialogHeader>
        <div className="py-2">
          {isStatus ? (
            <select
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
              value={String(value ?? "active")}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          ) : (
            <Input
              type={typeof state.value === "number" ? "number" : "text"}
              value={String(value ?? "")}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </div>
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

// ── Main Component ────────────────────────────────────────────────────────────

const AdminMasters = () => {
  const { user, refreshUser } = useAuth();
  const role = user?.role === "powerhouse" || user?.role === "super" ? user.role : "super";
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MasterRow | null>(null);
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createWhatsApp, setCreateWhatsApp] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createCommission, setCreateCommission] = useState("10");
  const [createParentId, setCreateParentId] = useState<number | "">("");
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [pinViewOpen, setPinViewOpen] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown>>({});
  const [depositAmount, setDepositAmount] = useState("");
  const [depositRemarks, setDepositRemarks] = useState("");
  const [depositReferenceId, setDepositReferenceId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawRemarks, setWithdrawRemarks] = useState("");
  const [withdrawReferenceId, setWithdrawReferenceId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [editName, setEditName] = useState("");
  const [editCommission, setEditCommission] = useState("10");
  const [editWhatsApp, setEditWhatsApp] = useState("");
  const [editWhatsappDeposit, setEditWhatsappDeposit] = useState("");
  const [editWhatsappWithdraw, setEditWhatsappWithdraw] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [pendingCellSave, setPendingCellSave] = useState<{ id: number; field: string; value: unknown } | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [masterToDelete, setMasterToDelete] = useState<MasterRow | null>(null);
  const [masterToSetDefault, setMasterToSetDefault] = useState<MasterRow | null>(null);
  const [deletingMaster, setDeletingMaster] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const listParams: ListParams = {};
  if (dateFrom) listParams.date_from = dateFrom;
  if (dateTo) listParams.date_to = dateTo;
  const { data: mastersRaw, isLoading, refetch } = useQuery({
    queryKey: ["admin-masters", role, listParams],
    queryFn: () => getMasters(role, listParams),
    refetchInterval: autoRefresh ? 10000 : false,
  });
  const { data: supersListRaw } = useQuery({ queryKey: ["admin-supers"], queryFn: () => getSupers(), enabled: role === "powerhouse" && createOpen });
  const rows = (Array.isArray(mastersRaw) ? mastersRaw : []) as MasterRow[];
  const supersList = Array.isArray(supersListRaw) ? supersListRaw : [];

  useEffect(() => {
    if (!autoRefresh || !refreshUser) return;
    const id = setInterval(() => refreshUser(), 10000);
    return () => clearInterval(id);
  }, [autoRefresh, refreshUser]);

  const EDITABLE_CELLS: Record<string, string> = {
    name: "Name",
    main_balance: "Balance",
    bonus_balance: "Bonus Bal",
    exposure_balance: "Exposure",
    total_balance: "Total Bal",
    pl_balance: "P/L",
    total_win_loss: "Win/Loss",
    users_balance: "Users Bal",
    commission_percentage: "Commission %",
    status: "Status",
  };

  const handleCellClick = (row: MasterRow, field: string) => {
    if (!EDITABLE_CELLS[field]) return;
    setInlineEdit({ row, field, label: EDITABLE_CELLS[field], value: row[field] ?? null });
  };

  const handleCellSave = async (id: number, field: string, value: unknown) => {
    if (role === "super") {
      setPendingCellSave({ id, field, value });
      setInlineEdit(null);
      setPinOpen(true);
      return;
    }
    await updateMaster(id, { [field]: value }, role);
    queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
    toast({ title: "Updated." });
    setInlineEdit(null);
  };

  const columns = [
    {
      header: "Username",
      accessor: (row: MasterRow) => (
        <span className="font-semibold text-primary">{String(row.username ?? "")}</span>
      ),
      sortKey: "username",
    },
    {
      header: "Name",
      accessor: (row: MasterRow) => (
        <span className="cursor-pointer hover:underline text-primary" onClick={() => handleCellClick(row, "name")}>
          {String(row.name ?? "—")}
        </span>
      ),
      sortKey: "name",
    },
    {
      header: "Balance",
      accessor: (row: MasterRow) => (
        <TableBadge variant="balance" onClick={() => handleCellClick(row, "main_balance")}>
          ₹{Number(row.main_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
      sortKey: "main_balance",
    },
    {
      header: "P/L",
      accessor: (row: MasterRow) => {
        const n = Number(row.pl_balance ?? 0);
        return (
          <TableBadge variant={n >= 0 ? "plPositive" : "plNegative"} onClick={() => handleCellClick(row, "pl_balance")}>
            {n >= 0 ? "+" : ""}₹{n.toLocaleString()}
          </TableBadge>
        );
      },
      sortKey: "pl_balance",
    },
    {
      header: "Bonus Bal",
      accessor: (row: MasterRow) => (
        <TableBadge variant="bonus" onClick={() => handleCellClick(row, "bonus_balance")}>
          ₹{Number(row.bonus_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
      sortKey: "bonus_balance",
    },
    {
      header: "Total Bal",
      accessor: (row: MasterRow) => (
        <TableBadge variant="total" onClick={() => handleCellClick(row, "total_balance")}>
          ₹{Number(row.total_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
      sortKey: "total_balance",
    },
    {
      header: "Win/Loss",
      accessor: (row: MasterRow) => {
        const n = Number(row.total_win_loss ?? 0);
        return (
          <TableBadge variant={n >= 0 ? "plPositive" : "plNegative"} onClick={() => handleCellClick(row, "total_win_loss")}>
            {n >= 0 ? "+" : ""}₹{n.toLocaleString()}
          </TableBadge>
        );
      },
      sortKey: "total_win_loss",
    },
    {
      header: "Users Bal",
      accessor: (row: MasterRow) => (
        <TableBadge variant="usersBal" onClick={() => handleCellClick(row, "users_balance")}>
          ₹{Number(row.users_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
      sortKey: "users_balance",
    },
    {
      header: "Players",
      accessor: (row: MasterRow) => (
        <TableBadge variant="players">{row.players_count ?? 0}</TableBadge>
      ),
      sortKey: "players_count",
    },
    {
      header: "Commission",
      accessor: (row: MasterRow) => (
        <TableBadge variant="commission" onClick={() => handleCellClick(row, "commission_percentage")}>
          {row.commission_percentage ?? 0}%
        </TableBadge>
      ),
      sortKey: "commission_percentage",
    },
    {
      header: "Status",
      accessor: (row: MasterRow) => (
        <span
          className="cursor-pointer hover:opacity-90 inline-block"
          onClick={() => handleCellClick(row, "status")}
        >
          <StatusBadge status={String(row.status ?? "active")} />
        </span>
      ),
      sortKey: "status",
    },
    {
      header: "Default",
      accessor: (row: MasterRow) =>
        row.is_default_master ? (
          <span className="text-xs font-medium text-muted-foreground">Default</span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setMasterToSetDefault(row)}
          >
            Set default
          </Button>
        ),
    },
    {
      header: "Joined",
      accessor: (row: MasterRow) => (
        <span className="text-xs text-muted-foreground">
          {row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : ""}
        </span>
      ),
      sortKey: "created_at",
    },
    {
      header: "Actions",
      accessor: (row: MasterRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-success" title="Deposit" onClick={() => { setSelectedUser(row); setDepositOpen(true); }}><ArrowDownCircle className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" title="Withdraw" onClick={() => { setSelectedUser(row); setWithdrawOpen(true); }}><ArrowUpCircle className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Reset Password" onClick={() => { setSelectedUser(row); setResetPwOpen(true); }}><Key className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="View PIN" onClick={() => { setSelectedUser(row); setPinViewOpen(true); }}><Eye className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-warning" title="Regenerate PIN" onClick={() => { setSelectedUser(row); setPendingAction("regeneratePin"); setPendingPayload({ userId: row.id }); setPinOpen(true); }}><RefreshCw className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-neon" title="Settlement" onClick={() => { setSelectedUser(row); setSettlementOpen(true); }}><ArrowRightLeft className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => { setSelectedUser(row); setViewOpen(true); }}><Eye className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => { setSelectedUser(row); setEditName(String(row.name ?? "")); setEditCommission(String(row.commission_percentage ?? "10")); setEditWhatsApp(String(row.whatsapp_number ?? "")); setEditWhatsappDeposit(String(row.whatsapp_deposit ?? "")); setEditWhatsappWithdraw(String(row.whatsapp_withdraw ?? "")); setEditOpen(true); }}><Edit className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete" onClick={() => setMasterToDelete(row)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ),
    },
  ];

  const handleDeleteMaster = async () => {
    if (!masterToDelete?.id) return;
    setDeletingMaster(true);
    try {
      await deleteMaster(Number(masterToDelete.id), role);
      queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
      toast({ title: "Master deleted." });
      setMasterToDelete(null);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to delete master";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeletingMaster(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Master Users</h2>
      <ListDateRangeToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={({ dateFrom: f, dateTo: t }) => { setDateFrom(f); setDateTo(t); }}
        onLoad={() => refetch()}
        loading={isLoading}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          <RefreshCw className="h-4 w-4" /> Auto refresh (10s)
        </label>
      </div>
      <DataTable data={rows} columns={columns} searchKey="username" searchPlaceholder="Search masters..." onAdd={() => setCreateOpen(true)} addLabel="Add Master" variant="adminListing" />

      {/* Inline single-field edit */}
      <InlineEditModal state={inlineEdit} onClose={() => setInlineEdit(null)} onSave={handleCellSave} />

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) {
          setCreateName(""); setCreateUsername(""); setCreatePhone(""); setCreateEmail(""); setCreateWhatsApp(""); setCreatePassword(""); setCreateCommission("10"); setCreateParentId("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Create Master</DialogTitle></DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] px-1 pb-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {role === "powerhouse" && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1">Super *</label>
                  <select
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                    value={createParentId}
                    onChange={(e) => setCreateParentId(e.target.value === "" ? "" : Number(e.target.value))}
                  >
                    <option value="">Select super</option>
                    {(supersList as { id?: number; username?: string }[]).map((s) => (
                      <option key={s.id} value={s.id}>{s.username ?? s.id}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
                <Input placeholder="Full Name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Username</label>
                <Input placeholder="Username" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Phone</label>
                <Input placeholder="Phone" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email (optional)</label>
                <Input placeholder="Email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">WhatsApp Number</label>
                <Input placeholder="WhatsApp" value={createWhatsApp} onChange={(e) => setCreateWhatsApp(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Password</label>
                <Input type="password" placeholder="Password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Commission %</label>
                <Input type="number" placeholder="Commission %" value={createCommission} onChange={(e) => setCreateCommission(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={async () => {
                try {
                  const body: Record<string, unknown> = {
                    name: createName.trim(),
                    username: createUsername.trim(),
                    phone: createPhone.trim(),
                    password: createPassword,
                    commission_percentage: createCommission ? Number(createCommission) : 10,
                  };
                  if (createEmail.trim()) body.email = createEmail.trim();
                  if (createWhatsApp.trim()) body.whatsapp_number = createWhatsApp.trim();
                  if (role === "powerhouse") {
                    if (createParentId === "" || createParentId === undefined) {
                      toast({ title: "Please select a Super.", variant: "destructive" });
                      return;
                    }
                    body.parent = createParentId;
                  }
                  await createMaster(body, role);
                  queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
                  toast({ title: "Master created successfully." });
                  setCreateOpen(false);
                  setCreateName(""); setCreateUsername(""); setCreatePhone(""); setCreateEmail(""); setCreateWhatsApp(""); setCreatePassword(""); setCreateCommission("10"); setCreateParentId("");
                } catch (e: unknown) {
                  const msg = (e as { detail?: string })?.detail ?? "Something went wrong.";
                  toast({ title: msg, variant: "destructive" });
                }
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Master Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: "Username", val: String(selectedUser.username ?? "") },
                  { label: "Name", val: String(selectedUser.name ?? "") },
                  { label: "WhatsApp", val: String(selectedUser.whatsapp_number ?? "") },
                  { label: "WhatsApp (deposit)", val: String(selectedUser.whatsapp_deposit ?? "") },
                  { label: "WhatsApp (withdraw)", val: String(selectedUser.whatsapp_withdraw ?? "") },
                  { label: "Balance", val: fmt(selectedUser.main_balance) },
                  { label: "P/L", val: fmtPL(selectedUser.pl_balance) },
                  { label: "Bonus Bal", val: fmt(selectedUser.bonus_balance) },
                  { label: "Exposure Bal", val: fmt(selectedUser.exposure_balance) },
                  { label: "Exposure Limit", val: fmt(selectedUser.exposure_limit) },
                  { label: "Total Bal", val: fmt(selectedUser.total_balance) },
                  { label: "Win/Loss", val: fmtPL(selectedUser.total_win_loss) },
                  { label: "Users Bal", val: fmt(selectedUser.users_balance) },
                  { label: "Players", val: String(selectedUser.players_count ?? 0) },
                  { label: "Commission", val: `${selectedUser.commission_percentage ?? 0}%` },
                  { label: "Status", val: <StatusBadge status={String(selectedUser.status ?? "active")} /> },
                  { label: "Joined", val: selectedUser.created_at ? new Date(String(selectedUser.created_at)).toLocaleDateString() : "" },
                ].map(({ label, val }) => (
                  <div key={label} className="p-2 rounded-lg bg-muted/30 border border-border">
                    <span className="text-muted-foreground text-xs block">{label}</span>
                    <p className="font-medium mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditSaving(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Edit Master</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="overflow-y-auto max-h-[70vh] px-1 pb-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Commission %</label>
                  <Input type="number" placeholder="Commission %" value={editCommission} onChange={(e) => setEditCommission(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1">WhatsApp Number</label>
                  <Input value={editWhatsApp} onChange={(e) => setEditWhatsApp(e.target.value)} placeholder="WhatsApp" />
                </div>
                {role === "super" && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground block mb-1">WhatsApp (deposit)</label>
                      <Input value={editWhatsappDeposit} onChange={(e) => setEditWhatsappDeposit(e.target.value)} placeholder="Number for deposit inquiries" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground block mb-1">WhatsApp (withdraw)</label>
                      <Input value={editWhatsappWithdraw} onChange={(e) => setEditWhatsappWithdraw(e.target.value)} placeholder="Number for withdrawal inquiries" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              disabled={editSaving}
              onClick={async () => {
                if (!selectedUser?.id) return;
                setEditSaving(true);
                try {
                  const payload: Record<string, string> = {
                    name: editName.trim(),
                    commission_percentage: editCommission || "10",
                    whatsapp_number: editWhatsApp.trim(),
                  };
                  if (role === "super") {
                    payload.whatsapp_deposit = editWhatsappDeposit.trim();
                    payload.whatsapp_withdraw = editWhatsappWithdraw.trim();
                  }
                  await updateMaster(selectedUser.id as number, payload, role);
                  queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
                  toast({ title: "Master updated successfully." });
                  setEditOpen(false);
                } catch (e) {
                  const msg = (e as { detail?: string })?.detail ?? "Failed to update";
                  toast({ title: msg, variant: "destructive" });
                } finally {
                  setEditSaving(false);
                }
              }}
            >
              {editSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Deposit to {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="Amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            <Textarea placeholder="Remarks" rows={2} value={depositRemarks} onChange={(e) => setDepositRemarks(e.target.value)} />
            <Input placeholder="Transaction / Reference ID (optional)" value={depositReferenceId} onChange={(e) => setDepositReferenceId(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                setPendingAction("deposit");
                setPendingPayload({
                  userId: selectedUser?.id,
                  amount: depositAmount,
                  remarks: depositRemarks,
                  reference_id: depositReferenceId.trim() || undefined,
                });
                setDepositOpen(false);
                setPinOpen(true);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Withdraw from {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="Amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            <Textarea placeholder="Remarks" rows={2} value={withdrawRemarks} onChange={(e) => setWithdrawRemarks(e.target.value)} />
            <Input placeholder="Transaction / Reference ID (required)" value={withdrawReferenceId} onChange={(e) => setWithdrawReferenceId(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                if (!withdrawReferenceId.trim()) {
                  toast({ title: "Reference ID is required for manual withdrawal.", variant: "destructive" });
                  return;
                }
                setPendingAction("withdraw");
                setPendingPayload({
                  userId: selectedUser?.id,
                  amount: withdrawAmount,
                  remarks: withdrawRemarks,
                  reference_id: withdrawReferenceId.trim(),
                });
                setWithdrawOpen(false);
                setPinOpen(true);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Reset Password — {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Input type="password" placeholder="Confirm Password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                if (newPassword !== newPasswordConfirm) { toast({ title: "Passwords do not match", variant: "destructive" }); return; }
                if (newPassword.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
                setPendingAction("resetPassword");
                setPendingPayload({ userId: selectedUser?.id, new_password: newPassword });
                setResetPwOpen(false);
                setPinOpen(true);
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PIN */}
      <Dialog open={pinViewOpen} onOpenChange={setPinViewOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">PIN for {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="text-center py-4">
            <p className="text-3xl font-gaming tracking-[0.5em] neon-text">{String(selectedUser?.pin ?? "")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinViewOpen(false)}>Close</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                setPendingAction("regeneratePin");
                setPendingPayload({ userId: selectedUser?.id });
                setPinViewOpen(false);
                setPinOpen(true);
              }}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settlement */}
      <Dialog open={settlementOpen} onOpenChange={setSettlementOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Settlement — {selectedUser?.username}</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted">
                <div><span className="text-muted-foreground text-xs">Main Balance</span><p className="font-bold">₹{Number(selectedUser.main_balance ?? 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">P/L Balance</span><p className={`font-bold ${Number(selectedUser.pl_balance ?? 0) >= 0 ? "text-success" : "text-accent"}`}>{Number(selectedUser.pl_balance ?? 0) >= 0 ? "+" : ""}₹{Number(selectedUser.pl_balance ?? 0).toLocaleString()}</p></div>
              </div>
              <p className="text-xs text-muted-foreground">Settlement will transfer all master balance to your account and reset P/L to 0.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettlementOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                setPendingAction("settlement");
                setPendingPayload({ masterId: selectedUser?.id });
                setSettlementOpen(false);
                setPinOpen(true);
              }}
            >
              Settle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set default master confirm */}
      <AlertDialog open={!!masterToSetDefault} onOpenChange={(open) => { if (!open) setMasterToSetDefault(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set default master?</AlertDialogTitle>
            <AlertDialogDescription>
              Make this master the default? New signups without a referral will be assigned to this master.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                if (masterToSetDefault?.id != null) {
                  setPendingAction("setDefaultMaster");
                  setPendingPayload({ masterId: masterToSetDefault.id });
                  setMasterToSetDefault(null);
                  setPinOpen(true);
                }
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PinDialog
        open={pinOpen}
        onClose={() => { setPinOpen(false); setPendingAction(null); setPendingPayload({}); setPendingCellSave(null); }}
        onConfirm={async (pin) => {
          try {
            if (pendingCellSave) {
              const payload: Record<string, unknown> = { [pendingCellSave.field]: pendingCellSave.value, pin };
              await updateMaster(pendingCellSave.id, payload, role);
              queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
              toast({ title: "Updated." });
              setPendingCellSave(null);
              setPinOpen(false);
              return;
            }
            if (pendingAction === "deposit") {
              const userId = pendingPayload.userId as number;
              const amount = pendingPayload.amount as string;
              const remarks = (pendingPayload.remarks as string) ?? "";
              const reference_id = pendingPayload.reference_id as string | undefined;
              await directDeposit(
                { user_id: userId, amount: Number(amount) || 0, remarks, pin, ...(reference_id ? { reference_id } : {}) },
                role
              );
              queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
              queryClient.invalidateQueries({ queryKey: ["admin-deposits", role] });
              toast({ title: "Deposit created and approved." });
            } else if (pendingAction === "withdraw") {
              const userId = pendingPayload.userId as number;
              const amount = pendingPayload.amount as string;
              const remarks = (pendingPayload.remarks as string) ?? "";
              const reference_id = String(pendingPayload.reference_id ?? "").trim();
              if (!reference_id) {
                toast({ title: "Reference ID is required.", variant: "destructive" });
                return;
              }
              await directWithdraw({ user_id: userId, amount: Number(amount) || 0, remarks, reference_id, pin }, role);
              queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
              queryClient.invalidateQueries({ queryKey: ["admin-withdrawals", role] });
              toast({ title: "Withdrawal created and approved." });
            } else if (pendingAction === "resetPassword") {
              const userId = pendingPayload.userId as number;
              const new_password = pendingPayload.new_password as string;
              await resetPassword(userId, { pin, new_password }, role, "masters");
              queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
              toast({ title: "Password reset successfully." });
            } else if (pendingAction === "regeneratePin") {
              const userId = pendingPayload.userId as number;
              await regeneratePin(userId, { pin }, role, "masters");
              queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
              toast({ title: "PIN regenerated successfully." });
            } else if (pendingAction === "settlement") {
              const masterId = pendingPayload.masterId as number;
              await settleMaster(masterId, { pin });
              queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
              toast({ title: "Settlement completed." });
            } else if (pendingAction === "setDefaultMaster") {
              const masterId = pendingPayload.masterId as number;
              await setDefaultMaster(masterId, pin, role);
              queryClient.invalidateQueries({ queryKey: ["admin-masters", role] });
              if (role === "powerhouse") queryClient.invalidateQueries({ queryKey: ["admin-super-settings"] });
              toast({ title: "Default master updated." });
            }
            setPinOpen(false); setPendingAction(null); setPendingPayload({});
          } catch (e: unknown) {
            const msg = (e as { detail?: string })?.detail ?? "Something went wrong.";
            toast({ title: msg, variant: "destructive" });
          }
        }}
        title="Enter PIN to confirm"
      />

      <AlertDialog open={!!masterToDelete} onOpenChange={(open) => { if (!open) setMasterToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete master?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the master &quot;{masterToDelete ? String(masterToDelete.username ?? masterToDelete.id) : ""}&quot;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingMaster}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMaster} disabled={deletingMaster} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingMaster ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMasters;
