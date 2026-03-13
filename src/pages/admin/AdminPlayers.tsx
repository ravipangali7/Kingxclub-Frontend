import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMasters, getPlayers, createPlayer, updatePlayer, togglePlayerActive, directDeposit, directWithdraw, resetPassword, deletePlayer, type ListParams } from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { ArrowDownCircle, ArrowUpCircle, Key, Eye, Edit, RefreshCw, Inbox, Trash2 } from "lucide-react";

const whatsAppUrl = (phone?: string | null, whatsapp?: string | null) => {
  const raw = (phone || whatsapp || "").replace(/\D/g, "");
  return raw ? `https://wa.me/${raw}` : null;
};
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
import { Switch } from "@/components/ui/switch";
import { TableBadge } from "@/components/admin/TableBadge";

type PlayerRow = Record<string, unknown> & { id?: number; username?: string; name?: string; main_balance?: string; bonus_balance?: string; exposure_balance?: string; exposure_limit?: string; is_active?: boolean; status?: string; created_at?: string; phone?: string; whatsapp_number?: string; parent_username?: string; no_activity_7_days?: boolean; total_balance?: string | number; total_win_loss?: string | number };

type PendingAction = "deposit" | "withdraw" | "resetPassword" | null;

const AdminPlayers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createWhatsApp, setCreateWhatsApp] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createParentId, setCreateParentId] = useState<number | "">("");
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [togglePinOpen, setTogglePinOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<{ row: PlayerRow; nextActive: boolean } | null>(null);
  const [selectedUser, setSelectedUser] = useState<PlayerRow | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown>>({});
  const [depositAmount, setDepositAmount] = useState("");
  const [depositRemarks, setDepositRemarks] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawRemarks, setWithdrawRemarks] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [cellEdit, setCellEdit] = useState<{ row: PlayerRow; field: string; label: string; value: unknown; editable: boolean } | null>(null);
  const [cellEditValue, setCellEditValue] = useState("");
  const [cellEditSaving, setCellEditSaving] = useState(false);
  const [pendingCellSave, setPendingCellSave] = useState<{ id: number; field: string; value: string } | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [masterIdFilter, setMasterIdFilter] = useState<string>("");
  const [playerToDelete, setPlayerToDelete] = useState<PlayerRow | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState(false);
  const listParams: ListParams = {};
  if (dateFrom) listParams.date_from = dateFrom;
  if (dateTo) listParams.date_to = dateTo;
  if ((role === "powerhouse" || role === "super") && masterIdFilter) listParams.master_id = masterIdFilter;
  const { data: players = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-players", role, listParams],
    queryFn: () => getPlayers(role, listParams),
    refetchInterval: autoRefresh ? 10000 : false,
  });
  const { data: mastersList = [] } = useQuery({ queryKey: ["admin-masters", role], queryFn: () => getMasters(role), enabled: role === "powerhouse" || role === "super" });
  const rows = players as PlayerRow[];

  const openCell = (row: PlayerRow, field: string, label: string, value: unknown, editable: boolean) => {
    setCellEdit({ row, field, label, value, editable });
    setCellEditValue(String(value ?? ""));
  };

  const columns = [
    {
      header: "Username",
      sortKey: "username",
      accessor: (row: PlayerRow) => (
        <span className="cursor-pointer hover:underline text-primary" onClick={() => openCell(row, "username", "Username", row.username, false)}>
          {String(row.username ?? "")}
        </span>
      ),
    },
    {
      header: "Name",
      sortKey: "name",
      accessor: (row: PlayerRow) => (
        <span className="cursor-pointer hover:underline text-primary" onClick={() => openCell(row, "name", "Name", row.name, true)}>
          {String(row.name ?? "—")}
        </span>
      ),
    },
    {
      header: "Phone",
      sortKey: "phone",
      accessor: (row: PlayerRow) => (
        <span className="cursor-pointer hover:underline text-primary" onClick={() => openCell(row, "phone", "Phone", row.phone, true)}>
          {String(row.phone ?? "—")}
        </span>
      ),
    },
    {
      header: "Master",
      sortKey: "parent_username",
      accessor: (row: PlayerRow) => String(row.parent_username ?? "—"),
    },
    {
      header: "Message",
      accessor: (row: PlayerRow) => {
        const waUrl = whatsAppUrl(row.phone, row.whatsapp_number);
        return (
          <div className="flex gap-1">
            {waUrl ? (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex p-1 rounded hover:bg-muted" title="WhatsApp">
                <svg className="h-4 w-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            ) : null}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Inbox - Open chat" onClick={() => navigate(`/${role}/messages?contact=${row.id}`)}>
              <Inbox className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      header: "Balance",
      sortKey: "main_balance",
      accessor: (row: PlayerRow) => (
        <TableBadge variant="balance" onClick={() => openCell(row, "main_balance", "Balance", row.main_balance, true)}>
          ₹{Number(row.main_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
    },
    {
      header: "Bonus",
      sortKey: "bonus_balance",
      accessor: (row: PlayerRow) => (
        <TableBadge variant="bonus" onClick={() => openCell(row, "bonus_balance", "Bonus", row.bonus_balance, true)}>
          ₹{Number(row.bonus_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
    },
    {
      header: "Exposure",
      sortKey: "exposure_balance",
      accessor: (row: PlayerRow) => (
        <TableBadge variant="exposure" onClick={() => openCell(row, "exposure_balance", "Exposure", row.exposure_balance, true)}>
          ₹{Number(row.exposure_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
    },
    {
      header: "Total Balance",
      sortKey: "total_balance",
      accessor: (row: PlayerRow) => (
        <TableBadge variant="total" onClick={() => openCell(row, "total_balance", "Total Balance", row.total_balance, false)}>
          ₹{Number(row.total_balance ?? 0).toLocaleString()}
        </TableBadge>
      ),
    },
    {
      header: "Win/Loss",
      sortKey: "total_win_loss",
      accessor: (row: PlayerRow) => {
        const n = Number(row.total_win_loss ?? 0);
        return (
          <TableBadge variant={n >= 0 ? "plPositive" : "plNegative"} onClick={() => openCell(row, "total_win_loss", "Win/Loss", row.total_win_loss, false)}>
            {n >= 0 ? "+" : ""}₹{n.toLocaleString()}
          </TableBadge>
        );
      },
    },
    {
      header: "Exp Limit",
      sortKey: "exposure_limit",
      accessor: (row: PlayerRow) => (
        <TableBadge variant="commission" onClick={() => openCell(row, "exposure_limit", "Exp Limit", row.exposure_limit, true)}>
          ₹{Number(row.exposure_limit ?? 0).toLocaleString()}
        </TableBadge>
      ),
    },
    {
      header: "Status",
      accessor: (row: PlayerRow) => {
        const isActive = row.is_active !== false;
        const label = isActive ? "User Activate" : "User Deactivate";
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => {
                setToggleTarget({ row, nextActive: checked });
                setTogglePinOpen(true);
              }}
            />
            <span className="text-xs font-medium whitespace-nowrap cursor-pointer hover:underline text-primary" onClick={() => openCell(row, "is_active", "Status", label, false)}>{label}</span>
          </div>
        );
      },
    },
    { header: "Joined", accessor: (row: PlayerRow) => {
      const val = row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : "";
      return <span className="cursor-pointer hover:underline text-primary" onClick={() => openCell(row, "created_at", "Joined", val, false)}>{val || "—"}</span>;
    } },
    {
      header: "Actions",
      accessor: (row: PlayerRow) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-success" title="Deposit" onClick={() => { setSelectedUser(row); setDepositOpen(true); }}><ArrowDownCircle className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" title="Withdraw" onClick={() => { setSelectedUser(row); setWithdrawOpen(true); }}><ArrowUpCircle className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Reset Password" onClick={() => { setSelectedUser(row); setResetPwOpen(true); }}><Key className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="View Report" onClick={() => navigate(`/${role}/players/${row.id}/report`)}><Eye className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => { setSelectedUser(row); setEditName(String(row.name ?? "")); setEditPhone(String(row.phone ?? "")); setEditOpen(true); }}><Edit className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete" onClick={() => setPlayerToDelete(row)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ),
    },
  ];

  const handleDeletePlayer = async () => {
    if (!playerToDelete?.id) return;
    setDeletingPlayer(true);
    try {
      await deletePlayer(Number(playerToDelete.id), role);
      queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
      toast({ title: "Player deleted." });
      setPlayerToDelete(null);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to delete player";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeletingPlayer(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Player Users</h2>
      <ListDateRangeToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={({ dateFrom: f, dateTo: t }) => { setDateFrom(f); setDateTo(t); }}
        onLoad={() => refetch()}
        loading={isLoading}
      />
      <div className="flex flex-wrap items-center gap-2">
        {(role === "powerhouse" || role === "super") && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Master:</span>
            <select
              value={masterIdFilter}
              onChange={(e) => setMasterIdFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              {(mastersList as { id: number; username?: string }[]).map((m) => (
                <option key={m.id} value={String(m.id)}>{m.username ?? m.id}</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          <RefreshCw className="h-4 w-4" /> Auto refresh (10s)
        </label>
      </div>
      <DataTable
        data={rows}
        columns={columns}
        searchKey="username"
        searchPlaceholder="Search players..."
        onAdd={() => setCreateOpen(true)}
        addLabel="Add Player"
        variant="adminListing"
        getRowClassName={(row) => (row.is_active === false || row.no_activity_7_days === true ? "bg-destructive/15" : "")}
      />

      {/* Single-field cell edit / view modal */}
      <Dialog
        open={!!cellEdit}
        onOpenChange={(open) => {
          if (!open) setCellEdit(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              {cellEdit?.editable ? "Edit" : "View"} — {cellEdit?.label}
            </DialogTitle>
            {cellEdit && <p className="text-xs text-muted-foreground">{cellEdit.row.username}</p>}
          </DialogHeader>
          {cellEdit && (
            <div className="py-2">
              {cellEdit.editable ? (
                <Input
                  value={cellEditValue}
                  onChange={(e) => setCellEditValue(e.target.value)}
                  placeholder={cellEdit.label}
                />
              ) : (
                <p className="text-sm break-all">{String(cellEdit.value ?? "—")}</p>
              )}
            </div>
          )}
          {cellEdit?.editable && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setCellEdit(null)} disabled={cellEditSaving}>Cancel</Button>
              <Button
                className="gold-gradient text-primary-foreground"
                disabled={cellEditSaving}
                onClick={async () => {
                  if (!cellEdit?.row?.id) return;
                  const value = cellEditValue.trim();
                  if (role === "master" || role === "super") {
                    setPendingCellSave({ id: cellEdit.row.id as number, field: cellEdit.field, value });
                    setCellEdit(null);
                    setPinOpen(true);
                    return;
                  }
                  setCellEditSaving(true);
                  try {
                    await updatePlayer(cellEdit.row.id as number, { [cellEdit.field]: value }, role);
                    queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
                    toast({ title: `${cellEdit.label} updated.` });
                    setCellEdit(null);
                  } catch (e) {
                    const msg = (e as { detail?: string })?.detail ?? "Failed to update";
                    toast({ title: msg, variant: "destructive" });
                  } finally {
                    setCellEditSaving(false);
                  }
                }}
              >
                {cellEditSaving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Player */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) {
          setCreateName(""); setCreateUsername(""); setCreatePhone(""); setCreateEmail(""); setCreateWhatsApp(""); setCreatePassword(""); setCreateParentId("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Create Player</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(role === "powerhouse" || role === "super") && (
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Master</label>
                <select
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm mt-1"
                  value={createParentId}
                  onChange={(e) => setCreateParentId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">Select master</option>
                  {(mastersList as { id?: number; username?: string }[]).map((m) => (
                    <option key={m.id} value={m.id}>{m.username ?? m.id}</option>
                  ))}
                </select>
              </div>
            )}
            <Input placeholder="Full Name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
            <Input placeholder="Username" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} />
            <Input placeholder="Phone" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} />
            <Input placeholder="Email (optional)" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
            <Input placeholder="WhatsApp Number" value={createWhatsApp} onChange={(e) => setCreateWhatsApp(e.target.value)} />
            <Input type="password" placeholder="Password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} className="md:col-span-2" />
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
                  };
                  if (createEmail.trim()) body.email = createEmail.trim();
                  if (createWhatsApp.trim()) body.whatsapp_number = createWhatsApp.trim();
                  if (role === "powerhouse" || role === "super") {
                    if (createParentId === "" || createParentId === undefined) {
                      toast({ title: "Please select a Master.", variant: "destructive" });
                      return;
                    }
                    body.parent = createParentId;
                  }
                  await createPlayer(body, role);
                  queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
                  toast({ title: "Player created successfully." });
                  setCreateOpen(false);
                  setCreateName(""); setCreateUsername(""); setCreatePhone(""); setCreateEmail(""); setCreateWhatsApp(""); setCreatePassword(""); setCreateParentId("");
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

      {/* View Player */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Player Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">Username</span><p className="font-medium">{String(selectedUser.username ?? "")}</p></div>
                <div><span className="text-muted-foreground text-xs">Full Name</span><p className="font-medium">{String(selectedUser.name ?? "")}</p></div>
                <div><span className="text-muted-foreground text-xs">Phone</span><p className="font-medium">{String(selectedUser.phone ?? "")}</p></div>
                <div><span className="text-muted-foreground text-xs">Status</span><p><StatusBadge status={selectedUser.is_active === false ? "inactive" : "active"} /></p></div>
                <div><span className="text-muted-foreground text-xs">Balance</span><p className="font-medium">₹{Number(selectedUser.main_balance ?? 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Bonus</span><p className="font-medium">₹{Number(selectedUser.bonus_balance ?? 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Exposure</span><p className="font-medium">₹{Number(selectedUser.exposure_balance ?? 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Joined</span><p className="font-medium">{selectedUser.created_at ? new Date(String(selectedUser.created_at)).toLocaleDateString() : ""}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Player */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditSaving(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Edit Player</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" />
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" />
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
                  await updatePlayer(selectedUser.id as number, { name: editName.trim(), phone: editPhone.trim() }, role);
                  queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
                  toast({ title: "Player updated successfully." });
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

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Deposit to {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="Amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            <Textarea placeholder="Remarks (optional)" rows={2} value={depositRemarks} onChange={(e) => setDepositRemarks(e.target.value)} />
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

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Withdraw from {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="Amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            <Textarea placeholder="Remarks (optional)" rows={2} value={withdrawRemarks} onChange={(e) => setWithdrawRemarks(e.target.value)} />
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
            <Input type="password" placeholder="Confirm New Password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground"
              onClick={() => {
                if (newPassword !== newPasswordConfirm) {
                  toast({ title: "Passwords do not match", variant: "destructive" });
                  return;
                }
                if (newPassword.length < 6) {
                  toast({ title: "Password must be at least 6 characters", variant: "destructive" });
                  return;
                }
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

      <PinDialog
        open={pinOpen}
        onClose={() => {
          setPinOpen(false);
          setPendingAction(null);
          setPendingPayload({});
          setPendingCellSave(null);
        }}
        onConfirm={async (pin) => {
          try {
            if (pendingCellSave) {
              await updatePlayer(pendingCellSave.id, { [pendingCellSave.field]: pendingCellSave.value, pin }, role);
              queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
              toast({ title: "Updated." });
              setPendingCellSave(null);
              setPinOpen(false);
              return;
            }
            if (pendingAction === "deposit") {
              const userId = pendingPayload.userId as number;
              const amount = pendingPayload.amount as string;
              const remarks = (pendingPayload.remarks as string) ?? "";
              await directDeposit(
                { user_id: userId, amount: Number(amount) || 0, remarks, pin },
                role
              );
              queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
              queryClient.invalidateQueries({ queryKey: ["admin-deposits", role] });
              toast({ title: "Deposit created and approved." });
            } else if (pendingAction === "withdraw") {
              const userId = pendingPayload.userId as number;
              const amount = pendingPayload.amount as string;
              const remarks = (pendingPayload.remarks as string) ?? "";
              await directWithdraw(
                { user_id: userId, amount: Number(amount) || 0, remarks, pin },
                role
              );
              queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
              queryClient.invalidateQueries({ queryKey: ["admin-withdrawals", role] });
              toast({ title: "Withdrawal created and approved." });
            } else if (pendingAction === "resetPassword") {
              const userId = pendingPayload.userId as number;
              const new_password = pendingPayload.new_password as string;
              await resetPassword(userId, { pin, new_password }, role, "players");
              queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
              toast({ title: "Password reset successfully." });
            }
            setPinOpen(false);
            setPendingAction(null);
            setPendingPayload({});
          } catch (e: unknown) {
            const msg = (e as { detail?: string })?.detail ?? "Something went wrong.";
            toast({ title: msg, variant: "destructive" });
          }
        }}
        title="Enter PIN to confirm"
      />

      <PinDialog
        open={togglePinOpen}
        onClose={() => { setTogglePinOpen(false); setToggleTarget(null); }}
        onConfirm={async (pin) => {
          if (!toggleTarget?.row?.id) return;
          try {
            await togglePlayerActive(toggleTarget.row.id, { pin, is_active: toggleTarget.nextActive }, role);
            queryClient.invalidateQueries({ queryKey: ["admin-players", role] });
            setTogglePinOpen(false);
            setToggleTarget(null);
            toast({ title: toggleTarget.nextActive ? "User activated." : "User deactivated." });
          } catch (e: unknown) {
            const msg = (e as { detail?: string })?.detail ?? "Invalid PIN or request failed.";
            toast({ title: msg, variant: "destructive" });
          }
        }}
        title={toggleTarget?.nextActive ? "Enter PIN to activate user" : "Enter PIN to deactivate user"}
      />

      <AlertDialog open={!!playerToDelete} onOpenChange={(open) => { if (!open) setPlayerToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete player?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the player &quot;{playerToDelete ? String(playerToDelete.username ?? playerToDelete.id) : ""}&quot;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPlayer}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlayer} disabled={deletingPlayer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingPlayer ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPlayers;
