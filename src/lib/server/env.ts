import { AsyncLocalStorage } from "node:async_hooks";

// Minimal D1 type surface we use. Avoids needing @cloudflare/workers-types.
export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: { duration?: number; rows_read?: number; rows_written?: number };
  error?: string;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(stmts: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(sql: string): Promise<unknown>;
}

/** Minimal R2 surface we use. */
export interface R2Object {
  body: ReadableStream | null;
  arrayBuffer(): Promise<ArrayBuffer>;
  httpEtag: string;
  size: number;
  uploaded: Date;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
}
export interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | Blob | string,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<R2Object>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
}

export type Env = {
  DB: D1Database;
  PHOTOS?: R2Bucket;
  BOT_TOKEN?: string;
  ADMIN_TELEGRAM_ID?: string;
  ADMIN_TELEGRAM_IDS?: string;
  ADMIN_PASSWORD?: string;
  TG_WEBHOOK_SECRET?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
};

const envStore = new AsyncLocalStorage<Env>();

export function runWithEnv<T>(env: Env, fn: () => T | Promise<T>): Promise<T> {
  return Promise.resolve(envStore.run(env, fn));
}

export function getEnv(): Env {
  const env = envStore.getStore();
  if (!env) {
    throw new Error(
      "getEnv() called outside Cloudflare request context. " +
        "Did you call this from a non-server-function path?",
    );
  }
  return env;
}

export function tryGetEnv(): Env | null {
  return envStore.getStore() ?? null;
}
