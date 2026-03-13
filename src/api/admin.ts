/**
 * Admin API (powerhouse, super, master). Use prefix: powerhouse/ | super/ | master/
 */
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiPostForm, apiPatchForm } from "@/lib/api";

const prefix = (role: "powerhouse" | "super" | "master") => `/${role}`;

/** Ensure list API response is always an array (handles raw array or wrapped { data/results }). */
function asList<T = Record<string, unknown>>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res != null && typeof res === "object") {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as T[];
    if (Array.isArray(o.results)) return o.results as T[];
  }
  return [];
}

// --- Dashboard ---
export type DashboardParams = { date_from?: string; date_to?: string };
export async function getDashboard(role: "powerhouse" | "super" | "master", params?: DashboardParams) {
  const q = new URLSearchParams();
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  const qs = q.toString();
  const res = await apiGet<Record<string, unknown>>(`${prefix(role)}/dashboard/${qs ? `?${qs}` : ""}`);
  return res as unknown as Record<string, unknown>;
}

export async function getUnreadMessageCount(role: "powerhouse" | "super" | "master") {
  const res = await apiGet<{ unread_count: number }>(`${prefix(role)}/messages/unread-count/`);
  return (res as { unread_count: number })?.unread_count ?? 0;
}

// --- Current user (profile / change password) ---
export type AdminRole = "powerhouse" | "super" | "master";
export async function getProfile(role: AdminRole) {
  return apiGet<Record<string, unknown>>(`${prefix(role)}/profile/`);
}
export async function updateProfile(
  role: AdminRole,
  data: { name?: string; phone?: string; email?: string; whatsapp_number?: string; main_balance?: string }
) {
  return apiPatch(`${prefix(role)}/profile/update/`, data);
}
export async function changePassword(role: AdminRole, body: { old_password: string; new_password: string }) {
  return apiPost(`${prefix(role)}/change-password/`, body);
}

// --- Users (role-specific paths) ---
export type ListParams = { search?: string; status?: string; date_from?: string; date_to?: string; is_active?: string; master_id?: string };
function buildQueryString(params?: ListParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.date_from) q.set("date_from", params.date_from);
  if (params.date_to) q.set("date_to", params.date_to);
  if (params.is_active) q.set("is_active", params.is_active);
  if (params.master_id) q.set("master_id", params.master_id);
  const s = q.toString();
  return s ? `?${s}` : "";
}
export async function getSupers(params?: ListParams) {
  const res = await apiGet(`${prefix("powerhouse")}/supers/${buildQueryString(params)}`);
  return asList(res);
}
export async function getSuper(id: number) {
  return apiGet(`${prefix("powerhouse")}/supers/${id}/`);
}
export async function createSuper(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/supers/create/`, body);
}
export async function updateSuper(id: number, body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/supers/${id}/edit/`, body);
}
export async function deleteSuper(id: number) {
  return apiDelete(`${prefix("powerhouse")}/supers/${id}/delete/`);
}

export async function getMasters(role: "powerhouse" | "super" = "powerhouse", params?: ListParams) {
  const res = await apiGet(`${prefix(role)}/masters/${buildQueryString(params)}`);
  return asList(res);
}
export async function getMaster(id: number, role: "powerhouse" | "super" = "powerhouse") {
  return apiGet(`${prefix(role)}/masters/${id}/`);
}
export async function createMaster(body: unknown, role: "powerhouse" | "super" = "powerhouse") {
  return apiPost(`${prefix(role)}/masters/create/`, body);
}
export async function updateMaster(id: number, body: unknown, role: "powerhouse" | "super" = "powerhouse") {
  return apiPatch(`${prefix(role)}/masters/${id}/edit/`, body);
}
export async function deleteMaster(id: number, role: "powerhouse" | "super" = "powerhouse") {
  return apiDelete(`${prefix(role)}/masters/${id}/delete/`);
}

