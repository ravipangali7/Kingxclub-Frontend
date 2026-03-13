import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { GameCategory } from "@/api/games";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "Games", path: "/games" },
  { label: "Live Casino", path: "/games" },
  { label: "Bonus", path: "/bonus" },
  { label: "Wallet", path: "/wallet" },
];

interface SecondHomeSidebarProps {
  categories?: GameCategory[];
}

export function SecondHomeSidebar({ categories = [] }: SecondHomeSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* CTA block – matches second home dark theme (slider/bonus style) */}
      <div className="rounded-lg glass border border-white/10 p-4">
        <p className="text-sm text-foreground/90 mb-3">Join and start playing.</p>
        <div className="flex flex-col gap-2">
          <Link to="/register" className="block">
            <Button
              size="sm"
              className="w-full rounded-lg bg-white text-primary hover:bg-white/90 font-semibold h-9"
            >
              Register
            </Button>
          </Link>
          <Link to="/login" className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-lg border-white/20 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/30"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg glass border border-white/10 p-4">
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">Quick links</h3>
        <ul className="space-y-2">
          {quickLinks.map((item) => (
            <li key={item.path + item.label}>
              <Link
                to={item.path}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {categories.length > 0 && (
        <div className="rounded-lg glass border border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm text-foreground">Browse by category</h3>
            <Link to="/categories" className="text-xs text-primary font-medium hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/categories/${cat.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded-lg glass border border-white/10 p-4">
        <Link to="/bonus" className="text-sm font-medium text-primary hover:underline">
          Promotions
        </Link>
      </div>
    </aside>
  );
}
