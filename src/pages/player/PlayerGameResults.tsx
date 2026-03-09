import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/utils/currency";
import { getPlayerGameLog, getPlayerWallet } from "@/api/player";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, Trophy, TrendingDown, Wallet, Radio } from "lucide-react";

const POLL_INTERVAL_MS = 3000;

const PlayerGameResults = () => {
  const { user } = useAuth();
  const symbol = getCurrencySymbol(user);
  const { data: wallet, dataUpdatedAt: walletUpdatedAt } = useQuery({
    queryKey: ["playerWallet"],
    queryFn: getPlayerWallet,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
  const { data: gameLogs = [], dataUpdatedAt: gameLogUpdatedAt } = useQuery({
    queryKey: ["player-game-log"],
    queryFn: getPlayerGameLog,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
  const [filter, setFilter] = useState<string>("all");
  const logs = gameLogs as Record<string, unknown>[];
  const resultKey = (l: Record<string, unknown>) => String(l.type ?? l.result ?? l.game_result ?? "").toLowerCase();
  const filtered = logs.slice(0, 100).filter((l) => filter === "all" || resultKey(l) === filter);
  const totalBet = filtered.reduce((s, l) => s + Number(l.effective_bet_amount ?? l.bet_amount ?? l.betAmount ?? 0), 0);
  const totalWin = filtered.reduce((s, l) => s + Number(l.win_amount ?? l.winAmount ?? 0), 0);

  const w = wallet as Record<string, unknown> | undefined;
  const mainBalance = Number(w?.main_balance ?? 0);
  const bonusBalance = Number(w?.bonus_balance ?? 0);
  const totalBalance = mainBalance + bonusBalance;
  const lastUpdated = Math.max(walletUpdatedAt ?? 0, gameLogUpdatedAt ?? 0);

  return (
    <div className="p-2 mobile:p-4 md:p-6 space-y-4 max-w-4xl mx-auto min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
        <h2 className="font-gaming font-bold text-lg mobile:text-xl neon-text tracking-wider truncate">BET HISTORY</h2>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Radio className="h-3 w-3 animate-pulse text-primary" />
          Live — updates every 3s
        </span>
      </div>

      {/* Wallet (real-time) */}
      <Card className="theme-card min-w-0 border-primary/30">
        <CardContent className="p-3 mobile:p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Wallet className="h-4 w-4 mobile:h-5 mobile:w-5 text-primary flex-shrink-0" />
              <span className="text-xs mobile:text-sm font-semibold text-muted-foreground truncate">Current balance</span>
            </div>
            {lastUpdated > 0 && (
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mobile:gap-4 mt-2 mobile:mt-3 min-w-0">
            <div>
              <p className="text-[10px] text-muted-foreground">Main</p>
              <p className="font-gaming font-bold text-lg">{symbol}{mainBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Bonus</p>
              <p className="font-gaming font-bold text-lg text-primary">{symbol}{bonusBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="font-gaming font-bold text-lg gold-gradient bg-clip-text text-transparent">{symbol}{totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mobile:gap-3 min-w-0">
        <Card className="theme-card min-w-0">
          <CardContent className="p-2 mobile:p-3 text-center">
            <Gamepad2 className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="font-gaming font-bold text-sm">{filtered.length}</p>
            <p className="text-[9px] text-muted-foreground">Total Games</p>
          </CardContent>
        </Card>
        <Card className="theme-card min-w-0">
          <CardContent className="p-2 mobile:p-3 text-center">
            <Trophy className="h-4 w-4 mx-auto text-success mb-1" />
            <p className="font-gaming font-bold text-xs mobile:text-sm text-success truncate">{symbol}{totalWin.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Total Won</p>
          </CardContent>
        </Card>
        <Card className="theme-card min-w-0">
          <CardContent className="p-2 mobile:p-3 text-center">
            <TrendingDown className="h-4 w-4 mx-auto text-accent mb-1" />
            <p className="font-gaming font-bold text-xs mobile:text-sm truncate">{symbol}{totalBet.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Total Bet</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter (align with API type: win, lose, draw) - touch-friendly */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide min-w-0 pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        {["all", "win", "lose", "draw"].map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}
            className="text-xs capitalize shrink-0 min-h-[40px] touch-manipulation">
            {f === "lose" ? "Loss" : f}
          </Button>
        ))}
      </div>

      {/* Desktop header: Game, Category, Bet amount, Win/Loss, Total Amount, Result */}
      <div className="hidden md:grid grid-cols-6 gap-2 text-xs text-muted-foreground px-4 py-2 font-semibold border-b border-border bg-muted/30 rounded-t-lg">
        <span>Game</span>
        <span>Category</span>
        <span>Bet amount</span>
        <span>Win/Loss</span>
        <span>Total Amount</span>
        <span className="text-right">Result</span>
      </div>

      <div className="space-y-2">
        {filtered.map((log: Record<string, unknown>, i: number) => {
          const gameName = String(log.game_name ?? log.game ?? "");
          const category = String(log.category_name ?? log.category ?? "");
          const effectiveBet = log.effective_bet_amount != null ? Number(log.effective_bet_amount) : Number(log.bet_amount ?? log.betAmount ?? 0);
          const betDisplay = effectiveBet > 0 ? `${symbol}${effectiveBet}` : "—";
          const winAmount = Number(log.win_amount ?? log.winAmount ?? 0);
          const loseAmount = Number(log.lose_amount ?? log.loseAmount ?? 0);
          const result = String(log.type ?? log.result ?? "").toLowerCase();
          const playedAt = log.created_at ?? log.playedAt;
          const isLoss = result === "lose" || result === "loss";
          const winLossDisplay =
            winAmount > 0 ? `+${symbol}${winAmount}` : isLoss && loseAmount > 0 ? `-${symbol}${loseAmount}` : "—";
          const afterBalance = log.after_balance != null && log.after_balance !== "" ? Number(log.after_balance) : null;
          const totalAmountDisplay = afterBalance != null && !Number.isNaN(afterBalance) ? `${symbol}${afterBalance.toLocaleString()}` : "—";
          return (
          <Card key={String(log.id ?? i)} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-3 md:p-4">
              <div className="md:hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{gameName}</p>
                    <p className="text-[10px] text-muted-foreground">{category} • {playedAt ? new Date(String(playedAt)).toLocaleString() : ""}</p>
                  </div>
                  <StatusBadge status={result} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground items-center">
                  <span>Bet amount: {betDisplay}</span>
                  <span className={winAmount > 0 ? "text-success font-bold" : isLoss && loseAmount > 0 ? "text-destructive font-bold" : ""}>
                    Win/Loss: {winLossDisplay}
                  </span>
                  <span>Total Amount: {totalAmountDisplay}</span>
                </div>
              </div>
              <div className="hidden md:grid grid-cols-6 gap-2 items-center">
                <div>
                  <p className="text-sm font-semibold">{gameName}</p>
                  <p className="text-[10px] text-muted-foreground">{playedAt ? new Date(String(playedAt)).toLocaleString() : ""}</p>
                </div>
                <span className="text-xs">{category}</span>
                <span className="text-xs font-medium">{betDisplay}</span>
                <span className={`text-xs font-bold ${winAmount > 0 ? "text-success" : isLoss && loseAmount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {winLossDisplay}
                </span>
                <span className="text-xs font-medium">{totalAmountDisplay}</span>
                <span className="text-right"><StatusBadge status={result} /></span>
              </div>
            </CardContent>
          </Card>
        );})}
      </div>
    </div>
  );
};

export default PlayerGameResults;
