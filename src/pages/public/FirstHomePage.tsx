import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GameCard } from "@/components/shared/GameCard";
import { getSiteSetting, getTestimonials } from "@/api/site";
import {
  getGames,
  getCategories,
  getProviders,
  getGameImageUrl,
  type Game,
  type GameCategory,
  type GameProvider,
} from "@/api/games";
import {
  DollarSign,
  Users,
  Clock,
  Shield,
  ChevronRight,
  Gift,
  Sparkles,
} from "lucide-react";

const STAT_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  dollar: DollarSign,
  users: Users,
  clock: Clock,
  shield: Shield,
};

const defaultStats = [
  { label: "Total Winnings", value: "$3M+", icon_key: "dollar" },
  { label: "Active Users", value: "2M+", icon_key: "users" },
  { label: "Instant Withdrawal", value: "5 Sec", icon_key: "clock" },
  { label: "Fair Games", value: "100%", icon_key: "shield" },
];

const defaultBiggestWins = [
  { player: "P_187", game: "Crazy Time", amount: "100.25", payout: "X20.24 Payout" },
  { player: "M_221", game: "Sweet Bonanza", amount: "50.00", payout: "X15.00 Payout" },
  { player: "E_122", game: "Aviator", amount: "120.00", payout: "X2.50 Payout" },
  { player: "T_105", game: "Roulette", amount: "75.50", payout: "X5.00 Payout" },
  { player: "D_114", game: "Dragon Tiger", amount: "200.00", payout: "X10.00 Payout" },
];

const defaultPromoBanners = [
  { title: "Welcome Bonus", subtitle: "200% up to $1000", cta_label: "Claim Now", cta_link: "/bonus", icon: "gift" },
  { title: "Invite Friends", subtitle: "Earn FREE", cta_label: "Claim Now", cta_link: "/register", icon: "sparkles" },
];

const categoryIcons = ["🎮", "🤖", "🕹️", "🎰", "🎡", "🎣", "🃏", "📋"];

