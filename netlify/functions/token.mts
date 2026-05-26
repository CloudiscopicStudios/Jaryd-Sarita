import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// Public endpoint — anyone (admin or guest) calls this to get a fresh Drive
// access token. Uses the persisted refresh token to get a new one from Google.
export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const store = getStore("auth");
  const refreshToken = await store.get("refresh_token");
  if (!refreshToken) return json({ error: "Drive not configured yet" }, 401);

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  const data = (await r.json()) as Record<string, unknown>;
  if (!r.ok) return json({ error: data.error_description ?? "Token refresh failed" }, 400);

  const folderId = await store.get("folder_id");
  return json({ access_token: data.access_token, expires_in: data.expires_in, folderId: folderId ?? null });
};
