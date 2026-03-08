import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPlayerMessages, getPlayerUnreadMessageCount, sendPlayerMessage, sendPlayerMessageForm } from "@/api/player";
import { useMessageSocket } from "@/hooks/useMessageSocket";
import { ChatInterface, type ApiMessage, type SendPayload } from "@/components/shared/ChatInterface";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 4000;

/**
 * Floating chat button (player only). Opens a bottom sheet with Messenger-style chat.
 * Renders only when user has a parent (master); otherwise nothing.
 */
export const PlayerChatFab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const partnerId = user?.parent ?? null;

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["player-messages-unread"],
    queryFn: getPlayerUnreadMessageCount,
  });
  const unread = Number(unreadCount) || 0;

  const { connected } = useMessageSocket((msg) => {
    if (partnerId == null) return;
    if (Number(msg.sender) === Number(partnerId) || Number(msg.receiver) === Number(partnerId)) {
      queryClient.invalidateQueries({ queryKey: ["player-messages", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
    }
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["player-messages", partnerId],
    queryFn: () => getPlayerMessages(partnerId ?? undefined),
    enabled: open && partnerId != null,
    refetchInterval: connected ? false : open && partnerId != null ? POLL_INTERVAL_MS : false,
  });

  const [sending, setSending] = useState(false);

  const handleSend = async (messageOrPayload: string | SendPayload) => {
    if (partnerId == null) return;
    setSending(true);
    try {
      if (typeof messageOrPayload === "string") {
        await sendPlayerMessage({ receiver: partnerId, message: messageOrPayload });
      } else {
        const { message, file, image } = messageOrPayload;
        const formData = new FormData();
        formData.append("receiver", String(partnerId));
        formData.append("message", message);
        if (file) formData.append("file", file);
        if (image) formData.append("image", image);
        await sendPlayerMessageForm(formData);
      }
      await queryClient.invalidateQueries({ queryKey: ["player-messages", partnerId] });
      await queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
    } catch (e) {
      const err = e as { detail?: string };
      toast.error(err?.detail ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) queryClient.invalidateQueries({ queryKey: ["player-messages-unread"] });
  };

  if (partnerId == null) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-32 right-4 z-40 md:bottom-6 md:right-20 h-14 w-14 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform hover:shadow-[0_0_24px_-2px_rgba(37,211,102,0.6)]"
        aria-label="Open chat"
      >
        <MessageCircle className="h-7 w-7" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gray-400 border-2 border-[#25D366]" />
        )}
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] flex flex-col p-0 rounded-t-2xl">
          <SheetHeader className="p-4 border-b border-border flex-shrink-0">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full gold-gradient flex items-center justify-center neon-glow-sm">
                <MessageCircle className="h-4 w-4 text-primary-foreground" />
              </div>
              Chat with Master
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 flex flex-col">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Loading messages…</p>
            ) : (
              <ChatInterface
                currentUserId={user?.id ?? 0}
                partnerId={partnerId}
                messages={messages as ApiMessage[]}
                onSend={handleSend}
                sending={sending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
