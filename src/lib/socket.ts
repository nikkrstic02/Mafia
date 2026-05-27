"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  socket = io({
    transports: ["websocket"],
  });
  return socket;
}

export function emitWithAck<TRes>(
  s: Socket,
  event: string,
  payload: unknown,
  timeoutMs = 8000,
): Promise<TRes> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
    s.emit(event, payload, (res: TRes) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

