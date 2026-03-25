import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getMediaUrl } from "@/lib/api";

export function buildPaymentDetailsPlainText(params: {
  methodName: string;
  details?: Record<string, unknown> | null;
  qrUrl?: string | null;
  includeQrImageNote?: boolean;
}): string {
  const lines: string[] = [`Payment method: ${params.methodName}`];
  const d = params.details;
  if (d && typeof d === "object") {
    for (const [k, v] of Object.entries(d)) {
      const label = k.replace(/_/g, " ");
      lines.push(`${label}: ${String(v ?? "")}`);
    }
  }
  if (params.qrUrl) {
    const abs = String(params.qrUrl).startsWith("http") ? String(params.qrUrl) : getMediaUrl(String(params.qrUrl));
    lines.push(params.includeQrImageNote ? `QR image: ${abs}` : `QR: ${abs}`);
  }
  return lines.join("\n");
}

type PaymentDetailsPanelProps = {
  methodName: string;
  details?: Record<string, unknown> | null;
  qrUrl?: string | null;
  /** When true, shows QR image and uses "[QR image]" in copy text instead of URL only */
  showQrImage?: boolean;
  /** "header" (default): copy button in panel header. "hidden": no copy button (use external single control). */
  copyPlacement?: "header" | "hidden";
  className?: string;
};

export function PaymentDetailsPanel({ methodName, details, qrUrl, showQrImage, copyPlacement = "header", className }: PaymentDetailsPanelProps) {
  const copyAll = async () => {
    const text = buildPaymentDetailsPlainText({
      methodName,
      details,
      qrUrl: qrUrl ?? undefined,
      includeQrImageNote: Boolean(showQrImage && qrUrl),
    });
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied payment details." });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const absQr = qrUrl ? (String(qrUrl).startsWith("http") ? String(qrUrl) : getMediaUrl(String(qrUrl))) : "";

  return (
    <div className={`rounded-xl border border-border bg-muted/30 p-3 space-y-2 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment details</p>
        {copyPlacement === "header" ? (
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={copyAll}>
            <Copy className="h-3 w-3" /> Copy all
          </Button>
        ) : null}
      </div>
      <p className="text-sm font-medium">{methodName}</p>
      {details != null && typeof details === "object" && Object.keys(details).length > 0 ? (
        <div className="text-sm space-y-1">
          {Object.entries(details).map(([k, v]) => (
            <p key={k}>
              <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>{" "}
              <span className="font-mono">{String(v ?? "")}</span>
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No extra details</p>
      )}
      {showQrImage && qrUrl && (
        <div className="pt-1">
          <img src={absQr} alt="Payment QR" className="w-28 h-28 object-contain rounded-lg border border-border bg-white" />
        </div>
      )}
    </div>
  );
}
