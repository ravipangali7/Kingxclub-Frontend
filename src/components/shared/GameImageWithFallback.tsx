import { useState } from "react";
import { cn } from "@/lib/utils";

/** Default game placeholder SVG (controller icon). */
function DefaultGameImageSvg({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-full h-full object-cover", className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="64" height="64" fill="currentColor" className="text-muted/30" />
      <path
        d="M20 24a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V24z"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground/50"
        fill="none"
      />
      <circle cx="28" cy="32" r="3" fill="currentColor" className="text-muted-foreground/60" />
      <path
        d="M38 28l4 4-4 4M42 28l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-muted-foreground/60"
      />
      <path
        d="M24 44h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-muted-foreground/40"
      />
    </svg>
  );
}

interface GameImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Renders game image or a default SVG placeholder when src is empty or fails to load.
 */
export function GameImageWithFallback({ src, alt, className }: GameImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src?.trim() || failed;

  if (showFallback) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-muted/20", className)}>
        <DefaultGameImageSvg className="max-w-[80%] max-h-[80%]" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
