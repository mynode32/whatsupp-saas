import "server-only";

export class DbError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DbError";
  }
}

/** Unwraps a Supabase `{ data, error }` result into `data`, throwing a DbError otherwise. */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new DbError(result.error.message, result.error);
  if (result.data === null) throw new DbError("Expected a row but got null");
  return result.data;
}

/** Same as unwrap, but null data is valid (e.g. "not found" lookups). */
export function unwrapNullable<T>(result: { data: T | null; error: { message: string } | null }): T | null {
  if (result.error) throw new DbError(result.error.message, result.error);
  return result.data;
}
