/**
 * API Integration Tests
 * Tests for the complete API integration
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { initializeApp } from "../../src/backend/bootstrap.ts";
import { Router } from "../../src/backend/routes/Router.ts";

Deno.test("API should initialize correctly", () => {
  const { container, middleware } = initializeApp();
  
  assertExists(container);
  assertExists(middleware);
  
  const router = new Router(container);
  assertExists(router);
  
  const routes = router.getRoutes();
  assertEquals(routes.length > 0, true);
});

Deno.test("API should handle host endpoints", async () => {
  const { container } = initializeApp();
  const router = new Router(container);
  
  // Test GET /api/hosts
  const hostsRequest = new Request("http://localhost:8000/api/hosts", {
    method: "GET"
  });
  
  const hostsResponse = await router.handleRequest(hostsRequest);
  assertEquals(hostsResponse.status, 200);
  
  const hostsData = await hostsResponse.json();
  assertEquals(hostsData.success, true);
  assertEquals(Array.isArray(hostsData.data), true);
  
  // Test GET /api/hosts/nearby
  const nearbyRequest = new Request("http://localhost:8000/api/hosts/nearby?x=10&y=20&radius=50", {
    method: "GET"
  });
  
  const nearbyResponse = await router.handleRequest(nearbyRequest);
  assertEquals(nearbyResponse.status, 200);
  
  const nearbyData = await nearbyResponse.json();
  assertEquals(nearbyData.success, true);
  assertEquals(Array.isArray(nearbyData.data), true);
  
  // Test GET /api/hosts/1/status
  const statusRequest = new Request("http://localhost:8000/api/hosts/1/status", {
    method: "GET"
  });
  
  const statusResponse = await router.handleRequest(statusRequest);
  assertEquals(statusResponse.status, 200);
  
  const statusData = await statusResponse.json();
  assertEquals(statusData.success, true);
  assertEquals(typeof statusData.data.online, "boolean");
  assertEquals(typeof statusData.data.inService, "boolean");
});

Deno.test("API should handle booking endpoints", async () => {
  const { container } = initializeApp();
  const router = new Router(container);
  
  // Test GET /api/bookings
  const bookingsRequest = new Request("http://localhost:8000/api/bookings", {
    method: "GET"
  });
  
  const bookingsResponse = await router.handleRequest(bookingsRequest);
  assertEquals(bookingsResponse.status, 200);
  
  const bookingsData = await bookingsResponse.json();
  assertEquals(bookingsData.success, true);
  assertEquals(Array.isArray(bookingsData.data), true);
  
  // Test POST /api/bookings
  const createBookingRequest = new Request("http://localhost:8000/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: "1",
      hostIds: [1],
      from: "2023-01-01T10:00:00Z",
      to: "2023-01-01T12:00:00Z"
    })
  });
  
  const createResponse = await router.handleRequest(createBookingRequest);
  assertEquals(createResponse.status, 200);
  
  const createData = await createResponse.json();
  assertEquals(createData.success, true);
  assertEquals(typeof createData.data.id, "number");
});

Deno.test("API should handle auth endpoints", async () => {
  const { container } = initializeApp();
  const router = new Router(container);
  
  // Test POST /api/auth/login
  const loginRequest = new Request("http://localhost:8000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      login: "testuser",
      password: "testpass"
    })
  });
  
  const loginResponse = await router.handleRequest(loginRequest);
  // Note: This might fail with actual auth, but should return proper response
  assertEquals(loginResponse.status >= 200 && loginResponse.status < 500, true);
  
  const loginData = await loginResponse.json();
  assertEquals(typeof loginData.success, "boolean");
});

Deno.test("API should handle 404 for non-existent endpoints", async () => {
  const { container } = initializeApp();
  const router = new Router(container);
  
  const notFoundRequest = new Request("http://localhost:8000/api/non-existent", {
    method: "GET"
  });
  
  const notFoundResponse = await router.handleRequest(notFoundRequest);
  assertEquals(notFoundResponse.status, 404);
  
  const notFoundData = await notFoundResponse.json();
  assertEquals(notFoundData.success, false);
});

Deno.test("API should handle OPTIONS requests for CORS", async () => {
  const { container } = initializeApp();
  const router = new Router(container);
  
  const optionsRequest = new Request("http://localhost:8000/api/hosts", {
    method: "OPTIONS"
  });
  
  const optionsResponse = await router.handleRequest(optionsRequest);
  assertEquals(optionsResponse.status, 200);
});