export async function getPlayers(role: "powerhouse" | "super" | "master" = "powerhouse", params?: ListParams) {
  const res = await apiGet(`${prefix(role)}/players/${buildQueryString(params)}`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getPlayer(id: number, role: "powerhouse" | "super" | "master" = "powerhouse") {
  return apiGet(`${prefix(role)}/players/${id}/`);
}
export type PlayerReportParams = { date_from?: string; date_to?: string };
export async function getPlayerReport(
  role: "powerhouse" | "super" | "master",
  playerId: number,
  params?: PlayerReportParams
) {
  const q = new URLSearchParams();
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  const qs = q.toString();
  const path = `${prefix(role)}/players/${playerId}/report/`;
  return apiGet<Record<string, unknown>>(qs ? `${path}?${qs}` : path);
}
export async function createPlayer(body: unknown, role: "powerhouse" | "super" | "master" = "powerhouse") {
  return apiPost(`${prefix(role)}/players/create/`, body);
}
export async function updatePlayer(id: number, body: unknown, role: "powerhouse" | "super" | "master" = "powerhouse") {
  return apiPatch(`${prefix(role)}/players/${id}/edit/`, body);
}
/** Toggle player is_active; requires PIN for master/super/powerhouse. */
export async function togglePlayerActive(
  id: number,
  body: { pin: string; is_active: boolean },
  role: "powerhouse" | "super" | "master"
) {
  return apiPatch(`${prefix(role)}/players/${id}/toggle-active/`, body);
}
export async function deletePlayer(id: number, role: "powerhouse" | "super" | "master" = "powerhouse") {
  return apiDelete(`${prefix(role)}/players/${id}/delete/`);
}

// --- Deposits / Withdrawals ---
export async function getDeposits(role: "powerhouse" | "super" | "master", params?: ListParams) {
  const res = await apiGet(`${prefix(role)}/deposits/${buildQueryString(params)}`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getDeposit(id: number, role: "powerhouse" | "super" | "master") {
  return apiGet(`${prefix(role)}/deposits/${id}/`);
}
export async function createDeposit(body: unknown, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/deposits/create/`, body);
}
/** Verify PIN first, then create and approve in one call. No pending deposit if PIN fails. */
export async function directDeposit(
  body: { user_id: number; amount: number; remarks?: string; pin: string; payment_mode?: number },
  role: "powerhouse" | "super" | "master"
) {
  return apiPost(`${prefix(role)}/deposits/direct/`, body);
}

/** Payment modes for deposit target (for dropdown). Master: own modes; super/powerhouse: modes for user_id (or parent if player). */
export async function getPaymentModesForDepositTarget(
  role: "powerhouse" | "super" | "master",
  userId: number
): Promise<Record<string, unknown>[]> {
  if (role === "master") {
    const res = await apiGet(`${prefix("master")}/payment-modes/`);
    return (res as unknown as Record<string, unknown>[]) ?? [];
  }
  const res = await apiGet(`${prefix(role)}/deposits/payment-modes/?user_id=${userId}`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function approveDeposit(id: number, body: { password?: string; pin?: string }, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/deposits/${id}/approve/`, body);
}
export async function rejectDeposit(id: number, body?: { reject_reason?: string }, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/deposits/${id}/reject/`, body ?? {});
}
/** Update deposit (status and/or amount). Requires backend PATCH endpoint e.g. PATCH /deposits/{id}/. */
export async function updateDeposit(id: number, body: { status?: string; amount?: number }, role: "powerhouse" | "super" | "master") {
  return apiPatch(`${prefix(role)}/deposits/${id}/`, body);
}

export async function getWithdrawals(role: "powerhouse" | "super" | "master", params?: ListParams) {
  const res = await apiGet(`${prefix(role)}/withdrawals/${buildQueryString(params)}`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getWithdraw(id: number, role: "powerhouse" | "super" | "master") {
  return apiGet(`${prefix(role)}/withdrawals/${id}/`);
}
/** Verify PIN first, then create and approve in one call. No pending withdrawal if PIN fails. */
export async function directWithdraw(
  body: { user_id: number; amount: number; remarks?: string; pin: string },
  role: "powerhouse" | "super" | "master"
) {
  return apiPost(`${prefix(role)}/withdrawals/direct/`, body);
}
export async function approveWithdraw(id: number, body: { password?: string; pin?: string }, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/withdrawals/${id}/approve/`, body);
}
export async function rejectWithdraw(id: number, body?: { reject_reason?: string }, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/withdrawals/${id}/reject/`, body ?? {});
}
/** Update withdrawal (status and/or amount). Requires backend PATCH endpoint e.g. PATCH /withdrawals/{id}/. */
export async function updateWithdraw(id: number, body: { status?: string; amount?: number }, role: "powerhouse" | "super" | "master") {
  return apiPatch(`${prefix(role)}/withdrawals/${id}/`, body);
}

// --- Bonus Requests ---
export async function getBonusRequests(role: "powerhouse" | "super" | "master", params?: ListParams) {
  const res = await apiGet(`${prefix(role)}/bonus-requests/${buildQueryString(params)}`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getBonusRequest(id: number, role: "powerhouse" | "super" | "master") {
  return apiGet(`${prefix(role)}/bonus-requests/${id}/`);
}
/** Update bonus request amount (master, super, powerhouse). Only pending requests can be updated. */
export async function updateBonusRequest(id: number, body: { amount: number | string }, role: "powerhouse" | "super" | "master") {
  return apiPatch(`${prefix(role)}/bonus-requests/${id}/`, body);
}
export async function approveBonusRequest(id: number, body: { password?: string; pin?: string }, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/bonus-requests/${id}/approve/`, body);
}
export async function rejectBonusRequest(id: number, body?: { reject_reason?: string }, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/bonus-requests/${id}/reject/`, body ?? {});
}

// --- Master: Payment modes (master role only) ---
export async function getMasterPaymentModes() {
  const res = await apiGet(`${prefix("master")}/payment-modes/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getMasterPaymentMode(id: number) {
  return apiGet(`${prefix("master")}/payment-modes/${id}/`);
}
export async function createMasterPaymentMode(body: unknown) {
  return apiPost(`${prefix("master")}/payment-modes/`, body);
}
/** Create payment mode with optional QR image (FormData). */
export async function createMasterPaymentModeFormData(formData: FormData) {
  return apiPostForm(`${prefix("master")}/payment-modes/`, formData);
}
export async function updateMasterPaymentMode(id: number, body: unknown) {
  return apiPatch(`${prefix("master")}/payment-modes/${id}/edit/`, body);
}
/** Update payment mode with optional QR image (FormData). */
export async function updateMasterPaymentModeFormData(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("master")}/payment-modes/${id}/edit/`, formData);
}
export async function deleteMasterPaymentMode(id: number) {
  return apiDelete(`${prefix("master")}/payment-modes/${id}/delete/`);
}

// --- Payment Mode Verification (master, super, powerhouse) ---
export async function getPaymentModeVerificationList(role: "powerhouse" | "super" | "master", params?: { status?: string }) {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
  const res = await apiGet(`${prefix(role)}/payment-mode-verification/${qs}`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function approvePaymentModeVerification(id: number, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/payment-mode-verification/${id}/approve/`, {});
}
export async function rejectPaymentModeVerification(id: number, body: { reject_reason?: string }, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/payment-mode-verification/${id}/reject/`, body);
}

// --- Bet History, Transactions, Activity ---
export async function getGameLog(role: "powerhouse" | "super" | "master") {
  const res = await apiGet(`${prefix(role)}/game-log/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export type GameLogDetailResponse = {
  game_log: Record<string, unknown>;
  transaction: Record<string, unknown> | null;
};
export async function getGameLogDetail(role: "powerhouse" | "super" | "master", id: number | string): Promise<GameLogDetailResponse> {
  return apiGet<GameLogDetailResponse>(`${prefix(role)}/game-log/${id}/`);
}
export async function getTransactions(role: "powerhouse" | "super" | "master") {
  const res = await apiGet(`${prefix(role)}/transactions/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getActivity(role: "powerhouse" | "super" | "master") {
  const res = await apiGet(`${prefix(role)}/activity/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}

// --- Account / Bonus statement (master, super, powerhouse) ---
export type StatementParams = { date_from?: string; date_to?: string; page?: number; page_size?: number };
export type StatementResponse = { results: Record<string, unknown>[]; count: number };
export async function getAccountStatement(
  role: "master" | "super" | "powerhouse",
  params?: StatementParams
): Promise<StatementResponse> {
  const q = new URLSearchParams();
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.page_size != null) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await apiGet<StatementResponse>(`${prefix(role)}/account-statement/${qs ? `?${qs}` : ""}`);
  return res as StatementResponse;
}
export async function getBonusStatement(
  role: "master" | "super" | "powerhouse",
  params?: StatementParams
): Promise<StatementResponse> {
  const q = new URLSearchParams();
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.page_size != null) q.set("page_size", String(params.page_size));
  const qs = q.toString();
  const res = await apiGet<StatementResponse>(`${prefix(role)}/bonus-statement/${qs ? `?${qs}` : ""}`);
  return res as StatementResponse;
}

