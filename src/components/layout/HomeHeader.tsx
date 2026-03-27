import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, Bell, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerNotification } from "@/contexts/PlayerNotificationContext";
import { getCurrencySymbol } from "@/utils/currency";
import { getSiteSetting, getLiveBettingSections } from "@/api/site";
import { getPlayerUnreadMessageCount } from "@/api/player";
import { getMediaUrl } from "@/lib/api";
import { liveOddsTicker as defaultLiveOddsTicker } from "@/data/homePageMockData";
import { cn } from "@/lib/utils";
import { PlayerSidebarContent } from "./PlayerSidebarContent";

type TickerRow = { home: string; away: string; odds1: string; odds2: string; live?: boolean };

function mapLiveBettingToTickerRows(sections: { events?: { team1: string; team2: string; odds?: number[]; is_live?: boolean }[] }[]): TickerRow[] {
  const rows: TickerRow[] = [];
  for (const section of sections) {
    for (const ev of section.events ?? []) {
      const odds = ev.odds ?? [];
      rows.push({
        home: ev.team1,
        away: ev.team2,
        odds1: odds[0] != null ? String(odds[0]) : "",
        odds2: odds[1] != null ? String(odds[1]) : "",
        live: ev.is_live,
      });
    }
  }
  return rows;
}

const navItems = [
  { label: "Home", path: "/" },
  { label: "Games", path: "/games" },
  { label: "Categories", path: "/categories" },
  { label: "Providers", path: "/providers" },
  { label: "Promotion", path: "/promotions" },
];

function getDashboardPath(role: string): string {
  switch (role) {
    case "powerhouse": return "/powerhouse";
    case "super": return "/super/masters";
    case "master": return "/master/players";
    case "player":
    default: return "/player";
  }
}

