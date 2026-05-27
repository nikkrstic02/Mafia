export type NarratorMode = "random" | "choose";
export type GamePhase = "lobby" | "reveal";

export type Player = {
  id: string;
  name: string;
  connected: boolean;
  joinedAt: number;
  lastSeenAt: number;
};

export type RoomState = {
  code: string;
  createdAt: number;
  hostId: string;
  narratorMode: NarratorMode;
  narratorId: string | null;
  phase: GamePhase;
  players: Player[];
  rolesById: Record<string, string> | null; // narrator-only
};
