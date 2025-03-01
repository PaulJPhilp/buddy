import { Context, Effect } from "effect";

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
}

/**
 * Logger service
 */
export class LoggerService extends Context.Tag("LoggerService")<
  LoggerService,
  Logger
>() {}

/**
 * Console logger implementation
 */
class ConsoleLogger implements Logger {
  private formatMeta(meta?: Record<string, unknown>): string {
    if (!meta) return "";
    try {
      return JSON.stringify(meta, null, 2);
    } catch (e) {
      return String(meta);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${message}`, meta ? this.formatMeta(meta) : "");
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(`[INFO] ${message}`, meta ? this.formatMeta(meta) : "");
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta ? this.formatMeta(meta) : "");
  }

  error(
    message: string,
    error?: unknown,
    meta?: Record<string, unknown>,
  ): void {
    console.error(
      `[ERROR] ${message}`,
      error instanceof Error ? error.stack : error,
      meta ? this.formatMeta(meta) : "",
    );
  }
}

/**
 * Default console logger implementation
 */
export const ConsoleLoggerLive = LoggerService.of(new ConsoleLogger());

/**
 * Log utility functions
 */
export const log = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.debug(message, meta);
    }),

  info: (message: string, meta?: Record<string, unknown>) =>
    Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.info(message, meta);
    }),

  warn: (message: string, meta?: Record<string, unknown>) =>
    Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.warn(message, meta);
    }),

  error: (message: string, error?: unknown, meta?: Record<string, unknown>) =>
    Effect.gen(function* () {
      const logger = yield* LoggerService;
      logger.error(message, error, meta);
    }),
};

/**
 * Tap effect to log information at different stages of execution
 */
export const logEffect = {
  /**
   * Log before effect execution
   */
  before: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    message: string,
    meta?: Record<string, unknown>,
  ): Effect.Effect<A, E, LoggerService | R> =>
    Effect.flatMap(log.info(message, meta), () => effect),

  /**
   * Log after successful effect execution
   */
  after: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    message: string,
    includingResult = false,
  ): Effect.Effect<A, E, LoggerService | R> =>
    Effect.tap(effect, (result) =>
      log.info(message, includingResult ? { result } : undefined),
    ),

  /**
   * Log when effect fails
   */
  onError: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    message: string,
  ): Effect.Effect<A, E, LoggerService | R> =>
    Effect.tapError(effect, (error) => log.error(message, error)),
};
