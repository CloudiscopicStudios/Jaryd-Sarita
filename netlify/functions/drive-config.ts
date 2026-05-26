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
    const { folderId } = JSON.parse(event.body ?? "{}");
    if (!folderId) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "folderId required" }) };
    }

    const store = getStore("auth");
    await store.set("folder_id", folderId);

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message ?? "Internal error" }),
    };
  }
};
