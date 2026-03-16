import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getPromotions, type PromotionApi } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const PREVIEW_LENGTH = 120;

function stripHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function descriptionPreview(html: string, maxLen: number = PREVIEW_LENGTH): string {
  const text = stripHtml(html);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + "…";
}

function getImageUrl(p: PromotionApi): string | null {
  const url = p.image_url ?? p.image;
  if (typeof url === "string" && url.startsWith("http")) return url;
  if (typeof url === "string" && url) return getMediaUrl(url);
  return null;
}

function hasCta(p: PromotionApi): boolean {
  const link = p.cta_link?.trim();
  const label = p.cta_label?.trim();
  return Boolean(link && label);
}

function isInternalCtaLink(link: string): boolean {
  return link.startsWith("/") && !link.startsWith("//");
}

const PromotionPage = () => {
  const { user } = useAuth();
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionApi | null>(null);
  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions"],
    queryFn: getPromotions,
  });

  const depositHref = user?.role === "player" ? "/player/wallet" : "/login";

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6 md:mb-8">
        Promotions
      </h1>

      {promotions.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No active promotions at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => {
            const imgUrl = getImageUrl(promo);
            return (
              <article
                key={promo.id}
                className="theme-card overflow-hidden flex flex-col"
              >
                {imgUrl && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                    <img
                      src={imgUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="font-display font-bold text-lg text-foreground mb-2">
                    {promo.title}
                  </h2>
                  <p className="text-muted-foreground text-sm line-clamp-3 flex-1">
                    {descriptionPreview(promo.description)}
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {hasCta(promo) &&
                      (isInternalCtaLink(promo.cta_link!) ? (
                        <Button size="sm" className="flex-1 min-w-0 bg-primary hover:bg-primary/90" asChild>
                          <Link to={promo.cta_link!}>{promo.cta_label}</Link>
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1 min-w-0 bg-primary hover:bg-primary/90" asChild>
                          <a href={promo.cta_link!} target="_blank" rel="noopener noreferrer">
                            {promo.cta_label}
                          </a>
                        </Button>
                      ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0"
                      onClick={() => setSelectedPromotion(promo)}
                    >
                      Read More
                    </Button>
                    <Button size="sm" className="flex-1 min-w-0 bg-primary hover:bg-primary/90" asChild>
                      <Link to={depositHref}>Deposit</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!selectedPromotion}
        onOpenChange={(open) => {
          if (!open) setSelectedPromotion(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto theme-card">
          {selectedPromotion && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl pr-8">
                  {selectedPromotion.title}
                </DialogTitle>
              </DialogHeader>
              {getImageUrl(selectedPromotion) && (
                <div className="rounded-lg overflow-hidden bg-muted -mx-1">
                  <img
                    src={getImageUrl(selectedPromotion)!}
                    alt=""
                    className="w-full max-h-48 object-cover"
                  />
                </div>
              )}
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{
                  __html: selectedPromotion.description || "",
                }}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPromotion(null)}>
                  Close
                </Button>
                {hasCta(selectedPromotion) &&
                  (isInternalCtaLink(selectedPromotion.cta_link!) ? (
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link to={selectedPromotion.cta_link!}>{selectedPromotion.cta_label}</Link>
                    </Button>
                  ) : (
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <a href={selectedPromotion.cta_link!} target="_blank" rel="noopener noreferrer">
                        {selectedPromotion.cta_label}
                      </a>
                    </Button>
                  ))}
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to={depositHref}>Deposit</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionPage;
