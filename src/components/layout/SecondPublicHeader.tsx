import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerNotification } from "@/contexts/PlayerNotificationContext";
import { getSiteSetting } from "@/api/site";
import { getPlayerUnreadMessageCount } from "@/api/player";
import { getMediaUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Bell, User, Search, Menu, X } from "lucide-react";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Game", path: "/games" },
  { label: "Live Casino", path: "/games" },
  { label: "Providers", path: "/providers" },
  { label: "Promotion", path: "/promotions" },
  { label: "Bonus", path: "/bonus" },
  { label: "Wallet", path: "/wallet" },
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

export const SecondPublicHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  const dashboardPath = user ? getDashboardPath(user.role) : "/player";

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const logo = (siteSetting as { logo?: string } | undefined)?.logo;
  const logoUrl = logo ? getMediaUrl(logo) : "/karnali-logo.png";
  const isPlayer = user?.role === "player";
  const messagesPath = isLoggedIn && !isPlayer ? `${dashboardPath}/messages` : null;
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["player-messages-unread"],
    queryFn: getPlayerUnreadMessageCount,
    enabled: isPlayer,
  });
  const messageBadge = isPlayer ? Number(unreadMessages) || 0 : 0;
  const notification = usePlayerNotification();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border text-foreground">
      <div className="flex items-center justify-between h-14 px-4 gap-4">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-9 w-9 rounded bg-primary/20 flex items-center justify-center">
            <img src={logoUrl} alt="KarnaliX" className="h-6 w-6 rounded object-contain" />
          </div>
          <span className="font-bold text-foreground hidden sm:inline">KarnaliX</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 max-w-xs hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link to={dashboardPath}>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9">
                  <User className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline text-sm">Dashboard</span>
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-9" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground h-9 text-sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 font-semibold text-sm">
                  Join
                </Button>
              </Link>
            </>
          )}
          {isPlayer && notification ? (
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground h-9 w-9"
              onClick={() => notification.openChat()}
            >
              <Bell className="h-5 w-5" />
              {messageBadge > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                  {messageBadge > 99 ? "99+" : messageBadge}
                </span>
              )}
            </Button>
          ) : messagesPath ? (
            <Link to={messagesPath}>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-9 w-9">
                <Bell className="h-5 w-5" />
                {messageBadge > 0 && (
                  <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                    {messageBadge > 99 ? "99+" : messageBadge}
                  </span>
                )}
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9">
              <Bell className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs hidden sm:inline">
            EN
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-foreground h-9 w-9" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded text-sm text-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <>
              <Link to={dashboardPath} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded text-sm text-primary font-medium">
                Dashboard
              </Link>
              <button type="button" onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded text-sm text-muted-foreground hover:bg-muted">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded text-sm text-accent font-medium">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded text-sm text-primary font-medium">
                Join
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
