import { Redis } from "@upstash/redis";

type NarratorMode = "random" | "choose";
type GamePhase = "lobby" | "reveal";

type Player = {
  id: string;
  name: string;
  connected: boolean;
  joinedAt: number;
  lastSeenAt: number;
};

type Room = {
  code: string;
  createdAt: number;
  hostId: string;
  narratorMode: NarratorMode;
  narratorId: string | null;
  phase: GamePhase;
  players: Record<string, Player>;
  rolesById: Record<string, string> | null;
};

const ROOM_TTL_SECONDS = 60 * 60 * 24;
const ROOM_KEY_PREFIX = "mafia:room:";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const localRooms = globalThis.__MAFIA_ROOMS__ ?? new Map<string, Room>();
globalThis.__MAFIA_ROOMS__ = localRooms;

function now() {
  return Date.now();
}

function roomKey(code: string) {
  return `${ROOM_KEY_PREFIX}${code}`;
}

function makeRoomCode(length = 5) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function normalizeName(name: unknown) {
  return String(name || "").trim();
}

function sameName(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function getRoleDistribution(playerCount: number) {
  const distributions: Record<number, { mafiaCount: number; citizenCount: number }> = {
    7: { mafiaCount: 1, citizenCount: 2 },
    8: { mafiaCount: 1, citizenCount: 3 },
    9: { mafiaCount: 1, citizenCount: 4 },
    10: { mafiaCount: 2, citizenCount: 4 },
    11: { mafiaCount: 2, citizenCount: 5 },
    12: { mafiaCount: 2, citizenCount: 6 },
    13: { mafiaCount: 2, citizenCount: 7 },
  };
  return distributions[playerCount] || null;
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function publicPlayer(p: Player) {
  return {
    id: p.id,
    name: p.name,
    connected: p.connected,
    joinedAt: p.joinedAt,
    lastSeenAt: p.lastSeenAt,
  };
}

function getPublicRoomState(room: Room, viewerId?: string) {
  const players = Object.values(room.players)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map(publicPlayer);

  const role = viewerId ? room.rolesById?.[viewerId] : null;
  const isNarrator = role === "Narrator";

  return {
    code: room.code,
    createdAt: room.createdAt,
    hostId: room.hostId,
    narratorMode: room.narratorMode,
    narratorId: room.narratorId,
    phase: room.phase,
    players,
    rolesById: isNarrator ? room.rolesById : null,
  };
}

function getPlayers(room: Room) {
  return Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);
}

async function getRoom(code: unknown) {
  const normalizedCode = String(code || "").toUpperCase();
  if (!normalizedCode) return null;
  if (!redis) return localRooms.get(normalizedCode) || null;
  const room = await redis.get<Room>(roomKey(normalizedCode));
  return room || null;
}

async function saveRoom(room: Room) {
  if (!redis) {
    localRooms.set(room.code, room);
    return;
  }
  await redis.set(roomKey(room.code), room, { ex: ROOM_TTL_SECONDS });
}

export async function createRoomAction(payload: {
  playerId?: string;
  name?: string;
  narratorMode?: NarratorMode;
}) {
  const playerId = String(payload?.playerId || "");
  const name = normalizeName(payload?.name);
  const narratorMode = payload?.narratorMode === "choose" ? "choose" : "random";

  if (!playerId) return { ok: false as const, error: "Missing playerId." };
  if (!name) return { ok: false as const, error: "Enter a nickname." };

  for (let attempts = 0; attempts < 20; attempts++) {
    const code = makeRoomCode();
    const createdAt = now();
    const room: Room = {
      code,
      createdAt,
      hostId: playerId,
      narratorMode,
      narratorId: null,
      phase: "lobby",
      players: {
        [playerId]: {
          id: playerId,
          name,
          connected: true,
          joinedAt: createdAt,
          lastSeenAt: createdAt,
        },
      },
      rolesById: null,
    };

    if (!redis) {
      if (localRooms.has(code)) continue;
      localRooms.set(code, room);
      return { ok: true as const, code };
    }

    const result = await redis.set(roomKey(code), room, {
      ex: ROOM_TTL_SECONDS,
      nx: true,
    });
    if (result === "OK") {
      return { ok: true as const, code };
    }
  }

  return { ok: false as const, error: "Failed to allocate a room code. Try again." };
}

export async function joinRoomAction(payload: {
  code?: string;
  playerId?: string;
  name?: string;
}) {
  const code = String(payload?.code || "").toUpperCase();
  const playerId = String(payload?.playerId || "");
  const name = normalizeName(payload?.name);
  const room = await getRoom(code);
  if (!room) return { ok: false as const, error: "Room not found." };
  if (!playerId) return { ok: false as const, error: "Missing playerId." };
  if (!name) return { ok: false as const, error: "Enter a nickname." };

  const existingById = room.players[playerId];
  if (!existingById && room.phase !== "lobby") {
    return { ok: false as const, error: "Game already started. Create a new room." };
  }

  if (!existingById) {
    for (const p of Object.values(room.players)) {
      if (sameName(p.name, name)) return { ok: false as const, error: "That nickname is already taken." };
    }
    if (Object.keys(room.players).length >= 13) {
      return { ok: false as const, error: "Room is full (max 13)." };
    }
  }

  if (existingById) {
    existingById.connected = true;
    existingById.lastSeenAt = now();
  } else {
    room.players[playerId] = {
      id: playerId,
      name,
      connected: true,
      joinedAt: now(),
      lastSeenAt: now(),
    };
  }

  await saveRoom(room);
  return { ok: true as const, code };
}

export async function getRoomStateAction(payload: { code?: string; playerId?: string }) {
  const code = String(payload?.code || "").toUpperCase();
  const playerId = String(payload?.playerId || "");
  const room = await getRoom(code);
  if (!room) return { ok: false as const, error: "Room not found." };
  await saveRoom(room);
  return { ok: true as const, room: getPublicRoomState(room, playerId || undefined) };
}

export async function setNarratorAction(payload: { code?: string; narratorId?: string }) {
  const code = String(payload?.code || "").toUpperCase();
  const narratorId = String(payload?.narratorId || "");
  const room = await getRoom(code);
  if (!room) return { ok: false as const, error: "Room not found." };
  if (room.narratorMode !== "choose") {
    return { ok: false as const, error: "Room is set to random narrator." };
  }
  if (!narratorId) return { ok: false as const, error: "Missing narrator ID." };
  if (!room.players[narratorId]) return { ok: false as const, error: "Invalid narrator." };
  room.narratorId = narratorId;
  await saveRoom(room);
  return { ok: true as const };
}

export async function startGameAction(payload: { code?: string }) {
  const code = String(payload?.code || "").toUpperCase();
  const room = await getRoom(code);
  if (!room) return { ok: false as const, error: "Room not found." };

  const players = getPlayers(room);
  const playerCount = players.length;
  const dist = getRoleDistribution(playerCount);
  if (!dist) return { ok: false as const, error: "Rooms must have 7-13 players." };

  let narratorId = room.narratorId;
  if (room.narratorMode === "random") {
    narratorId = pickRandom(players).id;
  } else if (!narratorId || !room.players[narratorId]) {
    return { ok: false as const, error: "Select a narrator first." };
  }

  const otherPlayers = players.filter((p) => p.id !== narratorId);
  const roles: string[] = [];
  for (let i = 0; i < dist.mafiaCount; i++) roles.push("Mafia");
  roles.push("Lady", "Police", "Doctor");
  for (let i = 0; i < dist.citizenCount; i++) roles.push("Citizen");
  shuffle(roles);

  const rolesById: Record<string, string> = {};
  rolesById[narratorId] = "Narrator";
  otherPlayers.forEach((p, idx) => {
    rolesById[p.id] = roles[idx];
  });

  room.narratorId = narratorId;
  room.rolesById = rolesById;
  room.phase = "reveal";

  await saveRoom(room);
  return { ok: true as const };
}

export async function requestRoleAction(payload: { code?: string; playerId?: string }) {
  const code = String(payload?.code || "").toUpperCase();
  const playerId = String(payload?.playerId || "");
  const room = await getRoom(code);
  if (!room) return { ok: false as const, error: "Room not found." };
  if (!playerId) return { ok: false as const, error: "Missing playerId." };
  if (!room.rolesById) return { ok: false as const, error: "Game not started." };

  const role = room.rolesById[playerId];
  if (!role) return { ok: false as const, error: "Role not found for your player ID." };

  const mafiaIds = Object.entries(room.rolesById)
    .filter(([, r]) => r === "Mafia")
    .map(([id]) => id);
  const mafiaMates =
    role === "Mafia"
      ? mafiaIds
          .filter((id) => id !== playerId)
          .map((id) => room.players[id]?.name)
          .filter((name): name is string => Boolean(name))
      : [];

  await saveRoom(room);
  return { ok: true as const, role, mafiaMates };
}

export async function restartGameAction(payload: { code?: string }) {
  const code = String(payload?.code || "").toUpperCase();
  const room = await getRoom(code);
  if (!room) return { ok: false as const, error: "Room not found." };

  room.phase = "lobby";
  room.rolesById = null;
  if (room.narratorMode === "choose") room.narratorId = null;
  await saveRoom(room);
  return { ok: true as const };
}

declare global {
  var __MAFIA_ROOMS__: Map<string, Room> | undefined;
}
