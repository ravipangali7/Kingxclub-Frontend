import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Mail, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { getProfile, updateProfile, type AdminRole } from "@/api/admin";

function getRoleFromPath(pathname: string): AdminRole {
  const segment = pathname.split("/")[1];
  if (segment === "super" || segment === "powerhouse") return segment;
  return "master";
}

export default function AdminProfile() {
  const { pathname } = useLocation();
  const role = getRoleFromPath(pathname);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-profile", role],
    queryFn: () => getProfile(role),
  });

  useEffect(() => {
    if (profile && typeof profile === "object") {
      setName(String(profile.name ?? ""));
      setPhone(String(profile.phone ?? ""));
      setEmail(String(profile.email ?? ""));
      setWhatsapp(String(profile.whatsapp_number ?? ""));
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; phone?: string; email?: string; whatsapp_number?: string }) =>
      updateProfile(role, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profile", role] });
      setEditing(false);
      toast({ title: "Profile updated successfully!" });
    },
    onError: (err: Error) => {
      toast({ title: err?.message || "Update failed", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ name, phone, email, whatsapp_number: whatsapp || undefined });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display font-bold text-xl">{roleLabel} Profile</h2>
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold text-sm">Personal Info</h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setEditing(!editing)}>
              <Edit className="h-3 w-3" /> {editing ? "Cancel" : "Edit"}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={!editing}
              className={!editing ? "border-transparent bg-transparent" : ""}
            />
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              readOnly={!editing}
              className={!editing ? "border-transparent bg-transparent" : ""}
            />
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!editing}
              className={!editing ? "border-transparent bg-transparent" : ""}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm w-4">WA</span>
            <Input
              placeholder="WhatsApp number"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              readOnly={!editing}
              className={!editing ? "border-transparent bg-transparent" : ""}
            />
          </div>
          {editing && (
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
              Save changes
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
