import { apiGet } from "@/lib/api";

export async function getSiteSetting() {
  const res = await apiGet("/public/site-setting/");
  return (res as Record<string, unknown>) ?? {};
}

/** Second home sections: providers, top games, category-wise games, popular games with names, image URLs, and links from backend. */
export interface SecondHomeSectionProvider {
  id: number;
  name: string;
  logo: string;
  logo_image?: string | null;
  games: number;
  single_game_id?: number | null;
  link: string;
}

export interface SecondHomeSectionGame {
  id: number;
  name: string;
  image: string | null;
  category: string;
  min_bet: number;
  max_bet: number;
  provider: string;
  link: string;
}

export interface SecondHomeCategorySection {
  category_id: number;
  section_title: string;
  section_icon: string;
  games: SecondHomeSectionGame[];
}

export interface SecondHomeSectionsResponse {
  providers: { section_title: string; section_subtitle?: string; section_svg: string; items: SecondHomeSectionProvider[] };
  top_games: { section_title: string; section_svg: string; items: SecondHomeSectionGame[] };
  categories_game: { section_title: string; section_svg: string; categories: SecondHomeCategorySection[] };
  popular_games: { section_title: string; section_svg: string; items: SecondHomeSectionGame[] };
}

export async function getSecondHomeSections(): Promise<SecondHomeSectionsResponse> {
  const res = await apiGet("/public/second-home-sections/");
  return res as SecondHomeSectionsResponse;
}

/** Active country for register/login dropdown (from DB). */
export interface PublicCountry {
  id: number;
  name: string;
  country_code: string;
  currency_symbol: string;
}

/** Shape for country code dropdown: value (country_code) and label (e.g. "Nepal (+977)"). */
export interface CountryOption {
  value: string;
  label: string;
}

export async function getPublicCountries(): Promise<CountryOption[]> {
  try {
    const res = await apiGet<PublicCountry[]>("/public/countries/");
    const list = Array.isArray(res) ? res : [];
    return list.map((c) => ({
      value: String(c.country_code ?? "").trim(),
      label: `${c.name ?? ""} (+${c.country_code ?? ""})`.trim(),
    })).filter((o) => o.value && o.label);
  } catch {
    return [];
  }
}

/** Site setting shape for WhatsApp/phones/name (whatsapp_number, phones array, name). */
export type SiteSettingRecord = Record<string, unknown> & {
  name?: string;
  whatsapp_number?: string;
  phones?: string[];
};

/** User shape with optional parent_whatsapp_number (from /auth/me/ for players). */
export type UserWithParentWhatsApp = { role?: string; parent_whatsapp_number?: string | null } | null | undefined;

/**
 * Resolve the WhatsApp number to use for contact/support/deposit/withdraw links.
 * - Logged-in player: use parent (master) whatsapp_number; if empty, use site setting whatsapp_number.
 * - Not logged in or non-player: use site setting whatsapp_number (with phones fallback).
 */
export function getResolvedWhatsAppNumber(
  siteSetting: SiteSettingRecord | undefined | null,
  user: UserWithParentWhatsApp
): string {
  if (user?.role === "player" && user.parent_whatsapp_number && String(user.parent_whatsapp_number).trim()) {
    return String(user.parent_whatsapp_number).trim();
  }
  if (!siteSetting) return "";
  const raw =
    (siteSetting.whatsapp_number && String(siteSetting.whatsapp_number).trim()) ||
    (Array.isArray(siteSetting.phones) && siteSetting.phones[0] ? String(siteSetting.phones[0]).trim() : null);
  return raw || "";
}

/**
 * Build WhatsApp chat link from a resolved number (digits only or with formatting).
 * Normalizes: 9–10 digits get 977 prefix.
 */
