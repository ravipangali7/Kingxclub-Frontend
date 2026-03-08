import { useEffect, useRef, useState } from "react";
import { getMessagesWebSocketUrl } from "@/lib/api";

const INITIAL_RECONNECT_MS = 2000;
const MAX_RECONNECT_MS = 30000;
const BACKOFF_MULTIPLIER = 1.5;
const MAX_RETRIES = 30;

export interface MessageNewPayload {
  type: "message.new";
  message: {
    id: number;
    sender: number;
    receiver: number;
    message: string;
    created_at: string;
    [key: string]: unknown;
  };
}

/**
 * Subscribe to real-time message events via WebSocket.
 * When the server sends a "message.new" event, onNewMessage is called with the message payload.
 * Reconnects with backoff on close/error; polling fallback when disconnected.
 * Returns { connected } so callers can e.g. disable polling while socket is open.
 */
export function useMessageSocket(onNewMessage: (payload: MessageNewPayload["message"]) => void) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    const url = getMessagesWebSocketUrl();
    if (!url) return;

    function connect() {
      if (reconnectTimeoutRef.current != null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryCountRef.current = 0;
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (retryCountRef.current >= MAX_RETRIES) return;
        const delay = Math.min(
          INITIAL_RECONNECT_MS * Math.pow(BACKOFF_MULTIPLIER, retryCountRef.current),
          MAX_RECONNECT_MS
        );
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, delay);
      };

      ws.onerror = () => setConnected(false);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MessageNewPayload;
          if (data?.type === "message.new" && data.message) {
            onNewMessageRef.current(data.message);
          }
        } catch {
          // ignore parse errors
        }
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current != null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, []);

  return { connected };
}
