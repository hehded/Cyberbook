/**
 * Development server for frontend
 * Serves the refactored frontend with hot reload
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const PORT = 8000;
const HOST = "localhost";

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Serve main HTML file
  if (pathname === "/" || pathname === "") {
    const html = await Deno.readTextFile("./index-refactored.html");
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Serve static files from src directory
  if (pathname.startsWith("/src/")) {
    try {
      const filePath = pathname.substring(1); // Remove /src/ prefix
      const fileContent = await Deno.readFile(`.${filePath}`);
      
      // Determine content type
      let contentType = "text/plain";
      if (filePath.endsWith(".css")) {
        contentType = "text/css";
      } else if (filePath.endsWith(".js")) {
        contentType = "application/javascript";
      } else if (filePath.endsWith(".ts")) {
        contentType = "application/typescript";
      } else if (filePath.endsWith(".html")) {
        contentType = "text/html";
      }
      
      return new Response(fileContent, {
        headers: { "Content-Type": contentType },
      });
    } catch (error) {
      return new Response("File not found", { status: 404 });
    }
  }

  // API proxy for development
  if (pathname.startsWith("/api/")) {
    try {
      // Proxy to backend API
      const apiUrl = `http://localhost:8001${pathname}`;
      const response = await fetch(apiUrl);
      const data = await response.text();
      
      return new Response(data, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("content-type") || "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 404 for other routes
  return new Response("Not Found", { status: 404 });
}

console.log(`Starting development server on http://${HOST}:${PORT}`);
await serve(handler, { hostname: HOST, port: PORT });