import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// Admin calls this once after signing in — exchanges the auth code for tokens
// and persists the refresh token in Netlify Blobs.
export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { code } = await req.json();
  if (!code) return json({ error: "code required" }, 400);

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: "postmessage",
      grant_type: "authorization_code",
    }),
  });

  const data = (await r.json()) as Record<string, unknown>;
  if (!r.ok) return json({ error: data.error_description ?? "Token exchange failed" }, 400);

  const store = getStore("auth");
  if (data.refresh_token) {
    await store.set("refresh_token", data.refresh_token as string);
  }

  const folderId = await store.get("folder_id");
  return json({ access_token: data.access_token, expires_in: data.expires_in, folderId: folderId ?? null });
};