// --- Total D/W, Super Master D/W, Super D/W State ---
export type DateRangeParams = { date_from?: string; date_to?: string };
export async function getTotalDW(role: "master" | "super" | "powerhouse", params?: DateRangeParams): Promise<Record<string, unknown>[]> {
  const q = new URLSearchParams();
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  const qs = q.toString();
  const res = await apiGet<Record<string, unknown>[]>(`${prefix(role)}/client-request/total-dw/${qs ? `?${qs}` : ""}`);
  return Array.isArray(res) ? res : (res as { data?: Record<string, unknown>[] })?.data ?? [];
}
export async function getSuperMasterDW(role: "super" | "powerhouse" = "super", params?: DateRangeParams): Promise<Record<string, unknown>[]> {
  const q = new URLSearchParams();
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  const qs = q.toString();
  const res = await apiGet<Record<string, unknown>[]>(`${prefix(role)}/client-request/super-master-dw/${qs ? `?${qs}` : ""}`);
  return Array.isArray(res) ? res : (res as { data?: Record<string, unknown>[] })?.data ?? [];
}
export async function getSuperDWState(role: "super" | "powerhouse" = "super", params?: DateRangeParams): Promise<Record<string, unknown>[]> {
  const q = new URLSearchParams();
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  const qs = q.toString();
  const res = await apiGet<Record<string, unknown>[]>(`${prefix(role)}/client-request/super-dw-state/${qs ? `?${qs}` : ""}`);
  return Array.isArray(res) ? res : (res as { data?: Record<string, unknown>[] })?.data ?? [];
}

