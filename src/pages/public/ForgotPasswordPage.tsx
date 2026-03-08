import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Gamepad2, Phone, Mail, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  forgotPasswordSearch,
  forgotPasswordSendOtp,
  forgotPasswordVerifyReset,
  type ForgotSearchResult,
} from "@/api/auth";

type Step = "search" | "channel" | "otp" | "done";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("search");
  const [searchInput, setSearchInput] = useState("");
  const [searchBy, setSearchBy] = useState<"phone" | "username" | "email">("username");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<ForgotSearchResult | null>(null);
  const [channel, setChannel] = useState<"phone" | "email">("phone");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload =
        searchBy === "phone"
          ? { phone: searchInput.trim() }
          : searchBy === "email"
            ? { email: searchInput.trim() }
            : { username: searchInput.trim() };
      const result = await forgotPasswordSearch(payload);
      setUser(result);
      if (!result.has_phone && !result.has_email) {
        if (result.whatsapp_number) {
          setStep("channel"); // show WhatsApp option only
        } else {
          toast({
            title: "No contact method",
            description: "You haven't set up email and phone. Contact support.",
            variant: "destructive",
          });
        }
      } else if (result.has_phone && result.has_email) {
        setStep("channel");
      } else {
        setChannel(result.has_phone ? "phone" : "email");
        await sendOtp(result.id, result.has_phone ? "phone" : "email");
        setStep("otp");
      }
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Search failed.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (userId: number, ch: "phone" | "email") => {
    setError("");
    setLoading(true);
    try {
      await forgotPasswordSendOtp(userId, ch);
      toast({ title: ch === "phone" ? "OTP sent to your phone." : "OTP sent to your email." });
      setStep("otp");
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Failed to send OTP.";
      setError(detail);
      toast({ title: detail, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChooseChannel = (ch: "phone" | "email") => {
    if (!user) return;
    setChannel(ch);
    sendOtp(user.id, ch);
  };

  const handleResetViaWhatsApp = () => {
    if (!user?.whatsapp_number) return;
    const num = user.whatsapp_number.replace(/\D/g, "");
    const url = `https://wa.me/${num}`;
    window.open(url, "_blank");
    toast({ title: "Opening WhatsApp. Ask your master for a password reset." });
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPasswordVerifyReset(user.id, otp, newPassword);
      toast({ title: "Password updated. You can now log in." });
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Reset failed.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy relative overflow-hidden">
      <div className="absolute inset-0 hero-bg" />
      <div className="absolute inset-0 gaming-grid-bg opacity-30" />
      <Card className="w-full max-w-sm relative z-10 gaming-card">
        <CardHeader className="text-center space-y-3">
          <div className="h-16 w-16 mx-auto rounded-xl gold-gradient flex items-center justify-center neon-glow">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-gaming text-xl neon-text tracking-wide">FORGOT PASSWORD</CardTitle>
          <p className="text-xs text-muted-foreground">
            {step === "search" && "Enter your username, phone, or email"}
            {step === "channel" && "Choose where to receive the code"}
            {step === "otp" && "Enter the code and new password"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "search" && (
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value as "phone" | "username" | "email")}
                  className="h-11 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="username">Username</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                </select>
                <Input
                  placeholder={searchBy === "phone" ? "Phone" : searchBy === "email" ? "Email" : "Username"}
                  className="h-11 flex-1"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Searching..." : "Find account"}
              </Button>
            </form>
          )}

          {step === "channel" && user && (
            <div className="space-y-3">
              {user.has_phone && user.phone_mask && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 justify-start gap-2"
                  onClick={() => handleChooseChannel("phone")}
                  disabled={loading}
                >
                  <Phone className="h-4 w-4" /> Send OTP to {user.phone_mask}
                </Button>
              )}
              {user.has_email && user.email_mask && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 justify-start gap-2"
                  onClick={() => handleChooseChannel("email")}
                  disabled={loading}
                >
                  <Mail className="h-4 w-4" /> Send OTP to {user.email_mask}
                </Button>
              )}
              {!user.has_phone && !user.has_email && user.whatsapp_number && (
                <Button
                  type="button"
                  className="w-full h-11 gap-2"
                  onClick={handleResetViaWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" /> Reset via WhatsApp
                </Button>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}

          {step === "otp" && user && (
            <form onSubmit={handleVerifyReset} className="space-y-3">
              <Input
                placeholder="Enter 6-digit code"
                className="h-11"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
              />
              <Input
                type="password"
                placeholder="New password (min 6 characters)"
                className="h-11"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                className="h-11"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Updating..." : "Reset password"}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline font-medium">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
