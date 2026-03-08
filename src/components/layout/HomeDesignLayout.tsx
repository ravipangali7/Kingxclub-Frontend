import { ReactNode } from "react";
import { HomeHeader } from "./HomeHeader";
import { HomeFooter } from "./HomeFooter";
import { MobileNav } from "./MobileNav";
import { WhatsAppButton } from "./WhatsAppButton";

interface HomeDesignLayoutProps {
  children: ReactNode;
}

export function HomeDesignLayout({ children }: HomeDesignLayoutProps) {
  return (
    <div className="home-design min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <HomeHeader />
      <main className="flex-1 pt-[calc(3.5rem+2.25rem)] md:pt-[calc(3.5rem+2.25rem)]">
        {children}
      </main>
      <HomeFooter />
      <MobileNav />
      <WhatsAppButton />
    </div>
  );
}