// --- Payment method list (super: same as payment-mode-verification) ---
export async function getPaymentMethodList(): Promise<Record<string, unknown>[]> {
  const res = await apiGet(`${prefix("super")}/payment-method/`);
  return asList(res);
}

// --- Accounting report (master & super only) ---
export type AccountingReportParams = { date_from?: string; date_to?: string };
export type AccountingSummary = {
  total_pl: string;
  total_deposits: string;
  deposits_count: number;
  total_withdrawals: string;
  withdrawals_count: number;
  game_logs_count: number;
  transactions_count: number;
  settlements_count?: number;
  settlements_total?: string;
};
export type AccountingReportResponse = {
  summary: AccountingSummary;
  game_logs: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  deposits: Record<string, unknown>[];
  withdrawals: Record<string, unknown>[];
  settlements?: { id: number; from_user_username: string | null; amount: string; created_at: string | null }[];
};
export async function getAccountingReport(
  role: "master" | "super" | "powerhouse",
  params?: AccountingReportParams
): Promise<AccountingReportResponse> {
  const q = new URLSearchParams();
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  const qs = q.toString();
  const url = `${prefix(role)}/accounting-report/${qs ? `?${qs}` : ""}`;
  return apiGet<AccountingReportResponse>(url);
}

// --- Messages ---
export async function getMessages(role: "powerhouse" | "super" | "master", partnerId?: number) {
  const path = partnerId != null ? `${prefix(role)}/messages/?partner_id=${partnerId}` : `${prefix(role)}/messages/`;
  const res = await apiGet(path);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export type MessageContact = {
  id: number;
  username: string;
  name: string;
  role: string;
  unread_count?: number;
};

export async function getMessageContacts(role: "powerhouse" | "super" | "master") {
  const res = await apiGet(`${prefix(role)}/messages/contacts/`);
  return (res as unknown as MessageContact[]) ?? [];
}
export async function sendMessage(body: unknown, role: "powerhouse" | "super" | "master") {
  return apiPost(`${prefix(role)}/messages/send/`, body);
}
/** Send message with optional file/image (multipart/form-data). FormData keys: receiver, message, file?, image? */
export async function sendMessageForm(formData: FormData, role: "powerhouse" | "super" | "master") {
  return apiPostForm(`${prefix(role)}/messages/send/`, formData);
}

// --- Settlement (super only) ---
export async function settleMaster(masterId: number, body: { pin: string }) {
  return apiPost(`${prefix("super")}/settlement/${masterId}/`, body);
}

// --- Regenerate PIN / Reset Password (powerhouse for supers/masters/players) ---
const userTypePrefix = (role: "powerhouse" | "super" | "master", userType: "supers" | "masters" | "players") =>
  `${prefix(role)}/${userType}`;

export async function regeneratePin(
  userId: number,
  body: { pin: string },
  role: "powerhouse" | "super" | "master",
  userType: "supers" | "masters" | "players"
) {
  return apiPost(`${userTypePrefix(role, userType)}/${userId}/regenerate-pin/`, body);
}

export async function resetPassword(
  userId: number,
  body: { pin: string; new_password: string },
  role: "powerhouse" | "super" | "master",
  userType: "supers" | "masters" | "players"
) {
  return apiPost(`${userTypePrefix(role, userType)}/${userId}/reset-password/`, body);
}

// ========== Powerhouse-only ==========
export async function getCategoriesAdmin() {
  const res = await apiGet(`${prefix("powerhouse")}/categories/`);
  return asList(res);
}
export async function getCategoryAdmin(id: number) {
  return apiGet(`${prefix("powerhouse")}/categories/${id}/`);
}
export async function createCategoryAdmin(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/categories/`, body);
}
/** Create category with optional SVG file (FormData). */
export async function createCategoryAdminForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/categories/`, formData);
}
export async function updateCategoryAdmin(id: number, body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/categories/${id}/`, body);
}
/** Update category with optional SVG file (FormData). */
export async function updateCategoryAdminForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/categories/${id}/`, formData);
}
export async function deleteCategoryAdmin(id: number) {
  return apiDelete(`${prefix("powerhouse")}/categories/${id}/`);
}


