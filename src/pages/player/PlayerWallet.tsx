import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/utils/currency";
import { getPlayerWallet, getPaymentModes, getDepositPaymentModes, getDepositBonusEligibility, depositRequest, depositRequestWithScreenshot, withdrawRequest } from "@/api/player";
import { getPublicPaymentMethods } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Upload, CheckCircle, Sparkles, TrendingUp, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";

const quickAmounts = [500, 1000, 2000, 5000, 10000, 25000];

const PlayerWallet = () => {
  const { user } = useAuth();
  const symbol = getCurrencySymbol(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedPM, setSelectedPM] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawWallet, setWithdrawWallet] = useState<"main" | "bonus">("main");
  const [depositRemarks, setDepositRemarks] = useState("");
  const [depositScreenshot, setDepositScreenshot] = useState<File | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const { data: wallet = {} } = useQuery({ queryKey: ["player-wallet"], queryFn: getPlayerWallet });
  const { data: depositPaymentModes = [] } = useQuery({
    queryKey: ["player-deposit-payment-modes"],
    queryFn: getDepositPaymentModes,
    enabled: depositOpen,
  });
  const { data: depositBonusEligibility } = useQuery({
    queryKey: ["player-deposit-bonus-eligibility"],
    queryFn: getDepositBonusEligibility,
    enabled: depositOpen,
  });
  const { data: playerPaymentModes = [] } = useQuery({
    queryKey: ["player-payment-modes"],
    queryFn: getPaymentModes,
  });
  const { data: publicPaymentMethods = [] } = useQuery({
    queryKey: ["publicPaymentMethods"],
    queryFn: getPublicPaymentMethods,
    enabled: depositOpen || withdrawOpen,
  });
  const paymentMethodImageMap = (publicPaymentMethods as { id: number; name: string; image_url?: string | null }[]).reduce(
    (acc, pm) => {
      if (pm.image_url) acc[pm.id] = pm.image_url;
      return acc;
    },
    {} as Record<number, string>
  );
  const withdrawPaymentModes = (playerPaymentModes as Record<string, unknown>[]).filter((pm) => pm.status === "approved");
  const w = wallet as Record<string, unknown> & {
    recent_deposits?: unknown[];
    recent_withdrawals?: unknown[];
    bonus_requests?: unknown[];
    main_balance?: string;
    bonus_balance?: string;
    main_withdrawable?: string;
    bonus_withdrawable?: string;
    total_withdrawable?: string;
    can_withdraw_main?: boolean;
    can_withdraw_bonus?: boolean;
  };
  const myDeposits = w.deposits ?? w.recent_deposits ?? [];
  const myWithdrawals = w.withdrawals ?? w.recent_withdrawals ?? [];
  const myBonusRequests = w.bonus_requests ?? [];
  const mainBalance = Number(w.main_balance ?? 0);
  const bonusBalance = Number(w.bonus_balance ?? 0);
  const mainWithdrawable = Number(w.main_withdrawable ?? 0);
  const bonusWithdrawable = Number(w.bonus_withdrawable ?? 0);
  const totalWithdrawable = Number(w.total_withdrawable ?? 0);
  const canWithdrawBonus = Boolean(w.can_withdraw_bonus);
  const maxAmountForWallet = withdrawWallet === "bonus" ? bonusWithdrawable : mainWithdrawable;

  return (
    <div className="p-2 mobile:p-4 md:p-6 space-y-4 mobile:space-y-5 max-w-4xl mx-auto min-w-0">
      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-2 mobile:gap-3 md:gap-4 min-w-0">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
          <Card className="text-center gaming-card hover:neon-glow-sm transition-all min-w-0">
            <CardContent className="p-2 mobile:p-4">
              <Wallet className="h-4 w-4 mobile:h-5 mobile:w-5 mx-auto mb-1 text-primary" />
              <p className="text-[10px] text-muted-foreground">Main Balance</p>
              <p className="font-gaming font-bold text-sm mobile:text-lg md:text-2xl truncate">{symbol}{mainBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="min-w-0">
          <Card className="text-center gaming-card hover:neon-glow-sm transition-all min-w-0">
            <CardContent className="p-2 mobile:p-4">
              <Sparkles className="h-4 w-4 mobile:h-5 mobile:w-5 mx-auto mb-1 text-accent" />
              <p className="text-[10px] text-muted-foreground">Bonus</p>
              <p className="font-gaming font-bold text-sm mobile:text-lg md:text-2xl text-accent truncate">{symbol}{bonusBalance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="min-w-0">
          <Card className="text-center gaming-card neon-glow-sm min-w-0">
            <CardContent className="p-2 mobile:p-4">
              <TrendingUp className="h-4 w-4 mobile:h-5 mobile:w-5 mx-auto mb-1 text-neon" />
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="font-gaming font-bold text-sm mobile:text-lg md:text-2xl neon-text truncate">{symbol}{(mainBalance + bonusBalance).toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons - touch-friendly */}
      <div className="grid grid-cols-2 gap-2 mobile:gap-3 min-w-0">
        <Button className="gold-gradient text-primary-foreground font-gaming h-11 mobile:h-12 text-xs mobile:text-sm tracking-wider neon-glow-sm touch-manipulation min-h-[44px]" onClick={() => setDepositOpen(true)}>
          <ArrowDownCircle className="h-3.5 w-3.5 mobile:h-4 mobile:w-4 mr-1.5 mobile:mr-2" /> DEPOSIT
        </Button>
        <Button
          className="bg-accent text-accent-foreground font-gaming h-11 mobile:h-12 text-xs mobile:text-sm tracking-wider touch-manipulation min-h-[44px]"
          onClick={() => {
            if (withdrawPaymentModes.length === 0) {
              toast({ title: "Add a payment method first, then ask your master to approve it.", variant: "destructive" });
              navigate("/player/payment-modes");
              return;
            }
            setWithdrawOpen(true);
          }}
        >
          <ArrowUpCircle className="h-3.5 w-3.5 mobile:h-4 mobile:w-4 mr-1.5 mobile:mr-2" /> WITHDRAW
        </Button>
      </div>

      {/* History Tabs */}
      <Tabs defaultValue="deposits" className="min-w-0">
        <TabsList className="w-full grid grid-cols-3 min-h-[44px] touch-manipulation">
          <TabsTrigger value="deposits" className="gap-1 font-display text-xs"><ArrowDownCircle className="h-3 w-3" /> Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1 font-display text-xs"><ArrowUpCircle className="h-3 w-3" /> Withdrawals</TabsTrigger>
          <TabsTrigger value="bonus-requests" className="gap-1 font-display text-xs"><Gift className="h-3 w-3" /> Bonus Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-2 mt-3">
          {myDeposits.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No deposits yet</p>}
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-5 gap-2 text-xs text-muted-foreground px-4 py-2 font-semibold">
            <span>Amount</span><span>Method</span><span>Date</span><span>Processed By</span><span className="text-right">Status</span>
          </div>
          {myDeposits.map((d: Record<string, unknown>, i: number) => (
            <Card key={String(d.id ?? i)} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between md:hidden">
                  <div>
                    <p className="text-sm font-bold">{symbol}{Number(d.amount ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{String(d.payment_mode ?? "")} • {d.created_at ? new Date(String(d.created_at)).toLocaleDateString() : ""}</p>
                  </div>
                  <StatusBadge status={String(d.status ?? "pending")} />
                </div>
                <div className="hidden md:grid grid-cols-5 gap-2 items-center">
                  <span className="font-bold text-sm">{symbol}{Number(d.amount ?? 0).toLocaleString()}</span>
                  <span className="text-sm">{String(d.payment_mode ?? "")}</span>
                  <span className="text-xs text-muted-foreground">{d.created_at ? new Date(String(d.created_at)).toLocaleDateString() : ""}</span>
                  <span className="text-xs text-muted-foreground">{String(d.processed_by ?? "-")}</span>
                  <span className="text-right"><StatusBadge status={String(d.status ?? "pending")} /></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-2 mt-3">
          {myWithdrawals.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No withdrawals yet</p>}
          <div className="hidden md:grid grid-cols-5 gap-2 text-xs text-muted-foreground px-4 py-2 font-semibold">
            <span>Amount</span><span>Method</span><span>Date</span><span>Account</span><span className="text-right">Status</span>
          </div>
          {myWithdrawals.map((w: Record<string, unknown>, i: number) => (
            <Card key={String(w.id ?? i)} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between md:hidden">
                  <div>
                    <p className="text-sm font-bold">{symbol}{Number(w.amount ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{String(w.payment_mode ?? "")} • {w.created_at ? new Date(String(w.created_at)).toLocaleDateString() : ""}</p>
                  </div>
                  <StatusBadge status={String(w.status ?? "pending")} />
                </div>
                <div className="hidden md:grid grid-cols-5 gap-2 items-center">
                  <span className="font-bold text-sm">{symbol}{Number(w.amount ?? 0).toLocaleString()}</span>
                  <span className="text-sm">{String(w.payment_mode ?? "")}</span>
                  <span className="text-xs text-muted-foreground">{w.created_at ? new Date(String(w.created_at)).toLocaleDateString() : ""}</span>
                  <span className="text-xs text-muted-foreground">{String(w.account_details ?? "-")}</span>
                  <span className="text-right"><StatusBadge status={String(w.status ?? "pending")} /></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bonus-requests" className="space-y-2 mt-3">
          {myBonusRequests.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No bonus requests yet. Claim a bonus from the Bonus page.</p>}
          <div className="hidden md:grid grid-cols-4 gap-2 text-xs text-muted-foreground px-4 py-2 font-semibold">
            <span>Amount</span><span>Type</span><span>Date</span><span className="text-right">Status</span>
          </div>
          {myBonusRequests.map((br: Record<string, unknown>, i: number) => (
            <Card key={String(br.id ?? i)} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between md:hidden">
                  <div>
                    <p className="text-sm font-bold">{symbol}{Number(br.amount ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{String(br.bonus_type_display ?? br.bonus_type ?? "")} • {br.created_at ? new Date(String(br.created_at)).toLocaleDateString() : ""}</p>
                  </div>
                  <StatusBadge status={String(br.status ?? "pending")} />
                </div>
                <div className="hidden md:grid grid-cols-4 gap-2 items-center">
                  <span className="font-bold text-sm">{symbol}{Number(br.amount ?? 0).toLocaleString()}</span>
                  <span className="text-sm">{String(br.bonus_type_display ?? br.bonus_type ?? "")}</span>
                  <span className="text-xs text-muted-foreground">{br.created_at ? new Date(String(br.created_at)).toLocaleDateString() : ""}</span>
                  <span className="text-right"><StatusBadge status={String(br.status ?? "pending")} /></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Deposit Modal */}
      <Dialog open={depositOpen} onOpenChange={(open) => { setDepositOpen(open); if (!open) setDepositScreenshot(null); }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] mobile:max-w-2xl gaming-card w-full">
          <DialogHeader>
            <DialogTitle className="font-gaming text-lg neon-text tracking-wider">DEPOSIT FUNDS</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Step 1 + Step 2 (payment method list + pay to account) */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">1. Select Payment Method (Master)</p>
                <div className="space-y-2">
                  {(depositPaymentModes as Record<string, unknown>[]).length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">No payment methods available. Ask your master to add one.</p>
                  )}
                  {(depositPaymentModes as Record<string, unknown>[]).map((pm) => {
                    const pmName = String(pm.payment_method_name ?? "");
                    const pmDetail = pm.details && typeof pm.details === "object" && Object.keys(pm.details as object).length > 0
                      ? "****" + String(Object.values(pm.details as Record<string, unknown>)[0] ?? "").slice(-4)
                      : "";
                    const pmMethodId = pm.payment_method != null ? Number(pm.payment_method) : null;
                    const pmImageUrl = pmMethodId != null ? paymentMethodImageMap[pmMethodId] : null;
                    return (
                      <div
                        key={String(pm.id ?? "")}
                        onClick={() => setSelectedPM(String(pm.id ?? ""))}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedPM === String(pm.id ?? "") ? "border-primary neon-glow-sm bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-muted/30 border border-border">
                          {pmImageUrl ? (
                            <img src={getMediaUrl(pmImageUrl)} alt={pmName} className="h-full w-full object-contain" />
                          ) : (
                            <span className="gold-gradient flex h-full w-full items-center justify-center text-xs font-bold text-primary-foreground">{(pmName || "P")[0]}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{pmName}</p>
                          <p className="text-[10px] text-muted-foreground">{pmDetail || "—"}</p>
                        </div>
                        {selectedPM === String(pm.id ?? "") && <CheckCircle className="h-4 w-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedPM && (() => {
                const selectedMode = (depositPaymentModes as Record<string, unknown>[]).find((pm) => String(pm.id) === selectedPM);
                const displayName = String(selectedMode?.payment_method_name ?? "");
                const details = selectedMode?.details as Record<string, unknown> | null | undefined;
                const hasDetails = details != null && typeof details === "object" && Object.keys(details).length > 0;
                return (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">2. Pay to this account</p>
                    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-2">
                      <p className="text-sm font-semibold">{displayName}</p>
                      {hasDetails ? (
                        <div className="text-sm space-y-1">
                          {Object.entries(details).map(([k, v]) => (
                            <p key={k}>{k.replace(/_/g, " ")}: <span className="font-mono font-medium">{String(v ?? "")}</span></p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No details</p>
                      )}
                      {selectedMode?.qr_image_url && (
                        <div className="mt-2">
                          <img src={getMediaUrl(String(selectedMode.qr_image_url))} alt="Payment QR" className="w-28 h-28 object-contain rounded-lg border border-border" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Transfer the amount to the account above. Then enter the amount and upload your payment screenshot in the right column.</p>
                  </div>
                );
              })()}
            </div>

            {/* Right: Step 3 + 4 (amount, remarks, screenshot) — only when method selected */}
            {selectedPM && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">3. Enter amount you paid</p>
                  <Input type="number" placeholder="Enter deposit amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 text-lg font-gaming" />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {quickAmounts.map((a) => (
                      <Button key={a} variant="outline" size="sm" onClick={() => setAmount(String(a))} className={`text-xs font-gaming ${amount === String(a) ? "border-primary text-primary" : ""}`}>
                        {symbol}{a >= 1000 ? `${a / 1000}K` : a}
                      </Button>
                    ))}
                  </div>
                  {depositBonusEligibility?.is_first_deposit && depositBonusEligibility?.applicable_rule && (
                    <div className="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-3">
                      <p className="text-xs font-medium text-accent flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5" />
                        First deposit bonus
                      </p>
                      {depositBonusEligibility.applicable_rule.reward_type === "flat" ? (
                        <p className="text-sm mt-1">
                          You will get {symbol}{Number(depositBonusEligibility.applicable_rule.reward_amount || 0).toLocaleString()} bonus on first deposit.
                        </p>
                      ) : (
                        <p className="text-sm mt-1">
                          You will get {symbol}{(Number(amount) || 0) > 0
                            ? ((Number(amount) * Number(depositBonusEligibility.applicable_rule.reward_amount || 0)) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                            : "0"}
                          {" "}bonus on first deposit ({depositBonusEligibility.applicable_rule.reward_amount}% of deposit).
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">4. Transaction ID / Reference ID <span className="text-destructive">*</span></p>
                  <Input
                    placeholder="Enter transaction ID or reference ID from your payment"
                    value={depositRemarks}
                    onChange={(e) => setDepositRemarks(e.target.value)}
                    className="text-sm"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Required. This helps us verify your deposit quickly.</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">5. Upload payment screenshot</p>
                  <input
                    ref={screenshotInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setDepositScreenshot(e.target.files?.[0] ?? null)}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => screenshotInputRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && screenshotInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {depositScreenshot ? depositScreenshot.name : "Click to upload payment screenshot"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button
              className="gold-gradient text-primary-foreground font-gaming neon-glow-sm"
              onClick={async () => {
                const amt = Number(amount) || 0;
                if (amt <= 0) {
                  toast({ title: "Enter a valid amount.", variant: "destructive" });
                  return;
                }
                if (!selectedPM) {
                  toast({ title: "Select a payment method first.", variant: "destructive" });
                  return;
                }
                if (!depositRemarks.trim()) {
                  toast({ title: "Please enter your transaction ID or reference ID.", variant: "destructive" });
                  return;
                }
                try {
                  if (depositScreenshot) {
                    const formData = new FormData();
                    formData.append("amount", String(amt));
                    formData.append("payment_mode", String(selectedPM));
                    formData.append("remarks", depositRemarks.trim() || "");
                    formData.append("screenshot", depositScreenshot);
                    await depositRequestWithScreenshot(formData);
                  } else {
                    await depositRequest({
                      amount: amt,
                      payment_mode: Number(selectedPM),
                      remarks: depositRemarks.trim() || "",
                    });
                  }
                  queryClient.invalidateQueries({ queryKey: ["player-wallet"] });
                  toast({ title: "Deposit request submitted." });
                  setDepositOpen(false);
                  setAmount("");
                  setSelectedPM(null);
                  setDepositRemarks("");
                  setDepositScreenshot(null);
                } catch (e: unknown) {
                  const msg = (e as { detail?: string })?.detail ?? "Failed to submit deposit.";
                  toast({ title: msg, variant: "destructive" });
                }
              }}
            >
              Submit Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal — only reachable when KYC approved */}
      <Dialog open={withdrawOpen} onOpenChange={(open) => { setWithdrawOpen(open); if (!open) { setAmount(""); setWithdrawPassword(""); setSelectedPM(null); setWithdrawWallet("main"); } }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] mobile:max-w-md gaming-card w-full">
          <DialogHeader>
            <DialogTitle className="font-gaming text-lg neon-text tracking-wider">WITHDRAW FUNDS</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Select your approved payout method</label>
              <div className="space-y-2">
                {withdrawPaymentModes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No approved payout methods. Add a payment method and ask your master to approve it.</p>
                ) : (
                  withdrawPaymentModes.map((pm) => {
                    const wName = String(pm.payment_method_name ?? "");
                    const wDetail = pm.details && typeof pm.details === "object" && Object.keys(pm.details as object).length > 0
                      ? "****" + String(Object.values(pm.details as Record<string, unknown>)[0] ?? "").slice(-4)
                      : "";
                    const wMethodId = pm.payment_method != null ? Number(pm.payment_method) : null;
                    const wImageUrl = wMethodId != null ? paymentMethodImageMap[wMethodId] : null;
                    return (
                      <div
                        key={String(pm.id ?? "")}
                        onClick={() => setSelectedPM(String(pm.id ?? ""))}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedPM === String(pm.id ?? "") ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                        }`}
                      >
                        <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-muted/30 border border-border">
                          {wImageUrl ? (
                            <img src={getMediaUrl(wImageUrl)} alt={wName} className="h-full w-full object-contain" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-accent/10 text-xs font-bold text-accent">{(wName || "P")[0]}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{wName}</p>
                          <p className="text-[10px] text-muted-foreground">{wDetail || "—"}</p>
                        </div>
                        {selectedPM === String(pm.id ?? "") && <CheckCircle className="h-4 w-4 text-accent" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Withdrawable</p>
              <p className="text-sm">
                Main {symbol}{mainWithdrawable.toLocaleString()}
                {bonusWithdrawable > 0 || !canWithdrawBonus ? (
                  <> · Bonus {symbol}{bonusWithdrawable.toLocaleString()}</>
                ) : (
                  <span className="text-muted-foreground"> · Bonus not withdrawable (play required games after bonus approval)</span>
                )}
              </p>
              {canWithdrawBonus && bonusWithdrawable > 0 && (
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="withdrawWallet" checked={withdrawWallet === "main"} onChange={() => setWithdrawWallet("main")} className="rounded-full" />
                    Main balance
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="withdrawWallet" checked={withdrawWallet === "bonus"} onChange={() => setWithdrawWallet("bonus")} className="rounded-full" />
                    Bonus balance
                  </label>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Amount (max {symbol}{maxAmountForWallet.toLocaleString()} from {withdrawWallet === "bonus" ? "bonus" : "main"})</label>
              <Input type="number" placeholder="Enter withdrawal amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 text-lg font-gaming" />
              {amount && Number(amount) > totalWithdrawable && (
                <p className="text-xs text-destructive mt-1">Amount exceeds total withdrawable ({symbol}{totalWithdrawable.toLocaleString()}).</p>
              )}
              {amount && Number(amount) > maxAmountForWallet && Number(amount) <= totalWithdrawable && (
                <p className="text-xs text-destructive mt-1">Amount exceeds {withdrawWallet === "bonus" ? "bonus" : "main"} withdrawable ({symbol}{maxAmountForWallet.toLocaleString()}).</p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Password (to confirm)</label>
              <Input type="password" placeholder="Enter password" value={withdrawPassword} onChange={(e) => setWithdrawPassword(e.target.value)} className="h-11" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={withdrawSubmitting}>Cancel</Button>
            <Button
              className="bg-accent text-accent-foreground font-gaming"
              disabled={!selectedPM || !amount || withdrawPassword.length < 1 || withdrawSubmitting}
              onClick={async () => {
                const amt = Number(amount);
                if (!selectedPM || !amt || amt <= 0) return;
                if (amt > totalWithdrawable) {
                  toast({ title: "Amount exceeds withdrawable (Main + Bonus).", variant: "destructive" });
                  return;
                }
                if (amt > maxAmountForWallet) {
                  toast({ title: `Amount exceeds ${withdrawWallet === "bonus" ? "bonus" : "main"} withdrawable (${symbol}${maxAmountForWallet.toLocaleString()}).`, variant: "destructive" });
                  return;
                }
                setWithdrawSubmitting(true);
                try {
                  await withdrawRequest({ amount: amt, payment_mode: Number(selectedPM), password: withdrawPassword, wallet: withdrawWallet });
                  toast({ title: "Withdrawal request submitted." });
                  setWithdrawOpen(false);
                  setAmount("");
                  setWithdrawPassword("");
                  setSelectedPM(null);
                  setWithdrawWallet("main");
                  queryClient.invalidateQueries({ queryKey: ["player-wallet"] });
                } catch (e: unknown) {
                  const err = e as { detail?: string | Record<string, string[]>; status?: number };
                  const raw = err?.detail;
                  const msg = typeof raw === "string" ? raw : Array.isArray(raw?.amount) ? raw.amount[0] : Array.isArray(raw?.wallet) ? raw.wallet[0] : "Invalid password or request failed.";
                  toast({ title: msg, variant: "destructive" });
                } finally {
                  setWithdrawSubmitting(false);
                }
              }}
            >
              {withdrawSubmitting ? "Submitting…" : "Submit Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerWallet;
