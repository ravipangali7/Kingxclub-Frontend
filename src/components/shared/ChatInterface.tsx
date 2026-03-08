import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Image as ImageIcon, X, Check, CheckCheck } from "lucide-react";
import { getMediaUrl } from "@/lib/api";

/** API message shape from backend (MessageSerializer). */
export interface ApiMessage {
  id: number;
  sender: number;
  receiver: number;
  message: string;
  created_at: string;
  sender_username?: string;
  receiver_username?: string;
  file?: string | null;
  image?: string | null;
  is_read?: boolean;
}

export interface ChatMessage {
  id: string | number;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  read?: boolean;
  file?: string | null;
  image?: string | null;
}

export type SendPayload = { message: string; file?: File; image?: File };

function normalizeMessage(m: ApiMessage, currentUserId: number): ChatMessage & { isFromMe: boolean } {
  const isFromMe = Number(m.sender) === Number(currentUserId);
  return {
    id: m.id,
    from: String(m.sender),
    to: String(m.receiver),
    message: m.message ?? "",
    timestamp: m.created_at,
    read: m.is_read,
    isFromMe,
    file: m.file ?? null,
    image: m.image ?? null,
  };
}

interface ChatInterfaceProps {
  /** Current user's ID (number) for comparing sender. */
  currentUserId: number;
  /** Partner user ID (number). */
  partnerId: number | null;
  /** Messages from API (sender, receiver, message, created_at, ...). */
  messages: ApiMessage[];
  /** Callback when user sends; string for text-only, or payload with optional file/image. */
  onSend: (messageOrPayload: string | SendPayload) => Promise<void>;
  /** Optional: loading state to disable send. */
  sending?: boolean;
  /** When true, hide send input (read-only thread). */
  readOnly?: boolean;
}

export const ChatInterface = ({ currentUserId, partnerId, messages, onSend, sending = false, readOnly = false }: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageList = Array.isArray(messages) ? messages : [];

  const list = messageList
    .filter(
      (m) =>
        (Number(m.sender) === Number(currentUserId) && Number(m.receiver) === Number(partnerId)) ||
        (Number(m.receiver) === Number(currentUserId) && Number(m.sender) === Number(partnerId))
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((m) => normalizeMessage(m, currentUserId));

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (!el || list.length === 0) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [list.length, list[list.length - 1]?.id]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || list.length === 0) return;
    let didScrollOnOpen = false;
    const observer = new ResizeObserver(() => {
      if (didScrollOnOpen) return;
      if (el.scrollHeight > 0) {
        didScrollOnOpen = true;
        scrollToBottom();
      }
    });
    observer.observe(el);
    if (el.scrollHeight > 0) {
      didScrollOnOpen = true;
      scrollToBottom();
    }
    return () => observer.disconnect();
  }, [list.length]);

  useEffect(() => {
    if (!pendingImage) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingImage);
    setImagePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pendingImage]);

  const hasPayload = newMessage.trim() || pendingFile || pendingImage;
  const canSend = hasPayload && partnerId != null && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    const text = newMessage.trim();
    setNewMessage("");
    const file = pendingFile ?? undefined;
    const image = pendingImage ?? undefined;
    setPendingFile(null);
    setPendingImage(null);
    if (file || image) {
      await onSend({ message: text, file, image });
    } else {
      await onSend(text);
    }
  };

  const clearAttachment = () => {
    setPendingFile(null);
    setPendingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {list.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
        )}
        {list.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.isFromMe
                  ? "gold-gradient text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}
            >
              {msg.image && (
                <a href={getMediaUrl(msg.image)} target="_blank" rel="noopener noreferrer" className="block my-1">
                  <img
                    src={getMediaUrl(msg.image)}
                    alt="Attachment"
                    className="max-w-full max-h-48 rounded-lg object-contain"
                  />
                </a>
              )}
              {msg.file && (
                <a
                  href={getMediaUrl(msg.file)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block my-1 underline ${msg.isFromMe ? "text-primary-foreground/90" : "text-foreground"}`}
                >
                  {msg.file.split(/[/\\]/).pop() ?? "File"}
                </a>
              )}
              {msg.message ? <p>{msg.message}</p> : null}
              <div className={`flex items-center gap-1.5 mt-1 ${msg.isFromMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                <span className="text-[10px]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.isFromMe && (
                  <span className="text-[10px] flex items-center gap-0.5" title={msg.read ? "Read" : "Delivered"}>
                    {msg.read ? (
                      <CheckCheck className="h-3 w-3" aria-hidden />
                    ) : (
                      <Check className="h-3 w-3" aria-hidden />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (pendingFile || pendingImage) && (
        <div className="px-3 py-1 flex items-center gap-2 border-t border-border">
          {pendingImage && imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt=""
              className="h-12 w-12 rounded object-cover flex-shrink-0"
            />
          )}
          <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
            {pendingImage?.name ?? pendingFile?.name}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" type="button" onClick={clearAttachment}>
            <X className="h-3.5 w-3" />
          </Button>
        </div>
      )}

      {!readOnly && (
        <div className="border-t border-border p-3 flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPendingFile(f);
                setPendingImage(null);
              }
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPendingImage(f);
                setPendingFile(null);
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 text-muted-foreground"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={partnerId == null || sending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 text-muted-foreground"
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={partnerId == null || sending}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="h-10"
            disabled={partnerId == null || sending}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="gold-gradient text-primary-foreground h-10 w-10 neon-glow-sm flex-shrink-0"
            disabled={!canSend}
            type="button"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
