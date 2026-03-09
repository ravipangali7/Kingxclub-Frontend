import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatInterface, type ApiMessage, type SendPayload } from "@/components/shared/ChatInterface";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPlayerMessages,
  getPlayerMessageContacts,
  sendPlayerMessage,
  sendPlayerMessageForm,
} from "@/api/player";
import { useMessageSocket } from "@/hooks/useMessageSocket";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col md:flex-row max-w-5xl mx-auto">
      {/* Contact list */}
      <div
        className={`${selectedContactId != null ? "hidden md:flex" : "flex"} md:w-72 border-r border-border overflow-y-auto flex-shrink-0 flex flex-col`}
      >
        <div className="p-4 border-b border-border glass flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display font-semibold">Messages</h2>
              <p className="text-xs text-muted-foreground">
                {parentId != null ? "Chat and notifications" : "You are not assigned to a master."}
              </p>
            </div>
          </div>
        </div>
        {contacts.length === 0 && parentId == null ? (
          <p className="p-3 text-sm text-muted-foreground">No master assigned. Contact support.</p>
        ) : (
          <>
            {contacts.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedContactId(c.id);
                  queryClient.invalidateQueries({ queryKey: ["player-message-contacts"] });
                  queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
                }}
                className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${selectedContactId === c.id ? "bg-muted" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.name || c.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
                  </div>
                  {(c.unread_count ?? 0) > 0 && (
                    <Badge variant="destructive" className="text-[10px] min-w-5 h-5 justify-center px-1 flex-shrink-0">
                      {(c.unread_count ?? 0) > 99 ? "99+" : c.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {contacts.length === 0 && parentId != null && (
              <p className="p-3 text-xs text-muted-foreground">No conversations yet</p>
            )}
          </>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {selectedContactId != null ? (
          <>
            <div className="p-3 border-b border-border flex items-center gap-2 md:flex-none flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedContactId(null)}
                className="md:hidden text-sm text-primary"
              >
                ← Back
              </button>
              <span className="font-display font-semibold text-sm truncate">
                {selectedContact?.name ?? selectedContact?.username ?? "User"}
              </span>
              {!canSendToSelected && (
                <span className="text-xs text-muted-foreground">(read-only)</span>
              )}
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              {isLoading ? (
                <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerMessages;
