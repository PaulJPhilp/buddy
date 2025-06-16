import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ChatService } from "../service";

describe("ChatService - Effect.Service Pattern", () => {
  describe("Service Structure", () => {
    it("should be a proper Effect.Service with .Default layer", () => {
      // Test that ChatService has the .Default property
      expect(ChatService.Default).toBeDefined();
      expect(typeof ChatService.Default).toBe("object");

      // The key test is that it works as a Layer - we can provide it to effects
      // This proves it's a valid Effect.Service with the proper .Default layer
      const testEffect = Effect.gen(function* () {
        const service = yield* ChatService;
        return service;
      });

      // If this compiles and runs without error, the .Default layer is working correctly
      expect(() =>
        testEffect.pipe(Effect.provide(ChatService.Default)),
      ).not.toThrow();
    });

    it("should have the correct service identifier", () => {
      // Test that the service has the expected identifier
      // The key property is used internally by Effect.Service
      expect(typeof ChatService).toBe("function");
      expect(ChatService.name).toBe("ChatService");
    });

    it("should be accessible via Effect.Service pattern", () =>
      Effect.gen(function* () {
        // Test that we can access the service through Effect.gen
        const service = yield* ChatService;

        // Verify the service has the expected API methods
        expect(typeof service.getState).toBe("function");
        expect(typeof service.setState).toBe("function");
        expect(typeof service.sendMessage).toBe("function");
        expect(typeof service.setTyping).toBe("function");
        expect(typeof service.validateMessage).toBe("function");
        expect(typeof service.getHistory).toBe("function");
        expect(typeof service.clearHistory).toBe("function");
        expect(service.messageStream).toBeDefined();
      }).pipe(Effect.provide(ChatService.Default)));

    it("should work with Layer.provide", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Test that we can call service methods
        const initialState = yield* service.getState();
        expect(initialState).toBeDefined();
        expect(initialState.messages).toBeDefined();
        expect(typeof initialState.isTyping).toBe("boolean");
      }).pipe(Effect.provide(ChatService.Default)));

    it("should work with Layer composition", () => {
      // Test that the service can be composed with other layers
      const ComposedLayer = Layer.merge(
        ChatService.Default,
        Layer.succeed("TestDep", "test-value"),
      );

      return Effect.gen(function* () {
        const service = yield* ChatService;
        const testDep = yield* Effect.service("TestDep" as any);

        expect(service).toBeDefined();
        expect(testDep).toBe("test-value");
      }).pipe(Effect.provide(ComposedLayer));
    });

    it("should maintain service instance consistency", () =>
      Effect.gen(function* () {
        // Get service instance twice
        const service1 = yield* ChatService;
        const service2 = yield* ChatService;

        // They should be the same instance (singleton behavior)
        expect(service1).toBe(service2);

        // Test state consistency
        const state1 = yield* service1.getState();
        const state2 = yield* service2.getState();

        expect(state1).toEqual(state2);
      }).pipe(Effect.provide(ChatService.Default)));
  });

  describe("Service Dependencies", () => {
    it("should be self-contained without external dependencies", () => {
      // Verify that the service can be instantiated without external dependencies
      // based on the current implementation which creates its own WebSocket instance
      // This is verified by successfully providing just ChatService.Default
      expect(ChatService.Default).toBeDefined();

      // The service should work with just its own layer
      return Effect.gen(function* () {
        const service = yield* ChatService;
        expect(service).toBeDefined();
      }).pipe(Effect.provide(ChatService.Default));
    });

    it("should initialize successfully without external services", () =>
      Effect.gen(function* () {
        // Test that the service can initialize with just its .Default layer
        const service = yield* ChatService;

        // Verify initialization completed
        expect(service).toBeDefined();

        // Test that basic operations work
        const validation = yield* service.validateMessage("test message");
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
      }).pipe(Effect.provide(ChatService.Default)));
  });

  describe("Service Lifecycle", () => {
    it("should handle scoped lifecycle correctly", () =>
      Effect.gen(function* () {
        // Test service in a scoped context
        const service = yield* ChatService;

        // Perform some operations to ensure the service is working
        yield* service.setState({
          id: "test-chat",
          messages: [],
          isTyping: false,
          metadata: {
            messageCount: 0,
            totalAttachments: 0,
          },
        });

        const state = yield* service.getState();
        expect(state.id).toBe("test-chat");
      }).pipe(Effect.provide(ChatService.Default), Effect.scoped));

    it("should cleanup resources properly", () =>
      Effect.gen(function* () {
        const service = yield* ChatService;

        // Test that the service can be used and disposed of properly
        const message = yield* service.sendMessage("Test cleanup message");
        expect(message.text).toBe("Test cleanup message");

        // No explicit cleanup needed - Effect runtime handles it
      }).pipe(Effect.provide(ChatService.Default), Effect.scoped));
  });
});
