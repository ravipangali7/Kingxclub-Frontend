import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { getCleanDataMetadata, executeCleanData } from "@/api/admin";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_LABELS: Record<string, string> = {
  user: "User",
  master: "Master",
  super: "Super",
  powerhouse: "Powerhouse",
};

const CONFIRM_PHRASE = "DELETE";

export default function PowerhouseCleanData() {
  const queryClient = useQueryClient();
  const { data: meta, isLoading } = useQuery({ queryKey: ["clean-data-meta"], queryFn: getCleanDataMetadata });
  const models = meta?.models ?? [];
  const presetIds = meta?.preset_ids?.length ? meta.preset_ids : ["user", "master", "super", "powerhouse"];

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    if (!models.length) return;
    const init: Record<string, boolean> = {};
    for (const m of models) {
      init[m.id] = false;
    }
    setSelected(init);
    setActivePreset(null);
  }, [models]);

  const applyPreset = (presetId: string) => {
    setActivePreset(presetId);
    const next: Record<string, boolean> = {};
    for (const m of models) {
      if (m.protected) next[m.id] = false;
      else next[m.id] = Boolean(m.presets[presetId]);
    }
    setSelected(next);
  };

  const toggleModel = (id: string, prot: boolean) => {
    if (prot) return;
    setSelected((s) => ({ ...s, [id]: !s[id] }));
    setActivePreset(null);
  };

  const selectedCleanableIds = useMemo(
    () => models.filter((m) => !m.protected && selected[m.id]).map((m) => m.id),
    [models, selected]
  );
  const selectedCount = selectedCleanableIds.length;

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const closeWizard = () => {
    setWizardOpen(false);
    setStep(1);
    setPin("");
    setPassword("");
    setConfirmText("");
  };

  const mutation = useMutation({
    mutationFn: () =>
      executeCleanData({
        pin,
        password,
        models: selectedCleanableIds,
      }),
    onSuccess: (res) => {
      const parts = Object.entries(res.deleted || {})
        .map(([k, n]) => `${k}: ${n}`)
        .join(", ");
      toast({
        title: "Clean data completed",
        description: parts || "Done.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["supers"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["siteSetting"] });
      queryClient.invalidateQueries({ queryKey: ["admin-super-settings"] });
      queryClient.invalidateQueries({ queryKey: ["clean-data-meta"] });
      closeWizard();
    },
    onError: (err: unknown) => {
      const detail = (err as { detail?: string })?.detail ?? "Request failed.";
      toast({ title: detail, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
          <Eraser className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl neon-text tracking-wide">Clean Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose which tables to clear or reset. Game catalog (games, categories, providers) is always preserved. Powerhouse accounts are never deleted.
          </p>
        </div>
      </div>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base font-display">Clean under</CardTitle>
          <CardDescription>Quick-select presets. You can still adjust individual models below.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {presetIds.map((pid) => (
            <Button
              key={pid}
              type="button"
              variant={activePreset === pid ? "default" : "outline"}
              size="sm"
              className={cn(activePreset === pid && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              onClick={() => applyPreset(pid)}
              disabled={isLoading || !models.length}
            >
              {PRESET_LABELS[pid] ?? pid}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Models</CardTitle>
          <CardDescription>
            {selectedCount} model{selectedCount !== 1 ? "s" : ""} selected for cleanup
            {isLoading && " · Loading…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border max-h-[min(60vh,520px)] overflow-y-auto rounded-md border border-border">
          {models.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{m.label}</p>
                {m.protected && <p className="text-[11px] text-muted-foreground mt-0.5">Always preserved</p>}
              </div>
              <Switch checked={m.protected ? false : Boolean(selected[m.id])} onCheckedChange={() => toggleModel(m.id, m.protected)} disabled={m.protected} aria-label={m.label} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          Irreversible. Confirm with PIN, password, and typed phrase.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="font-display tracking-wide"
          disabled={selectedCount === 0 || isLoading}
          onClick={() => {
            setWizardOpen(true);
            setStep(1);
            setPin("");
            setPassword("");
            setConfirmText("");
          }}
        >
          Clean Data
        </Button>
      </div>

      <Dialog open={wizardOpen} onOpenChange={(o) => { if (!o && !mutation.isPending) closeWizard(); }}>
        <DialogContent className="max-w-md border-destructive/30">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {step === 1 && "Confirm PIN"}
              {step === 2 && "Account password"}
              {step === 3 && "Final confirmation"}
              <span className="block text-muted-foreground text-xs font-normal mt-1">Step {step} of 3</span>
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Enter your Powerhouse PIN.</p>
              <PasswordInput placeholder="PIN" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center text-lg tracking-widest" disabled={mutation.isPending} />
              <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={closeWizard} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => setStep(2)} disabled={pin.length < 4 || mutation.isPending} className="gold-gradient text-primary-foreground">
                  Next
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Enter your account password.</p>
              <PasswordInput placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={mutation.isPending} />
              <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={mutation.isPending}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)} disabled={!password || mutation.isPending} className="gold-gradient text-primary-foreground">
                  Next
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  This cannot be undone
                </p>
                <p className="text-xs text-muted-foreground">
                  Selected tables will be cleared or reset. Data will not be recoverable. Games, categories, and providers stay intact; Powerhouse users are not removed.
                </p>
                <ul className="text-xs font-mono max-h-28 overflow-y-auto border border-border/50 rounded p-2 bg-background/80">
                  {selectedCleanableIds.map((id) => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Type {CONFIRM_PHRASE} to confirm</label>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={CONFIRM_PHRASE} className="mt-1 font-mono" disabled={mutation.isPending} autoComplete="off" />
              </div>
              <DialogFooter className="gap-2 sm:justify-end flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={mutation.isPending}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={confirmText.trim() !== CONFIRM_PHRASE || mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? "Working…" : "Execute cleanup"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