export async function getProvidersAdmin() {
  const res = await apiGet(`${prefix("powerhouse")}/providers/`);
  return asList(res);
}
export async function getProviderAdmin(id: number) {
  return apiGet(`${prefix("powerhouse")}/providers/${id}/`);
}
export async function createProviderAdmin(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/providers/`, body);
}
/** Create provider with optional image file (FormData). */
export async function createProviderAdminForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/providers/`, formData);
}
export async function updateProviderAdmin(id: number, body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/providers/${id}/`, body);
}
/** Update provider with optional image file (FormData). */
export async function updateProviderAdminForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/providers/${id}/`, formData);
}
export async function deleteProviderAdmin(id: number) {
  return apiDelete(`${prefix("powerhouse")}/providers/${id}/`);
}

export type GetGamesAdminParams = { provider_id?: number | null; provider_ids?: number[] };

export async function getGamesAdmin(params?: GetGamesAdminParams) {
  let qs = "";
  if (params?.provider_id != null && typeof params.provider_id === "number") {
    qs = `?provider_id=${params.provider_id}`;
  } else if (params?.provider_ids?.length) {
    qs = `?provider_ids=${params.provider_ids.join(",")}`;
  }
  const res = await apiGet(`${prefix("powerhouse")}/games/${qs}`);
  return asList(res);
}
export async function getGameAdmin(id: number) {
  return apiGet(`${prefix("powerhouse")}/games/${id}/`);
}
export async function createGame(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/games/`, body);
}
export async function createGameForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/games/`, formData);
}
export async function updateGame(id: number, body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/games/${id}/`, body);
}
export async function updateGameForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/games/${id}/`, formData);
}
export async function deleteGame(id: number) {
  return apiDelete(`${prefix("powerhouse")}/games/${id}/`);
}

// --- Direct Import (game API called from browser; backend only provides URL and persists import) ---
export type ImportProvider = { code: string; name: string };
export type ImportGame = { game_uid: string; game_name: string; game_type: string; game_image: string };
export type ImportProviderGamesResponse = { categories: string[]; games: ImportGame[] };
export type ImportGamesResult = { provider_created: boolean; categories_created: number; games_created: number; games_skipped: number };

