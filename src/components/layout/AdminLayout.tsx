import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle, Users, ArrowDownCircle, ArrowUpCircle,
  ShieldCheck, Gamepad2, Clock, Activity, Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Menu, X, Tag, Box, Gift, FileText, Star, Globe, LogOut, CreditCard, User, Key, Image,
  Calculator, LayoutPanelTop, LayoutDashboard, Megaphone, MapPin, LayoutGrid, Palette
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboard, getUnreadMessageCount } from "@/api/admin";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  role: "master" | "super" | "powerhouse";
}

type NavLinkItem = { label: string; path: string; icon: typeof Users };
type NavGroupItem = { label: string; icon: typeof Users; children: NavLinkItem[] };
type NavItem = NavLinkItem | NavGroupItem;
function isNavGroup(item: NavItem): item is NavGroupItem {
  return "children" in item && Array.isArray(item.children);
}

const getNavItems = (role: string): NavItem[] => {
  const profileItems: NavLinkItem[] = [
    { label: "Profile", path: "/profile", icon: User },
    { label: "Change Password", path: "/change-password", icon: Key },
  ];

  if (role === "powerhouse") {
    return [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      {
        label: "List of Users",
        icon: Users,
        children: [
          { label: "Super", path: "/supers", icon: Users },
          { label: "Master", path: "/masters", icon: Users },
          { label: "User", path: "/players", icon: Users },
        ],
      },
      { label: "Payment mode Verification", path: "/payment-mode-verification", icon: ShieldCheck },
      { label: "Account Statement", path: "/account-statement", icon: FileText },
      { label: "Bonus Statement", path: "/bonus-statement", icon: Gift },
      {
        label: "Client Request",
        icon: ArrowDownCircle,
        children: [
          { label: "Deposit", path: "/deposits", icon: ArrowDownCircle },
          { label: "Withdrawal", path: "/withdrawals", icon: ArrowUpCircle },
          { label: "Bonus Request", path: "/bonus-requests", icon: Gift },
          { label: "Total D/W", path: "/client-request/total-dw", icon: Clock },
          { label: "Super Master D/W", path: "/client-request/super-master-dw", icon: Users },
          { label: "Super D/W State", path: "/client-request/super-dw-state", icon: Calculator },
        ],
      },
      { label: "Client Activity", path: "/activity", icon: Activity },
      {
        label: "Game",
        icon: Gamepad2,
        children: [
          { label: "Categories", path: "/categories", icon: Tag },
          { label: "Provider", path: "/providers", icon: Box },
          { label: "Games", path: "/games", icon: Gamepad2 },
          { label: "Coming Soon", path: "/coming-soon-enrollments", icon: Clock },
          { label: "Bonus Rule", path: "/bonus-rules", icon: Gift },
          { label: "Bet History", path: "/game-log", icon: Gamepad2 },
        ],
      },
      {
        label: "Site",
        icon: Globe,
        children: [
          { label: "Slider", path: "/slider", icon: Image },
          { label: "Popup", path: "/popup", icon: LayoutPanelTop },
          { label: "Promotion", path: "/promotions", icon: Megaphone },
          { label: "Country", path: "/countries", icon: MapPin },
          { label: "CMS Page", path: "/cms", icon: FileText },
          { label: "Testimonial", path: "/testimonials", icon: Star },
          { label: "Home Category", path: "/site-home-category", icon: Tag },
          { label: "Home Top Games", path: "/site-home-top-games", icon: Gamepad2 },
          { label: "Home Provider", path: "/site-home-provider", icon: Box },
          { label: "Home Category Game", path: "/site-home-category-game", icon: LayoutGrid },
          { label: "Home Popular Game", path: "/site-home-popular-game", icon: Star },
          { label: "Home Coming Soon", path: "/site-home-coming-soon", icon: Clock },
          { label: "Home Refer Bonus", path: "/site-home-refer-bonus", icon: Gift },
          { label: "Home Payment Accepted", path: "/site-home-payment-accepted", icon: CreditCard },
          { label: "Site Theme", path: "/site-theme", icon: Palette },
          { label: "Site Setting", path: "/site-settings", icon: Globe },
        ],
      },
      { label: "Payment Method", path: "/payment-methods", icon: CreditCard },
      { label: "Super Setting", path: "/super-settings", icon: Settings },
      { label: "Change Password", path: "/change-password", icon: Key },
      { label: "Profile", path: "/profile", icon: User },
    ];
  }

  if (role === "super") {
    return [
      { label: "Messages", path: "/messages", icon: MessageCircle },
      { label: "List of Master", path: "/masters", icon: Users },
      { label: "List of User", path: "/players", icon: Users },
      { label: "Account Statement", path: "/account-statement", icon: FileText },
      { label: "Bonus Statement", path: "/bonus-statement", icon: Gift },
      {
        label: "Client Request",
        icon: ArrowDownCircle,
        children: [
          { label: "Deposit", path: "/deposits", icon: ArrowDownCircle },
          { label: "Withdrawal", path: "/withdrawals", icon: ArrowUpCircle },
          { label: "Total D/W", path: "/client-request/total-dw", icon: Clock },
          { label: "Super Master D/W", path: "/client-request/super-master-dw", icon: Users },
          { label: "Super D/W State", path: "/client-request/super-dw-state", icon: Calculator },
        ],
      },
      { label: "Payment Mode Verification", path: "/payment-mode-verification", icon: ShieldCheck },
      { label: "Client Activity", path: "/activity", icon: Activity },
      ...profileItems,
    ];
  }

  if (role === "master") {
    return [
      { label: "Messages", path: "/messages", icon: MessageCircle },
      { label: "List of User", path: "/players", icon: Users },
      { label: "Account Statement", path: "/account-statement", icon: FileText },
      { label: "Bonus Statement", path: "/bonus-statement", icon: Gift },
      {
        label: "Client Request",
        icon: ArrowDownCircle,
        children: [
          { label: "Deposit", path: "/deposits", icon: ArrowDownCircle },
          { label: "Withdrawal", path: "/withdrawals", icon: ArrowUpCircle },
          { label: "Total D/W", path: "/client-request/total-dw", icon: Clock },
        ],
      },
      { label: "Payment method", path: "/payment-modes", icon: CreditCard },
      { label: "Payment Mode Verification", path: "/payment-mode-verification", icon: ShieldCheck },
      { label: "Client Activity", path: "/activity", icon: Activity },
      ...profileItems,
    ];
  }

  return [];
};

