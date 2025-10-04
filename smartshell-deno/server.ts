// server.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleApiRequest } from "./backend/api.ts";

const PORT = Number(Deno.env.get("PORT") || 8000);

// Rate limiting
const rateMap = new Map<string, { tsWindow: number; count: number }>();

function checkRateLimit(ip: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.tsWindow > windowMs) {
    rateMap.set(ip, { tsWindow: now, count: 1 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function cors(h = new Headers()) {
  const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
  h.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return h;
}

console.log(`🚀 Starting server on http://localhost:${PORT}`);

try {
  serve(async (req) => {
    const ip = req.headers.get("x-forwarded-for") || req.conn?.remoteAddr?.hostname || "unknown";
    
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "rate_limit_exceeded" }), {
        status: 429,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    try {
      // Serve frontend
      if (pathname === "/") {
        const html = await Deno.readTextFile("./frontend/index.html");
        return new Response(html, {
          status: 200,
          headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
        });
      }

      // Handle API requests
      if (pathname.startsWith("/api/")) {
        return await handleApiRequest(req);
      }

      return new Response("Not found", { status: 404 });
    } catch (err: any) {
      console.error("Error:", err);
      return new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500,
        headers: cors(new Headers({ "Content-Type": "application/json" })),
      });
    }
  }, { port: PORT });
} catch (err) {
  console.error("❌ Startup error:", err);
  Deno.exit(1);
}