function unwrapObject<T>(res: unknown): T {
  if (res != null && typeof res === "object" && !Array.isArray(res) && !("data" in res)) return res as T;
  const d = (res as { data?: T })?.data;
  return d as T;
}

/** Get game API base URL from backend (no backend call to game API). */
export async function getImportGameApiUrl(): Promise<{ game_api_url: string }> {
  const res = await apiGet<{ game_api_url?: string }>(`${prefix("powerhouse")}/import/game-api-url/`);
  const raw = unwrapObject<{ game_api_url?: string }>(res as unknown);
  const url = (raw?.game_api_url ?? "").trim();
  return { game_api_url: url };
}

/** Fetch providers from game API from browser (GET serverurl/getProvider). */
export async function fetchProvidersFromGameApi(baseUrl: string): Promise<ImportProvider[]> {
  const url = baseUrl.replace(/\/$/, "") + "/getProvider";
  const r = await fetch(url, { method: "GET" });
  if (!r.ok) throw new Error(r.status === 404 ? "Not Found (check Game API URL in Super Settings)" : `Game API error: ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data)) return [];
  const result: ImportProvider[] = [];
  for (const item of data) {
    if (typeof item === "string") result.push({ code: item, name: item });
    else if (item && typeof item === "object") {
      const code = String(item.code ?? item.provider ?? item.id ?? "").trim();
      const name = String(item.name ?? item.displayName ?? code).trim();
      if (code) result.push({ code, name });
    }
  }
  return result;
}

/** Fetch provider games from game API from browser (GET serverurl/providerGame?provider=...&limitCount=10000). */
export async function fetchProviderGamesFromGameApi(baseUrl: string, providerCode: string): Promise<ImportProviderGamesResponse> {
  const base = baseUrl.replace(/\/$/, "");
  const url = `${base}/providerGame?provider=${encodeURIComponent(providerCode)}&limitCount=10000`;
  const r = await fetch(url, { method: "GET" });
  if (!r.ok) throw new Error(r.status === 404 ? "Not Found (check provider code)" : `Game API error: ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data)) return { categories: [], games: [] };
  const games: ImportGame[] = [];
  const categorySet = new Set<string>();
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const game_code = String(item.game_code ?? item.code ?? "").trim();
    if (!game_code) continue;
    const game_type = (String(item.game_type ?? item.type ?? "").trim() || "Other");
    categorySet.add(game_type);
    games.push({
      game_uid: game_code,
      game_name: String(item.game_name ?? item.name ?? game_code).trim(),
      game_type,
      game_image: String(item.game_image ?? item.image ?? "").trim(),
    });
  }
  const categories = Array.from(categorySet).sort();
  return { categories, games };
}

export async function postImportGames(payload: {
  provider_code: string;
  provider_name: string;
  games: ImportGame[];
}): Promise<ImportGamesResult> {
  const res = await apiPost<ImportGamesResult>(`${prefix("powerhouse")}/import/games/`, payload);
  return unwrapObject<ImportGamesResult>(res as unknown) ?? {
    provider_created: false,
    categories_created: 0,
    games_created: 0,
    games_skipped: 0,
  };
}

export async function getBonusRulesAdmin() {
  const res = await apiGet(`${prefix("powerhouse")}/bonus-rules/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getBonusRuleAdmin(id: number) {
  return apiGet(`${prefix("powerhouse")}/bonus-rules/${id}/`);
}
export async function createBonusRule(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/bonus-rules/`, body);
}
export async function updateBonusRule(id: number, body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/bonus-rules/${id}/`, body);
}
export async function deleteBonusRule(id: number) {
  return apiDelete(`${prefix("powerhouse")}/bonus-rules/${id}/`);
}

export async function getSuperSettings() {
  return apiGet(`${prefix("powerhouse")}/super-settings/`);
}
export async function saveSuperSettings(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/super-settings/save/`, body);
}

export async function getSiteSettingsAdmin() {
  return apiGet(`${prefix("powerhouse")}/site-settings/`);
}
export async function updateSiteSettings(body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/site-settings/update/`, body);
}
/** Update site settings with logo file (FormData). Send name, phone1, phone2, email1, whatsapp_number, hero_title, hero_subtitle, footer_description, promo_banners (JSON string), logo (file). */
export async function updateSiteSettingsForm(formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/site-settings/update/`, formData);
}

