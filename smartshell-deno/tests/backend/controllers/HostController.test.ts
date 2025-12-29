/**
 * Host Controller Tests
 * Tests for HostController implementation
 */

import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { HostController } from "../../../src/backend/controllers/HostController.ts";
import { DIContainer } from "../../../src/backend/di/Container.ts";
import { createContainer } from "../../../src/backend/bootstrap/ServiceRegistration.ts";
import { createMockRequest } from "../../test-config.ts";

// Helper function to create a controller with test container
function createTestController(): HostController {
  const container = createContainer();
  return new HostController(container);
}

Deno.test("HostController.getAllHosts should return all hosts", async () => {
  const controller = createTestController();
  const request = createMockRequest("GET", "/api/hosts");
  
  const response = await controller.getAllHosts(request);
  const responseData = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(responseData.success, true);
  assertEquals(Array.isArray(responseData.data), true);
});

Deno.test("HostController.getHostsByLocation should return hosts within radius", async () => {
  const controller = createTestController();
  const request = createMockRequest("GET", "/api/hosts/nearby?x=10&y=20&radius=50");
  
  const response = await controller.getHostsByLocation(request);
  const responseData = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(responseData.success, true);
  assertEquals(Array.isArray(responseData.data), true);
});

Deno.test("HostController.getHostsByLocation should return validation error for invalid parameters", async () => {
  const controller = createTestController();
  const request = createMockRequest("GET", "/api/hosts/nearby?x=invalid&y=20&radius=50");
  
  const response = await controller.getHostsByLocation(request);
  const responseData = await response.json();
  
  assertEquals(response.status, 400);
  assertEquals(responseData.success, false);
});

Deno.test("HostController.getHostStatus should return host status", async () => {
  const controller = createTestController();
  const request = createMockRequest("GET", "/api/hosts/1/status");
  
  const response = await controller.getHostStatus(request);
  const responseData = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(responseData.success, true);
  assertEquals(typeof responseData.data.online, "boolean");
  assertEquals(typeof responseData.data.inService, "boolean");
});

Deno.test("HostController.getHostStatus should return validation error for invalid host ID", async () => {
  const controller = createTestController();
  const request = createMockRequest("GET", "/api/hosts/invalid/status");
  
  const response = await controller.getHostStatus(request);
  const responseData = await response.json();
  
  assertEquals(response.status, 400);
  assertEquals(responseData.success, false);
});

Deno.test("HostController.getShortcuts should return shortcuts", async () => {
  const controller = createTestController();
  const request = createMockRequest("GET", "/api/shortcuts");
  
  const response = await controller.getShortcuts(request);
  const responseData = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(responseData.success, true);
  assertEquals(Array.isArray(responseData.data), true);
});

Deno.test("HostController.getLeaderboard should return leaderboard", async () => {
  const controller = createTestController();
  const request = createMockRequest("GET", "/api/leaderboard");
  
  const response = await controller.getLeaderboard(request);
  const responseData = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(responseData.success, true);
  assertEquals(typeof responseData.data.month, "number");
  assertEquals(typeof responseData.data.year, "number");
  assertEquals(Array.isArray(responseData.data.leaders), true);
});

Deno.test("HostController.getAchievements should return unauthorized without session", async () => {
  const controller = createTestController();
  const request = createMockRequest("GET", "/api/achievements");
  
  const response = await controller.getAchievements(request);
  const responseData = await response.json();
  
  assertEquals(response.status, 401);
  assertEquals(responseData.success, false);
});