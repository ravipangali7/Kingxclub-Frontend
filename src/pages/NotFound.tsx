import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy relative overflow-hidden">
      <div className="absolute inset-0 hero-bg" />
      <div className="absolute inset-0 gaming-grid-bg opacity-30" />
      <div className="text-center relative z-10">
        <div className="h-20 w-20 mx-auto rounded-2xl gold-gradient flex items-center justify-center neon-glow mb-6">
          <Gamepad2 className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="mb-2 font-gaming text-5xl font-bold neon-text">404</h1>
        <p className="mb-6 text-lg text-navy-foreground/60">Page not found</p>
        <a href="/">
          <Button className="gold-gradient text-primary-foreground font-display font-semibold neon-glow-sm">
            Return Home
          </Button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
