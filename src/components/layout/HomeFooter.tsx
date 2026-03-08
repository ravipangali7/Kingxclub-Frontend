import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getSiteSetting, getCmsFooterPages } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { footerContact as defaultFooterContact, footerLinks as defaultFooterLinks, paymentMethods as defaultPaymentMethods } from "@/data/homePageMockData";

export const HomeFooter = () => {
  const { user } = useAuth();
  const { data: siteSetting = {} } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const { data: cmsPages = [] } = useQuery({ queryKey: ["cmsFooter"], queryFn: getCmsFooterPages });

  const gamesLinks =
    user?.role === "player"
      ? [{ label: "Bet History", href: "/player/game-results" }, ...defaultFooterLinks.games]
      : defaultFooterLinks.games;

  const s = siteSetting as { logo?: string; name?: string; phones?: string[]; emails?: string[]; whatsapp_number?: string; footer_description?: string };
  const logoUrl = s?.logo?.trim() ? getMediaUrl(s.logo.trim()) : "/karnali-logo.png";
  const siteName = s?.name?.trim() || "KarnaliX";
  const phone = Array.isArray(s?.phones) && s.phones.length > 0 ? String(s.phones[0]) : defaultFooterContact.phone;
  const email = Array.isArray(s?.emails) && s.emails.length > 0 ? String(s.emails[0]) : defaultFooterContact.email;
  const whatsapp = (s?.whatsapp_number as string)?.trim() || defaultFooterContact.whatsapp;
  const tagline = (s?.footer_description as string)?.trim() || defaultFooterContact.tagline;

  const cmsItems = cmsPages as { id?: number; title?: string; slug?: string }[];
  const legalLinks =
    cmsItems.length > 0
      ? cmsItems.map((p) => ({ label: p.title ?? "", href: `/page/${p.slug ?? ""}` }))
      : defaultFooterLinks.legal;

  const waUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <footer className="glass-strong border-t border-border mt-auto">
      <div className="container px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src={logoUrl} alt={siteName} className="h-8 rounded-lg object-contain" />
              {/* <span className="font-gaming font-bold text-lg gradient-text">{siteName}</span> */}
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">{tagline}</p>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>{phone}</p>
              <a href={`mailto:${email}`} className="block hover:text-primary">{email}</a>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block hover:text-primary">WhatsApp: {whatsapp}</a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Games</h4>
            <ul className="space-y-2">
              {gamesLinks.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 block touch-manipulation">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Support</h4>
            <ul className="space-y-2">
              {defaultFooterLinks.support.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 block touch-manipulation">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 block touch-manipulation">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>SSL Secured</span>
            <span>Licensed Gaming</span>
            <span>24/7 Support</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {defaultPaymentMethods.map((pm) => (
              <span key={pm} className="px-3 py-1 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground">
                {pm}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-border mt-4 pt-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <p className="mt-1">18+ only. Play responsibly.</p>
        </div>
      </div>
    </footer>
  );
};
