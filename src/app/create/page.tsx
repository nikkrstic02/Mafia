"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/screen";
import { getSocket, emitWithAck } from "@/lib/socket";
import { getOrCreatePlayerId, getSavedName, saveName } from "@/lib/storage";

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = React.useState(() =>
    typeof window === "undefined" ? "" : getSavedName(),
  );
  const [mode, setMode] = React.useState<"random" | "choose">("random");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Screen>
      <div className="animate-fade-in-up space-y-4">
        <Card title="Create a room">
          <div className="space-y-4">
            <Input
              label="Your nickname"
              placeholder="e.g., Nick"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium tracking-wide text-white/70">
                Narrator mode
              </legend>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="radio"
                  name="narrator"
                  checked={mode === "random"}
                  onChange={() => setMode("random")}
                />
                <div>
                  <div className="text-sm font-medium">Random narrator</div>
                  <div className="text-xs text-white/50">
                    When the game starts, the app picks one player as Narrator.
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="radio"
                  name="narrator"
                  checked={mode === "choose"}
                  onChange={() => setMode("choose")}
                />
                <div>
                  <div className="text-sm font-medium">Choose narrator</div>
                  <div className="text-xs text-white/50">
                    You’ll choose the Narrator later in the lobby.
                  </div>
                </div>
              </label>
            </fieldset>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              disabled={loading}
              onClick={async () => {
                setError(null);
                const nickname = name.trim();
                if (!nickname) return setError("Enter a nickname.");

                setLoading(true);
                saveName(nickname);
                const playerId = getOrCreatePlayerId();

                try {
                  const socket = getSocket();
                  const res = await emitWithAck<{ ok: boolean; code?: string; error?: string }>(
                    socket,
                    "room:create",
                    { playerId, name: nickname, narratorMode: mode },
                  );

                  if (!res.ok || !res.code) {
                    setError(res.error ?? "Failed to create room.");
                    return;
                  }

                  router.push(`/room/${res.code}/lobby`);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Creating..." : "Create room"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push("/join")}
            >
              Join instead
            </Button>
          </div>
        </Card>
      </div>
    </Screen>
  );
}