export function getWhatsAppLinkFromNumber(number: string): string | null {
  const raw = (number || "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const full = digits.length <= 10 ? "977" + digits : digits;
  return `https://wa.me/${full}`;
}

/**
 * Build WhatsApp chat link from site setting.
 * Uses whatsapp_number if set, else first entry in phones. Normalizes to digits; 9–10 digits get 977 prefix.
 */
export function getWhatsAppLink(siteSetting: SiteSettingRecord | undefined | null): string | null {
  const num = getResolvedWhatsAppNumber(siteSetting, null);
  return num ? getWhatsAppLinkFromNumber(num) : null;
}

/**
 * Build WhatsApp link for contact/support/deposit/withdraw: uses master's number for logged-in players, else site setting.
 */
export function getWhatsAppLinkWithUser(
  siteSetting: SiteSettingRecord | undefined | null,
  user: UserWithParentWhatsApp,
  text?: string
): string | null {
  const num = getResolvedWhatsAppNumber(siteSetting, user);
  const url = num ? getWhatsAppLinkFromNumber(num) : null;
  if (!url) return null;
  if (text) return `${url}?text=${encodeURIComponent(text)}`;
  return url;
}

export async function getCmsFooterPages() {
  const res = await apiGet("/public/cms/footer/");
  return (res as unknown as Array<Record<string, unknown>>) ?? [];
}

export async function getTestimonials() {
  const res = await apiGet("/public/testimonials/");
  return (res as unknown as Array<Record<string, unknown>>) ?? [];
}

export interface SliderSlideApi {
  id: number;
  title: string;
  subtitle?: string;
  image?: string;
  cta_label: string;
  cta_link: string;
  order: number;
}

export async function getSliderSlides(): Promise<SliderSlideApi[]> {
  const res = await apiGet("/public/slider/");
  return (Array.isArray(res) ? res : []) as SliderSlideApi[];
}

export interface LiveBettingEventApi {
  id: number;
  section: number;
  sport?: string;
  team1: string;
  team2: string;
  event_date?: string;
  event_time?: string;
  odds: number[];
  is_live?: boolean;
  order?: number;
}

export interface LiveBettingSectionApi {
  id: number;
  title: string;
  order: number;
  events: LiveBettingEventApi[];
}

export async function getLiveBettingSections(): Promise<LiveBettingSectionApi[]> {
  const res = await apiGet("/public/live-betting/");
  return (Array.isArray(res) ? res : []) as LiveBettingSectionApi[];
}

export interface PopupApi {
  id: number;
  title: string;
  content?: string;
  image?: string | null;
  cta_label: string;
  cta_link: string;
  is_active: boolean;
  order: number;
}

export async function getActivePopups(): Promise<PopupApi[]> {
  const res = await apiGet("/public/popups/");
  return (Array.isArray(res) ? res : []) as PopupApi[];
}

export interface PromotionApi {
  id: number;
  title: string;
  image?: string | null;
  image_url?: string | null;
  description: string;
  cta_link?: string | null;
  cta_label?: string | null;
  is_active: boolean;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export async function getPromotions(): Promise<PromotionApi[]> {
  const res = await apiGet("/public/promotions/");
  return (Array.isArray(res) ? res : []) as PromotionApi[];
}

export interface ComingSoonApi {
  id: number;
  name: string;
  image?: string | null;
  image_url?: string | null;
  description?: string;
  coming_date?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getComingSoon(): Promise<ComingSoonApi[]> {
  const res = await apiGet("/public/coming-soon/");
  return (Array.isArray(res) ? res : []) as ComingSoonApi[];
}

export interface PublicPaymentMethod {
  id: number;
  name: string;
  image_url?: string | null;
  /** Field keys and optional labels for dynamic payment mode details form. */
  fields?: Record<string, string>;
  order: number;
  is_active?: boolean;
}

export async function getPublicPaymentMethods(): Promise<PublicPaymentMethod[]> {
  const res = await apiGet("/public/payment-methods/");
  return (Array.isArray(res) ? res : []) as PublicPaymentMethod[];
}

// Type definitions for site setting JSON fields
export interface SiteSectionBase {
  section_title?: string;
  section_svg?: string;
}

export interface SiteCategoriesJson extends SiteSectionBase {
  category_ids?: number[];
}

export interface SiteTopGamesJson extends SiteSectionBase {
  game_ids?: number[];
}

export interface SiteProvidersJson extends SiteSectionBase {
  provider_ids?: number[];
}

export interface SiteCategoryEntry {
  category_id: number;
  game_ids: number[];
  section_title?: string;
  section_icon?: string;
}

export interface SiteCategoriesGameJson extends SiteSectionBase {
  categories?: SiteCategoryEntry[];
}

export interface SitePopularGamesJson extends SiteSectionBase {
  game_ids?: number[];
}

export interface SiteComingSoonJson extends SiteSectionBase {}

export interface SiteReferBonusJson extends SiteSectionBase {
  description?: string;
  cta?: string;
  href?: string;
}

export interface SitePaymentsAcceptedJson extends SiteSectionBase {
  payment_method_ids?: number[];
}

export interface SiteFooterJson {
  tagline?: string;
  links?: { label: string; href: string }[];
}

export interface SiteWelcomeDepositJson extends SiteSectionBase {
  title?: string;
  subtitle?: string;
  cta?: string;
  href?: string;
}
