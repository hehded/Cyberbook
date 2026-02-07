// main.ts
import { initializeApp } from "./src/backend/bootstrap.ts";
import { Router } from "./src/backend/routes/Router.ts";
import { shell } from "./sdk.ts";

async function main() {
  try {
    console.log("Initializing SmartShell with refactored architecture...");
    
    // Initialize the application with DI container and middleware
    const { container, middleware } = initializeApp();
    
    // Create router with all routes
    const router = new Router(container);
    
    // Start the server
    const port = parseInt(Deno.env.get("PORT") || "8000");
    const hostname = Deno.env.get("HOSTNAME") || "localhost";
    
    console.log(`Starting server on http://${hostname}:${port}`);
    
    // Create request handler with middleware
    const requestHandler = async (req: Request): Promise<Response> => {
      // Apply middleware chain
      return middleware(req, async () => {
        const url = new URL(req.url);
        const pathname = url.pathname;

        // 1. Serve static files (Frontend)
        if (pathname === "/" || pathname === "/index.html") {
          try {
            // Try serving production build first
            const html = await Deno.readTextFile("./frontend/dist/index.html");
            return new Response(html, {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            });
          } catch {
            // Fallback to source (requires dev server or browser TS support)
            try {
              const html = await Deno.readTextFile("./frontend/index-refactored.html");
              return new Response(html, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
              });
            } catch {
              return new Response("Frontend not found. Run 'deno run -A build.ts' in frontend/ folder.", { status: 404 });
            }
          }
        }

        // Handle favicon
        if (pathname === "/favicon.ico") {
          return new Response(null, { status: 204 });
        }

        // Serve production assets (bundle.js, styles, assets)
        if (pathname === "/bundle.js" || pathname.startsWith("/assets/") || pathname.startsWith("/styles/")) {
          try {
            const filePath = `./frontend/dist${pathname}`;
            const file = await Deno.readFile(filePath);
            const ext = pathname.split(".").pop() || "";
            const contentType = {
              "css": "text/css",
              "js": "application/javascript",
              "png": "image/png",
              "jpg": "image/jpeg",
              "svg": "image/svg+xml"
            }[ext] || "text/plain";
            
            return new Response(file, {
              headers: { "Content-Type": contentType },
            });
          } catch {
            // Continue to next check if file not found in dist
          }
        }

        if (pathname.startsWith("/src/") || pathname.startsWith("/frontend/")) {
          try {
            let filePath = `.${pathname}`;
            let file: Uint8Array;
            
            try {
              file = await Deno.readFile(filePath);
            } catch {
              // If .js file not found, try .ts
              if (filePath.endsWith('.js')) {
                filePath = filePath.replace(/\.js$/, '.ts');
                file = await Deno.readFile(filePath);
              } else {
                throw new Error('File not found');
              }
            }

            const ext = filePath.split(".").pop() || "";
            const contentType = {
              "css": "text/css",
              "js": "application/javascript",
              "ts": "application/javascript", // Serve TS as JS for browser compatibility
              "html": "text/html",
              "json": "application/json",
              "png": "image/png",
              "jpg": "image/jpeg",
              "svg": "image/svg+xml"
            }[ext] || "text/plain";
            
            return new Response(file, {
              headers: { "Content-Type": contentType },
            });
          } catch {
            // Continue to router if file not found
          }
        }

        // Serve templates
        if (pathname.startsWith("/templates/")) {
          const templatePaths = [
            `./src/frontend${pathname}`,
            `./frontend${pathname}`,
            `./src${pathname}`
          ];

          for (const path of templatePaths) {
            try {
              const file = await Deno.readFile(path);
              return new Response(file, {
                headers: { "Content-Type": "text/html" },
              });
            } catch {
              // Continue to next path
            }
          }
        }

        // 2. Handle API requests via Router
        return router.handleRequest(req);
      });
    };
    
    // Start the HTTP server
    const server = Deno.serve(
      { hostname, port },
      requestHandler
    );
    
    console.log(`Server running at http://${hostname}:${port}`);
    console.log("Available endpoints:");
    
    // Log all available routes
    const routes = router.getRoutes();
    routes.forEach(route => {
      console.log(`  ${route.method} ${route.path}`);
    });
    
    // Run smoke tests to verify functionality
    console.log("\nRunning smoke tests...");
    await runSmokeTests();
    
    // Keep server running
    await server.finished;
  } catch (err) {
    console.error("Failed to start server:", err);
    Deno.exit(1);
  }
}

async function runSmokeTests() {
  try {
    console.log("Smoke test: SDK init...");

    try {
      const club = await shell.api.currentClub();
      console.log("Club:", club?.name ?? "-", "ID:", club?.id ?? "-");
    } catch (e: any) {
      console.warn("currentClub failed:", e?.message ?? e);
    }

    try {
      const groups = await shell.api.hostGroups();
      console.log("Host groups:", groups.length);
      for (const g of groups) console.log(" -", g.title, `(ID: ${g.id})`);
    } catch (e: any) {
      console.warn("hostGroups failed:", e?.message ?? e);
    }

    try {
      const q = `
        query {
          hosts {
            id
            alias
            online
            in_service
            ip_addr
          }
        }
      `;
      const res: any = await shell.call(q as any);
      const hosts = res?.data?.hosts ?? res?.hosts ?? [];
      console.log("Hosts:", hosts.length);
    } catch (e: any) {
      console.warn("hosts call failed:", e?.message ?? e);
    }

    console.log("Smoke test finished.");
  } catch (err) {
    console.error("Smoke test error:", err);
  }
}

if (import.meta.main) await main();
