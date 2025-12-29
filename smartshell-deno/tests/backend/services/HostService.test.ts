/**
 * Host Service Tests
 * Tests for the HostService implementation
 */

import { assertEquals, assertThrows } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { HostService } from "../../../src/backend/services/HostService.ts";
import { HostRepository } from "../../../src/backend/repositories/HostRepository.ts";
import { BookingRepository } from "../../../src/backend/repositories/BookingRepository.ts";
import { Host } from "../../../src/backend/domain/entities/Host.ts";

// Test data factory
const TestDataFactory = {
  createHost: (overrides = {}) => ({
    id: 1,
    alias: "test-host",
    ip_addr: "192.168.1.100",
    coord_x: 0,
    coord_y: 0,
    group: { id: "test-group", title: "Test Group" },
    session: null,
    ...overrides
  })
};

Deno.test("HostService.getAllHosts should return all hosts", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const hosts = await hostService.getAllHosts();
  
  assertEquals(hosts.length > 0, true);
});

Deno.test("HostService.getHostById should return a specific host", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const host = await hostService.getHostById(1);
  
  assertEquals(host?.id, 1);
});

Deno.test("HostService.getHostById should return null for non-existent host", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const host = await hostService.getHostById(999);
  
  assertEquals(host, null);
});

Deno.test("HostService.getHostStatus should return correct status for host", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const status = await hostService.getHostStatus(1);
  
  assertEquals(typeof status.online, "boolean");
  assertEquals(typeof status.inService, "boolean");
});

Deno.test("HostService.getHostsByLocation should return hosts within radius", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const hosts = await hostService.getHostsByLocation(10, 20, 50);
  
  assertEquals(Array.isArray(hosts), true);
});

Deno.test("HostService.getAvailableHosts should return hosts not in service", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const hosts = await hostService.getAvailableHosts();
  
  assertEquals(Array.isArray(hosts), true);
});

Deno.test("HostService.getHostsByGroup should return hosts in group", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const hosts = await hostService.getHostsByGroup("group1");
  
  assertEquals(Array.isArray(hosts), true);
});

Deno.test("HostService.createHost should create a new host", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const hostData = TestDataFactory.createHost({ alias: "new-host" });
  const newHost = await hostService.createHost(hostData);
  
  assertEquals(newHost.alias, "new-host");
  assertEquals(typeof newHost.id, "number");
});

Deno.test("HostService.updateHost should update an existing host", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const updatedHost = await hostService.updateHost(1, { alias: "updated-host" });
  
  assertEquals(updatedHost.alias, "updated-host");
  assertEquals(updatedHost.id, 1);
});

Deno.test("HostService.updateHostSession should update host session", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  const sessionInfo = { 
    user: "test-user", 
    started_at: "2023-01-01T10:00:00Z",
    duration: 3600,
    elapsed: 1800,
    time_left: 1800
  };
  const updatedHost = await hostService.updateHostSession(1, sessionInfo);
  
  assertEquals(updatedHost.session?.user, "test-user");
  assertEquals(updatedHost.session?.started_at, "2023-01-01T10:00:00Z");
});

Deno.test("HostService.deleteHost should delete a host without active bookings", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  // Create a new host without active bookings
  const hostData = TestDataFactory.createHost({ alias: "temp-host" });
  const newHost = await hostService.createHost(hostData);
  
  // Delete the newly created host
  const deleted = await hostService.deleteHost(newHost.id as number);
  
  assertEquals(deleted, true);
});

Deno.test("HostService.getHostStatus should throw error for invalid host ID", async () => {
  const hostRepository = new HostRepository();
  const bookingRepository = new BookingRepository();
  const hostService = new HostService(hostRepository, bookingRepository);
  
  assertThrows(
    () => hostService.getHostStatus(0),
    Error,
    "Host ID is required"
  );
});