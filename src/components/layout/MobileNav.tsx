import { Link, useLocation } from "react-router-dom";
import { Home, Gamepad2, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const location = useLocation();

  const items = [
    { label: "Home", path: "/", icon: Home },
    { label: "Games", path: "/games", icon: Gamepad2 },
    { label: "Provider", path: "/providers", icon: Building2 },
    { label: "Profile", path: "/player", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mobile:hidden glass-strong border-t border-border nav-bottom-safe">
      <div className="flex items-center justify-around h-14 min-h-[56px] px-1 mobile:px-2 gap-0 min-w-0">
        {items.map((item) => {
          const isActive =
            item.path === "/providers"
              ? location.pathname.startsWith("/providers")
              : item.path === "/player"
                ? location.pathname.startsWith("/player")
                : location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-0 flex-1 rounded-lg min-h-[44px] touch-manipulation transition-colors max-w-[80px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
