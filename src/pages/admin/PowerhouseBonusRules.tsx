import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getBonusRulesAdmin, createBonusRule, updateBonusRule, deleteBonusRule } from "@/api/admin";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/hooks/use-toast";

function parseDateOnly(iso: unknown): string {
  if (iso == null || typeof iso !== "string") return "";
  const d = String(iso).slice(0, 10);
  return d.length === 10 ? d : "";
}

const PowerhouseBonusRules = () => {
  const queryClient = useQueryClient();
  const { data: bonusRules = [] } = useQuery({ queryKey: ["admin-bonus-rules"], queryFn: getBonusRulesAdmin });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Record<string, unknown> | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [bonusType, setBonusType] = useState("welcome");
  const [promoCode, setPromoCode] = useState("");
  const [rewardType, setRewardType] = useState<"percentage" | "flat">("percentage");
  const [rewardAmount, setRewardAmount] = useState("0");
  const [rollRequired, setRollRequired] = useState("0");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setBonusType("welcome");
    setPromoCode("");
    setRewardType("percentage");
    setRewardAmount("0");
    setRollRequired("0");
    setValidFrom("");
    setValidUntil("");
    setIsActive(true);
    setEditingRule(null);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingRule(row);
    setName(String(row.name ?? ""));
    setBonusType(String(row.bonus_type ?? "welcome"));
    setPromoCode(String(row.promo_code ?? ""));
    setRewardType((row.reward_type as "percentage" | "flat") ?? "percentage");
    setRewardAmount(String(row.reward_amount ?? "0"));
    setRollRequired(String(row.roll_required ?? "0"));
    setValidFrom(parseDateOnly(row.valid_from));
    setValidUntil(parseDateOnly(row.valid_until));
    setIsActive(Boolean(row.is_active));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRule?.id) return;
    const n = name.trim();
    if (!n) {
      toast({ title: "Bonus name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateBonusRule(Number(editingRule.id), {
        name: n,
        bonus_type: bonusType,
        promo_code: promoCode.trim() || null,
        reward_type: rewardType,
        reward_amount: rewardAmount || "0",
        roll_required: parseInt(rollRequired, 10) || 0,
        valid_from: validFrom ? `${validFrom}T00:00:00Z` : null,
        valid_until: validUntil ? `${validUntil}T23:59:59Z` : null,
        is_active: isActive,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-rules"] });
      toast({ title: "Bonus rule updated successfully." });
      resetForm();
      setEditOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to update bonus rule";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    setRuleToDelete(row);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ruleToDelete?.id) return;
    setDeleting(true);
    try {
      await deleteBonusRule(Number(ruleToDelete.id));
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-rules"] });
      toast({ title: "Bonus rule deleted." });
      setDeleteOpen(false);
      setRuleToDelete(null);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to delete bonus rule";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { header: "Name", accessor: (row: Record<string, unknown>) => String(row.name ?? "") },
    { header: "Type", accessor: (row: Record<string, unknown>) => <span className="capitalize">{String(row.bonus_type ?? "").replace(/_/g, " ")}</span> },
    { header: "Reward", accessor: (row: Record<string, unknown>) => `${row.reward_amount ?? ""}${row.reward_type === "percentage" ? "%" : " Fixed"}` },
    { header: "Roll", accessor: (row: Record<string, unknown>) => `x${row.roll_required ?? "-"}` },
    { header: "Status", accessor: (row: Record<string, unknown>) => <StatusBadge status={row.is_active ? "active" : "suspended"} /> },
    {
      header: "Actions",
      accessor: (row: Record<string, unknown>) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-xs text-crimson" onClick={() => handleDeleteClick(row)}>Delete</Button>
        </div>
      ),
    },
  ];

  const handleSave = async () => {
    const n = name.trim();
    if (!n) {
      toast({ title: "Bonus name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createBonusRule({
        name: n,
        bonus_type: bonusType,
        promo_code: promoCode.trim() || null,
        reward_type: rewardType,
        reward_amount: rewardAmount || "0",
        roll_required: parseInt(rollRequired, 10) || 0,
        valid_from: validFrom ? `${validFrom}T00:00:00Z` : null,
        valid_until: validUntil ? `${validUntil}T23:59:59Z` : null,
        is_active: isActive,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-bonus-rules"] });
      toast({ title: "Bonus rule created successfully." });
      resetForm();
      setCreateOpen(false);
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to create bonus rule";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Bonus Rules</h2>
      <DataTable data={bonusRules as Record<string, unknown>[]} columns={columns} searchKey="name" onAdd={() => setCreateOpen(true)} addLabel="Add Bonus Rule" />
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Add Bonus Rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Bonus Name" value={name} onChange={(e) => setName(e.target.value)} />
            <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" value={bonusType} onChange={(e) => setBonusType(e.target.value)}>
              <option value="welcome">Welcome</option>
              <option value="deposit">Deposit</option>
              <option value="referral">Referral</option>
            </select>
            <Input placeholder="Promo Code (optional)" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <select className="h-10 rounded-lg border border-border bg-background px-3 text-sm" value={rewardType} onChange={(e) => setRewardType(e.target.value as "percentage" | "flat")}>
                <option value="percentage">Percentage</option>
                <option value="flat">Fixed</option>
              </select>
              <Input placeholder="Reward Amount" type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} />
            </div>
            <Input placeholder="Roll Required" type="number" value={rollRequired} onChange={(e) => setRollRequired(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" placeholder="Valid From" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              <Input type="date" placeholder="Valid To" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Edit Bonus Rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Bonus Name" value={name} onChange={(e) => setName(e.target.value)} />
            <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" value={bonusType} onChange={(e) => setBonusType(e.target.value)}>
              <option value="welcome">Welcome</option>
              <option value="deposit">Deposit</option>
              <option value="referral">Referral</option>
            </select>
            <Input placeholder="Promo Code (optional)" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <select className="h-10 rounded-lg border border-border bg-background px-3 text-sm" value={rewardType} onChange={(e) => setRewardType(e.target.value as "percentage" | "flat")}>
                <option value="percentage">Percentage</option>
                <option value="flat">Fixed</option>
              </select>
              <Input placeholder="Reward Amount" type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} />
            </div>
            <Input placeholder="Roll Required" type="number" value={rollRequired} onChange={(e) => setRollRequired(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" placeholder="Valid From" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              <Input type="date" placeholder="Valid To" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
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
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bonus rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{ruleToDelete ? String(ruleToDelete.name ?? "") : ""}&quot;. This action cannot be undone.
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

export default PowerhouseBonusRules;
