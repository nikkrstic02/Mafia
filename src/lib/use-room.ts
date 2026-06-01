"use client";

import * as React from "react";
import type { RoomState } from "@/types/room";
import { getSocket, emitWithAck } from "@/lib/socket";
import { getOrCreatePlayerId, getSavedName } from "@/lib/storage";

type Ack = { ok: boolean; error?: string };

export function useRoom(code: string) {
  const [room, setRoom] = React.useState<RoomState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [joined, setJoined] = React.useState(false);

  React.useEffect(() => {
    let stopped = false;
    const socket = getSocket();

    const join = async () => {
      try {
        setJoined(false);
        const playerId = getOrCreatePlayerId();
        const name = getSavedName();
        const res = await emitWithAck<Ack>(socket, "room:join", {
          code,
          playerId,
          name,
        });
        if (stopped) return;
        if (!res.ok) {
          setError(res.error ?? "Failed to join room.");
          return;
        }
        setJoined(true);
        setConnected(true);
      } catch (e) {
        if (stopped) return;
        setConnected(false);
        setError((e as Error).message);
      }
    };

    const fetchState = async () => {
      try {
        const playerId = getOrCreatePlayerId();
        const res = await emitWithAck<{
          ok: boolean;
          error?: string;
          room?: RoomState;
        }>(socket, "room:state", { code, playerId });
        if (stopped) return;
        if (!res.ok || !res.room) {
          setError(res.error ?? "Failed to load room state.");
          return;
        }
        setConnected(true);
        setRoom(res.room);
      } catch {
        if (stopped) return;
        setConnected(false);
      }
    };

    const leave = async () => {
      try {
        const playerId = getOrCreatePlayerId();
        await emitWithAck<Ack>(socket, "room:leave", { code, playerId });
      } catch {
        // Ignore errors on leave
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        void leave();
      } else {
        void join().then(fetchState);
      }
    };

    void join().then(fetchState);
    const interval = window.setInterval(fetchState, 1500);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void leave();
    };
  }, [code]);

  return { room, error, connected, joined, clearError: () => setError(null) };
}