const formatBal = (v: string | number | null | undefined) => (v != null ? `₹${Number(v).toLocaleString()}` : "₹0");

type BalanceItem = { label: string; value: string; rawPl?: string };

const getBalanceHeaders = (role: string, user: { main_balance?: string; super_balance?: string | null; master_balance?: string | null; player_balance?: string | null; pl_balance?: string; total_balance?: string | number } | null): BalanceItem[] => {
  if (!user) return [];
  if (role === "powerhouse") return [
    { label: "Main", value: formatBal(user.main_balance) },
    { label: "Super Bal", value: formatBal(user.super_balance) },
    { label: "Master Bal", value: formatBal(user.master_balance) },
    { label: "Player Bal", value: formatBal(user.player_balance) },
    { label: "P/L", value: formatBal(user.pl_balance), rawPl: user.pl_balance },
    { label: "Total", value: formatBal(user.total_balance) },
  ];
  if (role === "super") return [
    { label: "Main", value: formatBal(user.main_balance) },
    { label: "Master Bal", value: formatBal(user.master_balance) },
    { label: "Player Bal", value: formatBal(user.player_balance) },
    { label: "P/L", value: formatBal(user.pl_balance), rawPl: user.pl_balance },
    { label: "Total", value: formatBal(user.total_balance) },
  ];
  return [
    { label: "Main", value: formatBal(user.main_balance) },
    { label: "Player Bal", value: formatBal(user.player_balance) },
    { label: "P/L", value: formatBal(user.pl_balance), rawPl: user.pl_balance },
    { label: "Total", value: formatBal(user.total_balance) },
  ];
};

