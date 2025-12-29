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
      return middleware(req, () => router.handleRequest(req));
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
