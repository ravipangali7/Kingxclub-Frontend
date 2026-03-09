import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerNotification } from "@/contexts/PlayerNotificationContext";
import { getPlayerUnreadMessageCount } from "@/api/player";
import { PlayerSidebarContent } from "./PlayerSidebarContent";

const formatBal = (v: string | number | null | undefined) => (v != null ? `₹${Number(v).toLocaleString()}` : "₹0");

export const PlayerLayout = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, logout, refreshUser } = useAuth();
  const notification = usePlayerNotification();
  const total = user?.total_balance != null ? formatBal(user.total_balance) : "₹0";

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["player-messages-unread"],
    queryFn: getPlayerUnreadMessageCount,
  });
  const messageBadge = Number(unreadMessages) || 0;

  // When user returns from game tab (visibility or focus), refetch wallet and auth so header/sidebar balance updates
  useEffect(() => {
    let visibilityTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const refetchBalance = () => {
      queryClient.invalidateQueries({ queryKey: ["playerWallet"] });
      queryClient.invalidateQueries({ queryKey: ["player-wallet"] });
      refreshUser?.();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (visibilityTimeoutId) clearTimeout(visibilityTimeoutId);
        visibilityTimeoutId = setTimeout(() => {
          refetchBalance();
          visibilityTimeoutId = null;
        }, 500);
      }
    };
    const onFocus = () => refetchBalance();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      if (visibilityTimeoutId) clearTimeout(visibilityTimeoutId);
    };
  }, [queryClient, refreshUser]);

  return (
    <div className="min-h-screen flex flex-col mobile:flex-row bg-background">
      {/* Desktop Sidebar (visible from 450px up; below that, sidebar is in header hamburger) */}
      <aside className="hidden mobile:flex flex-col w-64 glass text-foreground border-r border-border flex-shrink-0 sticky top-0 h-screen overflow-y-auto min-w-0">
        <PlayerSidebarContent
          user={user}
          logout={logout}
          messageBadge={messageBadge}
          currentPath={location.pathname}
          onMessagesClick={notification?.openModal}
        />
      </aside>

      {/* Main Content Area (mobile: no extra top bar – logo + balance live in header) */}
      <div className="flex-1 flex flex-col min-h-screen mobile:min-h-0 min-w-0">
        {/* Desktop top bar – same horizontal spacing as site header/footer */}
        <header className="hidden mobile:flex sticky top-0 z-50 glass border-b border-border h-14 items-center justify-between container px-2 mobile:px-4 mx-auto w-full max-w-[100%]">
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg capitalize truncate">
              {location.pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2 mobile:gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 px-2 mobile:px-3 py-1.5 rounded-lg bg-muted/50">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-gaming font-bold text-primary truncate">{total}</span>
            </div>
            <div className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">P1</div>
          </div>
        </header>

        {/* Content – container + responsive px to match header/footer margins */}
        <main className="flex-1 pb-20 mobile:pb-6 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="container px-2 mobile:px-4 mx-auto w-full max-w-[100%]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
