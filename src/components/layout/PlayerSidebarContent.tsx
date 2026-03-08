import { Link, useNavigate } from "react-router-dom";
import { Home, MessageCircle, Wallet, Clock, User, Gamepad2, Key, CreditCard, BarChart3, LogOut, Users } from "lucide-react";
import type { User as AuthUser } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export const sidebarLinks = [
  { label: "Dashboard", path: "/player", icon: Home },
  { label: "Wallet", path: "/player/wallet", icon: Wallet },
  { label: "Messages", path: "/player/messages", icon: MessageCircle },
  { label: "Transactions", path: "/player/transactions", icon: Clock },
  { label: "Bet History", path: "/player/game-results", icon: BarChart3 },
  { label: "Payment Modes", path: "/player/payment-modes", icon: CreditCard },
  { label: "Refer", path: "/player/referral", icon: Users },
  { label: "Change Password", path: "/player/change-password", icon: Key },
  { label: "Profile", path: "/player/profile", icon: User },
];

const formatBal = (v: string | number | null | undefined) => (v != null ? `₹${Number(v).toLocaleString()}` : "₹0");

export interface PlayerSidebarContentProps {
  user: AuthUser | null;
  logout: () => void;
  messageBadge: number;
  currentPath: string;
  onNavigate?: () => void;
  /** When provided and messageBadge > 0, clicking Messages opens this instead of navigating. */
  onMessagesClick?: () => void;
  compact?: boolean;
}

export const PlayerSidebarContent = ({
  user,
  logout,
  messageBadge,
  currentPath,
  onNavigate,
  onMessagesClick,
  compact = false,
}: PlayerSidebarContentProps) => {
  const navigate = useNavigate();
  const total = user?.total_balance != null ? formatBal(user.total_balance) : "₹0";
  const main = formatBal(user?.main_balance);
  const bonus = formatBal(user?.bonus_balance);

  const isActive = (path: string) => currentPath === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
    onNavigate?.();
  };

  const linkClass = compact
    ? "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium min-h-[44px] touch-manipulation transition-all duration-200"
    : "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200";

  return (
    <>
      {/* Balance card */}
      <div className={compact ? "p-3" : "p-4"}>
        <div className="rounded-xl gold-gradient p-4 neon-glow-sm">
          <p className="text-primary-foreground/60 text-[10px] font-medium">Total Balance</p>
          <p className="font-gaming font-bold text-2xl text-primary-foreground">{total}</p>
          <div className="flex gap-3 mt-2 text-[10px] text-primary-foreground/70">
            <span>Main: {main}</span>
            <span>Bonus: {bonus}</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className={compact ? "flex-1 px-2 py-1 space-y-0.5" : "flex-1 px-3 py-2 space-y-1"}>
        {sidebarLinks.map((link) => {
          const isMessages = link.path === "/player/messages";
          const openModalInstead = isMessages && messageBadge > 0 && onMessagesClick;
          if (openModalInstead) {
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => {
                  onMessagesClick();
                  onNavigate?.();
                }}
                className={`${linkClass} w-full ${
                  isActive(link.path)
                    ? "bg-primary/10 text-primary neon-glow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <link.icon className={`h-4 w-4 flex-shrink-0 ${isActive(link.path) ? "text-primary" : ""}`} />
                <span className="flex-1 truncate text-left">{link.label}</span>
                <Badge variant="destructive" className="text-[10px] min-w-5 h-5 justify-center px-1">
                  {messageBadge > 99 ? "99+" : messageBadge}
                </Badge>
              </button>
            );
          }
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onNavigate}
              className={`${linkClass} ${
                isActive(link.path)
                  ? "bg-primary/10 text-primary neon-glow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <link.icon className={`h-4 w-4 flex-shrink-0 ${isActive(link.path) ? "text-primary" : ""}`} />
              <span className="flex-1 truncate">{link.label}</span>
              {isMessages && messageBadge > 0 && (
                <Badge variant="destructive" className="text-[10px] min-w-5 h-5 justify-center px-1">
                  {messageBadge > 99 ? "99+" : messageBadge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={compact ? "p-3 border-t border-border space-y-1" : "p-4 border-t border-border space-y-2"}>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Gamepad2 className="h-4 w-4" />
          <span>Play Games</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
};
