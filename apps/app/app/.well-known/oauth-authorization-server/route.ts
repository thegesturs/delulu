const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.delulu.social";

export async function GET() {
  const response = await fetch(
    `${apiUrl}/.well-known/oauth-authorization-server`,
    { headers: { accept: "application/json" } }
  );
  return new Response(response.body, {
    status: response.status,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=3600",
      "content-type": "application/json",
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
    },
  });
}
