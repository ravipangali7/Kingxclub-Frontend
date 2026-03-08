import { Outlet } from "react-router-dom";
import { HomeHeader } from "./HomeHeader";
import { HomeFooter } from "./HomeFooter";
import { MobileNav } from "./MobileNav";
import { WhatsAppButton } from "./WhatsAppButton";

/**
 * Player dashboard wrapped in the same site header and footer as the second home.
 * Message FAB is shown globally via GlobalMessageFab in App (when user is logged in).
 */
export const PlayerSiteLayout = () => (
  <div className="home-design min-h-screen flex flex-col bg-background">
    <HomeHeader />
    <main className="flex-1 overflow-auto flex flex-col pt-[calc(3.5rem+2.25rem)] pb-20 mobile:pb-0 min-w-0">
      <Outlet />
    </main>
    <HomeFooter />
    <MobileNav />
    <WhatsAppButton />
  </div>
);
