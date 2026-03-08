import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/utils/currency";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { Wallet, TrendingUp, Eye, Gamepad2, ArrowDownCircle, ArrowUpCircle, Shield, Send, Trophy, Clock, Flame, Radio } from "lucide-react";
import { getPlayerDashboard, getPlayerTransactions } from "@/api/player";
import { getGames, getGameImageUrl } from "@/api/games";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GameCard } from "@/components/shared/GameCard";
import { motion } from "framer-motion";

const PlayerDashboard = () => {
  const { user } = useAuth();
  const symbol = getCurrencySymbol(user);
  const { data: dashboard = {} } = useQuery({ queryKey: ["player-dashboard"], queryFn: getPlayerDashboard });
  const { data: transactions = [] } = useQuery({ queryKey: ["player-transactions"], queryFn: getPlayerTransactions });
  const { data: gamesResp } = useQuery({ queryKey: ["games", "dashboard"], queryFn: () => getGames(undefined, undefined, 1, 50) });
  const games = gamesResp?.results ?? [];
  const recent = (transactions as Record<string, unknown>[]).slice(0, 5);
  const topGames = (games as { id: number; name: string; image?: string; category_name?: string; min_bet: string; max_bet: string }[]).slice(0, 6);
  const [transferOpen, setTransferOpen] = useState(false);
  const d = dashboard as Record<string, unknown>;
  const mainBalance = String(d.main_balance ?? user?.main_balance ?? "0");
  const bonusBalance = String(d.bonus_balance ?? user?.bonus_balance ?? "0");
  const exposureBalance = String(d.exposure_balance ?? "0");

  return (
    <div className="p-2 mobile:p-4 md:p-6 space-y-4 mobile:space-y-5 max-w-5xl mx-auto min-w-0">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
        <Card className="gold-gradient neon-glow overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-8 -mb-8" />
          <CardContent className="p-4 mobile:p-6 relative z-10">
            <p className="text-primary-foreground/70 text-xs font-medium">Welcome back,</p>
            <h2 className="font-gaming font-bold text-xl mobile:text-2xl text-primary-foreground tracking-wide truncate">{user?.name || user?.username || "Player"}</h2>
            <p className="text-primary-foreground/60 text-[10px] mobile:text-xs mt-1 truncate">
              {user?.last_login
                ? `Last login: ${new Date(user.last_login).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                : "Last login: —"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Balance Cards - 3 cols; compact on small screens */}
      <div className="grid grid-cols-3 gap-2 mobile:gap-3 md:gap-4 min-w-0">
        <StatCard title="Main Balance" value={`${symbol}${Number(mainBalance).toLocaleString()}`} icon={Wallet} />
        <StatCard title="Bonus" value={`${symbol}${Number(bonusBalance).toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Exposure" value={`${symbol}${Number(exposureBalance).toLocaleString()}`} icon={Eye} />
      </div>

      {/* Quick Actions - 2x2 on tiny, 4 in a row on mobile+ */}
      <div className="grid grid-cols-2 mobile:grid-cols-4 gap-2 mobile:gap-3 min-w-0">
        <Link to="/player/wallet" className="min-w-0">
          <Card className="cursor-pointer hover:border-primary/50 hover:neon-glow-sm transition-all gaming-card h-full min-h-[72px] mobile:min-h-0 touch-manipulation">
            <CardContent className="p-3 mobile:p-4 text-center">
              <ArrowDownCircle className="h-5 w-5 mobile:h-6 mobile:w-6 mx-auto mb-1 text-success" />
              <p className="text-[10px] mobile:text-xs font-medium">Deposit</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/player/wallet" className="min-w-0">
          <Card className="cursor-pointer hover:border-primary/50 hover:neon-glow-sm transition-all gaming-card h-full min-h-[72px] mobile:min-h-0 touch-manipulation">
            <CardContent className="p-3 mobile:p-4 text-center">
              <ArrowUpCircle className="h-5 w-5 mobile:h-6 mobile:w-6 mx-auto mb-1 text-accent" />
              <p className="text-[10px] mobile:text-xs font-medium">Withdraw</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="cursor-pointer hover:border-primary/50 hover:neon-glow-sm transition-all gaming-card min-h-[72px] mobile:min-h-0 touch-manipulation" onClick={() => setTransferOpen(true)}>
          <CardContent className="p-3 mobile:p-4 text-center">
            <Send className="h-5 w-5 mobile:h-6 mobile:w-6 mx-auto mb-1 text-primary" />
            <p className="text-[10px] mobile:text-xs font-medium">Transfer</p>
          </CardContent>
        </Card>
        <Link to="/games" className="min-w-0">
          <Card className="cursor-pointer hover:border-primary/50 hover:neon-glow-sm transition-all gaming-card h-full min-h-[72px] mobile:min-h-0 touch-manipulation">
            <CardContent className="p-3 mobile:p-4 text-center">
              <Gamepad2 className="h-5 w-5 mobile:h-6 mobile:w-6 mx-auto mb-1 text-neon" />
              <p className="text-[10px] mobile:text-xs font-medium">Play</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/player/game-results" className="min-w-0">
          <Card className="cursor-pointer hover:border-primary/50 hover:neon-glow-sm transition-all gaming-card h-full min-h-[72px] mobile:min-h-0 touch-manipulation">
            <CardContent className="p-3 mobile:p-4 text-center">
              <Radio className="h-5 w-5 mobile:h-6 mobile:w-6 mx-auto mb-1 text-primary" />
              <p className="text-[10px] mobile:text-xs font-medium">Bet History</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two-column layout on desktop, single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile:gap-5 min-w-0">
        {/* Recent Activity */}
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-xs mobile:text-sm mb-2 mobile:mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 mobile:h-4 mobile:w-4 text-primary flex-shrink-0" /> Recent Activity
          </h3>
          <div className="space-y-2">
            {recent.map((t: Record<string, unknown>, i: number) => (
              <Card key={String(t.id ?? i)} className="hover:border-primary/20 transition-colors min-w-0">
                <CardContent className="p-2.5 mobile:p-3 flex items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs mobile:text-sm font-medium capitalize truncate">{String(t.transaction_type ?? t.type ?? "").replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-muted-foreground">{t.created_at ? new Date(String(t.created_at)).toLocaleDateString() : ""}</p>
                  </div>
                  <span className={`font-gaming font-bold text-xs mobile:text-sm flex-shrink-0 ${["deposit", "win", "bonus"].includes(String(t.transaction_type ?? t.type ?? "")) ? "text-success" : "text-accent"}`}>
                    {["deposit", "win", "bonus"].includes(String(t.transaction_type ?? t.type ?? "")) ? "+" : "-"}{symbol}{Number(t.amount ?? 0).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Play */}
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-xs mobile:text-sm mb-2 mobile:mb-3 flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 mobile:h-4 mobile:w-4 text-warning flex-shrink-0" /> Quick Play
          </h3>
          <div className="grid grid-cols-2 gap-2 mobile:gap-3 min-w-0">
            {topGames.map((game) => (
              <Link key={game.id} to={`/games/${game.id}`} className="min-w-0">
                <GameCard image={getGameImageUrl(game)} name={game.name} category={game.category_name ?? ""} minBet={Number(game.min_bet)} maxBet={Number(game.max_bet)} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Dialog - responsive */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] mobile:max-w-sm gaming-card w-full">
          <DialogHeader><DialogTitle className="font-gaming neon-text tracking-wider">TRANSFER</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Recipient Username</label>
              <Input placeholder="Enter username" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Amount</label>
              <Input type="number" placeholder={`${symbol}0`} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Your Password (to confirm)</label>
              <Input type="password" placeholder="Enter password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button className="gold-gradient text-primary-foreground font-gaming" onClick={() => setTransferOpen(false)}>Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerDashboard;