export const HomeHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  const dashboardPath = user?.role ? getDashboardPath(user.role) : "/player";
  const symbol = getCurrencySymbol(user);
  const walletBalance = user?.total_balance != null ? `${symbol}${Number(user.total_balance).toLocaleString()}` : `${symbol}0.00`;

  const isPlayer = user?.role === "player";
  const depositPath = isPlayer ? "/player/wallet" : "/login";
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const { data: liveBettingSections = [] } = useQuery({ queryKey: ["liveBettingSections"], queryFn: getLiveBettingSections });
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["player-messages-unread"],
    queryFn: getPlayerUnreadMessageCount,
    enabled: isPlayer,
  });
  const messageBadge = isPlayer ? Number(unreadMessages) || 0 : 0;
  const notification = usePlayerNotification();
  const tickerRows: TickerRow[] = useMemo(() => {
    const fromApi = mapLiveBettingToTickerRows(liveBettingSections);
    return fromApi.length > 0 ? fromApi : defaultLiveOddsTicker;
  }, [liveBettingSections]);

  const logoUrl = (siteSetting as { logo?: string } | undefined)?.logo?.trim()
    ? getMediaUrl((siteSetting as { logo: string }).logo.trim())
    : "/karnali-logo.png";
  const siteName = (siteSetting as { name?: string } | undefined)?.name?.trim() || "KarnaliX";
  const scrollingText = String((siteSetting as { scrolling_text?: string } | undefined)?.scrolling_text ?? "");
  const hasScrollingText = scrollingText !== "";

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border">
      <div className="container flex flex-col min-w-0">
        <div className="flex items-center justify-between h-14 px-2 mobile:px-4 gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0 flex-shrink-0 z-10">
            <img src={logoUrl} alt={siteName} className="h-8 rounded-lg object-contain" />
            {/* <span className="font-gaming font-bold text-lg gradient-text tracking-tight hidden sm:inline">{siteName}</span> */}
          </Link>

          {/* Mobile: Deposit in center (only when logged in) */}
          {isLoggedIn && (
            <div className="flex-1 flex justify-center min-w-0 mobile:hidden">
              <Link
                to={depositPath}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-colors border shrink-0",
                  location.pathname === "/player/wallet"
                    ? "bg-primary/20 border-primary text-primary"
                    : "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary"
                )}
              >
                Deposit
              </Link>
            </div>
          )}

          <nav className="hidden mobile:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/bonus"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === "/bonus" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              Bonus
            </Link>
            {!isPlayer && (
              <Link
                to={isLoggedIn ? `${dashboardPath}/messages` : "/login"}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.startsWith(`${dashboardPath}/messages`) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                Message
              </Link>
            )}
            {isLoggedIn && (
              <>
                <Link
                  to={dashboardPath}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === dashboardPath || location.pathname.startsWith(`${dashboardPath}/`) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center gap-1 mobile:gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-2 mobile:px-3 py-1.5 rounded-lg glass border border-white/10">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-roboto-mono text-sm font-semibold text-foreground truncate max-w-[100px] sm:max-w-none">{walletBalance}</span>
            </div>
            <Link
              to={depositPath}
              className={cn(
                "hidden mobile:flex px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === "/player/wallet" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              Deposit
            </Link>
            {isPlayer ? (
              <Button
                variant="ghost"
                size="icon"
                className="relative min-h-[44px] min-w-[44px] touch-manipulation"
                onClick={() => notification?.openChat()}
              >
                <Bell className="h-5 w-5" />
                {messageBadge > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                    {messageBadge > 99 ? "99+" : messageBadge}
                  </span>
                )}
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="relative min-h-[44px] min-w-[44px] touch-manipulation">
                <Bell className="h-5 w-5" />
              </Button>
            )}
            {!isLoggedIn && (
              <>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-white/20 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/30 hover:text-foreground"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="rounded-lg bg-white text-primary hover:bg-white/90 font-semibold px-4 h-9 shadow-sm"
                  >
                    Register
                  </Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="icon" className="mobile:hidden min-h-[44px] min-w-[44px] touch-manipulation" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Live odds ticker */}
        <div className="h-9 border-t border-white/10 overflow-hidden bg-card/40">
          <div className="flex animate-ticker w-max py-1.5">
            {hasScrollingText ? (
              <>
                <span className="px-6 shrink-0 text-xs text-foreground/90 whitespace-pre">{scrollingText}</span>
                <span className="px-6 shrink-0 text-xs text-foreground/90 whitespace-pre">{scrollingText}</span>
              </>
            ) : (
              [...tickerRows, ...tickerRows].map((row, i) => (
                <div key={i} className="flex items-center gap-4 px-6 shrink-0 text-xs text-muted-foreground">
                  {row.live && (
                    <span className="flex items-center gap-1 text-green-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> LIVE
                    </span>
                  )}
                  <span className="text-foreground/90">{row.home}</span>
                  <span>vs</span>
                  <span className="text-foreground/90">{row.away}</span>
                  <span className="font-roboto-mono text-primary">{row.odds1}</span>
                  <span className="font-roboto-mono">{row.odds2}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu (visible below 450px) */}
      {menuOpen && (
        <nav className="mobile:hidden border-t border-border glass-strong animate-fade-in flex flex-col max-h-[70vh] overflow-hidden">
          <div className="p-2 mobile:p-4 space-y-1 overflow-y-auto scrollbar-hide min-h-0">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 mobile:px-4 py-3.5 rounded-lg text-sm font-medium min-h-[44px] touch-manipulation",
                  location.pathname === item.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/bonus" onClick={() => setMenuOpen(false)} className={cn("flex items-center gap-3 px-3 mobile:px-4 py-3 rounded-lg text-sm font-medium", location.pathname === "/bonus" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5")}>
              Bonus
            </Link>
            {isLoggedIn && (
              <Link to={depositPath} onClick={() => setMenuOpen(false)} className={cn("flex items-center gap-3 px-3 mobile:px-4 py-3 rounded-lg text-sm font-medium min-h-[44px] touch-manipulation", location.pathname === "/player/wallet" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                Deposit
              </Link>
            )}
            {isPlayer ? (
              <div className="border-t border-border mt-2 pt-2">
                <PlayerSidebarContent
                  user={user}
                  logout={logout}
                  currentPath={location.pathname}
                  onNavigate={() => setMenuOpen(false)}
                  compact
                />
              </div>
            ) : (
              <>
                <Link to={isLoggedIn ? `${dashboardPath}/messages` : "/login"} onClick={() => setMenuOpen(false)} className={cn("flex items-center gap-3 px-3 mobile:px-4 py-3 rounded-lg text-sm font-medium", location.pathname.startsWith(`${dashboardPath}/messages`) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                  Message
                </Link>
                {isLoggedIn && (
                  <>
                    <Link to={dashboardPath} onClick={() => setMenuOpen(false)} className={cn("flex items-center gap-3 px-3 mobile:px-4 py-3 rounded-lg text-sm font-medium", location.pathname === dashboardPath || location.pathname.startsWith(`${dashboardPath}/`) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                      Dashboard
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex items-center gap-3 px-3 mobile:px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 w-full text-left min-h-[44px] touch-manipulation">
                      Logout
                    </button>
                  </>
                )}
                <div className="flex items-center gap-2 pt-2 px-3 mobile:px-4">
                  <Wallet className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-roboto-mono text-sm truncate">{walletBalance}</span>
                </div>
                {!isLoggedIn && (
                  <div className="flex gap-2 pt-2">
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 min-w-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-lg border-white/20 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/30"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 min-w-0">
                      <Button
                        size="sm"
                        className="w-full rounded-lg bg-white text-primary hover:bg-white/90 font-semibold h-9"
                      >
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
