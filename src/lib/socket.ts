"use client";
export function getSocket() {
  return null;
}

export function emitWithAck<TRes>(
  _socket: unknown,
  event: string,
  payload: unknown,
  timeoutMs = 8000,
): Promise<TRes> {
  const routeByEvent: Record<string, string> = {
    "room:create": "/api/room/create",
    "room:join": "/api/room/join",
    "room:setNarrator": "/api/room/set-narrator",
    "game:start": "/api/room/start",
    "game:requestRole": "/api/room/request-role",
    "game:restart": "/api/room/restart",
    "room:state": "/api/room/state",
  };

  const route = routeByEvent[event];
  if (!route) {
    return Promise.reject(new Error(`Unsupported request: ${event}`));
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      return (await res.json()) as TRes;
    })
    .catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("Request timed out");
      }
      if (err instanceof TypeError) {
        throw new Error("Network error. Check your connection and try again.");
      }
      throw err;
    })
    .finally(() => window.clearTimeout(timer));
}
