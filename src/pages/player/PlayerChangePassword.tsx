import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { changePassword } from "@/api/player";

const PlayerChangePassword = () => {
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPw || !confirm) {
      toast({ title: "Please fill new password and confirm", variant: "destructive" });
      return;
    }
    if (newPw !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPw.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await changePassword({ new_password: newPw });
      toast({ title: "Password updated successfully!", description: "Please use your new password next time." });
      setNewPw("");
      setConfirm("");
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Failed to update password.";
      toast({ title: detail, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
      <h2 className="font-gaming font-bold text-xl neon-text tracking-wider">CHANGE PASSWORD</h2>

      <Card className="theme-card">
        <CardContent className="p-5 space-y-4">
          <div className="h-14 w-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
            <Lock className="h-7 w-7" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">New Password</label>
            <PasswordInput placeholder="Enter new password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="h-11" />
            {newPw && (
              <div className="flex gap-2 mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${newPw.length >= 6 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {newPw.length >= 6 ? "✓" : "✗"} 6+ chars
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[A-Z]/.test(newPw) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {/[A-Z]/.test(newPw) ? "✓" : "○"} Uppercase
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${/[0-9]/.test(newPw) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {/[0-9]/.test(newPw) ? "✓" : "○"} Number
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Confirm New Password</label>
            <PasswordInput placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
            {confirm && newPw && (
              <p className={`text-[10px] mt-1 ${confirm === newPw ? "text-success" : "text-destructive"}`}>
                {confirm === newPw ? "✓ Passwords match" : "✗ Passwords don't match"}
              </p>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full gold-gradient text-primary-foreground font-gaming tracking-wider h-11 neon-glow-sm">
            {loading ? "Updating..." : "UPDATE PASSWORD"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerChangePassword;
