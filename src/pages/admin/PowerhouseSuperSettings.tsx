import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getSuperSettings, saveSuperSettings } from "@/api/admin";
import { toast } from "@/hooks/use-toast";

const PowerhouseSuperSettings = () => {
  const queryClient = useQueryClient();
  const { data: superSettings } = useQuery({ queryKey: ["admin-super-settings"], queryFn: getSuperSettings });
  const [minDeposit, setMinDeposit] = useState("");
  const [maxDeposit, setMaxDeposit] = useState("");
  const [minWithdraw, setMinWithdraw] = useState("");
  const [maxWithdraw, setMaxWithdraw] = useState("");
  const [exposureLimit, setExposureLimit] = useState("");
  const [gameApiUrl, setGameApiUrl] = useState("");
  const [gameApiLaunchUrl, setGameApiLaunchUrl] = useState("");
  const [gameApiSecret, setGameApiSecret] = useState("");
  const [rejectSuggestionsJson, setRejectSuggestionsJson] = useState('{"data":[]}');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = (superSettings ?? {}) as Record<string, unknown>;
    setMinDeposit(String(s.min_deposit ?? ""));
    setMaxDeposit(String(s.max_deposit ?? ""));
    setMinWithdraw(String(s.min_withdraw ?? ""));
    setMaxWithdraw(String(s.max_withdraw ?? ""));
    setExposureLimit(String(s.exposure_limit ?? ""));
    setGameApiUrl(String(s.game_api_url ?? ""));
    setGameApiLaunchUrl(String(s.game_api_launch_url ?? ""));
    setGameApiSecret(String(s.game_api_secret ?? ""));
    const rr = s.reject_reason_suggestions;
    if (rr != null && typeof rr === "object") {
      try {
        setRejectSuggestionsJson(JSON.stringify(rr, null, 2));
      } catch {
        setRejectSuggestionsJson('{"data":[]}');
      }
    } else {
      setRejectSuggestionsJson('{"data":[]}');
    }
  }, [superSettings]);

  const handleSave = async () => {
    let reject_reason_suggestions: unknown;
    try {
      reject_reason_suggestions = JSON.parse(rejectSuggestionsJson) as unknown;
    } catch {
      toast({ title: "Reject suggestions: invalid JSON.", variant: "destructive" });
      return;
    }
    if (
      reject_reason_suggestions == null ||
      typeof reject_reason_suggestions !== "object" ||
      !Array.isArray((reject_reason_suggestions as { data?: unknown }).data)
    ) {
      toast({ title: 'Reject suggestions must be JSON like {"data":["reason 1","reason 2"]}.', variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await saveSuperSettings({
        min_deposit: minDeposit || "0",
        max_deposit: maxDeposit || "0",
        min_withdraw: minWithdraw || "0",
        max_withdraw: maxWithdraw || "0",
        exposure_limit: exposureLimit || "0",
        game_api_url: gameApiUrl.trim(),
        game_api_launch_url: gameApiLaunchUrl.trim(),
        game_api_secret: gameApiSecret.trim(),
        reject_reason_suggestions,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-super-settings"] });
      toast({ title: "Super settings saved." });
    } catch (e) {
      const msg = (e as { detail?: string })?.detail ?? "Failed to save settings";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-display font-bold text-xl">Super Settings</h2>
      <Card>
        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-display">Financial Settings</CardTitle></CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Deposit Min</label><Input type="number" value={minDeposit} onChange={(e) => setMinDeposit(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Deposit Max</label><Input type="number" value={maxDeposit} onChange={(e) => setMaxDeposit(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Withdraw Min</label><Input type="number" value={minWithdraw} onChange={(e) => setMinWithdraw(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Withdraw Max</label><Input type="number" value={maxWithdraw} onChange={(e) => setMaxWithdraw(e.target.value)} /></div>
          </div>
          <div><label className="text-xs text-muted-foreground">Exposure Limit</label><Input type="number" value={exposureLimit} onChange={(e) => setExposureLimit(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-display">Reject reason suggestions</CardTitle></CardHeader>
        <CardContent className="p-4 pt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            JSON with a <code className="text-[10px] bg-muted px-1 rounded">data</code> array of strings. Shown as quick-fill chips on deposit/withdraw/bonus/KYC reject dialogs.
          </p>
          <Textarea
            value={rejectSuggestionsJson}
            onChange={(e) => setRejectSuggestionsJson(e.target.value)}
            className="font-mono text-xs min-h-[120px]"
            spellCheck={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-display">API Settings</CardTitle></CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div><label className="text-xs text-muted-foreground">API Endpoint (getProvider/providerGame)</label><Input value={gameApiUrl} onChange={(e) => setGameApiUrl(e.target.value)} placeholder="https://allapi.online/launch_game_js" /></div>
          <div><label className="text-xs text-muted-foreground">Launch URL (e.g. launch_game1_js)</label><Input value={gameApiLaunchUrl} onChange={(e) => setGameApiLaunchUrl(e.target.value)} placeholder="https://allapi.online/launch_game1_js" /></div>
          <div><label className="text-xs text-muted-foreground">API Secret</label><Input value={gameApiSecret} onChange={(e) => setGameApiSecret(e.target.value)} type="password" /></div>
        </CardContent>
      </Card>

      <Button className="gold-gradient text-primary-foreground font-display w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Settings"}</Button>
    </div>
  );
};

export default PowerhouseSuperSettings;
