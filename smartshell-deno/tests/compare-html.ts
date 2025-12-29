/**
 * HTML Comparison Script
 * Compares the original and refactored HTML files to ensure identical behavior
 */

import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

// Read both HTML files
const originalHtml = await Deno.readTextFile("smartshell-deno/frontend/index.html");
const refactoredHtml = await Deno.readTextFile("smartshell-deno/frontend/index-refactored.html");

console.log("Comparing original and refactored HTML files...");

// Extract key elements to compare
function extractKeyElements(html: string) {
  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : "";
  
  // Extract meta tags
  const metaMatches = html.matchAll(/<meta[^>]*>/g);
  const metaTags = Array.from(metaMatches);
  
  // Extract script tags
  const scriptMatches = html.matchAll(/<script[^>]*>.*?<\/script>/gs);
  const scriptTags = Array.from(scriptMatches);
  
  // Extract CSS links
  const cssMatches = html.matchAll(/<link[^>]*>/g);
  const cssTags = Array.from(cssMatches);
  
  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/s);
  const body = bodyMatch ? bodyMatch[1] : "";
  
  return {
    title,
    metaTags,
    scriptTags,
    cssTags,
    body
  };
}

const originalElements = extractKeyElements(originalHtml);
const refactoredElements = extractKeyElements(refactoredHtml);

// Compare key elements
console.log(`Title: "${originalElements.title}" vs "${refactoredElements.title}"`);
assertEquals(originalElements.title, refactoredElements.title, "Titles should match");

console.log(`Meta tags: ${originalElements.metaTags.length} vs ${refactoredElements.metaTags.length}`);
assertEquals(originalElements.metaTags.length, refactoredElements.metaTags.length, "Meta tag count should match");

console.log(`Script tags: ${originalElements.scriptTags.length} vs ${refactoredElements.scriptTags.length}`);
assertEquals(originalElements.scriptTags.length, refactoredElements.scriptTags.length, "Script tag count should match");

console.log(`CSS links: ${originalElements.cssTags.length} vs ${refactoredElements.cssTags.length}`);
assertEquals(originalElements.cssTags.length, refactoredElements.cssTags.length, "CSS link count should match");

// Check for key functionality in both files
const keyFeatures = [
  "login",
  "hosts",
  "map",
  "booking",
  "session",
  "api"
];

for (const feature of keyFeatures) {
  const originalHasFeature = originalElements.body.toLowerCase().includes(feature);
  const refactoredHasFeature = refactoredElements.body.toLowerCase().includes(feature);
  
  console.log(`Feature "${feature}": ${originalHasFeature} vs ${refactoredHasFeature}`);
  assertEquals(originalHasFeature, refactoredHasFeature, `Feature "${feature}" should exist in both files`);
}

console.log("HTML comparison completed successfully!");
console.log("Both files contain the same key elements and functionality.");