import { NextRequest, NextResponse } from "next/server";

// Proxy to the FastAPI bot backend (amoCRM / OpenAI / Telegram integration).
// Server-side only: the admin API key never reaches the browser.
const BACKEND_API_URL = process.env.BOT_BACKEND_API_URL || "http://localhost:8000";
const BACKEND_ADMIN_API_KEY = process.env.BOT_BACKEND_ADMIN_API_KEY || "";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function backendUrl(path: string[], search: string) {
  const cleanBase = BACKEND_API_URL.replace(/\/$/, "");
  const cleanPath = path.join("/");
  return `${cleanBase}/${cleanPath}${search}`;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const headers = new Headers(request.headers);
  headers.delete("host");
  if (BACKEND_ADMIN_API_KEY) {
    headers.set("X-Admin-API-Key", BACKEND_ADMIN_API_KEY);
  }

  // arrayBuffer keeps binary bodies (file uploads) intact
  const response = await fetch(backendUrl(path, request.nextUrl.search), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "application/json";
  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: { "content-type": contentType },
  });
}

export async function GET(request: NextRequest, context: RouteContext) { return proxy(request, context); }
export async function POST(request: NextRequest, context: RouteContext) { return proxy(request, context); }
export async function PATCH(request: NextRequest, context: RouteContext) { return proxy(request, context); }
export async function PUT(request: NextRequest, context: RouteContext) { return proxy(request, context); }
export async function DELETE(request: NextRequest, context: RouteContext) { return proxy(request, context); }
