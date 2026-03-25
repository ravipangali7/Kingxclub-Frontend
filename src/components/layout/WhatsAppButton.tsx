import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getSiteSetting, getWhatsAppLinkWithUser } from "@/api/site";

export const WhatsAppButton = () => {
  const { user } = useAuth();
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const waUrl = getWhatsAppLinkWithUser(siteSetting as { whatsapp_number?: string; phones?: string[] } | undefined, user, "Hi, I need support from Kingxclub.");
  if (!waUrl) return null;
  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 md:bottom-6 h-14 w-14 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform hover:shadow-[0_0_24px_-2px_rgba(37,211,102,0.6)]"
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-white border-2 border-[#25D366] animate-pulse" />
    </a>
  );
};
