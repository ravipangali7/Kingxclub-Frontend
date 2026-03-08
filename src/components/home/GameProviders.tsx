import { Link } from "react-router-dom";
import { providers as defaultProviders } from "@/data/homePageMockData";
import type { ProviderShape } from "@/data/homePageMockData";

interface GameProvidersProps {
  providers?: ProviderShape[] | null;
  loading?: boolean;
}

export function GameProviders({ providers: providersProp, loading }: GameProvidersProps) {
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
            providers.map((provider) => (
              <Link
                key={provider.name}
                to={provider.link ?? `/games?provider=${provider.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="group"
              >
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
                  <p className="text-sm text-muted-foreground">{provider.games}+ Games</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
