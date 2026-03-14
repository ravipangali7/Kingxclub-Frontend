import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getSiteSetting, getCmsFooterPages, getResolvedWhatsAppNumber, getWhatsAppLinkWithUser } from "@/api/site";
import { getCategories } from "@/api/games";
import { getMediaUrl } from "@/lib/api";

export const PublicFooter = () => {
  const { user } = useAuth();
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const { data: cmsPages = [] } = useQuery({ queryKey: ["cmsFooter"], queryFn: getCmsFooterPages });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const s = siteSetting as { logo?: string; emails?: string[]; phones?: string[]; whatsapp_number?: string; footer_description?: string } | undefined;
  const logoUrl = s?.logo ? getMediaUrl(s.logo) : "/karnali-logo.png";
  const email = Array.isArray(s?.emails) ? s.emails[0] : "";
  const phone = Array.isArray(s?.phones) ? s.phones[0] : "";
  const whatsapp = getResolvedWhatsAppNumber(s, user) || s?.whatsapp_number ?? "";
  const waUrl = getWhatsAppLinkWithUser(s, user);

  return (
    <footer className="bg-card text-foreground mt-auto border-t border-border">
      <div className="container px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={logoUrl} alt="Karnali X" className="h-8 w-8 rounded" />
              <span className="font-gaming font-bold text-sm neon-text tracking-wider">KARNALI X</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nepal's Premier Online Gaming Platform. Play responsibly.
            </p>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>{email}</p>
              <p>{phone}</p>
              {waUrl ? (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block hover:text-primary">WhatsApp: {whatsapp}</a>
              ) : (
                <p>WhatsApp: {whatsapp}</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3 text-primary">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Home", path: "/" },
                { label: "Games", path: "/games" },
                { label: "Bonus", path: "/bonus" },
                { label: "Wallet", path: "/wallet" },
                { label: "Dashboard", path: "/player" },
                { label: "Messages", path: "/player/messages" },
                { label: "Transactions", path: "/player/transactions" },
                { label: "Profile", path: "/player/profile" },
              ].map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="text-xs text-muted-foreground hover:text-primary transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3 text-primary">Categories</h4>
            <ul className="space-y-2">
              {(categories as { id: number; name: string }[]).slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link to={`/categories/${c.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CMS Pages */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3 text-primary">Info</h4>
            <ul className="space-y-2">
              {(cmsPages as { id: number; title: string; slug: string }[]).map((p) => (
                <li key={p.id}>
                  <Link to={`/page/${p.slug}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">{p.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-4 text-center text-xs text-muted-foreground">
          {s?.footer_description ?? "Nepal's Premier Online Gaming Platform."}
        </div>
      </div>
    </footer>
  );
};
