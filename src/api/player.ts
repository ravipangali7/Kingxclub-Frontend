import { apiGet, apiPost, apiPostForm, apiPatch, apiDelete, BASE_URL } from "@/lib/api";
import { PLAY_MODE } from "@/config";

const P = "/player";

/**
 * Fetch launch URL only (for in-app iframe). GET /api/player/games/<id>/launch/ -> launch_url.
 */
export async function getGameLaunchUrl(gameId: number): Promise<string> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Login to play");
  const url = `${BASE_URL.replace(/\/$/, "")}${P}/games/${gameId}/launch/`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Token ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as { launch_url?: string; error?: string; detail?: string };
  if (!res.ok) {
    throw { status: res.status, detail: data.error ?? data.detail ?? "Launch failed", ...data };
  }
  const launchUrl = data?.launch_url?.trim();
  if (!launchUrl) throw new Error("Could not get game URL");
  return launchUrl;
}

/**
 * Launch game by internal game id: GET /api/player/games/<id>/launch/, then open launch_url in new tab.
 */
export async function launchGame(gameId: number): Promise<void> {
  const launchUrl = await getGameLaunchUrl(gameId);
  window.open(launchUrl, "_blank", "noopener,noreferrer");
}

/**
 * Launch game according to PLAY_MODE: iframe -> navigate to play page; new_tab -> open URL in new tab; in_same_tab -> set location.href.
 */
export async function launchGameByMode(
  gameId: number,
  navigate: (path: string) => void
): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return;
  }
  const rawUser = localStorage.getItem("user");
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser) as { role?: string };
      if (parsed.role && parsed.role !== "player") {
        navigate("/");
        return;
      }
    } catch {
      // Ignore malformed cache; backend guards launch access.
    }
  }
  if (PLAY_MODE === "iframe") {
    navigate(`/games/${gameId}/play`);
    return;
  }
  const url = await getGameLaunchUrl(gameId);
  if (PLAY_MODE === "new_tab") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  if (PLAY_MODE === "in_same_tab") {
    window.location.href = url;
  }
}

export async function getPlayerDashboard() {
  const res = await apiGet<Record<string, unknown>>(`${P}/dashboard/`);
  return res as unknown as Record<string, unknown>;
}

export async function getPlayerUnreadMessageCount(): Promise<number> {
  const res = await apiGet<{ unread_count: number }>(`${P}/messages/unread-count/`);
  return (res as unknown as { unread_count?: number })?.unread_count ?? 0;
}

export type PlayerMessageContact = {
  id: number;
  username: string;
  name: string;
  role: string;
  unread_count?: number;
};

export async function getPlayerMessageContacts(): Promise<PlayerMessageContact[]> {
  const res = await apiGet<PlayerMessageContact[]>(`${P}/messages/contacts/`);
  return Array.isArray(res) ? res : [];
}

export type PlayerNotificationItem = {
  id: number;
  sender_id: number;
  sender_username: string;
  sender_name: string;
  message: string;
  created_at: string | null;
};

export async function getPlayerNotifications(): Promise<PlayerNotificationItem[]> {
  const res = await apiGet<PlayerNotificationItem[]>(`${P}/messages/notifications/`);
  return Array.isArray(res) ? res : [];
}

export async function getPlayerWallet() {
  const res = await apiGet<Record<string, unknown>>(`${P}/wallet/`);
  return res as unknown as Record<string, unknown>;
}

