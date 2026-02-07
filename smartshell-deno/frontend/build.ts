/**
 * Build script for frontend modules
 * Compiles TypeScript and bundles the frontend
 */

import * as esbuild from "https://deno.land/x/esbuild@v0.19.11/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";

/**
 * Main build function
 */
async function build(): Promise<void> {
  console.log("Building frontend...");
  
  try {
    // Create dist directories
    try {
      await Deno.mkdir("./dist", { recursive: true });
      await Deno.mkdir("./dist/styles", { recursive: true });
    } catch {}
    
    // 1. Bundle TypeScript
    await esbuild.build({
      plugins: [...denoPlugins()],
      entryPoints: ["../src/frontend/index.ts"],
      outfile: "./dist/bundle.js",
      bundle: true,
      format: "esm",
      minify: true,
      sourcemap: true,
    });

    // 2. Process HTML
    let html = await Deno.readTextFile("./index-refactored.html");
    html = html.replace(/src=".*\/src\/frontend\/index\.(ts|js)"/g, 'src="/bundle.js"');
    html = html.replace(/href=".*\/src\/frontend\/styles\/main\.css"/g, 'href="/styles/main.css"');
    await Deno.writeTextFile("./dist/index.html", html);

    // 3. Copy CSS
    try {
      await Deno.copyFile("../src/frontend/styles/main.css", "./dist/styles/main.css");
    } catch (e) {
      console.warn("⚠️ CSS file not found or copy failed:", e);
    }
    
    console.log("✅ Build complete! Files are in frontend/dist/");
    console.log("👉 Now restart main.ts to serve the production build.");
  } catch (error) {
    console.error("❌ Build failed:", error);
    Deno.exit(1);
  } finally {
    esbuild.stop();
  }
}

// Run build if this script is executed directly
if (import.meta.main) {
  build();
}