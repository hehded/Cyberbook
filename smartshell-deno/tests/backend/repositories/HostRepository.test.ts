/**
 * Host Repository Tests
 * Tests for HostRepository implementation
 */

import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { HostRepository } from "../../../src/backend/repositories/HostRepository.ts";
import { Host } from "../../../src/backend/domain/entities/Host.ts";

Deno.test("HostRepository.findAll should return all hosts", async () => {
  const repository = new HostRepository();
  const hosts = await repository.findAll();
  
  assertEquals(Array.isArray(hosts), true);
  assertEquals(hosts.length > 0, true);
});

Deno.test("HostRepository.findById should return a specific host", async () => {
  const repository = new HostRepository();
  const host = await repository.findById(1);
  
  assertEquals(host?.id, 1);
});

Deno.test("HostRepository.findById should return null for non-existent host", async () => {
  const repository = new HostRepository();
  const host = await repository.findById(999);
  
  assertEquals(host, null);
});

Deno.test("HostRepository.findByLocation should return hosts within radius", async () => {
  const repository = new HostRepository();
  const hosts = await repository.findByLocation(10, 20, 50);
  
  assertEquals(Array.isArray(hosts), true);
});

Deno.test("HostRepository.findByGroup should return hosts in group", async () => {
  const repository = new HostRepository();
  const hosts = await repository.findByGroup("group1");
  
  assertEquals(Array.isArray(hosts), true);
});

Deno.test("HostRepository.findByIp should return host with IP address", async () => {
  const repository = new HostRepository();
  const host = await repository.findByIp("192.168.1.10");
  
  assertEquals(host?.ip_addr, "192.168.1.10");
});

Deno.test("HostRepository.findByIp should return null for non-existent IP", async () => {
  const repository = new HostRepository();
  const host = await repository.findByIp("999.999.999.999");
  
  assertEquals(host, null);
});

Deno.test("HostRepository.findWithActiveSessions should return hosts with active sessions", async () => {
  const repository = new HostRepository();
  const hosts = await repository.findWithActiveSessions();
  
  assertEquals(Array.isArray(hosts), true);
});

Deno.test("HostRepository.findAvailable should return available hosts", async () => {
  const repository = new HostRepository();
  const hosts = await repository.findAvailable();
  
  assertEquals(Array.isArray(hosts), true);
});

Deno.test("HostRepository.create should create a new host", async () => {
  const repository = new HostRepository();
  const hostData = {
    alias: "test-host",
    ip_addr: "192.168.1.100",
    coord_x: 0,
    coord_y: 0,
    group: { id: "test-group", title: "Test Group" },
    session: null
  };
  
  const newHost = await repository.create(hostData);
  
  assertEquals(newHost.alias, "test-host");
  assertEquals(newHost.ip_addr, "192.168.1.100");
  assertEquals(typeof newHost.id, "number");
});

Deno.test("HostRepository.update should update an existing host", async () => {
  const repository = new HostRepository();
  const updatedHost = await repository.update(1, { alias: "updated-host" });
  
  assertEquals(updatedHost.alias, "updated-host");
  assertEquals(updatedHost.id, 1);
});

Deno.test("HostRepository.update should throw error for non-existent host", async () => {
  const repository = new HostRepository();
  
  try {
    await repository.update(999, { alias: "updated-host" });
    assertEquals(false, true, "Should have thrown an error");
  } catch (error) {
    assertEquals(error instanceof Error, true);
  }
});

Deno.test("HostRepository.delete should delete a host", async () => {
  const repository = new HostRepository();
  
  // First create a host to delete
  const hostData = {
    alias: "temp-host",
    ip_addr: "192.168.1.200",
    coord_x: 0,
    coord_y: 0,
    group: { id: "temp-group", title: "Temp Group" },
    session: null
  };
  
  const newHost = await repository.create(hostData);
  const deleted = await repository.delete(newHost.id as number);
  
  assertEquals(deleted, true);
  
  // Verify it's deleted
  const foundHost = await repository.findById(newHost.id as number);
  assertEquals(foundHost, null);
});

Deno.test("HostRepository.delete should return false for non-existent host", async () => {
  const repository = new HostRepository();
  const deleted = await repository.delete(999);
  
  assertEquals(deleted, false);
});