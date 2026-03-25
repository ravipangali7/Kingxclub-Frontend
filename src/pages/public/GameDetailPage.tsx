import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameImageWithFallback } from "@/components/shared/GameImageWithFallback";
import { getGame, getGameImageUrl } from "@/api/games";
import {
  getSiteSetting,
  getResolvedWhatsAppNumber,
  getWhatsAppDepositLinkWithUser,
  getWhatsAppWithdrawLinkWithUser,
} from "@/api/site";
import { getPlayerWallet, launchGameByMode } from "@/api/player";
import { useAuth } from "@/contexts/AuthContext";
import type { Game } from "@/api/games";
import {
  ChevronLeft,
  Play,
  Info,
  Star,
  Users,
  Wallet,
  Minus,
  Plus,
  MessageCircle,
  Phone,
  Zap,
  Shield,
  Clock,
  Gift,
  Trophy,
} from "lucide-react";

const WALLET_URL = "https://kingxclub.com/player/wallet";
const quickBets = [50, 100, 500, 1000, 5000];
const defaultHowToPlay = ["Place your bet", "Start the game and wait for the round", "Collect winnings instantly"];
const defaultFeatures = ["Live", "Fair", "Secure"];
const defaultDescription = "A thrilling game. Place your bet and play.";


const GameDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const isPlayer = user?.role === "player";
  const [betAmount, setBetAmount] = useState(100);
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "howToPlay" | "stats">("about");

  const { data: game, isLoading, isError: gameError, refetch: refetchGame } = useQuery({
    queryKey: ["game", id],
    queryFn: () => getGame(id!),
    enabled: !!id,
  });
  const { data: siteSetting } = useQuery({ queryKey: ["siteSetting"], queryFn: getSiteSetting });
  const { data: wallet } = useQuery({
    queryKey: ["playerWallet"],
    queryFn: getPlayerWallet,
    enabled: !!isPlayer,
  });

  useEffect(() => {
    let visibilityTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const refetchBalance = () => {
      if (!isPlayer) return;
      queryClient.invalidateQueries({ queryKey: ["playerWallet"] });
      queryClient.invalidateQueries({ queryKey: ["player-wallet"] });
      refreshUser?.();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && isPlayer) {
        if (visibilityTimeoutId) clearTimeout(visibilityTimeoutId);
        visibilityTimeoutId = setTimeout(() => {
          refetchBalance();
          visibilityTimeoutId = null;
        }, 500);
      }
    };
    const onFocus = () => {
      if (isPlayer) refetchBalance();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      if (visibilityTimeoutId) clearTimeout(visibilityTimeoutId);
    };
  }, [isPlayer, queryClient, refreshUser]);

  if (isLoading || !id)
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        Loading game...
      </div>
    );
  if (gameError)
    return (
      <div className="container mx-auto px-4 py-8 text-center space-y-2">
        <p className="text-muted-foreground">Could not load game.</p>
        <Button variant="outline" size="sm" onClick={() => refetchGame()}>
          Retry
        </Button>
      </div>
    );
  if (!game) return <div className="container mx-auto px-4 py-8 text-center">Game not found</div>;

  const g = game as Game;
  const minBet = Number(g.min_bet) || 10;
  const maxBet = Number(g.max_bet) || 5000;
  const totalBalance =
    isPlayer && wallet != null
      ? Number((wallet as { main_balance?: string }).main_balance || 0) +
        Number((wallet as { bonus_balance?: string }).bonus_balance || 0)
      : 0;
  const balanceFormatted = totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const canPlay = totalBalance >= betAmount;
  const rating = 4.5;
  const rtp = 96;
  const siteSettingRecord = siteSetting as { whatsapp_number?: string; phones?: string[] } | undefined;
  const resolvedNumber = getResolvedWhatsAppNumber(siteSettingRecord, user);
  const whatsAppDepositLink = getWhatsAppDepositLinkWithUser(
    siteSettingRecord,
    user,
    "Hi! I want to deposit funds to my account."
  );
  const whatsAppWithdrawLink = getWhatsAppWithdrawLinkWithUser(
    siteSettingRecord,
    user,
    "Hi! I want to withdraw funds from my account."
  );
  const phones = siteSettingRecord?.phones;
  const phoneNumber = resolvedNumber || (Array.isArray(phones) && phones[0] ? phones[0] : "");

  const handleBetChange = (value: number) => {
    setBetAmount(Math.max(minBet, Math.min(maxBet, value)));
  };

  const handleStartPlaying = async () => {
    if (!id) return;
    if (!user) {
      navigate("/login", { state: { from: `/games/${id}` } });
      return;
    }
    if (user?.role !== "player") return;
    if (totalBalance < betAmount) return;
    setIsLaunching(true);
    try {
      await launchGameByMode(g.id, navigate);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 min-w-0 max-w-full">
      <Link
        to="/games"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Games
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1: Image */}
        <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-border lg:col-start-1 lg:row-start-1">
          <GameImageWithFallback
            src={getGameImageUrl(g)}
            alt={g.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/30 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{g.name}</h2>
              <p className="text-muted-foreground mb-6">by {g.provider_name ?? ""}</p>
              <p className="text-sm text-muted-foreground">
                Min Bet: ₹{minBet} | Max Bet: ₹{maxBet.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full">
            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
            <Users className="w-4 h-4 text-neon-green" />
            <span className="font-mono text-sm">0 playing</span>
          </div>
        </div>

        {/* 2: Place your bet */}
        <div className="glass rounded-xl p-6 lg:col-start-2 lg:row-start-1">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Place Your Bet
            </h3>

            <div className="glass rounded-lg p-4 mb-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono">₹{balanceFormatted}</span>
                <a href={WALLET_URL}>
                  <Button variant="gold" size="sm">
                    Add Funds
                  </Button>
                </a>
              </div>
              {!user && (
                <p className="text-xs text-muted-foreground mt-1">Log in to see your balance</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Bet Amount</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleBetChange(betAmount - 10)}
                  disabled={betAmount <= minBet}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => handleBetChange(Number(e.target.value))}
                  className="text-center font-mono text-lg h-12"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleBetChange(betAmount + 10)}
                  disabled={betAmount >= maxBet}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickBets.map((amount) => (
                  <Button
                    key={amount}
                    variant={betAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBetAmount(amount)}
                  >
                    ₹{amount}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setBetAmount(maxBet)}>
                  MAX
                </Button>
              </div>
            </div>

            <Button
              variant="neon"
              size="xl"
              className="w-full mt-6 gap-2"
              onClick={() => {
                if (!user) {
                  navigate("/login", { state: { from: `/games/${id}` } });
                  return;
                }
                handleStartPlaying();
              }}
              disabled={isLaunching || (!!user && isPlayer && !canPlay)}
            >
              <Play className="w-5 h-5" />
              {!user
                ? "Login to Play"
                : !isPlayer
                  ? "Only players can play"
                  : isLaunching
                    ? "Redirecting..."
                    : "Start Playing"}
            </Button>
            {isPlayer && !canPlay && user && (
              <p className="text-sm text-destructive mt-2">Insufficient balance</p>
            )}
          </div>

        {/* 3: Deposit fund */}
        <div className="glass rounded-xl p-4 space-y-3 lg:col-start-2 lg:row-start-2">
          <a
            href={WALLET_URL}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <p className="font-medium">Deposit Funds</p>
              <p className="text-xs text-muted-foreground">Add money to play</p>
            </div>
          </a>
          <a
              href={whatsAppDepositLink || WALLET_URL}
              target={whatsAppDepositLink ? "_blank" : undefined}
              rel={whatsAppDepositLink ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors border border-[#25D366]/30"
            >
              <div className="w-10 h-10 rounded-lg bg-[#25D366]/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </div>
              <div className="flex-1">
                <p className="font-medium flex items-center gap-2">
                  Instant Deposit
                  <Zap className="w-4 h-4 text-accent" />
                </p>
                <p className="text-xs text-muted-foreground">Via WhatsApp</p>
              </div>
            </a>
            <a
              href={whatsAppWithdrawLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium flex items-center gap-2">
                  Instant Withdraw
                  <Zap className="w-4 h-4 text-accent" />
                </p>
                <p className="text-xs text-muted-foreground">Via WhatsApp</p>
              </div>
            </a>
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Call Admin</p>
                  <p className="text-xs text-muted-foreground">{phoneNumber}</p>
                </div>
              </a>
            )}
          </div>

        {/* 4: About */}
        <div className="glass rounded-xl p-6 lg:col-start-1 lg:row-start-2">
          <div className="flex items-center gap-4 mb-6 border-b border-border pb-4">
            <Button
              variant={activeTab === "about" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("about")}
            >
              About
            </Button>
            <Button
              variant={activeTab === "howToPlay" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("howToPlay")}
            >
              How to Play
            </Button>
            <Button
              variant={activeTab === "stats" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("stats")}
            >
              Stats
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                About {g.name}
              </h3>
              <p className="text-muted-foreground">{defaultDescription}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-accent mb-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{rating}</span>
                </div>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="font-bold text-primary mb-1">{rtp}%</div>
                <p className="text-xs text-muted-foreground">RTP</p>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="font-bold text-neon-green mb-1">₹{minBet}</div>
                <p className="text-xs text-muted-foreground">Min Bet</p>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="font-bold text-accent mb-1">₹{maxBet.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Max Bet</p>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="font-semibold mb-3">How to Play</h4>
              <ol className="space-y-2">
                {defaultHowToPlay.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {defaultFeatures.map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1 bg-muted rounded-full text-xs font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Safe & Secure - full width */}
        <div className="glass rounded-xl p-4 lg:col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-neon-green" />
            <span className="text-sm font-medium">Safe & Secure Gaming</span>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Instant payouts 24/7
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Daily bonuses & rewards
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Fair & transparent gameplay
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetailPage;
