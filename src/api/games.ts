import { apiGet, apiPost, getMediaUrl } from "@/lib/api";
import type { ComingSoonShape } from "@/data/homePageMockData";

export interface GameCategory {
  id: number;
  name: string;
  /** Prefer icon (image URL); svg is legacy. */
  icon?: string;
  svg?: string;
  is_active?: boolean;
  /** Number of active games in this category (from API). */
  games_count?: number;
}

export interface GameProvider {
  id: number;
  name: string;
  code: string;
  image?: string;
  banner?: string;
  is_active?: boolean;
  /** When set, open this game directly; otherwise open provider detail. */
  single_game_id?: number | null;
}

export interface ProviderDetailCategory {
  id: number;
  name: string;
  icon?: string | null;
  svg?: string | null;
}

export interface ProviderDetail extends GameProvider {
  games_count: number;
  categories: ProviderDetailCategory[];
}

export interface Game {
  id: number;
  name: string;
  game_uid: string;
  image?: string;
  image_url?: string;
  coming_soon_image?: string;
  min_bet: string;
  max_bet: string;
  category: number;
  category_name?: string;
  provider: number;
  provider_name?: string;
  provider_code?: string;
  is_active?: boolean;
  is_top_game?: boolean;
  is_popular_game?: boolean;
  is_lobby?: boolean;
}

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const data = (res as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

function unwrapSingle<T>(res: unknown): T | null {
  if (res != null && typeof res === "object" && !Array.isArray(res) && !("data" in res)) return res as T;
  const data = (res as { data?: T })?.data;
  return data ?? null;
}

/** Resolve game image URL: prefer coming_soon_image when set, else image, else image_url, else empty. */
export function getGameImageUrl(game: Game): string {
  if (game.coming_soon_image?.trim()) return getMediaUrl(game.coming_soon_image.trim());
  if (game.image?.trim()) return getMediaUrl(game.image.trim());
  if (game.image_url?.trim()) return game.image_url.trim();
  return getMediaUrl("");
}

export async function getCategories(): Promise<GameCategory[]> {
  const res = await apiGet<GameCategory[]>("/public/categories/");
  return unwrapList<GameCategory>(res as unknown);
}

export async function getProviders(): Promise<GameProvider[]> {
  const res = await apiGet<GameProvider[]>("/public/providers/");
  return unwrapList<GameProvider>(res as unknown);
}

/** Fetch single provider detail with games_count and categories (for provider page). Image/banner are returned as full display URLs. */
export async function getProviderDetail(id: number): Promise<ProviderDetail | null> {
  const res = await apiGet<ProviderDetail>(`/public/providers/${id}/`);
  const raw = unwrapSingle<ProviderDetail>(res as unknown);
  if (!raw) return null;
  return {
    ...raw,
    image: raw.image?.trim() ? getMediaUrl(raw.image.trim()) : undefined,
    banner: raw.banner?.trim() ? getMediaUrl(raw.banner.trim()) : undefined,
  };
}

export interface GamesPaginatedResponse {
  results: Game[];
  count: number;
  next: string | null;
  previous: string | null;
}

export async function getGames(
  categoryId?: number,
  providerId?: number,
  page?: number,
  pageSize: number = 24,
  search?: string,
  options?: { is_top_game?: boolean; is_popular_game?: boolean; ids?: number[] }
): Promise<GamesPaginatedResponse> {
  const params = new URLSearchParams();
  if (options?.ids && options.ids.length > 0) {
    params.set("ids", options.ids.join(","));
    const q = `?${params.toString()}`;
    const res = await apiGet<GamesPaginatedResponse>(`/public/games/${q}`);
    const raw = res as unknown as { results?: Game[]; count?: number; next?: string | null; previous?: string | null };
    return {
      results: Array.isArray(raw?.results) ? raw.results : [],
      count: typeof raw?.count === "number" ? raw.count : 0,
      next: raw?.next ?? null,
      previous: raw?.previous ?? null,
    };
  }
  if (categoryId != null) params.set("category_id", String(categoryId));
  if (providerId != null) params.set("provider_id", String(providerId));
  if (page != null) params.set("page", String(page));
  params.set("page_size", String(pageSize));
  if (search != null && search.trim() !== "") params.set("search", search.trim());
  if (options?.is_top_game === true) params.set("is_top_game", "true");
  if (options?.is_popular_game === true) params.set("is_popular_game", "true");
  const q = params.toString() ? `?${params.toString()}` : "";
  const res = await apiGet<GamesPaginatedResponse>(`/public/games/${q}`);
  const raw = res as unknown as { results?: Game[]; count?: number; next?: string | null; previous?: string | null };
  return {
    results: Array.isArray(raw?.results) ? raw.results : [],
    count: typeof raw?.count === "number" ? raw.count : 0,
    next: raw?.next ?? null,
    previous: raw?.previous ?? null,
  };
}

export async function getGame(id: string | number): Promise<Game | null> {
  const res = await apiGet<Game>(`/public/games/${id}/`);
  return unwrapSingle<Game>(res as unknown);
}

/** Coming-soon list item from API (subset of Game + coming_soon_*). */
export interface ComingSoonGameApi {
  id: number;
  name: string;
  image?: string;
  image_url?: string;
  coming_soon_launch_date?: string | null;
  coming_soon_description?: string;
}

function formatLaunchDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

/** Fetch coming-soon games from backend; returns shape expected by ComingSoon component. */
export async function getComingSoonGames(): Promise<ComingSoonShape[]> {
  try {
    const res = await apiGet<ComingSoonGameApi[]>("/public/coming-soon-games/");
    const list = unwrapList<ComingSoonGameApi>(res as unknown);
    return list.map((item) => ({
      id: String(item.id),
      name: item.name,
      image: getGameImageUrl(item as unknown as Game),
      launchDate: formatLaunchDate(item.coming_soon_launch_date ?? undefined),
      description: item.coming_soon_description ?? undefined,
    }));
  } catch {
    return [];
  }
}

/** Enroll current user for a coming-soon game (requires auth). Idempotent. */
export async function enrollComingSoon(gameId: number): Promise<{ detail: string; enrolled?: boolean }> {
  const res = await apiPost<{ detail: string; enrolled?: boolean }>("/public/coming-soon-enroll/", { game_id: gameId });
  return (res as { detail?: string; enrolled?: boolean }) ?? { detail: "Enrolled.", enrolled: true };
}
