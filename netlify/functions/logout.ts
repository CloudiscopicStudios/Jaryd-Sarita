import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: new Headers({ ...CORS, "Content-Type": "application/json" }),
  });

export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: new Headers(CORS) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const store = getStore("auth");
    await Promise.all([store.delete("refresh_token"), store.delete("folder_id")]);
    return json({ ok: true });
  } catch (err: any) {
    return json({ error: err.message ?? "Internal error" }, 500);
  }
};
