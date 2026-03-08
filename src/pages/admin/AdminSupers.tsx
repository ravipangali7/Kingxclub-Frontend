import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getSupers,
  createSuper,
  updateSuper,
  directDeposit,
  directWithdraw,
  regeneratePin,
  resetPassword,
  type ListParams,
} from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { ArrowDownCircle, ArrowUpCircle, Key, Eye, Edit, RefreshCw } from "lucide-react";
import { PinDialog } from "@/components/shared/PinDialog";
import { ListDateRangeToolbar } from "@/components/shared/ListDateRangeToolbar";
import { TableBadge } from "@/components/admin/TableBadge";

type SuperRow = Record<string, unknown> & {
  id?: number; username?: string; name?: string;
  main_balance?: string; pl_balance?: string; bonus_balance?: string;
  exposure_balance?: string; exposure_limit?: string;
  masters_count?: number; players_count?: number; users_balance?: string;
  masters_balance?: string; masters_pl_balance?: string;
  total_balance?: string; total_win_loss?: string;
  status?: string; created_at?: string; pin?: string;
  commission_percentage?: string;
};

type PendingAction = "deposit" | "withdraw" | "resetPassword" | "regeneratePin" | null;

interface InlineEditState {
  row: SuperRow;
  field: string;
  label: string;
  value: unknown;
}

// ── Single-field inline edit ──────────────────────────────────────────────────