/** Upload an image for site section icons. Returns { url: string } (relative path for getMediaUrl). */
export async function uploadSiteMedia(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.set("file", file, file.name || "image");
  const res = await apiPostForm<{ url?: string }>(`${prefix("powerhouse")}/upload-site-media/`, formData);
  const url = (res as { url?: string }).url;
  if (url == null) throw new Error("Upload did not return url");
  return { url };
}

// --- Slider (second home) ---
export async function getSliderSlidesAdmin() {
  const res = await apiGet(`${prefix("powerhouse")}/slider/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function createSliderSlide(body: { title: string; subtitle?: string; image?: string; cta_label?: string; cta_link?: string; order?: number }) {
  return apiPost(`${prefix("powerhouse")}/slider/`, body);
}
export async function updateSliderSlide(id: number, body: Partial<{ title: string; subtitle: string; image: string; cta_label: string; cta_link: string; order: number }>) {
  return apiPatch(`${prefix("powerhouse")}/slider/${id}/`, body);
}
export async function deleteSliderSlide(id: number) {
  return apiDelete(`${prefix("powerhouse")}/slider/${id}/`);
}
export async function createSliderSlideForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/slider/`, formData);
}
export async function updateSliderSlideForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/slider/${id}/`, formData);
}

// --- Popup ---
export async function getPopups() {
  const res = await apiGet(`${prefix("powerhouse")}/popup/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function createPopup(body: { title: string; content?: string; image?: string; cta_label?: string; cta_link?: string; is_active?: boolean; order?: number }) {
  return apiPost(`${prefix("powerhouse")}/popup/`, body);
}
export async function updatePopup(id: number, body: Partial<{ title: string; content: string; image: string; cta_label: string; cta_link: string; is_active: boolean; order: number }>) {
  return apiPatch(`${prefix("powerhouse")}/popup/${id}/`, body);
}
export async function deletePopup(id: number) {
  return apiDelete(`${prefix("powerhouse")}/popup/${id}/`);
}
export async function createPopupForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/popup/`, formData);
}
export async function updatePopupForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/popup/${id}/`, formData);
}

// --- Promotion (powerhouse CRUD) ---
export async function getPromotionsAdmin() {
  const res = await apiGet(`${prefix("powerhouse")}/promotions/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function createPromotion(body: { title: string; description?: string; is_active?: boolean; order?: number }) {
  return apiPost(`${prefix("powerhouse")}/promotions/`, body);
}
export async function updatePromotion(id: number, body: Partial<{ title: string; description: string; is_active: boolean; order: number }>) {
  return apiPatch(`${prefix("powerhouse")}/promotions/${id}/`, body);
}
export async function deletePromotion(id: number) {
  return apiDelete(`${prefix("powerhouse")}/promotions/${id}/`);
}
export async function createPromotionForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/promotions/`, formData);
}
export async function updatePromotionForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/promotions/${id}/`, formData);
}

// --- Coming Soon Enrollments (powerhouse view only) ---
export async function getComingSoonEnrollments() {
  const res = await apiGet(`${prefix("powerhouse")}/coming-soon-enrollments/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}

