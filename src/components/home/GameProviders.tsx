import { Link, useNavigate } from "react-router-dom";
import { providers as defaultProviders } from "@/data/homePageMockData";
import type { ProviderShape } from "@/data/homePageMockData";
import { PLAY_MODE } from "@/config";
import { launchGameByMode } from "@/api/player";

interface GameProvidersProps {
  providers?: ProviderShape[] | null;
  loading?: boolean;
}

const linkClass = "group block";

export function GameProviders({ providers: providersProp, loading }: GameProvidersProps) {
  const navigate = useNavigate();
  const providers = providersProp && providersProp.length > 0 ? providersProp : defaultProviders;

  return (
    <section className="py-16 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Trusted <span className="gradient-text-gold">Game Providers</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Partnered with world-class gaming providers for the best experience
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-2 md:col-span-4 text-center text-muted-foreground">Loading providers...</div>
          ) : (
            providers.map((provider) => {
              const playGameId =
                provider.single_game_id != null && provider.single_game_id > 0 ? provider.single_game_id : null;
              const to =
                playGameId != null
                  ? `/games/${playGameId}/play`
                  : provider.id != null
                    ? `/providers/${provider.id}`
                    : provider.link ?? `/games?provider=${provider.name.toLowerCase().replace(/\s+/g, "-")}`;
              const useLaunchHandler = playGameId != null && PLAY_MODE !== "iframe";
              const content = (
                <div className="glass rounded-xl p-6 text-center hover:glow-cyan transition-all duration-300 group-hover:scale-105">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${provider.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    {provider.logoImage ? (
                      <img src={provider.logoImage} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white">{provider.logo}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{provider.name}</h3>
                  {/* <p className="text-sm text-muted-foreground">{provider.games}+ Games</p> */}
                </div>
              );
              const key = provider.id ?? provider.name;
              return (
                <span key={key}>
                  {useLaunchHandler ? (
                    <span
                      role="link"
                      tabIndex={0}
                      className={`${linkClass} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
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
                    <Link to={to} className={linkClass}>
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
