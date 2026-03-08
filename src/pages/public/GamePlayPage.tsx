import { useRef, useState, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGameLaunchUrl } from "@/api/player";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Home, Move } from "lucide-react";

const BUTTON_WIDTH = 80;
const BUTTON_HEIGHT = 36;

/** Design size many embedded games expect (min width); we scale to fit viewport on small devices. */
const DESIGN_WIDTH = 768;
const DESIGN_HEIGHT = 1024;

export default function GamePlayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [backPosition, setBackPosition] = useState({ x: 16, y: 16 });
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [positionMode, setPositionMode] = useState(false);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateScale = () => {
      const w = window.visualViewport?.width ?? window.innerWidth;
      const h = window.visualViewport?.height ?? window.innerHeight;
      // Only scale down when viewport is smaller than design size (small devices); cap at 1 so big devices stay full-size
      const s = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT, 1);
      setScale(s);
    };
    updateScale();
    window.visualViewport?.addEventListener("resize", updateScale);
    window.addEventListener("resize", updateScale);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateScale);
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const useScaleFit = scale < 1;

  const handlePlaceBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const x = Math.max(0, Math.min(window.innerWidth - BUTTON_WIDTH, e.clientX - BUTTON_WIDTH / 2));
    const y = Math.max(0, Math.min(window.innerHeight - BUTTON_HEIGHT, e.clientY - BUTTON_HEIGHT / 2));
    setBackPosition({ x, y });
    setPositionMode(false);
  };

  const { data: launchUrl, isLoading, isError, error } = useQuery({
    queryKey: ["game-launch", id],
    queryFn: () => getGameLaunchUrl(Number(id)),
    enabled: !!id && /^\d+$/.test(id),
  });

  // Full viewport; 100dvh for mobile (avoids address bar); overflow hidden for scale wrapper
  const gameContainerClass =
    "fixed inset-0 w-full max-w-full overflow-hidden min-h-0 h-[100dvh]";

  if (!id) {
    return (
      <div className={`${gameContainerClass} flex items-center justify-center p-4`}>
        <p className="text-muted-foreground">Invalid game.</p>
        <Button variant="link" onClick={() => navigate("/games")}>Back to games</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${gameContainerClass} flex items-center justify-center p-4`}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (isError || !launchUrl) {
    const err = error as { detail?: string } | undefined;
    return (
      <div className={`${gameContainerClass} flex flex-col items-center justify-center gap-4 p-4`}>
        <p className="text-muted-foreground">{err?.detail ?? "Could not load game."}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to game
        </Button>
      </div>
    );
  }

  return (
    <div className={gameContainerClass}>

      <iframe
        title="Game"
        src={launchUrl}
        className="absolute inset-0 w-[100vw] h-[87vh] min-w-0 min-h-0 border-0"
        // allow="fullscreen; payment; autoplay"
        // allowFullScreen
      />


      {positionMode && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/40"
          onClick={handlePlaceBack}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setPositionMode(false)}
          aria-label="Tap to place back button"
        >
          <p className="text-white font-medium text-center px-4 py-3 rounded-lg bg-background/90 shadow-lg max-w-[90vw]">
            Tap anywhere on screen to place the back button.
          </p>
        </div>
      )}

      <DropdownMenu open={popupOpen} onOpenChange={setPopupOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={backButtonRef}
            variant="outline"
            size="sm"
            className="fixed z-50 left-0 top-0 bg-background/90 backdrop-blur-sm shadow-md hover:bg-background will-change-transform"
            style={{ transform: `translate(${backPosition.x}px, ${backPosition.y}px)` }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="z-[60]">
          <DropdownMenuItem onClick={() => { setPopupOpen(false); navigate(-1); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setPopupOpen(false); navigate("/"); }}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setPopupOpen(false); setPositionMode(true); }}>
            <Move className="h-4 w-4 mr-2" />
            Change position
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
