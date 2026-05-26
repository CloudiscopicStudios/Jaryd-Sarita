import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { code } = JSON.parse(event.body ?? "{}");
    if (!code) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "code required" }) };
    }

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
    if (!r.ok) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: data.error_description ?? "Token exchange failed" }),
      };
    }

    const store = getStore("auth");
    if (data.refresh_token) {
      await store.set("refresh_token", data.refresh_token as string);
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
