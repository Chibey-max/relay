// types/types.ts
// Shared TypeScript interfaces and types used across the app. Import with
// a relative path, matching this project's existing import convention
// (the "@/*" alias in tsconfig.json resolves too, but no file here uses it).

/**
 * Loose shape for a value caught in a `catch` block. A thrown value is
 * `unknown` at the type level and is not guaranteed to be a real `Error`
 * instance, SDK and RPC provider code in this app often throws plain
 * objects, so every field here is optional.
 */
export interface ErrorLike {
  message?: string;
  code?: string | number;
  stack?: string;
}
