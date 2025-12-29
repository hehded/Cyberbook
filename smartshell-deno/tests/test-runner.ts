/**
 * Test Runner
 * Executes all tests in the test suite
 */

console.log("Running SmartShell Test Suite");
console.log("=============================");

// Import all test files
console.log("Loading backend service tests...");
await import("./backend/services/HostService.test.ts");
await import("./backend/services/BookingService.test.ts");

console.log("Loading backend controller tests...");
await import("./backend/controllers/HostController.test.ts");

console.log("Loading backend repository tests...");
await import("./backend/repositories/HostRepository.test.ts");

console.log("Loading frontend component tests...");
await import("./frontend/components/LoginComponent.test.ts");

console.log("Loading integration tests...");
await import("./integration/api.test.ts");

console.log("=============================");
console.log("All tests loaded successfully!");
console.log("Run with: deno test --allow-read --allow-net tests/");