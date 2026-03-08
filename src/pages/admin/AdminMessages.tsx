import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ChatInterface, type ApiMessage, type SendPayload } from "@/components/shared/ChatInterface";
import { getMessages, getMessageContacts, sendMessage, sendMessageForm } from "@/api/admin";
import { useMessageSocket } from "@/hooks/useMessageSocket";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const POLL_INTERVAL_MS = 4000;

interface AdminMessagesProps {
  role: "master" | "super" | "powerhouse";
  /** When true, fill container height (e.g. inside bottom sheet) so input is visible. */
  embedded?: boolean;
}

const AdminMessages = ({ role, embedded = false }: AdminMessagesProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const contactFromUrl = searchParams.get("contact");
  const [selectedContactId, setSelectedContactId] = useState<number | null>(() => {
    const id = contactFromUrl ? parseInt(contactFromUrl, 10) : NaN;
    return Number.isNaN(id) ? null : id;
  });
  const [contactSearch, setContactSearch] = useState("");

  useEffect(() => {
    const id = contactFromUrl ? parseInt(contactFromUrl, 10) : NaN;
    if (!Number.isNaN(id)) setSelectedContactId(id);
  }, [contactFromUrl]);

  const { connected } = useMessageSocket((msg) => {
    if (msg.sender === selectedContactId || msg.receiver === selectedContactId) {
      queryClient.invalidateQueries({ queryKey: ["admin-messages", role, selectedContactId] });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-message-contacts", role] });
    queryClient.invalidateQueries({ queryKey: ["admin-messages-unread", role] });
  });

  const { data: contactsData } = useQuery({
    queryKey: ["admin-message-contacts", role],
    queryFn: () => getMessageContacts(role),
  });

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["admin-messages", role, selectedContactId],
    queryFn: () => getMessages(role, selectedContactId ?? undefined),
    enabled: selectedContactId != null,
    refetchInterval: connected ? false : selectedContactId != null ? POLL_INTERVAL_MS : false,
  });

  const contactsRaw = Array.isArray(contactsData) ? contactsData : [];
  const contactSearchLower = contactSearch.trim().toLowerCase();
  const contacts = contactSearchLower
    ? contactsRaw.filter(
        (c: { name?: string; username?: string }) =>
          (c.name ?? "").toLowerCase().includes(contactSearchLower) ||
          (c.username ?? "").toLowerCase().includes(contactSearchLower)
      )
    : contactsRaw;
  const messages = Array.isArray(messagesData) ? messagesData : [];

  const [sending, setSending] = useState(false);

  const handleSend = async (messageOrPayload: string | SendPayload) => {
    if (selectedContactId == null) return;
    setSending(true);
    try {
      if (typeof messageOrPayload === "string") {
        await sendMessage({ receiver: selectedContactId, message: messageOrPayload }, role);
      } else {
        const { message, file, image } = messageOrPayload;
        const formData = new FormData();
        formData.append("receiver", String(selectedContactId));
        formData.append("message", message);
        if (file) formData.append("file", file);
        if (image) formData.append("image", image);
        await sendMessageForm(formData, role);
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-messages", role, selectedContactId] });
    } catch (e) {
      const err = e as { detail?: string };
      toast.error(err?.detail ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const apiMessages = messages as ApiMessage[];

  return (
    <div className={embedded ? "h-full min-h-0 flex flex-col md:flex-row" : "h-[calc(100vh-8rem)] flex flex-col md:flex-row"}>
      {/* Contact list */}
      <div className={`${selectedContactId != null ? "hidden md:block" : ""} md:w-72 border-r border-border overflow-y-auto flex-shrink-0 flex flex-col`}>
        <div className="p-3 border-b border-border flex-shrink-0">
          <h3 className="font-display font-semibold text-sm">Messages</h3>
          {(role === "master" || role === "super" || role === "powerhouse") && (
            <input
              type="text"
              placeholder="Search users..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          )}
        </div>
        {contacts.map((c) => (
          <div
            key={c.id}
            onClick={() => {
              setSelectedContactId(c.id);
              queryClient.invalidateQueries({ queryKey: ["admin-message-contacts", role] });
              queryClient.invalidateQueries({ queryKey: ["admin-messages-unread", role] });
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
        {contacts.length === 0 && (
          <p className="p-3 text-xs text-muted-foreground">No contacts</p>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {selectedContactId != null ? (
          <>
            <div className="p-3 border-b border-border flex items-center gap-2 md:hidden flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedContactId(null)}
                className="text-sm text-primary"
              >
                ← Back
              </button>
              <span className="font-display font-semibold text-sm truncate">
                {selectedContact?.name ?? selectedContact?.username ?? "User"}
              </span>
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

export default AdminMessages;
