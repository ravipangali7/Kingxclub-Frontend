import { Link, useNavigate } from "react-router-dom";
import { providers as defaultProviders } from "@/data/homePageMockData";
import type { ProviderShape } from "@/data/homePageMockData";
import { PLAY_MODE } from "@/config";
import { launchGameByMode } from "@/api/player";

interface GameProvidersProps {
  providers?: ProviderShape[] | null;
  sectionTitle?: React.ReactNode;
  sectionSvg?: string;
  loading?: boolean;
}

export function GameProviders({ providers: providersProp, sectionTitle, loading }: GameProvidersProps) {
  const providers = providersProp && providersProp.length > 0 ? providersProp : defaultProviders;
  const navigate = useNavigate();

  const cardBase =
    "group flex flex-col items-center text-center rounded-xl border border-border bg-card/80 p-6 transition-all duration-300 ease-out " +
    "hover:shadow-[0_0_20px_2px_rgba(0,212,255,0.4),0_0_40px_4px_rgba(0,212,255,0.2)] hover:border-cyan-500/50";

  return (
    <section className="py-16 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            {sectionTitle ?? (
              <>
                Trusted <span className="gradient-text-gold">Game Providers</span>
              </>
            )}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Partnered with world-class gaming providers for the best experience
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {loading ? (
            <div className="col-span-2 md:col-span-4 text-center text-muted-foreground">Loading providers...</div>
          ) : (
          providers.map((p) => {
            const playGameId = p.single_game_id != null && p.single_game_id > 0 ? p.single_game_id : null;
            const to = p.link ?? (playGameId != null ? `/games/${playGameId}/play` : (p.id != null ? `/providers/${p.id}` : `/games?provider=${encodeURIComponent(p.name.toLowerCase().replace(/\s+/g, "-"))}`));
            const useLaunchHandler = playGameId != null && PLAY_MODE !== "iframe" && !p.link;
            const content = (
              <>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-muted/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  {p.logoImage ? (
                    <img src={p.logoImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">{p.logo}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-white">{p.name}</span>
              </>
            );
            return (
              <span key={p.id ?? p.name} className="block">
                {useLaunchHandler ? (
                  <span
                    role="link"
                    tabIndex={0}
                    className={`${cardBase} cursor-pointer block`}
                    onClick={(e) => {
                      e.preventDefault();
                      launchGameByMode(playGameId!, navigate);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        launchGameByMode(playGameId!, navigate);
                      }
                    }}
                  >
                    {content}
                  </span>
                ) : (
                  <Link to={to} className={cardBase}>
                    {content}
                  </Link>
                )}
              </span>
            );
          })
          )}
        </div>
      </div>
    </section>
  );
}
