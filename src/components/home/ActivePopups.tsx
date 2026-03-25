import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getActivePopups, type PopupApi } from "@/api/site";

const STORAGE_KEY = "popup_seen_ids";

function getSeenIds(): number[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is number => typeof x === "number") : [];
  } catch {
    return [];
  }
}

function markSeen(id: number) {
  const seen = getSeenIds();
  if (seen.includes(id)) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, id]));
}

export function ActivePopups() {
  const { data: popups = [] } = useQuery({
    queryKey: ["active-popups"],
    queryFn: getActivePopups,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seenVersion, setSeenVersion] = useState(0);

  const unseen = useMemo(() => {
    const seen = getSeenIds();
    return (popups as PopupApi[]).filter((p) => !seen.includes(p.id));
  }, [popups, seenVersion]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [unseen.length, unseen[0]?.id]);

  const current = unseen[currentIndex];
  const open = Boolean(current);

  const handleClose = () => {
    if (current) {
      markSeen(current.id);
      setSeenVersion((v) => v + 1);
      setCurrentIndex(0);
    }
  };

  const ctaLink = current?.cta_link?.trim() || "#";
  const isInternal = ctaLink.startsWith("/") && !ctaLink.startsWith("//");

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{current?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {current?.image && (
            <div className="rounded-lg overflow-hidden bg-muted w-full min-h-[140px] max-h-[45vh] flex items-center justify-center">
              <img
                src={current.image}
                alt=""
                className="w-full max-h-[45vh] object-contain object-center"
              />
            </div>
          )}
          {current?.content && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {current.content}
            </div>
          )}
          <div className="flex justify-end gap-2">
            {current && (
              isInternal ? (
                <Button asChild className="gold-gradient text-primary-foreground">
                  <Link to={ctaLink} onClick={handleClose}>
                    {current.cta_label || "OK"}
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="gold-gradient text-primary-foreground"
                >
                  <a
                    href={ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClose}
                  >
                    {current.cta_label || "OK"}
                  </a>
                </Button>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
