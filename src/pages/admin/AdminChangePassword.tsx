import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { changePassword, type AdminRole } from "@/api/admin";

const getRoleFromPath = (pathname: string): AdminRole => {
  const segment = pathname.split("/")[1];
  if (segment === "super" || segment === "powerhouse") return segment;
  return "master";
};

const AdminChangePassword = () => {
  const { pathname } = useLocation();
  const role = getRoleFromPath(pathname);
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => changePassword(role, { old_password: current, new_password: newPw }),
    onSuccess: () => {
      toast({ title: "Password updated successfully. Use your new password next time." });
      setCurrent("");
      setNewPw("");
      setConfirm("");
    },
    onError: (err: Error) => {
      toast({ title: err?.message || "Failed to change password", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!current || !newPw || !confirm) {
      toast({ title: "Please fill all fields", variant: "destructive" });
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
    mutation.mutate();
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-display font-bold text-xl">{roleLabel} – Change Password</h2>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="h-14 w-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Current Password</label>
            <PasswordInput placeholder="Enter current password" value={current} onChange={(e) => setCurrent(e.target.value)} className="h-11" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">New Password</label>
            <PasswordInput placeholder="Enter new password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="h-11" />
            {newPw && (
              <p className={`text-[10px] mt-1 ${newPw.length >= 6 ? "text-green-600" : "text-destructive"}`}>
                {newPw.length >= 6 ? "✓ At least 6 characters" : "✗ Minimum 6 characters"}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Confirm New Password</label>
            <PasswordInput placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
            {confirm && newPw && (
              <p className={`text-[10px] mt-1 ${confirm === newPw ? "text-green-600" : "text-destructive"}`}>
                {confirm === newPw ? "✓ Passwords match" : "✗ Passwords don't match"}
              </p>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={mutation.isPending} className="w-full h-11">
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChangePassword;
