"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { RoomState } from "@/types/room";
import { getSocket, emitWithAck } from "@/lib/socket";
import { getOrCreatePlayerId, getSavedName } from "@/lib/storage";

type Ack = { ok: boolean; error?: string };

export function useRoom(code: string) {
  const router = useRouter();
  const [room, setRoom] = React.useState<RoomState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [joined, setJoined] = React.useState(false);

  React.useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (next: RoomState) => setRoom(next);
    const onError = (e: { message?: string }) =>
      setError(e?.message ?? "Something went wrong.");
    const onStarted = () => router.push(`/room/${code}/reveal`);
    const onRestarted = () => router.push(`/room/${code}/lobby`);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("room:error", onError);
    socket.on("game:started", onStarted);
    socket.on("game:restarted", onRestarted);
    const connectedStatusTimeout = window.setTimeout(
      () => setConnected(socket.connected),
      0,
    );

    const join = async () => {
      try {
        setJoined(false);
        const socket = getSocket();
        const playerId = getOrCreatePlayerId();
        const name = getSavedName();
        
        const res = await emitWithAck<Ack>(socket, "room:join", {
          code,
          playerId,
          name,
        });
        if (!res.ok) {
          setError(res.error ?? "Failed to join room.");
          return;
        }
        setJoined(true);
      } catch (e) {
        setError((e as Error).message);
      }
    };

    join();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("room:error", onError);
      socket.off("game:started", onStarted);
      socket.off("game:restarted", onRestarted);
      window.clearTimeout(connectedStatusTimeout);
    };
  }, [code, router]);

  return { room, error, connected, joined, clearError: () => setError(null) };
}
