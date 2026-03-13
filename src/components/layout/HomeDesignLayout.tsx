import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HomeHeader } from "./HomeHeader";
import { HomeFooter } from "./HomeFooter";
import { MobileNav } from "./MobileNav";
import { WhatsAppButton } from "./WhatsAppButton";

const BODY_SCROLLBAR_CLASS = "home-design-scrollbar";

interface HomeDesignLayoutProps {
  children: ReactNode;
}

export function HomeDesignLayout({ children }: HomeDesignLayoutProps) {
  const { pathname } = useLocation();
  const isFirstHome = pathname === "/";

  useEffect(() => {
    document.body.classList.add(BODY_SCROLLBAR_CLASS);
    return () => {
      document.body.classList.remove(BODY_SCROLLBAR_CLASS);
    };
  }, []);

  return (
    <div className="home-design min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <HomeHeader />
      <main className={isFirstHome ? "flex-1 pt-[5px]" : "flex-1 pt-[calc(3.5rem+2.25rem)] md:pt-[calc(3.5rem+2.25rem)]"}>
        {children}
      </main>
      <HomeFooter />
      <MobileNav />
      <WhatsAppButton />
    </div>
  );
}
