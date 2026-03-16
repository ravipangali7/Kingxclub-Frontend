import { apiGet, apiPost } from "@/lib/api";
import type { User } from "@/contexts/AuthContext";

export async function getMe(): Promise<User> {
  const res = await apiGet<User>("/public/auth/me/");
  return res as unknown as User;
}

// --- Forgot password (unauthenticated) ---
export type ForgotSearchPayload = { phone?: string; username?: string; email?: string };
export type ForgotSearchResult = {
  id: number;
  has_phone: boolean;
  has_email: boolean;
  phone_mask?: string;
  email_mask?: string;
  whatsapp_number?: string | null;
};

export async function forgotPasswordSearch(payload: ForgotSearchPayload): Promise<ForgotSearchResult> {
  const res = await apiPost<ForgotSearchResult>("/public/auth/forgot-password/search/", payload);
  return res as unknown as ForgotSearchResult;
}

export async function forgotPasswordSendOtp(
  userId: number,
  channel: "phone" | "email" | "whatsapp"
): Promise<void> {
  await apiPost("/public/auth/forgot-password/send-otp/", { user_id: userId, channel });
}

export async function forgotPasswordVerifyReset(
  userId: number,
  otp: string,
  newPassword: string
): Promise<void> {
  await apiPost("/public/auth/forgot-password/verify-reset/", {
    user_id: userId,
    otp,
    new_password: newPassword,
  });
}

export async function forgotPasswordWhatsappContact(userId: number): Promise<{ whatsapp_number: string | null }> {
  const res = await apiGet<{ whatsapp_number: string | null }>(
    `/public/auth/forgot-password/whatsapp-contact/?user_id=${userId}`
  );
  return res as unknown as { whatsapp_number: string | null };
}

// --- Signup (phone + OTP, then register) ---
export async function signupCheckPhone(phone: string): Promise<{ exists: boolean }> {
  const res = await apiPost<{ exists: boolean }>("/public/auth/signup/check-phone/", { phone });
  return res as unknown as { exists: boolean };
}

export type SignupOtpChannel = "sms" | "whatsapp";

export async function signupSendOtp(phone: string, channel: SignupOtpChannel = "sms"): Promise<void> {
  await apiPost("/public/auth/signup/send-otp/", { phone, channel });
}

export async function signupVerifyOtp(phone: string, otp: string): Promise<{ signup_token: string }> {
  const res = await apiPost<{ signup_token: string }>("/public/auth/signup/verify-otp/", { phone, otp });
  return res as unknown as { signup_token: string };
}

// --- Google OAuth ---
export type GoogleLoginSuccess = { token: string; user: import("@/contexts/AuthContext").User };
export type GoogleLoginNeedsUsername = { needs_username: true; email: string; name: string };

export async function authGoogle(idToken: string): Promise<GoogleLoginSuccess | GoogleLoginNeedsUsername> {
  const res = await apiPost<GoogleLoginSuccess | GoogleLoginNeedsUsername>("/public/auth/google/", {
    id_token: idToken,
  });
  return res as unknown as GoogleLoginSuccess | GoogleLoginNeedsUsername;
}

export async function authGoogleComplete(
  idToken: string,
  username: string,
  password: string
): Promise<{ token: string; user: import("@/contexts/AuthContext").User }> {
  const res = await apiPost<{ token: string; user: import("@/contexts/AuthContext").User }>(
    "/public/auth/google/complete/",
    { id_token: idToken, username, password }
  );
  return res as unknown as { token: string; user: import("@/contexts/AuthContext").User };
}
