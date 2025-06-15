import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { AgentService } from "../service";

describe("AgentService", () => {
  describe("Service Structure", () => {
    it("should have a valid .Default layer", () => {
      expect(AgentService.Default).toBeDefined();
      expect(typeof AgentService.Default).toBe("object");
      // Check that it's a proper Layer by verifying it has layer properties
      expect(AgentService.Default).toHaveProperty("pipe");
    });

    it("should be able to provide the service layer", () => {
      const testEffect = Effect.gen(function* () {
        const service = yield* AgentService;
        return "success";
      });

      expect(() =>
        testEffect.pipe(Effect.provide(AgentService.Default)),
      ).not.toThrow();
    });
  });

  it("should pass a basic non-Effect test", () => {
    console.log("Basic test running");
    expect(1 + 1).toBe(2);
  });

  it("should just log something", () =>
    Effect.gen(function* () {
      yield* Effect.log("Hello from Effect test!");
    }).pipe(Effect.runPromise));

  it("should return empty array initially", () =>
    Effect.gen(function* () {
      yield* Effect.logDebug(
        "Starting test: should return empty array initially",
      );

      yield* Effect.logDebug("Getting AgentService instance");
      const service = yield* AgentService;
      yield* Effect.logDebug("AgentService instance obtained", {
        service: typeof service,
      });

      yield* Effect.logDebug("Calling service.getAll()");
      const agents = yield* service.getAll();
      yield* Effect.logDebug("service.getAll() completed", {
        agents,
        agentsLength: agents.length,
      });

      yield* Effect.logDebug("Running assertion");
      expect(agents).toEqual([]);
      yield* Effect.logDebug("Test completed successfully");
    }).pipe(Effect.provide(AgentService.Default), Effect.runPromise));

  it("should create and retrieve an agent", () =>
    Effect.gen(function* () {
      const service = yield* AgentService;
      const agent = {
        id: "test-agent",
        initialAgentName: "Test Agent",
      };

      yield* service.create(agent);
      const retrieved = yield* service.getById("test-agent");
      expect(retrieved).toEqual(agent);
    }).pipe(Effect.provide(AgentService.Default), Effect.runPromise));

  it("should handle non-existent agent", () =>
    Effect.gen(function* () {
      const service = yield* AgentService;
      const agent = yield* service.getById("non-existent");
      expect(agent).toBeUndefined();
    }).pipe(Effect.provide(AgentService.Default), Effect.runPromise));

  it("should update an existing agent", () =>
    Effect.gen(function* () {
      const service = yield* AgentService;
      const agent = {
        id: "update-agent",
        initialAgentName: "Original Name",
      };

      yield* service.create(agent);
      yield* service.update("update-agent", {
        initialAgentName: "Updated Name",
      });

      const updated = yield* service.getById("update-agent");
      expect(updated).toEqual({
        id: "update-agent",
        initialAgentName: "Updated Name",
      });
    }).pipe(Effect.provide(AgentService.Default), Effect.runPromise));

  it("should delete an existing agent", () =>
    Effect.gen(function* () {
      const service = yield* AgentService;
      const agent = {
        id: "delete-agent",
        initialAgentName: "Delete Me",
      };

      yield* service.create(agent);
      yield* service.delete("delete-agent");

      const deleted = yield* service.getById("delete-agent");
      expect(deleted).toBeUndefined();

      const allAgents = yield* service.getAll();
      expect(allAgents).toEqual([]);
    }).pipe(Effect.provide(AgentService.Default), Effect.runPromise));

  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });
});
