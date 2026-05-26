import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: new Headers({ ...CORS, "Content-Type": "application/json" }),
  });

export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: new Headers(CORS) });

  try {
    const store = getStore("auth");
    const refreshToken = await store.get("refresh_token");

    if (!refreshToken) {
      return json({ error: "Drive not configured yet" }, 401);
    }

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
    if (!r.ok) {
      return json({ error: data.error_description ?? "Token refresh failed" }, 400);
    }

    const folderId = await store.get("folder_id");
    return json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      folderId: folderId ?? null,
    });
  } catch (err: any) {
    return json({ error: err.message ?? "Internal error" }, 500);
  }
};
