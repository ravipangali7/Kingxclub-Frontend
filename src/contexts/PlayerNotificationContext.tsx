import { createContext, useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPlayerNotifications } from "@/api/player";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PlayerNotificationContextValue = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const PlayerNotificationContext = createContext<PlayerNotificationContextValue | null>(null);

export function usePlayerNotification() {
  const ctx = useContext(PlayerNotificationContext);
  return ctx;
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function PlayerNotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPlayer = user?.role === "player";

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["player-notifications"],
    queryFn: getPlayerNotifications,
    enabled: isOpen && isPlayer,
  });

  const handleNotificationClick = (senderId: number) => {
    closeModal();
    queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
    queryClient.invalidateQueries({ queryKey: ["player-message-contacts"] });
    queryClient.invalidateQueries({ queryKey: ["player-notifications"] });
    navigate(`/player/messages?contact=${senderId}`);
  };

  const handleViewAll = () => {
    closeModal();
    queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
    navigate("/player/messages");
  };

  const value: PlayerNotificationContextValue = { isOpen, openModal, closeModal };

  return (
    <PlayerNotificationContext.Provider value={value}>
      {children}
      {isPlayer && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-4 border-b border-border flex-shrink-0">
              <DialogTitle className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full gold-gradient flex items-center justify-center neon-glow-sm">
                  <MessageCircle className="h-4 w-4 text-primary-foreground" />
                </div>
                Notifications
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
              {isLoading ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(n.sender_id)}
                        className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {n.sender_name || n.sender_username || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{n.message || "—"}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-3 border-t border-border flex-shrink-0">
              <Button variant="outline" className="w-full" onClick={handleViewAll}>
                View all messages
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PlayerNotificationContext.Provider>
  );
}
