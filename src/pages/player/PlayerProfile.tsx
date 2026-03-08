import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/utils/currency";
import { User, Phone, Mail, Key, CreditCard, ChevronRight, LogOut, BarChart3, Clock, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { getProfile, updateProfile, getPlayerGameLog } from "@/api/player";
import type { PlayerProfileResponse } from "@/api/player";

const profileLinks = [
  { label: "Payment Modes", path: "/player/payment-modes", icon: CreditCard, color: "text-primary" },
  { label: "Bet History", path: "/player/game-results", icon: BarChart3, color: "text-neon" },
  { label: "Transactions", path: "/player/transactions", icon: Clock, color: "text-warning" },
  { label: "Change Password", path: "/player/change-password", icon: Key, color: "text-accent" },
];

function formatBalance(value: string | undefined): string {
  if (value == null || value === "") return "0";
  const n = parseFloat(String(value));
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function avatarInitial(profile: PlayerProfileResponse | undefined): string {
  if (!profile) return "?";
  const name = (profile.name || "").trim();
  if (name.length > 0) return name.charAt(0).toUpperCase();
  const username = (profile.username || "").trim();
  if (username.length > 0) return username.charAt(0).toUpperCase();
  return "?";
}

const PlayerProfile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const symbol = getCurrencySymbol(user);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["player-profile"],
    queryFn: getProfile,
  });

  const { data: gameLog } = useQuery({
    queryKey: ["player-game-log"],
    queryFn: getPlayerGameLog,
  });

  const gamesCount = Array.isArray(gameLog) ? gameLog.length : null;

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
      updateProfile(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["player-profile"] });
      await refreshUser();
      setEditing(false);
      toast({ title: "Profile updated successfully!" });
    },
    onError: (err: unknown) => {
      const message = err && typeof err === "object" && "detail" in err
        ? String((err as { detail?: string }).detail)
        : err instanceof Error ? err.message : "Update failed";
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      name,
      phone,
      email,
      whatsapp_number: whatsapp || undefined,
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <p className="text-destructive">Failed to load profile.</p>
      </div>
    );
  }

  const displayName = (profile?.name || "").trim() || (profile?.username || "").trim() || "Player";
  const usernameHandle = profile?.username ? `@${profile.username}` : "@—";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <h2 className="font-gaming font-bold text-xl neon-text tracking-wider">PROFILE</h2>

      {/* Avatar & Info */}
      <Card className="overflow-hidden gaming-card">
        <div className="h-20 gold-gradient relative">
          <div className="absolute inset-0 gaming-grid-bg opacity-30" />
        </div>
        <CardContent className="p-5 -mt-10 text-center">
          <div className="h-20 w-20 rounded-full gold-gradient mx-auto flex items-center justify-center ring-4 ring-card neon-glow">
            <span className="font-gaming font-bold text-2xl text-primary-foreground">{avatarInitial(profile)}</span>
          </div>
          <h3 className="font-display font-semibold text-xl mt-3">{displayName}</h3>
          <p className="text-xs text-muted-foreground">{usernameHandle}</p>
          <div className="flex justify-center gap-4 mt-3">
            <div className="text-center">
              <p className="font-gaming font-bold text-sm text-primary">{symbol}{formatBalance(profile?.main_balance)}</p>
              <p className="text-[9px] text-muted-foreground">Balance</p>
            </div>
            <div className="text-center">
              <p className="font-gaming font-bold text-sm text-accent">{symbol}{formatBalance(profile?.bonus_balance)}</p>
              <p className="text-[9px] text-muted-foreground">Bonus</p>
            </div>
            <div className="text-center">
              <p className="font-gaming font-bold text-sm text-success">{gamesCount != null ? gamesCount : "—"}</p>
              <p className="text-[9px] text-muted-foreground">Games</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Info */}
      <Card className="gaming-card">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold text-sm">Personal Info</h3>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => setEditing(!editing)}>
              <Edit className="h-3 w-3" /> {editing ? "Cancel" : "Edit"}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input value={name} onChange={(e) => setName(e.target.value)} readOnly={!editing} className={!editing ? "border-transparent bg-transparent" : ""} />
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} readOnly={!editing} className={!editing ? "border-transparent bg-transparent" : ""} />
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!editing} className={!editing ? "border-transparent bg-transparent" : ""} />
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
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full gold-gradient text-primary-foreground font-gaming tracking-wider neon-glow-sm"
            >
              SAVE CHANGES
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="space-y-2">
        {profileLinks.map((link) => (
          <Link key={link.path} to={link.path}>
            <Card className="hover:border-primary/30 hover:neon-glow-sm transition-all gaming-card">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <link.icon className={`h-4 w-4 ${link.color}`} />
                  </div>
                  <span className="text-sm font-medium">{link.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" /> Logout
      </Button>
    </div>
  );
};

export default PlayerProfile;
