import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PinDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title?: string;
  loading?: boolean;
}

export const PinDialog = ({ open, onClose, onConfirm, title = "Enter PIN to confirm", loading = false }: PinDialogProps) => {
  const [pin, setPin] = useState("");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !loading) onClose(); }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
        </DialogHeader>
        <Input
          type="password"
          maxLength={6}
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="text-center text-lg tracking-widest"
          disabled={loading}
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} size="sm" disabled={loading}>Cancel</Button>
          <Button onClick={() => { onConfirm(pin); setPin(""); }} disabled={pin.length < 4 || loading} size="sm" className="gold-gradient text-primary-foreground">
            {loading ? "Checking…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
