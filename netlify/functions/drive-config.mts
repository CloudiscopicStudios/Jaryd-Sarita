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

// Admin calls this after creating the Drive folder to persist the folder ID.
export default async (req: Request, _ctx: Context) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { folderId } = await req.json();
  if (!folderId) return json({ error: "folderId required" }, 400);

  const store = getStore("auth");
  await store.set("folder_id", folderId);
  return json({ ok: true });
};