const FirstHomePage = () => {
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const { data: gamesResp, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ["games", "first-home"],
    queryFn: () => getGames(undefined, undefined, 1, 100),
  });
  const games = Array.isArray(gamesResp?.results) ? gamesResp.results : [];
  const { data: categoriesRaw = [], isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } =
    useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const { data: providers = [], isLoading: providersLoading } = useQuery({ queryKey: ["providers"], queryFn: getProviders });
  const { data: testimonials = [] } = useQuery({ queryKey: ["testimonials"], queryFn: getTestimonials });

  const site = siteSetting as Record<string, unknown> | undefined;
  const heroTitle = (site?.hero_title as string) ?? "Play. Win. Repeat.";
  const heroSubtitle =
    (site?.hero_subtitle as string) ??
    "Discover a world of endless entertainment. Dive into a diverse collection of exciting games.";

  const homeStats = (Array.isArray(site?.home_stats) && site.home_stats.length > 0
    ? site.home_stats
    : defaultStats) as { label: string; value: string; icon_key?: string }[];
  const biggestWins = (Array.isArray(site?.biggest_wins) && site.biggest_wins.length > 0
    ? site.biggest_wins
    : defaultBiggestWins) as { player: string; game: string; amount: string; payout: string }[];
  const promoBanners = (Array.isArray(site?.promo_banners) && site.promo_banners.length > 0
    ? site.promo_banners
    : defaultPromoBanners) as { title: string; subtitle: string; cta_label: string; cta_link: string; icon?: string }[];

  const getCountByCategory = (categoryId: number) =>
    games.filter((g: Game) => g.category === categoryId).length;

  const maxPerSection = 10;
  const topPicks = games.slice(0, maxPerSection);
  const popular = games.slice(2, 2 + maxPerSection);
  const upcoming = games.slice(4, 4 + maxPerSection);
  const trending = games.slice(1, 1 + maxPerSection);
  const newReleases = games.slice(0, maxPerSection);

  const sectionTitle = "text-sm text-muted-foreground text-center mb-6";
  const gradientText = "bg-gradient-to-r from-violet-500 to-teal-400 bg-clip-text text-transparent font-bold";

  return (
    <div className="space-y-0 pb-8 bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-navy-foreground min-h-[70vh] flex items-center">
        <div className="absolute inset-0 hero-bg" />
        <div className="absolute inset-0 gaming-grid-bg opacity-50" />
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-glow-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/10 blur-[120px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />

        <div className="relative container px-4 py-16 md:py-24 text-center">
          <h1 className={`font-gaming text-4xl md:text-6xl lg:text-7xl font-bold mb-4 ${gradientText}`}>
            {heroTitle}
          </h1>
          <p className="text-navy-foreground/70 text-base md:text-xl mb-8 max-w-2xl mx-auto">
            {heroSubtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link to="/games">
              <Button className="bg-gradient-to-r from-violet-500 to-teal-500 text-white font-semibold px-8 h-12 hover:opacity-90">
                Explore Games
              </Button>
            </Link>
            <Link to="/wallet">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8">
                Instant Withdrawal
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {homeStats.map((s) => {
              const Icon = STAT_ICONS[(s.icon_key ?? "dollar").toLowerCase()] ?? DollarSign;
              return (
                <div key={s.label} className="flex flex-col items-center gap-2 p-4 rounded-full bg-white/5 border border-white/10">
                  <Icon className="h-8 w-8 text-teal-400" />
                  <span className="font-gaming font-bold text-lg text-white">{s.value}</span>
                  <span className="text-xs text-white/60">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Promo Banners (dynamic from site settings) */}
      <section className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promoBanners.slice(0, 2).map((banner, i) => (
            <Card
              key={banner.title + i}
              className={`overflow-hidden border ${
                i === 0
                  ? "bg-gradient-to-r from-violet-600/90 to-violet-800/90 border-violet-500/30"
                  : "bg-gradient-to-r from-emerald-600/90 to-emerald-800/90 border-emerald-500/30"
              }`}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                    {banner.icon === "sparkles" ? (
                      <Sparkles className="h-7 w-7 text-white" />
                    ) : (
                      <Gift className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{banner.title}</p>
                    <p className="text-white font-bold text-xl">{banner.subtitle}</p>
                  </div>
                </div>
                <Link to={banner.cta_link || "/bonus"}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    {banner.cta_label || "Claim Now"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Explore Game Categories */}
      <section className="container px-4 py-8">
        <h2 className={sectionTitle}>Explore Game Categories</h2>
        {categoriesLoading && <p className="text-sm text-muted-foreground py-4">Loading categories…</p>}
        {categoriesError && (
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">Could not load categories.</p>
            <Button variant="outline" size="sm" onClick={() => refetchCategories()}>Retry</Button>
          </div>
        )}
        {!categoriesLoading && !categoriesError && (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categories.slice(0, 8).map((cat: GameCategory, i: number) => (
              <Link key={cat.id} to={`/games?category=${cat.id}`}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-violet-500/50 transition-all duration-300 group">
                  <span className="text-3xl group-hover:scale-125 transition-transform">{categoryIcons[i % categoryIcons.length]}</span>
                  <span className="text-[10px] font-semibold whitespace-nowrap text-center">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{getCountByCategory(cat.id)}+ Games</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Game sections: Top Picks, Popular, Upcoming, Trending, New Releases */}
      {[
        { title: "Top Picks For You", list: topPicks },
        { title: "Popular Games", list: popular },
        { title: "Upcoming Games", list: upcoming },
        { title: "Trending Games", list: trending },
        { title: "New Releases", list: newReleases },
      ].map(({ title, list }) => (
        <section key={title} className="container px-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">{title}</h2>
            <Link to="/games" className="text-sm text-orange-500 flex items-center gap-1 hover:underline font-medium">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {gamesLoading && <p className="text-sm text-muted-foreground py-4">Loading games…</p>}
          {gamesError && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">Could not load games.</p>
              <Button variant="outline" size="sm" onClick={() => refetchGames()}>Retry</Button>
            </div>
          )}
          {!gamesLoading && !gamesError && (
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-hide">
              {list.map((game) => (
                <div key={game.id} className="snap-start min-w-[170px] md:min-w-[220px]">
                  <Link to={`/games/${game.id}`}>
                    <GameCard
                      image={getGameImageUrl(game)}
                      name={game.name}
                      category={game.category_name ?? ""}
                      minBet={Number(game.min_bet)}
                      maxBet={Number(game.max_bet)}
                    />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Trusted Game Providers */}
      <section className="container px-4 py-10">
        <h2 className={sectionTitle}>Trusted Game Providers</h2>
        {providersLoading && <p className="text-sm text-muted-foreground py-4">Loading providers…</p>}
        {!providersLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {providers.slice(0, 8).map((p: GameProvider) => (
              <div
                key={p.id}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-violet-500/30 transition-all"
              >
                <span className="text-lg font-semibold text-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Biggest Wins Today */}
      <section className="container px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl">Biggest Wins Today</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">All Games</Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Crypto</Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {biggestWins.map((w, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {String(w.player).slice(0, 1)}
                    </div>
                    <span className="font-medium text-sm">{w.player}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{w.game}</span>
                  <span className="text-sm font-semibold text-green-500">${w.amount}</span>
                  <span className="text-xs text-muted-foreground">{w.payout}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Testimonials carousel */}
      {Array.isArray(testimonials) && testimonials.length > 0 && (
        <section className="container px-4 pt-10 pb-6">
          <h2 className="font-display font-bold text-2xl mb-5">Player Reviews</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide">
            {testimonials.map((t: { id: number; image?: string | null; name: string; stars?: number; message: string }) => (
              <Card key={t.id} className="min-w-[280px] snap-start flex-shrink-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {t.image ? (
                      <img src={t.image} alt={t.name} className="h-11 w-11 rounded-full object-cover bg-muted" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-sm text-primary">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <div className="flex text-warning text-xs">
                        {Array.from({ length: t.stars ?? 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FirstHomePage;
