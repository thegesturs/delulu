import type { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
  console.error("Unhandled error:", err);

  if (err.message.includes("not found") || err.message.includes("Not found")) {
    return c.json({ error: { code: "NOT_FOUND", message: err.message } }, 404);
  }

  if (
    err.message.includes("access denied") ||
    err.message.includes("Access denied")
  ) {
    return c.json({ error: { code: "FORBIDDEN", message: err.message } }, 403);
  }

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500
  );
}
