import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownCircle, ArrowUpCircle, Upload, CheckCircle } from "lucide-react";

const WalletPage = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedPM, setSelectedPM] = useState<string | null>(null);
  const paymentModes: { id: string; name: string; type?: string; account_id?: string; account_number?: string }[] = [];

  return (
    <div className="container px-4 py-6 space-y-4 max-w-lg mx-auto">
      {/* Balance Overview - login to see real balance */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center hover:border-primary/20 transition-colors"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Main</p><p className="font-display font-bold">—</p></CardContent></Card>
        <Card className="text-center hover:border-primary/20 transition-colors"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Bonus</p><p className="font-display font-bold text-primary">—</p></CardContent></Card>
        <Card className="text-center border-primary/20 hover:neon-glow-sm transition-all"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Total</p><p className="font-display font-bold neon-text">—</p></CardContent></Card>
      </div>
      <p className="text-xs text-muted-foreground text-center"><Link to="/login" className="text-primary hover:underline">Login</Link> to view balance and deposit/withdraw</p>

      <Tabs defaultValue="deposit">
        <TabsList className="w-full">
          <TabsTrigger value="deposit" className="flex-1 gap-1"><ArrowDownCircle className="h-3 w-3" /> Deposit</TabsTrigger>
          <TabsTrigger value="withdraw" className="flex-1 gap-1"><ArrowUpCircle className="h-3 w-3" /> Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Select Payment Method</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {paymentModes.length === 0 ? <p className="text-xs text-muted-foreground">Login as player to see your master&apos;s payment options.</p> : paymentModes.map((pm) => (
                <div
                  key={pm.id}
                  onClick={() => setSelectedPM(pm.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedPM === pm.id ? "border-primary neon-glow-sm bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{pm.name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{pm.name}</p>
                    <p className="text-xs text-muted-foreground">{pm.type === "ewallet" ? pm.account_id : pm.account_number}</p>
                  </div>
                  {selectedPM === pm.id && <CheckCircle className="h-4 w-4 text-primary" />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Input type="number" placeholder="Enter deposit amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="h-11" />

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Upload payment screenshot</p>
          </div>

          <Button className="w-full gold-gradient text-primary-foreground font-display font-semibold h-11 neon-glow-sm">Submit Deposit</Button>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4 mt-4">
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-warning font-medium">⚠️ KYC verification required before withdrawal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Select Your Payment Mode</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {paymentModes.length === 0 ? <p className="text-xs text-muted-foreground">Login as player to see your payment modes.</p> : paymentModes.map((pm) => (
                <div key={pm.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{pm.name[0]}</div>
                  <div>
                    <p className="text-sm font-medium">{pm.name}</p>
                    <p className="text-xs text-muted-foreground">{pm.type === "ewallet" ? pm.account_id : pm.account_number}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Input type="number" placeholder="Enter withdrawal amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="h-11" />
          <Input type="password" placeholder="Enter password to confirm" className="h-11" />
          <Button className="w-full bg-accent text-accent-foreground font-display font-semibold h-11" disabled>Login to withdraw</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletPage;
