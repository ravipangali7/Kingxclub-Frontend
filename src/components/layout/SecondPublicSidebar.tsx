import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  Radio,
  Trophy,
  Gamepad2,
  Dices,
  Building2,
  Gift,
  HelpCircle,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const sportsList = [
  "Cricket",
  "Soccer",
  "Basketball",
  "Tennis",
  "Volleyball",
  "Ice Hockey",
  "Handball",
  "Baseball",
  "Futsal",
  "Snooker",
  "Table Tennis",
  "Badminton",
  "Boxing",
  "MMA",
  "Darts",
  "Rugby",
  "Golf",
  "Motor Sports",
  "Cycling",
  "Winter Sports",
  "Billiards",
  "Floorball",
  "Water Polo",
  "Field Hockey",
  "Kabaddi",
  "Squash",
  "Gaelic Football",
  "Hurling",
  "Special Bets",
];

const sidebarMain = [
  { label: "Home", path: "/", icon: Home },
  { label: "Live", path: "/", icon: Radio },
  { label: "Sports", icon: Trophy, children: sportsList },
  { label: "Esports", path: "/games", icon: Gamepad2 },
  { label: "Virtual Betting", path: "/games", icon: Dices },
  { label: "Casino", path: "/games", icon: Building2 },
  { label: "Promotions", path: "/bonus", icon: Gift },
  { label: "Help", path: "/wallet", icon: HelpCircle },
  { label: "My Account", path: "/login", icon: User },
];

export const SecondPublicSidebar = () => {
  const [sportsOpen, setSportsOpen] = useState(true);
  const location = useLocation();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card text-card-foreground hidden md:flex flex-col overflow-y-auto">
      <nav className="p-3 space-y-0.5">
        {sidebarMain.map((item) => {
          if ("children" in item && Array.isArray(item.children)) {
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setSportsOpen(!sportsOpen)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {sportsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {sportsOpen && (
                  <ul className="pl-6 pr-2 py-1 space-y-0.5">
                    {item.children.map((sport) => (
                      <li key={sport}>
                        <Link
                          to="/games"
                          className="block px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          {sport}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          }
          const path = "path" in item ? item.path : "/";
          const isActive = location.pathname === path;
          return (
            <Link
              key={item.label}
              to={path}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