export async function getPlayerTransactions() {
  const res = await apiGet(`${P}/transactions/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}

export async function getPlayerGameLog() {
  const res = await apiGet(`${P}/game-log/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}

export type GameLogDetailResponse = {
  game_log: Record<string, unknown>;
  transaction: Record<string, unknown> | null;
};

export async function getPlayerGameLogDetail(id: number | string): Promise<GameLogDetailResponse> {
  const res = await apiGet<GameLogDetailResponse>(`${P}/game-log/${id}/`);
  return res;
}

export type ReferralItem = {
  id: number;
  username: string;
  name: string;
  created_at: string;
};

export async function getPlayerReferrals(): Promise<ReferralItem[]> {
  const res = await apiGet<ReferralItem[]>(`${P}/referrals/`);
  return Array.isArray(res) ? res : [];
}

export async function getPlayerReferralDetail(id: number | string): Promise<ReferralItem> {
  return apiGet<ReferralItem>(`${P}/referrals/${id}/`);
}

/** Master's payment modes (for deposit). Use in deposit modal. */
export async function getDepositPaymentModes() {
  const res = await apiGet(`${P}/deposit-payment-modes/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}

export async function getPaymentModes() {
  const res = await apiGet(`${P}/payment-modes/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getPaymentMode(id: number) {
  return apiGet(`${P}/payment-modes/${id}/`);
}
export async function createPaymentMode(body: unknown) {
  return apiPost(`${P}/payment-modes/`, body);
}
/** Create payment mode with optional QR image (FormData). */
export async function createPaymentModeFormData(formData: FormData) {
  return apiPostForm(`${P}/payment-modes/`, formData);
}
export async function updatePaymentMode(id: number, body: unknown) {
  return apiPatch(`${P}/payment-modes/${id}/`, body);
}
export async function deletePaymentMode(id: number) {
  return apiDelete(`${P}/payment-modes/${id}/`);
}

export async function getKycStatus() {
  return apiGet(`${P}/kyc/`);
}

export async function submitKyc(body: FormData | Record<string, unknown>) {
  if (body instanceof FormData) {
    const token = localStorage.getItem("token");
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const res = await fetch(`${base}${P}/kyc/submit/`, {
      method: "POST",
      headers: token ? { Authorization: `Token ${token}` } : {},
      body,
    });
    if (!res.ok) throw { status: res.status, ...(await res.json().catch(() => ({}))) };
    return res.json();
  }
  return apiPost(`${P}/kyc/submit/`, body);
}

/** Eligibility for first-deposit bonus: is_first_deposit and applicable_rule (reward_type, reward_amount, valid_from, valid_until). */
export type DepositBonusEligibilityResponse = {
  is_first_deposit: boolean;
  applicable_rule: {
    id: number;
    name: string;
    reward_type: string;
    reward_amount: string;
    reward_type_display?: string;
    valid_from: string | null;
    valid_until: string | null;
  } | null;
};

export async function getDepositBonusEligibility(): Promise<DepositBonusEligibilityResponse> {
  const res = await apiGet<DepositBonusEligibilityResponse>(`${P}/deposit-bonus-eligibility/`);
  return res as unknown as DepositBonusEligibilityResponse;
}

export async function depositRequest(body: unknown) {
  return apiPost(`${P}/deposit-request/`, body);
}

/** Submit deposit with screenshot file (multipart/form-data). Uses same BASE_URL as rest of app. */
export async function depositRequestWithScreenshot(formData: FormData) {
  return apiPostForm(`${P}/deposit-request/`, formData);
}

export type WithdrawRequestBody = {
  amount: number;
  payment_mode: number;
  password: string;
  wallet?: 'main' | 'bonus';
};

export async function withdrawRequest(body: WithdrawRequestBody) {
  return apiPost(`${P}/withdraw-request/`, body);
}

/** Create a bonus request (claim). Body: amount, bonus_type (welcome | deposit | referral), bonus_rule (optional id), remarks (optional). */
export async function bonusRequestCreate(body: { amount: number | string; bonus_type: string; bonus_rule?: number; remarks?: string }) {
  return apiPost(`${P}/bonus-request/`, body);
}

export type PlayerProfileResponse = {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number?: string;
  main_balance?: string;
  bonus_balance?: string;
  role?: string;
  role_display?: string;
  created_at?: string;
  updated_at?: string;
};

export async function getProfile(): Promise<PlayerProfileResponse> {
  const res = await apiGet<PlayerProfileResponse>(`${P}/profile/`);
  return res as unknown as PlayerProfileResponse;
}

export async function updateProfile(body: {
  name?: string;
  phone?: string;
  email?: string;
  whatsapp_number?: string;
}) {
  return apiPatch<PlayerProfileResponse>(`${P}/profile/update/`, body);
}

export async function changePassword(body: { new_password: string }) {
  return apiPost(`${P}/change-password/`, body);
}

export async function getPlayerMessages(partnerId?: number) {
  const path =
    partnerId != null ? `${P}/messages/?partner_id=${partnerId}` : `${P}/messages/`;
  const res = await apiGet(path);
  const list = res as unknown;
  return Array.isArray(list) ? list : [];
}

export async function sendPlayerMessage(body: unknown) {
  return apiPost(`${P}/messages/send/`, body);
}

/** Send message with optional file/image (multipart/form-data). FormData keys: receiver, message, file?, image? */
export async function sendPlayerMessageForm(formData: FormData) {
  return apiPostForm(`${P}/messages/send/`, formData);
}

export async function transfer(body: { username: string; amount: string; password: string }) {
  return apiPost(`${P}/transfer/`, body);
}
