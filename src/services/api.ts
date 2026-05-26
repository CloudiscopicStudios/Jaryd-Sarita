interface TokenResponse {
  access_token: string;
  expires_in: number;
  folderId: string | null;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, init);
  const body = await res.json().catch(() => ({ error: "Request failed" }));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Request failed");
  return body as T;
}

export const api = {
  /** Exchange a Google auth code for tokens. Persists the refresh token server-side. */
  exchangeCode: (code: string) =>
    apiFetch<TokenResponse>("/auth-exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }),

  /** Get a fresh Drive access token using the stored refresh token. */
  getToken: () => apiFetch<TokenResponse>("/token"),

  /** Persist the Drive folder ID so guests can upload. */
  saveConfig: (folderId: string) =>
    apiFetch<{ ok: boolean }>("/drive-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    }),

  /** Clear the stored refresh token and folder ID. */
  logout: () =>
    apiFetch<{ ok: boolean }>("/logout", { method: "POST" }).catch(() => null),
};
