import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GameCard } from "@/components/shared/GameCard";
import { getSiteSetting, getTestimonials } from "@/api/site";
import { getGames, getCategories, getGameImageUrl } from "@/api/games";
import { Users, Gamepad2, Trophy, Headphones, Star, ChevronRight, Zap, Shield, Flame, TrendingUp, Crown, Sparkles, Dice1, Target } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "Active Players", value: "12K+", icon: Users, color: "text-neon" },
  { label: "Games", value: "500+", icon: Gamepad2, color: "text-primary" },
  { label: "Total Winnings", value: "₹5Cr+", icon: Trophy, color: "text-warning" },
  { label: "24/7 Support", value: "Always", icon: Headphones, color: "text-accent" },
];

const liveWinners = [
  { name: "Ram S.", game: "Dragon Tiger", amount: 15000 },
  { name: "Sita D.", game: "Crash Aviator", amount: 8500 },
  { name: "Hari B.", game: "Roulette Pro", amount: 22000 },
  { name: "Gita K.", game: "Teen Patti", amount: 5600 },
  { name: "Bikash T.", game: "Blackjack VIP", amount: 31000 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const HomePage = () => {
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const { data: gamesData, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({ queryKey: ["games", "home"], queryFn: () => getGames(undefined, undefined, 1, 100) });
  const games = Array.isArray(gamesData?.results) ? gamesData.results : [];
  const { data: categoriesRaw = [], isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const { data: testimonials = [] } = useQuery({ queryKey: ["testimonials"], queryFn: getTestimonials });
  const heroTitle = (siteSetting as Record<string, string> | undefined)?.hero_title ?? "Play. Win. Dominate.";
  const heroSubtitle = (siteSetting as Record<string, string> | undefined)?.hero_subtitle ?? "Nepal's Premier Online Gaming Platform";
  const topGames = games.slice(0, 12);

  return (
    <div className="space-y-0 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-navy text-navy-foreground min-h-[80vh] flex items-center">
        <div className="absolute inset-0 hero-bg" />
        <div className="absolute inset-0 gaming-grid-bg opacity-50" />
        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-glow-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/10 blur-[120px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-neon/5 blur-[150px] animate-glow-pulse" style={{ animationDelay: "0.8s" }} />

        <div className="relative container px-4 py-20 md:py-32">
          <motion.div className="max-w-2xl" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon/30 bg-neon/5 text-neon text-xs font-semibold mb-6 animate-bounce-sm">
              <Zap className="h-3.5 w-3.5" /> Nepal's #1 Gaming Platform
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="font-gaming text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              <span className="neon-text text-glow">{heroTitle}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-navy-foreground/60 text-base md:text-xl mb-10 max-w-lg leading-relaxed">{heroSubtitle}</motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex gap-4 flex-wrap">
              <Link to="/games">
                <Button className="gold-gradient text-primary-foreground font-gaming font-semibold px-8 h-14 text-base neon-glow-lg tracking-wider">
                  <Gamepad2 className="h-5 w-5 mr-2" /> START PLAYING
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="border-neon/40 text-neon font-display h-14 px-8 hover:bg-neon/10 text-base tracking-wide">
                  <Sparkles className="h-4 w-4 mr-2" /> Join Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {stats.map((s, i) => (
              <div key={s.label} className="gaming-card rounded-xl p-5 text-center group hover:neon-glow transition-all duration-300 cyber-border" style={{ animationDelay: `${i * 0.1}s` }}>
                <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color} group-hover:animate-bounce-sm transition-colors`} />
                <p className="font-gaming font-bold text-2xl neon-text">{s.value}</p>
                <p className="text-[11px] text-navy-foreground/50 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Winners Ticker */}
      <section className="bg-primary/5 border-y border-primary/10 py-3 overflow-hidden">
        <div className="container px-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <span className="flex items-center gap-1 text-xs font-gaming text-primary flex-shrink-0">
              <Flame className="h-3.5 w-3.5 text-warning animate-glow-pulse" /> LIVE WINS
            </span>
            {liveWinners.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs flex-shrink-0 px-3 py-1.5 rounded-full bg-card/80 border border-border/50">
                <Crown className="h-3 w-3 text-warning" />
                <span className="font-medium">{w.name}</span>
                <span className="text-muted-foreground">won</span>
                <span className="text-success font-bold">₹{w.amount.toLocaleString()}</span>
                <span className="text-muted-foreground">in {w.game}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Picks Carousel */}
      <section className="container px-4 pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <span className="h-7 w-1.5 rounded-full gold-gradient inline-block" />
            <Flame className="h-5 w-5 text-warning" /> Top Picks
          </h2>
          <Link to="/games" className="text-sm text-primary flex items-center gap-1 hover:underline font-medium">View All <ChevronRight className="h-4 w-4" /></Link>
        </div>
        {gamesLoading && <p className="text-sm text-muted-foreground py-4">Loading games…</p>}
        {gamesError && (
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">Could not load games.</p>
            <Button variant="outline" size="sm" onClick={() => refetchGames()}>Retry</Button>
          </div>
        )}
        {!gamesLoading && !gamesError && (
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-hide">
            {topGames.map((game) => (
              <div key={game.id} className="snap-start min-w-[170px] md:min-w-[220px]">
                <Link to={`/games/${game.id}`}>
                  <GameCard image={getGameImageUrl(game)} name={game.name} category={game.category_name ?? ""} minBet={Number(game.min_bet)} maxBet={Number(game.max_bet)} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bonus Banners */}
      <section className="container px-4 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gold-gradient overflow-hidden neon-glow group hover:scale-[1.02] transition-transform duration-300">
            <CardContent className="p-6 relative">
              <div className="absolute top-3 right-3 h-20 w-20 rounded-full bg-white/10 flex items-center justify-center animate-spin-slow">
                <Trophy className="h-10 w-10 text-white/40" />
              </div>
              <p className="text-primary-foreground/60 text-xs font-gaming tracking-wider">WELCOME OFFER</p>
              <h3 className="font-gaming font-bold text-2xl text-primary-foreground tracking-wide mt-1">100% BONUS</h3>
              <p className="text-primary-foreground/80 text-sm mt-2">Up to ₹5,000 on first deposit!</p>
              <Button className="mt-4 bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm" size="sm">Claim Now</Button>
            </CardContent>
          </Card>
          <Card className="bg-accent overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <CardContent className="p-6 relative">
              <div className="absolute top-3 right-3 h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
                <Users className="h-10 w-10 text-white/40 animate-float" />
              </div>
              <p className="text-accent-foreground/60 text-xs font-gaming tracking-wider">REFERRAL</p>
              <h3 className="font-gaming font-bold text-2xl text-accent-foreground tracking-wide mt-1">EARN ₹500</h3>
              <p className="text-accent-foreground/80 text-sm mt-2">For each friend you invite!</p>
              <Button className="mt-4 bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm" size="sm">Share Code</Button>
            </CardContent>
          </Card>
          <Card className="electric-gradient overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <CardContent className="p-6 relative">
              <div className="absolute top-3 right-3 h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
                <Target className="h-10 w-10 text-white/40 animate-scale-pulse" />
              </div>
              <p className="text-white/60 text-xs font-gaming tracking-wider">DAILY</p>
              <h3 className="font-gaming font-bold text-2xl text-white tracking-wide mt-1">CASHBACK 10%</h3>
              <p className="text-white/80 text-sm mt-2">On every losing bet, daily!</p>
              <Button className="mt-4 bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm" size="sm">Learn More</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Game Categories */}
      <section className="container px-4 pt-10">
        <h2 className="font-display font-bold text-2xl mb-5 flex items-center gap-2">
          <span className="h-7 w-1.5 rounded-full gold-gradient inline-block" />
          <Dice1 className="h-5 w-5 text-accent" /> Game Categories
        </h2>
        {categoriesLoading && <p className="text-sm text-muted-foreground py-4">Loading categories…</p>}
        {categoriesError && (
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">Could not load categories.</p>
            <Button variant="outline" size="sm" onClick={() => refetchCategories()}>Retry</Button>
          </div>
        )}
        {!categoriesLoading && !categoriesError && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {categories.map((cat: { id: number; name: string }) => (
              <Link key={cat.id} to={`/games?category=${cat.id}`}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:neon-glow-sm transition-all duration-300 group cyber-border">
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">🎮</span>
                  <span className="text-[10px] font-semibold whitespace-nowrap">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Category Sections */}
      {!gamesLoading && !gamesError && !categoriesLoading && !categoriesError && categories.slice(0, 5).map((cat: { id: number; name: string }) => {
        const catGames = games.filter((g: { category: number }) => g.category === cat.id).slice(0, 10);
        if (catGames.length === 0) return null;
        return (
          <section key={cat.id} className="container px-4 pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl flex items-center gap-2">
                <span className="text-xl">🎮</span> {cat.name}
              </h2>
              <Link to={`/games?category=${cat.id}`} className="text-xs text-primary flex items-center gap-1 hover:underline font-medium">More <ChevronRight className="h-3 w-3" /></Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
              {catGames.map((game: { id: number; image?: string; name: string; category_name?: string; min_bet: string; max_bet: string }) => (
                <div key={game.id} className="snap-start min-w-[150px] md:min-w-[190px]">
                  <Link to={`/games/${game.id}`}>
                    <GameCard image={getGameImageUrl(game)} name={game.name} category={game.category_name ?? ""} minBet={Number(game.min_bet)} maxBet={Number(game.max_bet)} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Why Choose Us */}
      <section className="container px-4 pt-10">
        <div className="text-center mb-8">
          <h2 className="font-gaming font-bold text-2xl neon-text tracking-wide">WHY CHOOSE US</h2>
          <p className="text-sm text-muted-foreground mt-2">The ultimate gaming experience in Nepal</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Shield, title: "SSL Secured", desc: "256-bit encryption", color: "text-success" },
            { icon: Zap, title: "Instant Payouts", desc: "Within 5 minutes", color: "text-primary" },
            { icon: Headphones, title: "24/7 Support", desc: "Always available", color: "text-neon" },
            { icon: TrendingUp, title: "Best Odds", desc: "Industry leading", color: "text-accent" },
          ].map((item) => (
            <Card key={item.title} className="gaming-card hover:neon-glow-sm transition-all duration-300">
              <CardContent className="p-5 text-center">
                <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
                <h3 className="font-display font-bold text-sm">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="container px-4 pt-10">
        <div className="gaming-card rounded-2xl p-8 md:p-12 text-center neon-glow-sm relative overflow-hidden">
          <div className="absolute inset-0 hero-bg opacity-50" />
          <div className="relative">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4 animate-float" />
            <h3 className="font-gaming font-bold text-xl neon-text mb-3 tracking-wide">SAFE & SECURE GAMING</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              256-bit SSL encryption, licensed and regulated. Your funds and data are always protected with our advanced security.
            </p>
            <div className="flex justify-center gap-8 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-success" /> SSL Secured</span>
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Instant Payouts</span>
              <span className="flex items-center gap-1.5"><Headphones className="h-4 w-4 text-accent" /> 24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container px-4 pt-10 pb-6">
        <h2 className="font-display font-bold text-2xl mb-5 flex items-center gap-2">
          <span className="h-7 w-1.5 rounded-full gold-gradient inline-block" />
          ⭐ Player Reviews
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide">
          {testimonials.map((t: { id: number; image?: string | null; name: string; stars?: number; message: string }) => (
            <Card key={t.id} className="min-w-[280px] snap-start flex-shrink-0 hover:border-primary/30 hover:neon-glow-sm transition-all duration-300 gaming-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  {t.image ? (
                    <img src={t.image} alt={t.name} className="h-11 w-11 rounded-full ring-2 ring-primary/30 object-cover bg-muted" />
                  ) : (
                    <div className="h-11 w-11 rounded-full ring-2 ring-primary/30 bg-primary/20 flex items-center justify-center font-semibold text-sm text-primary">{t.name.charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <div className="flex text-warning text-xs">
                      {Array.from({ length: t.stars ?? 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
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
    </div>
  );
};

export default HomePage;
