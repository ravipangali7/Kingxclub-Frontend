import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatInterface, type ApiMessage, type SendPayload } from "@/components/shared/ChatInterface";
import { MessageCircle, ChevronLeft, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPlayerMessages,
  getPlayerMessageContacts,
  sendPlayerMessage,
  sendPlayerMessageForm,
} from "@/api/player";
import { useMessageSocket } from "@/hooks/useMessageSocket";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 4000;

const PlayerMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const contactFromUrl = searchParams.get("contact");
  const parentId = user?.parent ?? null;
  const [selectedContactId, setSelectedContactId] = useState<number | null>(() => {
    const id = contactFromUrl ? parseInt(contactFromUrl, 10) : NaN;
    return Number.isNaN(id) ? parentId : id;
  });

  useEffect(() => {
    const id = contactFromUrl ? parseInt(contactFromUrl, 10) : NaN;
    if (!Number.isNaN(id)) setSelectedContactId(id);
  }, [contactFromUrl]);

  const { connected } = useMessageSocket((msg) => {
    if (Number(msg.sender) === selectedContactId || Number(msg.receiver) === selectedContactId) {
      queryClient.invalidateQueries({ queryKey: ["player-messages", selectedContactId] });
    }
    queryClient.invalidateQueries({ queryKey: ["player-message-contacts"] });
    queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
  });

  const { data: contactsData } = useQuery({
    queryKey: ["player-message-contacts"],
    queryFn: getPlayerMessageContacts,
  });

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["player-messages", selectedContactId],
    queryFn: () => getPlayerMessages(selectedContactId ?? undefined),
    enabled: selectedContactId != null,
    refetchInterval: connected ? false : selectedContactId != null ? POLL_INTERVAL_MS : false,
  });

  const contacts = Array.isArray(contactsData) ? contactsData : [];
  const messages = Array.isArray(messagesData) ? messagesData : [];

  const [sending, setSending] = useState(false);

  const handleSend = async (messageOrPayload: string | SendPayload) => {
    if (selectedContactId == null || selectedContactId !== parentId) return;
    setSending(true);
    try {
      if (typeof messageOrPayload === "string") {
        await sendPlayerMessage({ receiver: selectedContactId, message: messageOrPayload });
      } else {
        const { message, file, image } = messageOrPayload;
        const formData = new FormData();
        formData.append("receiver", String(selectedContactId));
        formData.append("message", message);
        if (file) formData.append("file", file);
        if (image) formData.append("image", image);
        await sendPlayerMessageForm(formData);
      }
      queryClient.invalidateQueries({ queryKey: ["player-messages", selectedContactId] });
      queryClient.invalidateQueries({ queryKey: ["player-message-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
    } catch (e) {
      const err = e as { detail?: string };
      toast.error(err?.detail ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const apiMessages = messages as ApiMessage[];
  const canSendToSelected = selectedContactId != null && selectedContactId === parentId;

  const totalUnread = contacts.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  return (
    <div className="flex items-end justify-center min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-5rem)] px-0 md:px-4 pb-0 md:pb-6">
      {/* Bottom-sheet style floating panel */}
      <div className="w-full max-w-4xl flex flex-col rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl border border-border/60 glass-strong"
        style={{ height: "calc(100vh - 8rem)" }}
      >
        {/* ── Panel Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 flex-shrink-0 bg-card/60 backdrop-blur-sm">
          {/* Left: back button (mobile chat view) or title */}
          <div className="flex items-center gap-3 min-w-0">
            {selectedContactId != null && (
              <button
                type="button"
                onClick={() => setSelectedContactId(null)}
                className="md:hidden h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              {selectedContactId != null && selectedContact ? (
                <>
                  <p className="font-semibold text-sm leading-none truncate">
                    {selectedContact.name || selectedContact.username}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5 truncate">
                    {selectedContact.role}
                    {!canSendToSelected && " · read-only"}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-semibold text-base leading-none">Messages</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {parentId != null ? "Chat with your master" : "No master assigned"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right: icon badge + connection status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: connected ? "#22c55e" : "#94a3b8", background: connected ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.12)" }}
            >
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? "Live" : "Polling"}
            </span>
            <div className="relative h-9 w-9 rounded-full gold-gradient flex items-center justify-center neon-glow-sm flex-shrink-0">
              <MessageCircle className="h-4 w-4 text-primary-foreground" />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center border-2 border-background">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body: contacts + chat ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Contact list (hidden on mobile when chat open) */}
          <div
            className={`${
              selectedContactId != null ? "hidden md:flex" : "flex"
            } md:w-72 flex-col flex-shrink-0 border-r border-border/40 overflow-hidden`}
          >
            {/* Contacts scroll area */}
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 && parentId == null ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No master assigned.<br />Contact support.</p>
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                contacts.map((c) => {
                  const initials = (c.name || c.username || "?").slice(0, 2).toUpperCase();
                  const isActive = selectedContactId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedContactId(c.id);
                        queryClient.invalidateQueries({ queryKey: ["player-message-contacts"] });
                        queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/30 text-left transition-colors ${
                        isActive ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
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
                        <span className="h-5 min-w-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
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
            {selectedContactId != null ? (
              <div className="flex-1 min-h-0 flex flex-col">
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading messages…</p>
                    </div>
                  </div>
                ) : (
                  <ChatInterface
                    currentUserId={user?.id ?? 0}
                    partnerId={selectedContactId}
                    messages={apiMessages}
                    onSend={handleSend}
                    sending={sending}
                    readOnly={!canSendToSelected}
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="h-16 w-16 rounded-full gold-gradient flex items-center justify-center neon-glow-sm">
                  <MessageCircle className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Select a conversation</p>
                  <p className="text-xs text-muted-foreground mt-1">Choose a contact from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerMessages;
