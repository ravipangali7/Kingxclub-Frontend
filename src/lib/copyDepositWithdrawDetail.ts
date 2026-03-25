import { buildPaymentDetailsPlainText } from "@/components/PaymentDetailsPanel";

type PaymentModeDetail = Record<string, unknown> & {
  payment_method?: number;
  payment_method_name?: string;
  details?: Record<string, unknown>;
  status_display?: string;
  qr_image_url?: string;
};

export type DepositCopyRow = Record<string, unknown> & {
  id?: number;
  user_username?: string;
  username?: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  user_whatsapp_number?: string;
  amount?: string;
  payment_mode?: string;
  payment_mode_name?: string;
  payment_mode_qr_image?: string;
  payment_mode_detail?: PaymentModeDetail | null;
  status?: string;
  created_at?: string;
  screenshot?: string;
  remarks?: string;
  reference_id?: string;
};

export type WithdrawCopyRow = Record<string, unknown> & {
  id?: number;
  user_username?: string;
  username?: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  user_whatsapp_number?: string;
  amount?: string;
  payment_mode?: string;
  payment_mode_name?: string;
  payment_mode_qr_image?: string;
  payment_mode_detail?: PaymentModeDetail | null;
  status?: string;
  created_at?: string;
  account_details?: string;
  accountDetails?: string;
  remarks?: string;
  reference_id?: string;
};

function pushIf(lines: string[], label: string, value: string | undefined | null) {
  const v = String(value ?? "").trim();
  if (v) lines.push(`${label}: ${v}`);
}

export function buildDepositRowCopyText(row: DepositCopyRow): string {
  const lines: string[] = ["=== Deposit request ==="];
  pushIf(lines, "Username", String(row.user_username ?? row.username ?? ""));
  pushIf(lines, "Name", String(row.user_name ?? ""));
  pushIf(lines, "Phone", String(row.user_phone ?? ""));
  pushIf(lines, "Email", String(row.user_email ?? ""));
  pushIf(lines, "WhatsApp", String(row.user_whatsapp_number ?? ""));
  lines.push("");
  pushIf(lines, "Transaction ID", String(row.id ?? ""));
  pushIf(lines, "Amount", `₹${Number(row.amount ?? 0).toLocaleString()}`);
  pushIf(lines, "Status", String(row.status ?? ""));
  pushIf(lines, "Payment method (summary)", String(row.payment_mode_name ?? row.payment_mode ?? ""));
  if (row.created_at) {
    pushIf(lines, "Request date", new Date(String(row.created_at)).toLocaleString());
  }
  pushIf(lines, "Reference ID", String(row.reference_id ?? ""));
  pushIf(lines, "Remarks", String(row.remarks ?? ""));
  if (row.screenshot) {
    lines.push("User screenshot: [attached in admin]");
  }

  const pmd = row.payment_mode_detail;
  if (pmd) {
    lines.push("");
    lines.push("--- Payment mode detail ---");
    const methodName = String(pmd.payment_method_name ?? row.payment_mode_name ?? row.payment_mode ?? "").trim() || "—";
    const details =
      pmd.details != null && typeof pmd.details === "object" ? (pmd.details as Record<string, unknown>) : undefined;
    const qrRaw = pmd.qr_image_url ? String(pmd.qr_image_url) : null;
    const paymentBlock = buildPaymentDetailsPlainText({
      methodName,
      details,
      qrUrl: qrRaw,
      includeQrImageNote: Boolean(qrRaw),
    });
    lines.push(paymentBlock);
  }

  return lines.join("\n").trim();
}

export function buildWithdrawRowCopyText(row: WithdrawCopyRow): string {
  const lines: string[] = ["=== Withdrawal request ==="];
  pushIf(lines, "Username", String(row.user_username ?? row.username ?? ""));
  pushIf(lines, "Name", String(row.user_name ?? ""));
  pushIf(lines, "Phone", String(row.user_phone ?? ""));
  pushIf(lines, "Email", String(row.user_email ?? ""));
  pushIf(lines, "WhatsApp", String(row.user_whatsapp_number ?? ""));
  lines.push("");
  pushIf(lines, "Transaction ID", String(row.id ?? ""));
  pushIf(lines, "Amount", `₹${Number(row.amount ?? 0).toLocaleString()}`);
  pushIf(lines, "Status", String(row.status ?? ""));
  const accountStr = String(row.account_details ?? row.accountDetails ?? "").trim();
  pushIf(lines, "Account / payment details (summary)", accountStr || undefined);
  pushIf(lines, "Method", String(row.payment_mode_name ?? row.payment_mode ?? ""));
  if (row.created_at) {
    pushIf(lines, "Date", new Date(String(row.created_at)).toLocaleString());
  }
  pushIf(lines, "Transaction / Reference ID", String(row.reference_id ?? ""));
  pushIf(lines, "Remarks", String(row.remarks ?? ""));

  const pmd = row.payment_mode_detail;
  if (pmd) {
    lines.push("");
    lines.push("--- Payment mode detail ---");
    const methodName = String(pmd.payment_method_name ?? row.payment_mode_name ?? row.payment_mode ?? "").trim() || "—";
    const detailsObj =
      pmd.details != null && typeof pmd.details === "object" ? (pmd.details as Record<string, unknown>) : undefined;
    const hasKeys = detailsObj && Object.keys(detailsObj).length > 0;
    const qrRaw = pmd.qr_image_url ? String(pmd.qr_image_url) : row.payment_mode_qr_image ? String(row.payment_mode_qr_image) : null;
    const paymentBlock = buildPaymentDetailsPlainText({
      methodName,
      details: hasKeys ? detailsObj : undefined,
      qrUrl: qrRaw,
      includeQrImageNote: Boolean(qrRaw),
    });
    lines.push(paymentBlock);
  }

  return lines.join("\n").trim();
}
