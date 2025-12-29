/**
 * Static Controller
 * Handles serving of static files (HTML, CSS, JS, Images)
 * and on-the-fly TypeScript transpilation.
 */
import { BaseController } from './BaseController.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export class StaticController extends BaseController {
  private esbuildInitialized = false;

  constructor() {
    super();
    this.initEsbuild();
  }

  private async initEsbuild() {
    if (!this.esbuildInitialized) {
      try {
        await esbuild.initialize({
          worker: false,
        });
        this.esbuildInitialized = true;
      } catch (e) {
        // May already be initialized
        this.esbuildInitialized = true;
      }
    }
  }

  /**
   * Serve static files
   */
  async serveStatic(req: Request): Promise<Response> {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Default to index-refactored.html for root
    if (pathname === "/" || pathname === "/index.html") {
      return this.serveFile("frontend/index-refactored.html", "text/html");
    }

    // Security check: prevent directory traversal
    if (pathname.includes("..")) {
      return ResponseFactory.forbidden("Access denied");
    }

    // Determine content type and file path
    let contentType = "text/plain";
    let filePath = pathname.startsWith("/") ? pathname.substring(1) : pathname;

    // Map /src/... to correct location if needed
    // The structure is:
    // /src/frontend/... -> smartshell-deno/src/frontend/...
    // /frontend/... -> smartshell-deno/frontend/...

    // Check if file exists
    // We try multiple locations:
    // 1. Exact match
    // 2. src/frontend/... -> smartshell-deno/src/frontend/...

    // If request is for .js, we might need to look for .ts
    if (pathname.endsWith(".js")) {
      // Check if .js exists
      if (await this.fileExists(filePath)) {
        return this.serveFile(filePath, "application/javascript");
      }

      // Check if .ts exists
      const tsPath = filePath.replace(/\.js$/, ".ts");
      if (await this.fileExists(tsPath)) {
        return this.serveTranspiledTs(tsPath);
      }
    }

    // Handle .ts files requested directly (by imports in other files)
    if (pathname.endsWith(".ts")) {
       if (await this.fileExists(filePath)) {
         return this.serveTranspiledTs(filePath);
       }
    }

    // Handle other static files
    if (pathname.endsWith(".css")) contentType = "text/css";
    else if (pathname.endsWith(".html")) contentType = "text/html";
    else if (pathname.endsWith(".png")) contentType = "image/png";
    else if (pathname.endsWith(".jpg")) contentType = "image/jpeg";
    else if (pathname.endsWith(".svg")) contentType = "image/svg+xml";
    else if (pathname.endsWith(".json")) contentType = "application/json";

    if (await this.fileExists(filePath)) {
      return this.serveFile(filePath, contentType);
    }

    return ResponseFactory.notFound(`File not found: ${pathname}`);
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isFile;
    } catch {
      return false;
    }
  }

  private async serveFile(path: string, contentType: string): Promise<Response> {
    try {
      const file = await Deno.readFile(path);
      return new Response(file, {
        headers: {
          "content-type": contentType,
          "cache-control": "no-cache", // Disable cache for dev
        },
      });
    } catch (error) {
      console.error(`Error serving file ${path}:`, error);
      return ResponseFactory.serverError();
    }
  }

  private async serveTranspiledTs(path: string): Promise<Response> {
    try {
      const code = await Deno.readTextFile(path);

      // Strip CSS imports as they break in browser ESM
      // Matches: import './something.css'; or import "something.css";
      const cssImportRegex = /import\s+['"][^'"]+\.css['"];?/g;
      let cleanCode = code.replace(cssImportRegex, "/* CSS import removed */");

      // Rewrite .ts imports to .js so browser requests .js files
      // which the server will intercept and serve as transpiled TS
      cleanCode = cleanCode.replace(/(\.ts)(['"])/g, ".js$2");

      // Transpile TS to JS
      const result = await esbuild.transform(cleanCode, {
        loader: 'ts',
        format: 'esm', // We are using <script type="module">
        target: 'es2020',
      });

      return new Response(result.code, {
        headers: {
          "content-type": "application/javascript",
          "cache-control": "no-cache",
        },
      });
    } catch (error) {
      console.error(`Error transpiling ${path}:`, error);
      return ResponseFactory.serverError(`Transpilation failed: ${error.message}`);
    }
  }
}
