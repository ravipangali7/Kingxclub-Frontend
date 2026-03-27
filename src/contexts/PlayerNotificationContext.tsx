import { createContext, useCallback, useContext, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getPlayerNotifications } from "@/api/player";

export type FabTab = "chat" | "notifications";

export type PlayerNotification = {
  id: number;
  sender_id: number;
  sender_name?: string;
  sender_username?: string;
  message?: string;
  created_at: string | null;
};

type PlayerNotificationContextValue = {
  isOpen: boolean;
  selectedContactId: number | null;
  openModal: () => void;
  closeModal: () => void;
  openChat: (contactId?: number | null) => void;
  // Fab sheet state
  fabOpen: boolean;
  fabDefaultTab: FabTab;
  openFabSheet: (tab?: FabTab) => void;
  closeFabSheet: () => void;
  // Notifications data (consumed by GlobalMessageFab)
  notifications: PlayerNotification[];
  notificationsLoading: boolean;
};

const PlayerNotificationContext = createContext<PlayerNotificationContextValue | null>(null);

export function usePlayerNotification() {
  const ctx = useContext(PlayerNotificationContext);
  return ctx;
}

export function formatTimeAgo(iso: string | null): string {
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
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabDefaultTab, setFabDefaultTab] = useState<FabTab>("chat");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPlayer = user?.role === "player";

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const openChat = useCallback((contactId?: number | null) => {
    if (typeof contactId === "number" && !Number.isNaN(contactId)) {
      setSelectedContactId(contactId);
    } else {
      setSelectedContactId(null);
    }
    setIsOpen(false);
    queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
    queryClient.invalidateQueries({ queryKey: ["player-message-contacts"] });
    queryClient.invalidateQueries({ queryKey: ["player-notifications"] });
  }, [queryClient]);

  const openFabSheet = useCallback((tab: FabTab = "chat") => {
    setFabDefaultTab(tab);
    setFabOpen(true);
    if (tab === "notifications") {
      queryClient.invalidateQueries({ queryKey: ["player-notifications"] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
      queryClient.invalidateQueries({ queryKey: ["player-message-contacts"] });
    }
  }, [queryClient]);

  const closeFabSheet = useCallback(() => {
    setFabOpen(false);
    setSelectedContactId(null);
  }, []);

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["player-notifications"],
    queryFn: getPlayerNotifications,
    enabled: isPlayer && fabOpen,
  });

  const value: PlayerNotificationContextValue = {
    isOpen,
    selectedContactId,
    openModal,
    closeModal,
    openChat,
    fabOpen,
    fabDefaultTab,
    openFabSheet,
    closeFabSheet,
    notifications: notifications as PlayerNotification[],
    notificationsLoading,
  };

  return (
    <PlayerNotificationContext.Provider value={value}>
      {children}
    </PlayerNotificationContext.Provider>
  );
}
