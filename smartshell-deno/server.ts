// server.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { DIContainer } from "./src/backend/di/Container.ts";
import { Router } from "./src/backend/routes/Router.ts";
import { registerServices } from "./src/backend/bootstrap/ServiceRegistration.ts";
import { ResponseFactory } from "./src/backend/factories/ResponseFactory.ts";

const PORT = Number(Deno.env.get("PORT") || 8000);

// Rate limiting для базовой защиты (дополнительный уровень)
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

console.log(`🚀 Starting server on http://localhost:${PORT}`);

try {
  // Initialize dependency injection container
  const container = new DIContainer();
  
  // Register all services
  registerServices(container);
  
  // Initialize router with container
  const router = new Router(container);
  
  serve(async (req) => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "rate_limit_exceeded" }), {
        status: 429,
        headers: new Headers({
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        }),
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

      // Handle API requests through router
      if (pathname.startsWith("/api/")) {
        return await router.handleRequest(req);
      }

      return new Response("Not found", { status: 404 });
    } catch (err: any) {
      console.error("Error:", err);
      return new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500,
        headers: new Headers({
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        }),
      });
    }
  }, { port: PORT });
} catch (err) {
  console.error("❌ Startup error:", err);
  Deno.exit(1);
}