function InlineEditModal({ state, onClose }: { state: InlineEditState | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState<unknown>(state?.value ?? null);
  const [saving, setSaving] = useState(false);

  if (!state) return null;

  const handleSave = async () => {
    const id = Number(state.row.id);
    setSaving(true);
    try {
      await updateSuper(id, { [state.field]: value });
      queryClient.invalidateQueries({ queryKey: ["admin-supers"] });
      toast({ title: `${state.label} updated.` });
      onClose();
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

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
          <Input
            type={typeof state.value === "number" ? "number" : "text"}
            value={String(value ?? "")}
            onChange={(e) => setValue(e.target.value)}
          />
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

const ROLE = "powerhouse" as const;
const USER_TYPE = "supers" as const;

const AdminSupers = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [pinViewOpen, setPinViewOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SuperRow | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown>>({});
  const [depositAmount, setDepositAmount] = useState("");
  const [depositRemarks, setDepositRemarks] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawRemarks, setWithdrawRemarks] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createWhatsApp, setCreateWhatsApp] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createCommission, setCreateCommission] = useState("10");
  const [editName, setEditName] = useState("");
  const [editCommission, setEditCommission] = useState("10");
  const [editSaving, setEditSaving] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const listParams: ListParams = {};
  if (dateFrom) listParams.date_from = dateFrom;
  if (dateTo) listParams.date_to = dateTo;
  const { data: supersRaw, isLoading, refetch } = useQuery({
    queryKey: ["admin-supers", listParams],
    queryFn: () => getSupers(listParams),
    refetchInterval: autoRefresh ? 10000 : false,
  });
  const rows = (Array.isArray(supersRaw) ? supersRaw : []) as SuperRow[];

  const EDITABLE_CELLS: Record<string, string> = {
    name: "Name",
    commission_percentage: "Commission %",
  };

  const handleCellClick = (row: SuperRow, field: string) => {
    if (!EDITABLE_CELLS[field]) return;
    setInlineEdit({ row, field, label: EDITABLE_CELLS[field], value: row[field] ?? null });
  };

  const columns = [
    {
      header: "Username",
      accessor: (row: SuperRow) => (
        <span className="font-semibold text-primary">{String(row.username ?? "")}</span>
      ),
      sortKey: "username",
    },
    {
      header: "Name",
      accessor: (row: SuperRow) => (
        <span className="cursor-pointer hover:underline text-primary" onClick={() => handleCellClick(row, "name")}>
          {String(row.name ?? "—")}
        </span>
      ),
      sortKey: "name",
    },
    {
      header: "Balance",
      accessor: (row: SuperRow) => (
        <TableBadge variant="balance">
          ₹{Number(row.main_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
      sortKey: "main_balance",
    },
    {
      header: "P/L",
      accessor: (row: SuperRow) => {
        const n = Number(row.pl_balance ?? 0);
        return (
          <TableBadge variant={n >= 0 ? "plPositive" : "plNegative"}>
            {n >= 0 ? "+" : ""}₹{n.toLocaleString()}
          </TableBadge>
        );
      },
      sortKey: "pl_balance",
    },
    {
      header: "Bonus Bal",
      accessor: (row: SuperRow) => (
        <TableBadge variant="bonus">
          ₹{Number(row.bonus_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
      sortKey: "bonus_balance",
    },
    {
      header: "Total Bal",
      accessor: (row: SuperRow) => (
        <TableBadge variant="total">
          ₹{Number(row.total_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
      sortKey: "total_balance",
    },
    {
      header: "Win/Loss",
      accessor: (row: SuperRow) => {
        const n = Number(row.total_win_loss ?? 0);
        return (
          <TableBadge variant={n >= 0 ? "plPositive" : "plNegative"}>
            {n >= 0 ? "+" : ""}₹{n.toLocaleString()}
          </TableBadge>
        );
      },
      sortKey: "total_win_loss",
    },
    {
      header: "Users Bal",
      accessor: (row: SuperRow) => (
        <TableBadge variant="usersBal">
          ₹{Number(row.users_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
      sortKey: "users_balance",
    },
    {
      header: "Masters",
      accessor: (row: SuperRow) => (
        <TableBadge variant="players">{row.masters_count ?? 0}</TableBadge>
      ),
      sortKey: "masters_count",
    },
    {
      header: "Players",
      accessor: (row: SuperRow) => (
        <TableBadge variant="players">{row.players_count ?? 0}</TableBadge>
      ),
      sortKey: "players_count",
    },
    {
      header: "Commission",
      accessor: (row: SuperRow) => (
        <TableBadge variant="commission" onClick={() => handleCellClick(row, "commission_percentage")}>
          {row.commission_percentage ?? 0}%
        </TableBadge>
      ),
      sortKey: "commission_percentage",
    },
    {
      header: "Status",
      accessor: (row: SuperRow) => <StatusBadge status={String(row.status ?? "active")} />,
      sortKey: "status",
    },
    {
      header: "Joined",
      accessor: (row: SuperRow) => (
        <span className="text-xs text-muted-foreground cursor-pointer hover:underline text-primary">
          {row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : "—"}
        </span>
      ),
      sortKey: "created_at",
    },
    {
      header: "Actions",
      accessor: (row: SuperRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-success" title="Deposit" onClick={() => { setSelectedUser(row); setDepositOpen(true); }}><ArrowDownCircle className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" title="Withdraw" onClick={() => { setSelectedUser(row); setWithdrawOpen(true); }}><ArrowUpCircle className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Reset PW" onClick={() => { setSelectedUser(row); setResetPwOpen(true); }}><Key className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="View PIN" onClick={() => { setSelectedUser(row); setPinViewOpen(true); }}><Eye className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-warning" title="Regenerate PIN" onClick={() => { setSelectedUser(row); setPendingAction("regeneratePin"); setPendingPayload({ userId: row.id }); setPinOpen(true); }}><RefreshCw className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => { setSelectedUser(row); setViewOpen(true); }}><Eye className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => { setSelectedUser(row); setEditName(String(row.name ?? "")); setEditCommission(String(row.commission_percentage ?? "10")); setEditOpen(true); }}><Edit className="h-3 w-3" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Super Users</h2>
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
      <DataTable data={rows} columns={columns} searchKey="username" searchPlaceholder="Search supers..." onAdd={() => setCreateOpen(true)} addLabel="Add Super" variant="adminListing" />

      {/* Inline single-field edit */}
      <InlineEditModal state={inlineEdit} onClose={() => setInlineEdit(null)} />

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) {
          setCreateName(""); setCreateUsername(""); setCreatePhone(""); setCreateEmail(""); setCreateWhatsApp(""); setCreatePassword(""); setCreateCommission("10");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Create Super</DialogTitle></DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] px-1 pb-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  await createSuper(body);
                  queryClient.invalidateQueries({ queryKey: ["admin-supers"] });
                  toast({ title: "Super created successfully." });
                  setCreateOpen(false);
                  setCreateName(""); setCreateUsername(""); setCreatePhone(""); setCreateEmail(""); setCreateWhatsApp(""); setCreatePassword(""); setCreateCommission("10");
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
          <DialogHeader><DialogTitle className="font-display">Super Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: "Username", val: String(selectedUser.username ?? "") },
                  { label: "Name", val: String(selectedUser.name ?? "") },
                  { label: "Balance", val: fmt(selectedUser.main_balance) },
                  { label: "P/L", val: fmtPL(selectedUser.pl_balance) },
                  { label: "Bonus Bal", val: fmt(selectedUser.bonus_balance) },
                  { label: "Exposure Bal", val: fmt(selectedUser.exposure_balance) },
                  { label: "Exposure Limit", val: fmt(selectedUser.exposure_limit) },
                  { label: "Total Bal", val: fmt(selectedUser.total_balance) },
                  { label: "Win/Loss", val: fmtPL(selectedUser.total_win_loss) },
                  { label: "Users Bal", val: fmt(selectedUser.users_balance) },
                  { label: "Masters", val: String(selectedUser.masters_count ?? 0) },
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
          <DialogHeader><DialogTitle className="font-display">Edit Super</DialogTitle></DialogHeader>
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
                  await updateSuper(selectedUser.id as number, { name: editName.trim(), commission_percentage: editCommission || "10" });
                  queryClient.invalidateQueries({ queryKey: ["admin-supers"] });
                  toast({ title: "Super updated successfully." });
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                setPendingAction("deposit");
                setPendingPayload({ userId: selectedUser?.id, amount: depositAmount, remarks: depositRemarks });
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                setPendingAction("withdraw");
                setPendingPayload({ userId: selectedUser?.id, amount: withdrawAmount, remarks: withdrawRemarks });
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
            <Input type="password" placeholder="Confirm" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
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

      <PinDialog
        open={pinOpen}
        onClose={() => { setPinOpen(false); setPendingAction(null); setPendingPayload({}); }}
        onConfirm={async (pin) => {
          try {
            if (pendingAction === "deposit") {
              const userId = pendingPayload.userId as number;
              const amount = pendingPayload.amount as string;
              const remarks = (pendingPayload.remarks as string) ?? "";
              await directDeposit(
                { user_id: userId, amount: Number(amount) || 0, remarks, pin },
                ROLE
              );
              queryClient.invalidateQueries({ queryKey: ["admin-supers"] });
              queryClient.invalidateQueries({ queryKey: ["admin-deposits", ROLE] });
              toast({ title: "Deposit created and approved." });
            } else if (pendingAction === "withdraw") {
              const userId = pendingPayload.userId as number;
              const amount = pendingPayload.amount as string;
              const remarks = (pendingPayload.remarks as string) ?? "";
              await directWithdraw({ user_id: userId, amount: Number(amount) || 0, remarks, pin }, ROLE);
              queryClient.invalidateQueries({ queryKey: ["admin-supers"] });
              queryClient.invalidateQueries({ queryKey: ["admin-withdrawals", ROLE] });
              toast({ title: "Withdrawal created and approved." });
            } else if (pendingAction === "resetPassword") {
              const userId = pendingPayload.userId as number;
              const new_password = pendingPayload.new_password as string;
              await resetPassword(userId, { pin, new_password }, ROLE, USER_TYPE);
              queryClient.invalidateQueries({ queryKey: ["admin-supers"] });
              toast({ title: "Password reset successfully." });
            } else if (pendingAction === "regeneratePin") {
              const userId = pendingPayload.userId as number;
              await regeneratePin(userId, { pin }, ROLE, USER_TYPE);
              queryClient.invalidateQueries({ queryKey: ["admin-supers"] });
              toast({ title: "PIN regenerated successfully." });
            }
            setPinOpen(false); setPendingAction(null); setPendingPayload({});
          } catch (e: unknown) {
            const msg = (e as { detail?: string })?.detail ?? "Something went wrong.";
            toast({ title: msg, variant: "destructive" });
          }
        }}
        title="Enter PIN to confirm"
      />
    </div>
  );
};

export default AdminSupers;
