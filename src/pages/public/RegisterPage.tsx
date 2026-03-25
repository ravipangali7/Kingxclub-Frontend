import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { REGISTER_COUNTRY_OPTIONS } from "@/constants/countryCodes";
import { getSiteSetting } from "@/api/site";
import { UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { signupCheckPhone, signupSendOtp, signupVerifyOtp } from "@/api/auth";

type Step = "phone" | "otp" | "name" | "password";

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "****";
  return "*".repeat(phone.length - 4) + phone.slice(-4);
}

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get("ref") ?? "";
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState<string>("977");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [signupToken, setSignupToken] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleUsername, setGoogleUsername] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState("");
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [showGoogleUsernameStep, setShowGoogleUsernameStep] = useState(false);
  const { register, loginWithGoogle, googleComplete } = useAuth();
  const navigate = useNavigate();
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const googleAuthEnabled = Boolean((siteSetting as { google_auth_enabled?: boolean } | undefined)?.google_auth_enabled);
  const googleClientId = ((siteSetting as { google_client_id?: string } | undefined)?.google_client_id ?? "").trim();
  const countries = REGISTER_COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: c.label }));

  const handleGoogleSuccess = async (credential: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await loginWithGoogle(credential);
      if ("needs_username" in result && result.needs_username) {
        setGoogleIdToken(credential);
        setShowGoogleUsernameStep(true);
        setGoogleUsername("");
        setGooglePassword("");
        setGoogleConfirmPassword("");
      } else {
        navigate("/player", { replace: true });
      }
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Google sign-in failed.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = googleUsername.trim();
    if (!u || u.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!googlePassword || googlePassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (googlePassword !== googleConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await googleComplete(googleIdToken, u, googlePassword);
      navigate("/player", { replace: true });
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Could not create account.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refFromUrl) setReferralCode(refFromUrl);
  }, [refFromUrl]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    const fullPhone = countryCode + digits;
    if (!digits || fullPhone.length < 10) {
      setError("Enter a valid phone number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { exists } = await signupCheckPhone(fullPhone);
      if (exists) {
        setError("An account with this phone already exists. Please log in.");
        return;
      }
      await signupSendOtp(fullPhone, otpChannel);
      setVerifiedPhone(fullPhone);
      toast({ title: otpChannel === "whatsapp" ? "OTP sent via WhatsApp." : "OTP sent to your phone." });
      setStep("otp");
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Failed. Try again.";
      setError(detail);
      if (detail.toLowerCase().includes("whatsapp") && detail.toLowerCase().includes("not configured")) {
        toast({ title: "WhatsApp not available. Try SMS.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { signup_token } = await signupVerifyOtp(verifiedPhone, otp);
      setSignupToken(signup_token);
      setStep("name");
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Invalid or expired OTP.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    setError("");
    setStep("password");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({
        signup_token: signupToken,
        phone: verifiedPhone,
        name: name.trim(),
        password,
        referral_code: refFromUrl.trim() || referralCode.trim() || undefined,
        country_code: countryCode || undefined,
      });
      navigate("/player", { replace: true });
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Registration failed.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy relative overflow-hidden">
      <div className="absolute inset-0 hero-bg" />
      <div className="absolute inset-0 gaming-grid-bg opacity-30" />
      <Card className="w-full max-w-sm relative z-10 theme-card">
        <CardHeader className="text-center space-y-3">
          <div className="h-16 w-16 mx-auto rounded-xl gold-gradient flex items-center justify-center neon-glow">
            <UserPlus className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-gaming text-xl neon-text tracking-wide">CREATE ACCOUNT</CardTitle>
          <p className="text-xs text-muted-foreground">
            {step === "phone" && "Enter your phone number"}
            {step === "otp" && "Enter the code we sent"}
            {step === "name" && "Your name"}
            {step === "password" && "Choose a password"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {showGoogleUsernameStep ? (
            <form onSubmit={handleGoogleUsernameSubmit} className="space-y-3">
              <p className="text-xs text-muted-foreground">Choose a username and password to finish signing up with Google.</p>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Input
                placeholder="Username (3–30 characters, letters, numbers, underscores)"
                className="h-11"
                value={googleUsername}
                onChange={(e) => setGoogleUsername(e.target.value)}
                minLength={3}
                maxLength={30}
              />
              <PasswordInput
                placeholder="Password (min 6 characters)"
                className="h-11"
                value={googlePassword}
                onChange={(e) => setGooglePassword(e.target.value)}
                minLength={6}
              />
              <PasswordInput
                placeholder="Confirm password"
                className="h-11"
                value={googleConfirmPassword}
                onChange={(e) => setGoogleConfirmPassword(e.target.value)}
                minLength={6}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => { setShowGoogleUsernameStep(false); setGoogleIdToken(""); setGooglePassword(""); setGoogleConfirmPassword(""); setError(""); }}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1 gold-gradient text-primary-foreground font-display font-semibold h-11 neon-glow-sm" disabled={loading}>
                  {loading ? "Creating account..." : "Continue"}
                </Button>
              </div>
            </form>
          ) : (
          <>
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="h-11 w-[120px] shrink-0">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Phone (e.g. 9812345678)"
                  className="h-11 flex-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">OTP via</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={otpChannel === "sms" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => setOtpChannel("sms")}
                  >
                    SMS
                  </Button>
                  <Button
                    type="button"
                    variant={otpChannel === "whatsapp" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-10 border-green-600 text-green-600 hover:bg-green-600/10 hover:text-green-600 data-[state=active]:bg-green-600/20"
                    onClick={() => setOtpChannel("whatsapp")}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
              {refFromUrl ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Referral</p>
                  <p className="text-sm font-medium text-foreground">You are referred by <span className="text-primary font-semibold">{refFromUrl}</span></p>
                </div>
              ) : (
                referralCode && (
                  <Input
                    placeholder="Referral code (optional)"
                    className="h-11"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                  />
                )
              )}
              <Button type="submit" className="w-full gold-gradient text-primary-foreground font-display font-semibold h-11 neon-glow-sm" disabled={loading}>
                {loading ? "Sending OTP..." : "Continue"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-3">
              <p className="text-xs text-muted-foreground">Code sent to {maskPhone(verifiedPhone)}</p>
              <Input
                placeholder="6-digit code"
                className="h-11"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full gold-gradient text-primary-foreground font-display font-semibold h-11 neon-glow-sm" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          )}

          {step === "name" && (
            <form onSubmit={handleNameNext} className="space-y-3">
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Input placeholder="Full name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} required />
              <Button type="submit" className="w-full gold-gradient text-primary-foreground font-display font-semibold h-11 neon-glow-sm">
                Next
              </Button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleRegister} className="space-y-3">
              {error && <p className="text-xs text-destructive">{error}</p>}
              <PasswordInput
                placeholder="Password (min 6 characters)"
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full gold-gradient text-primary-foreground font-display font-semibold h-11 neon-glow-sm" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          )}

          <div className="relative my-4">
            <span className="bg-card px-2 text-xs text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">Or</span>
            <div className="h-px bg-border" />
          </div>
          <div className="flex flex-col gap-2 relative z-10">
                {googleAuthEnabled && googleClientId && (
                  <div className="flex justify-center mb-1 [&_iframe]:!min-h-[44px]">
                    <GoogleLogin
                      onSuccess={(res) => res.credential && handleGoogleSuccess(res.credential)}
                      onError={() => setError("Google sign-in was cancelled or failed.")}
                      useOneTap={false}
                      theme="filled_black"
                      size="large"
                      text="signup_with"
                      width="320"
                    />
                  </div>
                )}
              </div>

          <p className="text-center text-xs text-muted-foreground relative z-20">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium inline-block relative z-20">Sign In</Link>
          </p>
          <p className="text-center pt-2">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors">
              Back to Home
            </Link>
          </p>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
