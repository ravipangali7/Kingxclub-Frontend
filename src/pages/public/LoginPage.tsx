import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getSiteSetting, getWhatsAppLink, getPublicCountries } from "@/api/site";
import { COUNTRY_CODES } from "@/constants/countryCodes";
import { Eye, EyeOff, Gamepad2 } from "lucide-react";

const googleClientId = "386184793784-njlhdvqjh0698tnc5tffi79m5pjqpig4.apps.googleusercontent.com";

const roleRedirect: Record<string, string> = {
  powerhouse: "/powerhouse/players",
  super: "/super/masters",
  master: "/master/players",
  player: "/player",
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState<string>("977");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleUsername, setGoogleUsername] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState("");
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [showGoogleUsernameStep, setShowGoogleUsernameStep] = useState(false);
  const { login, loginWithGoogle, googleComplete } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const { data: countryOptions } = useQuery({ queryKey: ["public-countries"], queryFn: getPublicCountries });
  const countries = (countryOptions && countryOptions.length > 0) ? countryOptions : COUNTRY_CODES.map((c) => ({ value: c.value, label: c.label }));
  const whatsAppLink = getWhatsAppLink(siteSetting as import("@/api/site").SiteSettingRecord | undefined);

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
        const user = result as import("@/contexts/AuthContext").User;
        const nextParam = searchParams.get("next") ?? "";
        const isSafeNext = nextParam.startsWith("/") && !nextParam.startsWith("//");
        const to = isSafeNext ? nextParam : (roleRedirect[user.role] || "/");
        navigate(to, { replace: true });
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
      const user = await googleComplete(googleIdToken, u, googlePassword);
      const nextParam = searchParams.get("next") ?? "";
      const isSafeNext = nextParam.startsWith("/") && !nextParam.startsWith("//");
      const to = isSafeNext ? nextParam : (roleRedirect[user.role] || "/");
      navigate(to, { replace: true });
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Could not create account.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password, countryCode);
      const nextParam = searchParams.get("next") ?? "";
      const isSafeNext = nextParam.startsWith("/") && !nextParam.startsWith("//");
      const to = isSafeNext ? nextParam : (roleRedirect[user.role] || "/");
      navigate(to, { replace: true });
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail ?? "Invalid credentials.";
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
            <Gamepad2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-gaming text-xl neon-text tracking-wide">WELCOME BACK</CardTitle>
          <p className="text-xs text-muted-foreground">Sign in to your Karnali X account</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {showGoogleUsernameStep ? (
            <form onSubmit={handleGoogleUsernameSubmit} className="space-y-4">
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
              <div className="relative">
                <Input
                  type={showGooglePassword ? "text" : "password"}
                  placeholder="Password (min 6 characters)"
                  className="h-11 pr-10"
                  value={googlePassword}
                  onChange={(e) => setGooglePassword(e.target.value)}
                  minLength={6}
                />
                <button type="button" onClick={() => setShowGooglePassword(!showGooglePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showGooglePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showGooglePassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="h-11 pr-10"
                  value={googleConfirmPassword}
                  onChange={(e) => setGoogleConfirmPassword(e.target.value)}
                  minLength={6}
                />
                <button type="button" onClick={() => setShowGooglePassword(!showGooglePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showGooglePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Country code</label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Username" className="h-11" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password" className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full gold-gradient text-primary-foreground font-display font-semibold h-11 neon-glow-sm" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="relative my-4">
                <span className="bg-card px-2 text-xs text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">Or</span>
                <div className="h-px bg-border" />
              </div>
              <div className="flex flex-col gap-2">
                {googleClientId && (
                  <div className="flex justify-center [&_iframe]:!min-h-[44px]">
                    <GoogleLogin
                      onSuccess={(res) => res.credential && handleGoogleSuccess(res.credential)}
                      onError={() => setError("Google sign-in was cancelled or failed.")}
                      useOneTap={false}
                      theme="filled_black"
                      size="large"
                      text="signin_with"
                      width="320"
                    />
                  </div>
                )}
                {whatsAppLink && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-green-600 text-green-600 hover:bg-green-600/10"
                    onClick={() => window.open(whatsAppLink, "_blank", "noopener,noreferrer")}
                  >
                    Login with WhatsApp
                  </Button>
                )}
              </div>
            </>
          )}
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/forgot-password" className="text-primary hover:underline font-medium">Forgot password?</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
          <p className="text-center pt-2">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors">
              Back to Home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