const plValueColor = (b: BalanceItem) => {
  if (b.label !== "P/L" || b.rawPl == null) return "";
  const n = Number(b.rawPl);
  return n >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
};

export const AdminLayout = ({ role }: AdminLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("client-request");
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const prefix = `/${role}`;
  const navItems = getNavItems(role);
  const balances = getBalanceHeaders(role, user);

  const { data: dashboard } = useQuery({
    queryKey: ["admin-dashboard", role],
    queryFn: () => getDashboard(role),
  });
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["admin-messages-unread", role],
    queryFn: () => getUnreadMessageCount(role),
  });
  const badgeCounts: Record<string, number> = {
    "/messages": Number(unreadMessages) || 0,
    "/deposits": Number(dashboard?.pending_deposits) || 0,
    "/withdrawals": Number(dashboard?.pending_withdrawals) || 0,
    "/bonus-requests": Number(dashboard?.pending_bonus_requests) || 0,
  };

  const isActive = (path: string) => {
    const fullPath = prefix + path;
    return path === "" ? location.pathname === prefix || location.pathname === prefix + "/" : location.pathname.startsWith(fullPath);
  };

  const isGroupActive = (group: NavGroupItem) => {
    return group.children.some((c) => isActive(c.path));
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
        <div className="h-14 flex items-center px-3 gap-2 border-b border-sidebar-border">
          <img src={"/karnali-logo.png"} alt="Karnali X" className="h-8 w-8 rounded flex-shrink-0" />
          {!collapsed && <span className="font-gaming font-bold text-xs neon-text tracking-wider truncate">{roleLabel}</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map((item) => {
            if (isNavGroup(item)) {
              const groupKey = item.label.toLowerCase().replace(/\s+/g, "-");
              const isOpen = collapsed ? false : expandedGroup === groupKey;
              const active = isGroupActive(item);
              return (
                <div key={groupKey} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setExpandedGroup((x) => (x === groupKey ? null : groupKey))}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      active ? "bg-sidebar-accent/70 text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {isOpen ? <ChevronUp className="h-3.5 w-3 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3 flex-shrink-0" />}
                      </>
                    )}
                  </button>
                  {!collapsed && isOpen &&
                    item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={prefix + child.path}
                        className={`flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive(child.path)
                            ? "bg-sidebar-accent text-sidebar-primary font-medium neon-glow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`}
                      >
                        <child.icon className="h-3.5 w-3 flex-shrink-0" />
                        <span className="truncate">{child.label}</span>
                        {badgeCounts[child.path] != null && badgeCounts[child.path] > 0 && (
                          <Badge variant="destructive" className="ml-auto text-[10px] min-w-5 h-5 justify-center px-1">
                            {badgeCounts[child.path] > 99 ? "99+" : badgeCounts[child.path]}
                          </Badge>
                        )}
                      </Link>
                    ))}
                </div>
              );
            }
            const linkItem = item as NavLinkItem;
            return (
              <Link
                key={linkItem.path}
                to={prefix + linkItem.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive(linkItem.path)
                    ? "bg-sidebar-accent text-sidebar-primary font-medium neon-glow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <linkItem.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{linkItem.label}</span>
                    {badgeCounts[linkItem.path] != null && badgeCounts[linkItem.path] > 0 && (
                      <Badge variant="destructive" className="ml-auto text-[10px] min-w-5 h-5 justify-center px-1">
                        {badgeCounts[linkItem.path] > 99 ? "99+" : badgeCounts[linkItem.path]}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mini accounting: balance summary in sidebar (same as header) */}
        {balances.length > 0 && (
          <div className={`border-t border-sidebar-border px-2 py-2 space-y-1 ${collapsed ? "flex flex-col items-center" : ""}`}>
            {balances.map((b) => (
              <div key={b.label} className={`flex ${collapsed ? "flex-col items-center gap-0" : "items-center justify-between gap-2"} text-[10px]`}>
                <span className="text-muted-foreground whitespace-nowrap">{b.label}</span>
                <span className={`font-semibold truncate ${plValueColor(b) || "text-primary"}`}>{b.value}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col animate-slide-up">
            <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <img src={"/karnali-logo.png"} alt="" className="h-7 w-7 rounded" />
                <span className="font-gaming font-bold text-xs neon-text tracking-wider">{roleLabel}</span>
              </div>
              <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5 text-sidebar-foreground" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              {navItems.map((item) => {
                if (isNavGroup(item)) {
                  const groupKey = item.label.toLowerCase().replace(/\s+/g, "-");
                  const isOpen = expandedGroup === groupKey;
                  const active = isGroupActive(item);
                  return (
                    <div key={groupKey} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setExpandedGroup((x) => (x === groupKey ? null : groupKey))}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          active ? "bg-sidebar-accent/70 text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {isOpen ? <ChevronUp className="h-3.5 w-3" /> : <ChevronDown className="h-3.5 w-3" />}
                      </button>
                      {isOpen &&
                        item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={prefix + child.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive(child.path) ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <child.icon className="h-3.5 w-3" />
                            <span className="flex-1 truncate">{child.label}</span>
                            {badgeCounts[child.path] != null && badgeCounts[child.path] > 0 && (
                              <Badge variant="destructive" className="text-[10px] min-w-5 h-5 justify-center px-1">
                                {badgeCounts[child.path] > 99 ? "99+" : badgeCounts[child.path]}
                              </Badge>
                            )}
                          </Link>
                        ))}
                    </div>
                  );
                }
                const linkItem = item as NavLinkItem;
                return (
                  <Link
                    key={linkItem.path}
                    to={prefix + linkItem.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive(linkItem.path) ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <linkItem.icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{linkItem.label}</span>
                    {badgeCounts[linkItem.path] != null && badgeCounts[linkItem.path] > 0 && (
                      <Badge variant="destructive" className="text-[10px] min-w-5 h-5 justify-center px-1">
                        {badgeCounts[linkItem.path] > 99 ? "99+" : badgeCounts[linkItem.path]}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
            {/* Mini accounting in mobile sidebar */}
            {balances.length > 0 && (
              <div className="border-t border-sidebar-border px-3 py-2 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Balances</p>
                {balances.map((b) => (
                  <div key={b.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className={`font-semibold ${plValueColor(b) || "text-primary"}`}>{b.value}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 glass-card border-b border-border/50">
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2.5 min-h-[44px] min-w-[44px] rounded-lg hover:bg-muted touch-manipulation flex items-center justify-center" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="font-display font-semibold text-lg hidden md:block">{role === "super" || role === "master" ? roleLabel : `${roleLabel} Dashboard`}</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Balance chips */}
              <div className="hidden sm:flex items-center gap-2">
                {balances.map((b) => (
                  <div key={b.label} className="px-2 py-1 rounded-md bg-muted text-xs">
                    <span className="text-muted-foreground">{b.label}: </span>
                    <span className={`font-semibold ${plValueColor(b) || "text-primary"}`}>{b.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { logout(); navigate("/login"); }} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
              <div className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center text-xs font-bold text-primary-foreground neon-glow-sm">
                {roleLabel[0]}
              </div>
            </div>
          </div>
          {/* Mobile balance row */}
          <div className="sm:hidden flex items-center gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide min-w-0" style={{ WebkitOverflowScrolling: "touch" }}>
            {balances.map((b) => (
              <div key={b.label} className="flex-shrink-0 px-2 py-1 rounded-md bg-muted text-[10px]">
                <span className="text-muted-foreground">{b.label}: </span>
                <span className={`font-semibold ${plValueColor(b) || "text-primary"}`}>{b.value}</span>
              </div>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
