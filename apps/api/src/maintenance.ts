/** Block even GET callbacks during cutover; the transfer route authenticates itself. */
export function maintenanceResponse(
  request: Request,
  flag: string | undefined
): Response | null {
  if (flag !== "true" || new URL(request.url).pathname === "/internal/jobs") {
    return null;
  }
  return Response.json(
    {
      error: "maintenance",
      message:
        "The API is temporarily paused for maintenance. Please retry shortly.",
    },
    {
      status: 503,
      headers: { "retry-after": "60", "cache-control": "no-store" },
    }
  );
}
