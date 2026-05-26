import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    const store = getStore("auth");
    const refreshToken = await store.get("refresh_token");

    if (!refreshToken) {
      return {
        statusCode: 401,
        headers: CORS,
        body: JSON.stringify({ error: "Drive not configured yet" }),
      };
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
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: data.error_description ?? "Token refresh failed" }),
      };
    }

    const folderId = await store.get("folder_id");
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        access_token: data.access_token,
        expires_in: data.expires_in,
        folderId: folderId ?? null,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message ?? "Internal error" }),
    };
  }
};
