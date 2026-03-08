/**
 * API client: base URL + auth header. Uses fetch.
 * Set VITE_API_BASE_URL in .env for local dev (e.g. http://localhost:8000/api).
 */
// export const BASE_URL = "https://admin.luckyuser365.com/api";
export const BASE_URL = "https://admin.kingxclub.com/api";

function getToken(): string | null {
  return localStorage.getItem('token');
}

export type ApiResponse<T = unknown> = {
  data?: T;
  detail?: string;
  [key: string]: unknown;
};

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data: ApiResponse<T>;
  try {
    data = text ? (JSON.parse(text) as ApiResponse<T>) : {};
  } catch {
    data = { detail: text || 'Request failed' };
  }
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    throw { status: res.status, ...data };
  }
  return data;
}

export async function apiGet<T = unknown>(path: string): Promise<ApiResponse<T>> {
  return api<T>(path, { method: 'GET' });
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return api<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

/** POST with FormData (e.g. file upload). Omits Content-Type so browser sets multipart boundary. */
export async function apiPostForm<T = unknown>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }
  const res = await fetch(url, { method: 'POST', body: formData, headers });
  const text = await res.text();
  let data: ApiResponse<T>;
  try {
    data = text ? (JSON.parse(text) as ApiResponse<T>) : {};
  } catch {
    data = { detail: text || 'Request failed' };
  }
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    throw { status: res.status, ...data };
  }
  return data;
}

/** PATCH with FormData (e.g. file upload). */
export async function apiPatchForm<T = unknown>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }
  const res = await fetch(url, { method: 'PATCH', body: formData, headers });
  const text = await res.text();
  let data: ApiResponse<T>;
  try {
    data = text ? (JSON.parse(text) as ApiResponse<T>) : {};
  } catch {
    data = { detail: text || 'Request failed' };
  }
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    throw { status: res.status, ...data };
  }
  return data;
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return api<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

export async function apiPatch<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return api<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

export async function apiDelete(path: string): Promise<ApiResponse> {
  return api(path, { method: 'DELETE' });
}

export function getMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = BASE_URL.replace(/\/api\/?$/, '').trim();
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  // Avoid double /media/ when backend already returns path with media/ (e.g. provider images)
  const pathSegment = normalized.toLowerCase().startsWith('media/')
    ? normalized
    : `media/${normalized}`;
  return `${base}/${pathSegment}`;
}

/** WebSocket URL for real-time messages. Uses same host as API, path /ws/messages/, token in query. */
export function getMessagesWebSocketUrl(): string | null {
  const token = getToken();
  if (!token) return null;
  const base = BASE_URL.replace(/\/api\/?$/, '').trim();
  const wsProtocol = base.startsWith('https') ? 'wss' : 'ws';
  const wsHost = base.replace(/^https?:\/\//, '');
  const url = `${wsProtocol}://${wsHost}/ws/messages/?token=${encodeURIComponent(token)}`;
  return url;
}

/** WebSocket URL for session revoke (one device per user). Same host as API, path /ws/session/, token in query. */
export function getSessionWebSocketUrl(): string | null {
  const token = getToken();
  if (!token) return null;
  const base = BASE_URL.replace(/\/api\/?$/, '').trim();
  const wsProtocol = base.startsWith('https') ? 'wss' : 'ws';
  const wsHost = base.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${wsHost}/ws/session/?token=${encodeURIComponent(token)}`;
}