// --- Live Betting (second home) ---
export async function getLiveBettingSectionsAdmin() {
  const res = await apiGet(`${prefix("powerhouse")}/live-betting-sections/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function createLiveBettingSection(body: { title: string; order?: number }) {
  return apiPost(`${prefix("powerhouse")}/live-betting-sections/`, body);
}
export async function updateLiveBettingSection(id: number, body: Partial<{ title: string; order: number }>) {
  return apiPatch(`${prefix("powerhouse")}/live-betting-sections/${id}/`, body);
}
export async function deleteLiveBettingSection(id: number) {
  return apiDelete(`${prefix("powerhouse")}/live-betting-sections/${id}/`);
}
export async function getLiveBettingEventsAdmin(sectionId?: number) {
  const url = sectionId != null ? `${prefix("powerhouse")}/live-betting-events/?section=${sectionId}` : `${prefix("powerhouse")}/live-betting-events/`;
  const res = await apiGet(url);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function createLiveBettingEvent(body: { section: number; sport?: string; team1: string; team2: string; event_date?: string; event_time?: string; odds?: number[]; is_live?: boolean; order?: number }) {
  return apiPost(`${prefix("powerhouse")}/live-betting-events/`, body);
}
export async function updateLiveBettingEvent(id: number, body: Partial<{ section: number; sport: string; team1: string; team2: string; event_date: string; event_time: string; odds: number[]; is_live: boolean; order: number }>) {
  return apiPatch(`${prefix("powerhouse")}/live-betting-events/${id}/`, body);
}
export async function deleteLiveBettingEvent(id: number) {
  return apiDelete(`${prefix("powerhouse")}/live-betting-events/${id}/`);
}

export async function getCmsPages() {
  const res = await apiGet(`${prefix("powerhouse")}/cms/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getCmsPage(id: number) {
  return apiGet(`${prefix("powerhouse")}/cms/${id}/`);
}
export async function createCmsPage(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/cms/`, body);
}
/** Create CMS page with optional image file (FormData). */
export async function createCmsPageForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/cms/`, formData);
}
export async function updateCmsPage(id: number, body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/cms/${id}/`, body);
}
/** Update CMS page with optional image file (FormData). */
export async function updateCmsPageForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/cms/${id}/`, formData);
}
export async function deleteCmsPage(id: number) {
  return apiDelete(`${prefix("powerhouse")}/cms/${id}/`);
}

export async function getTestimonialsAdmin() {
  const res = await apiGet(`${prefix("powerhouse")}/testimonials/`);
  return (res as unknown as Record<string, unknown>[]) ?? [];
}
export async function getTestimonialAdmin(id: number) {
  return apiGet(`${prefix("powerhouse")}/testimonials/${id}/`);
}
export async function createTestimonial(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/testimonials/`, body);
}
/** Create testimonial with optional image file (FormData). */
export async function createTestimonialForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/testimonials/`, formData);
}
export async function updateTestimonial(id: number, body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/testimonials/${id}/`, body);
}
/** Update testimonial with optional image file (FormData). */
export async function updateTestimonialForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/testimonials/${id}/`, formData);
}
export async function deleteTestimonial(id: number) {
  return apiDelete(`${prefix("powerhouse")}/testimonials/${id}/`);
}

// --- Payment Methods (site-level accepted payment methods) ---
export interface PaymentMethodAdmin {
  id: number;
  name: string;
  image?: string | null;
  image_url?: string | null;
  fields: Record<string, unknown>;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
export async function getPaymentMethods() {
  const res = await apiGet(`${prefix("powerhouse")}/payment-methods/`);
  return asList<PaymentMethodAdmin>(res);
}
export async function createPaymentMethod(body: unknown) {
  return apiPost(`${prefix("powerhouse")}/payment-methods/`, body);
}
export async function createPaymentMethodForm(formData: FormData) {
  return apiPostForm(`${prefix("powerhouse")}/payment-methods/`, formData);
}
export async function updatePaymentMethod(id: number, body: unknown) {
  return apiPatch(`${prefix("powerhouse")}/payment-methods/${id}/`, body);
}
export async function updatePaymentMethodForm(id: number, formData: FormData) {
  return apiPatchForm(`${prefix("powerhouse")}/payment-methods/${id}/`, formData);
}
export async function deletePaymentMethod(id: number) {
  return apiDelete(`${prefix("powerhouse")}/payment-methods/${id}/`);
}

// --- Countries (powerhouse) ---
export interface CountryAdmin {
  id: number;
  name: string;
  country_code: string;
  currency_symbol: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
export async function getCountries(): Promise<CountryAdmin[]> {
  const res = await apiGet(`${prefix("powerhouse")}/countries/`);
  return asList<CountryAdmin>(res);
}
export async function createCountry(body: { name: string; country_code: string; currency_symbol: string; is_active?: boolean }) {
  return apiPost(`${prefix("powerhouse")}/countries/`, body);
}
export async function updateCountry(id: number, body: Partial<{ name: string; country_code: string; currency_symbol: string; is_active: boolean }>) {
  return apiPatch(`${prefix("powerhouse")}/countries/${id}/`, body);
}
export async function deleteCountry(id: number) {
  return apiDelete(`${prefix("powerhouse")}/countries/${id}/`);
}
