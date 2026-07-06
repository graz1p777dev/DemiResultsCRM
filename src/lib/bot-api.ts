// Client helper for the FastAPI bot backend, reached through the /api/backend proxy.
const BOT_API_BASE = "/api/backend";

export async function botGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BOT_API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Bot API ${res.status}`);
  return res.json();
}

export async function botJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BOT_API_BASE}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Bot API ${res.status}`);
  return res.json();
}
