/**
 * Static Controller
 * Handles serving of static files (HTML, CSS, JS, Images)
 * and on-the-fly TypeScript transpilation.
 */
import { BaseController } from './BaseController.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';
// Use WASM version of esbuild for Deno Deploy (read-only environment)
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/wasm.js";
import { join, dirname, fromFileUrl, walk } from "https://deno.land/std@0.208.0/path/mod.ts";
import { walk as fsWalk } from "https://deno.land/std@0.208.0/fs/walk.ts";

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export class StaticController extends BaseController {
  private esbuildInitialized = false;
  private rootDir: string;

  constructor() {
    super();
    this.initEsbuild();
    // Calculate root directory relative to this file
    // This file is in src/backend/controllers/StaticController.ts
    // Root is ../../../
    const currentDir = dirname(fromFileUrl(import.meta.url));
    this.rootDir = join(currentDir, "..", "..", "..");
    console.log(`[StaticController] Initialized. Root dir resolved to: ${this.rootDir}`);
  }

  private async initEsbuild() {
    if (!this.esbuildInitialized) {
      try {
        // Initialize WASM esbuild
        // We don't need to specify wasmURL if we trust the module defaults,
        // but explicit worker: false is good for Deno Deploy.
        await esbuild.initialize({
          worker: false,
        });
        this.esbuildInitialized = true;
        console.log("[StaticController] Esbuild (WASM) initialized");
      } catch (e) {
        // May already be initialized
        console.log("[StaticController] Esbuild initialization skipped/failed", e);
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

    console.log(`[StaticController] Serving request for: ${pathname}`);

    // Debug endpoint to list files
    if (pathname === "/api/debug/fs") {
      return this.listFileSystem();
    }

    // Default to index-refactored.html for root
    if (pathname === "/" || pathname === "/index.html") {
      console.log(`[StaticController] Serving index-refactored.html for path ${pathname}`);
      return this.serveFile("src/frontend/index-refactored.html", "text/html");
    }

    // Security check: prevent directory traversal
    if (pathname.includes("..")) {
      console.warn(`[StaticController] Blocked directory traversal: ${pathname}`);
      return ResponseFactory.forbidden("Access denied");
    }

    // Determine content type and file path
    let contentType = "text/plain";
    // Remove leading slash to join correctly
    let relativePath = pathname.startsWith("/") ? pathname.substring(1) : pathname;

    // If request is for .js, we might need to look for .ts
    if (pathname.endsWith(".js")) {
      // Check if .js exists
      if (await this.fileExists(relativePath)) {
        return this.serveFile(relativePath, "application/javascript");
      }

      // Check if .ts exists
      const tsPath = relativePath.replace(/\.js$/, ".ts");
      if (await this.fileExists(tsPath)) {
        return this.serveTranspiledTs(tsPath);
      }
    }

    // Handle .ts files requested directly (by imports in other files)
    if (pathname.endsWith(".ts")) {
       if (await this.fileExists(relativePath)) {
         return this.serveTranspiledTs(relativePath);
       }
    }

    // Handle other static files
    if (pathname.endsWith(".css")) contentType = "text/css";
    else if (pathname.endsWith(".html")) contentType = "text/html";
    else if (pathname.endsWith(".png")) contentType = "image/png";
    else if (pathname.endsWith(".jpg")) contentType = "image/jpeg";
    else if (pathname.endsWith(".svg")) contentType = "image/svg+xml";
    else if (pathname.endsWith(".json")) contentType = "application/json";
    else if (pathname.endsWith(".ico")) contentType = "image/x-icon";

    if (await this.fileExists(relativePath)) {
      return this.serveFile(relativePath, contentType);
    }

    console.warn(`[StaticController] File not found: ${relativePath} (Root: ${this.rootDir})`);
    return ResponseFactory.notFound(`File not found: ${pathname}`);
  }

  private resolvePath(relativePath: string): string {
    return join(this.rootDir, relativePath);
  }

  private async fileExists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(relativePath);
      const stat = await Deno.stat(fullPath);
      return stat.isFile;
    } catch {
      return false;
    }
  }

  private async serveFile(relativePath: string, contentType: string): Promise<Response> {
    try {
      const fullPath = this.resolvePath(relativePath);
      console.log(`[StaticController] Serving file: ${fullPath} as ${contentType}`);
      const file = await Deno.readFile(fullPath);
      return new Response(file, {
        headers: {
          "content-type": contentType,
          "cache-control": "no-cache", // Disable cache for dev
        },
      });
    } catch (error) {
      console.error(`[StaticController] Error serving file ${relativePath} at ${this.resolvePath(relativePath)}:`, error);
      return ResponseFactory.serverError();
    }
  }

  private async serveTranspiledTs(relativePath: string): Promise<Response> {
    try {
      const fullPath = this.resolvePath(relativePath);
      console.log(`[StaticController] Transpiling: ${fullPath}`);
      const code = await Deno.readTextFile(fullPath);

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
      console.error(`[StaticController] Error transpiling ${relativePath}:`, error);
      return ResponseFactory.serverError(`Transpilation failed: ${error.message}`);
    }
  }

  private async listFileSystem(): Promise<Response> {
    const files = [];
    try {
      for await (const entry of fsWalk(this.rootDir, { maxDepth: 5 })) {
        files.push(entry.path.replace(this.rootDir, ""));
      }
      return ResponseFactory.success({ root: this.rootDir, files });
    } catch (error) {
      return ResponseFactory.error(`Failed to walk fs: ${error.message}`);
    }
  }
}
