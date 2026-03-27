import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerNotification, formatTimeAgo, type FabTab } from "@/contexts/PlayerNotificationContext";
import type { UserRole } from "@/contexts/AuthContext";
import { getPlayerMessages, getPlayerUnreadMessageCount, sendPlayerMessage, sendPlayerMessageForm, getPlayerMessageContacts } from "@/api/player";
import { getUnreadMessageCount } from "@/api/admin";
import { useMessageSocket } from "@/hooks/useMessageSocket";
import { ChatInterface, type ApiMessage, type SendPayload } from "@/components/shared/ChatInterface";
import AdminMessages from "@/pages/admin/AdminMessages";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 4000;

const FAB_COLORS: Record<UserRole, string> = {
  player: "#25D366",
  powerhouse: "#7c3aed",
  super: "#2563eb",
  master: "#f59e0b",
};

export const GlobalMessageFab = () => {
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const playerNotification = usePlayerNotification();

  const role = user?.role ?? null;
  const isPlayer = role === "player";
  const adminRole = role === "powerhouse" || role === "super" || role === "master" ? role : null;

  // Admin-only local open state
  const [adminOpen, setAdminOpen] = useState(false);

  // Active tab for player sheet
  const [activeTab, setActiveTab] = useState<FabTab>("chat");

  // Sync tab when fab opens
  useEffect(() => {
    if (playerNotification?.fabOpen) {
      setActiveTab(playerNotification.fabDefaultTab);
    }
  }, [playerNotification?.fabOpen, playerNotification?.fabDefaultTab]);

  const partnerId = isPlayer ? (user?.parent ?? null) : null;
  const activePlayerPartnerId = isPlayer
    ? (playerNotification?.selectedContactId ?? partnerId)
    : null;

  // Unread counts
  const { data: playerUnread = 0 } = useQuery({
    queryKey: ["player-messages-unread"],
    queryFn: getPlayerUnreadMessageCount,
    enabled: isPlayer,
  });
  const { data: adminUnread = 0 } = useQuery({
    queryKey: ["admin-messages-unread", adminRole],
    queryFn: () => getUnreadMessageCount(adminRole!),
    enabled: adminRole != null,
  });
  const unread = isPlayer ? Number(playerUnread) || 0 : Number(adminUnread) || 0;

  // Player contacts (for Chat tab left column)
  const playerSheetOpen = isPlayer && (playerNotification?.fabOpen ?? false);

  const { data: contactsData } = useQuery({
    queryKey: ["player-message-contacts"],
    queryFn: getPlayerMessageContacts,
    enabled: isPlayer && playerSheetOpen,
  });
  const contacts = Array.isArray(contactsData) ? contactsData : [];

  // Selected contact in the sheet (local override for non-URL driven selection)
  const [sheetContactId, setSheetContactId] = useState<number | null>(null);

  // Resolve which contact is shown in Chat tab
  const chatPartnerId = sheetContactId ?? activePlayerPartnerId;

  // Socket
  const { connected } = useMessageSocket((msg) => {
    if (isPlayer && chatPartnerId != null) {
      if (Number(msg.sender) === Number(chatPartnerId) || Number(msg.receiver) === Number(chatPartnerId)) {
        queryClient.invalidateQueries({ queryKey: ["player-messages", chatPartnerId] });
        queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
      }
    } else if (adminRole != null) {
      queryClient.invalidateQueries({ queryKey: ["admin-messages-unread", adminRole] });
      queryClient.invalidateQueries({ queryKey: ["admin-messages", adminRole] });
    }
  });

  // Messages for active chat
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["player-messages", chatPartnerId],
    queryFn: () => getPlayerMessages(chatPartnerId ?? undefined),
    enabled: isPlayer && playerSheetOpen && activeTab === "chat" && chatPartnerId != null,
    refetchInterval: connected ? false : playerSheetOpen && chatPartnerId != null ? POLL_INTERVAL_MS : false,
  });

  const [sending, setSending] = useState(false);

  const handlePlayerSend = async (messageOrPayload: string | SendPayload) => {
    if (chatPartnerId == null) return;
    setSending(true);
    try {
      if (typeof messageOrPayload === "string") {
        await sendPlayerMessage({ receiver: chatPartnerId, message: messageOrPayload });
      } else {
        const { message, file, image } = messageOrPayload;
        const formData = new FormData();
        formData.append("receiver", String(chatPartnerId));
        formData.append("message", message);
        if (file) formData.append("file", file);
        if (image) formData.append("image", image);
        await sendPlayerMessageForm(formData);
      }
      await queryClient.invalidateQueries({ queryKey: ["player-messages", chatPartnerId] });
      await queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
    } catch (e) {
      const err = e as { detail?: string };
      toast.error(err?.detail ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleClosePlayerSheet = () => {
    playerNotification?.closeFabSheet();
    setSheetContactId(null);
  };

  const handleNotificationClick = (senderId: number) => {
    setSheetContactId(senderId);
    setActiveTab("chat");
    queryClient.invalidateQueries({ queryKey: ["player-messages", senderId] });
    queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
  };

  if (!user || !role) return null;
  if (location.pathname.match(/^\/games\/[^/]+\/play$/)) return null;

  const fabColor = FAB_COLORS[role];
  const canSendToContact = chatPartnerId != null && chatPartnerId === partnerId;

  return (
    <>
      {/* FAB — admin roles only; for players the header icon opens the sheet */}
      {!isPlayer && (
        <button
          type="button"
          onClick={() => setAdminOpen(true)}
          className="fixed bottom-20 right-4 z-40 md:bottom-6 h-14 w-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: fabColor }}
          aria-label="Open messages"
        >
          <MessageCircle className="h-7 w-7" />
          {unread > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gray-400 border-2 border-white"
              style={{ borderColor: fabColor }}
            />
          )}
        </button>
      )}

      {/* ── Player Sheet ── */}
      {isPlayer && (
        <Sheet open={playerSheetOpen} onOpenChange={(next) => { if (!next) handleClosePlayerSheet(); }}>
          <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] flex flex-col p-0 rounded-t-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full gold-gradient flex items-center justify-center neon-glow-sm flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-base">Messages</span>
              </div>
              {/* Tab pills */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("notifications")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "notifications"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Notifications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("chat");
                    queryClient.invalidateQueries({ queryKey: ["player-message-contacts"] });
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "chat"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chat
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {activeTab === "chat" ? (
                <>
                  {/* Contacts column */}
                  <div className="w-56 sm:w-64 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                      {partnerId == null ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
                          <MessageCircle className="h-8 w-8 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">No master assigned</p>
                        </div>
                      ) : contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
                          <p className="text-xs text-muted-foreground">No conversations yet</p>
                        </div>
                      ) : (
                        contacts.map((c) => {
                          const initials = (c.name || c.username || "?").slice(0, 2).toUpperCase();
                          const isActive = chatPartnerId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSheetContactId(c.id);
                                queryClient.invalidateQueries({ queryKey: ["player-messages", c.id] });
                                queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-3 border-b border-border/40 text-left transition-colors ${
                                isActive ? "bg-primary/10" : "hover:bg-muted/50"
                              }`}
                            >
                              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                isActive ? "gold-gradient text-primary-foreground neon-glow-sm" : "bg-muted text-muted-foreground"
                              }`}>
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                                  {c.name || c.username}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
                              </div>
                              {(c.unread_count ?? 0) > 0 && (
                                <span className="h-4 min-w-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                  {(c.unread_count ?? 0) > 99 ? "99+" : c.unread_count}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="flex-1 flex flex-col min-w-0 min-h-0">
                    {chatPartnerId != null ? (
                      messagesLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                      ) : (
                        <ChatInterface
                          currentUserId={user.id}
                          partnerId={chatPartnerId}
                          messages={messages as ApiMessage[]}
                          onSend={handlePlayerSend}
                          sending={sending}
                          readOnly={!canSendToContact}
                        />
                      )
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <div className="h-12 w-12 rounded-full gold-gradient flex items-center justify-center neon-glow-sm">
                          <MessageCircle className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Select a contact</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Choose from the list to start chatting</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Notifications tab */
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {playerNotification?.notificationsLoading ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  ) : !playerNotification?.notifications.length ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No new notifications</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {playerNotification.notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(n.sender_id)}
                            className="w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors flex flex-col gap-1"
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
                  <div className="p-4 border-t border-border flex-shrink-0 mt-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTab("chat")}
                      className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                      View all messages
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Admin Sheet ── */}
      {adminRole && (
        <Sheet open={adminOpen} onOpenChange={setAdminOpen}>
          <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] flex flex-col p-0 rounded-t-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border flex-shrink-0">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: fabColor }}
              >
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="font-semibold text-base">Messages</span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <AdminMessages role={adminRole} embedded />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
