import type { Server } from "node:http";
import { createServer } from "node:http";
import {
  NodeContext,
  NodeFileSystem,
  NodeHttpClient,
} from "@effect/platform-node";
import { Effect, Layer } from "effect";
import type { Express } from "express";
import express from "express";
import { WebSocketServer } from "ws";
import { UrlService } from "../url";

// Centralized Test Infrastructure
let httpServer: Server;
let wsServer: WebSocketServer;
let testUrl: string;

export const TestHttpServer = Layer.effect(
  Layer.succeed(express.application),
  Effect.sync(() => {
    const app = express();
    app.get("/api/urls/index.json", (req, res) => {
      res.json([{ id: "test-app" }]);
    });
    app.get("/api/urls/:id.json", (req, res) => {
      res.json({ id: req.params.id });
    });
    return app;
  })
).pipe(
  Layer.flatMap((app) =>
    Layer.scoped(
      Effect.succeed(httpServer),
      Effect.acquireRelease(
        Effect.sync(() => {
          const server = createServer(app.get(express.application));
          wsServer = new WebSocketServer({ server });
          return server;
        }),
        (server) => Effect.sync(() => server.close())
      )
    )
  ),
  Layer.flatMap((server) =>
    Layer.scoped(
      Effect.succeed(testUrl),
      Effect.acquireRelease(
        Effect.promise(
          () =>
            new Promise<string>((resolve) => {
              server.get(httpServer).listen(0, () => {
                const port = (server.get(httpServer).address() as any).port;
                resolve(`http://localhost:${port}`);
              });
            })
        ),
        () => Effect.void
      )
    )
  )
);

// Unified Test Layer
export const ServiceTestLayer = Layer.mergeAll(
  NodeContext.layer,
  NodeFileSystem.layer,
  NodeHttpClient.layer,
  TestHttpServer.pipe(
    Layer.flatMap((url) =>
      Layer.succeed(
        UrlService,
        UrlService.of({
          getBaseUrl: Effect.succeed(url.get(testUrl)),
          buildApiUrl: (path) => Effect.succeed(`${url.get(testUrl)}${path}`),
          buildChatUrl: (chatId) =>
            Effect.succeed(`${url.get(testUrl)}/c/${chatId}`),
        })
      )
    )
  )
);
