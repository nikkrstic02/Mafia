
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require("http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const next = require("next");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Server } = require("socket.io");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const dev =
  process.env.NODE_ENV !== "production" &&
  process.env.npm_lifecycle_event !== "start";

const app = next({ dev });
const handle = app.getRequestHandler();

/**
 * Room state is kept in-memory for now.
 * This is great for local/dev and small parties, but not for multi-instance deployments.
 */
const rooms = new Map(); // code -> room

function now() {
  return Date.now();
}

function makeRoomCode(length = 5) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function normalizeName(name) {
  return String(name || "").trim();
}

function sameName(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function getRoleDistribution(playerCount) {
  const distributions = {
    7: { mafiaCount: 1, ladyCount: 1, policeCount: 1, doctorCount: 1, narratorCount: 1, citizenCount: 2 },
    8: { mafiaCount: 1, ladyCount: 1, policeCount: 1, doctorCount: 1, narratorCount: 1, citizenCount: 3 },
    9: { mafiaCount: 1, ladyCount: 1, policeCount: 1, doctorCount: 1, narratorCount: 1, citizenCount: 4 },
    10: { mafiaCount: 2, ladyCount: 1, policeCount: 1, doctorCount: 1, narratorCount: 1, citizenCount: 4 },
    11: { mafiaCount: 2, ladyCount: 1, policeCount: 1, doctorCount: 1, narratorCount: 1, citizenCount: 5 },
    12: { mafiaCount: 2, ladyCount: 1, policeCount: 1, doctorCount: 1, narratorCount: 1, citizenCount: 6 },
    13: { mafiaCount: 2, ladyCount: 1, policeCount: 1, doctorCount: 1, narratorCount: 1, citizenCount: 7 },
  };
  return distributions[playerCount] || null;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createRoom({ hostId, hostName, narratorMode }) {
  let code = makeRoomCode();
  while (rooms.has(code)) code = makeRoomCode();

  const room = {
    code,
    createdAt: now(),
    hostId,
    narratorMode, // "random" | "choose"
    narratorId: null, // chosen narrator (only used when narratorMode==="choose")
    phase: "lobby", // "lobby" | "reveal"
    players: new Map(), // id -> player
    rolesById: null, // id -> role, populated on game start
  };

  room.players.set(hostId, {
    id: hostId,
    name: hostName,
    connected: true,
    joinedAt: now(),
    lastSeenAt: now(),
  });

  rooms.set(code, room);
  return room;
}

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    connected: p.connected,
    joinedAt: p.joinedAt,
    lastSeenAt: p.lastSeenAt,
  };
}

function getPublicRoomState(room) {
  const players = Array.from(room.players.values())
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map(publicPlayer);

  return {
    code: room.code,
    createdAt: room.createdAt,
    hostId: room.hostId,
    narratorMode: room.narratorMode,
    narratorId: room.narratorId,
    phase: room.phase,
    players,
  };
}

async function broadcastRoomState(io, room) {
  const sockets = await io.in(room.code).fetchSockets();
  const base = getPublicRoomState(room);

  for (const s of sockets) {
    const playerId = s.data?.playerId;
    const role = room.rolesById?.[playerId] ?? null;
    const isNarrator = role === "Narrator";

    s.emit("room:state", {
      ...base,
      // only narrator gets roles, since it reveals hidden information:
      rolesById: isNarrator ? room.rolesById : null,
    });
  }
}

function ensureRoom(code) {
  const room = rooms.get(String(code || "").toUpperCase());
  return room || null;
}

function validateJoin(room, { playerId, name }) {
  const nickname = normalizeName(name);
  if (!playerId || typeof playerId !== "string") return "Missing playerId.";
  if (!nickname) return "Enter a nickname.";

  const existingById = room.players.get(playerId);
  // Allow existing players to rejoin even after game started
  if (existingById) return null;

  // Only new players are blocked after game starts
  if (room.phase !== "lobby") return "Game already started. Create a new room.";

  for (const p of room.players.values()) {
    if (sameName(p.name, nickname)) return "That nickname is already taken.";
  }

  if (room.players.size >= 13) return "Room is full (max 13).";
  return null;
}

function assignRoles(room) {
  const players = Array.from(room.players.values()).sort(
    (a, b) => a.joinedAt - b.joinedAt,
  );
  const playerCount = players.length;

  const dist = getRoleDistribution(playerCount);
  if (!dist) return { ok: false, error: "Rooms must have 7–13 players." };

  let narratorId = room.narratorId;
  if (room.narratorMode === "random") {
    narratorId = pickRandom(players).id;
  } else {
    if (!narratorId || !room.players.has(narratorId)) {
      return { ok: false, error: "Select a narrator first." };
    }
  }

  const otherPlayers = players.filter((p) => p.id !== narratorId);
  const roles = [];

  for (let i = 0; i < dist.mafiaCount; i++) roles.push("Mafia");
  roles.push("Lady", "Police", "Doctor");
  for (let i = 0; i < dist.citizenCount; i++) roles.push("Citizen");

  shuffle(roles);

  const rolesById = {};
  rolesById[narratorId] = "Narrator";
  otherPlayers.forEach((p, idx) => {
    rolesById[p.id] = roles[idx];
  });

  room.narratorId = narratorId;
  room.rolesById = rolesById;
  room.phase = "reveal";
  return { ok: true, rolesById, narratorId };
}

app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => handle(req, res));
    const io = new Server(httpServer, {
      cors: { origin: true, credentials: true },
    });

    io.on("connection", (socket) => {
      socket.on("room:create", async (payload, cb) => {
        try {
          const playerId = String(payload?.playerId || "");
          const name = normalizeName(payload?.name);
          const narratorMode = payload?.narratorMode === "choose" ? "choose" : "random";

          if (!playerId) return cb?.({ ok: false, error: "Missing playerId." });
          if (!name) return cb?.({ ok: false, error: "Enter a nickname." });

          const room = createRoom({ hostId: playerId, hostName: name, narratorMode });

          socket.data.playerId = playerId;
          socket.data.roomCode = room.code;
          socket.join(room.code);

          await broadcastRoomState(io, room);
          return cb?.({ ok: true, code: room.code });
        } catch {
          return cb?.({ ok: false, error: "Failed to create room." });
        }
      });

      socket.on("room:join", async (payload, cb) => {
        try {
          const code = String(payload?.code || "").toUpperCase();
          const playerId = String(payload?.playerId || "");
          const name = normalizeName(payload?.name);

          const room = ensureRoom(code);
          if (!room) return cb?.({ ok: false, error: "Room not found." });

          const joinError = validateJoin(room, { playerId, name });
          if (joinError) return cb?.({ ok: false, error: joinError });

          const existing = room.players.get(playerId);
          if (existing) {
            existing.connected = true;
            existing.lastSeenAt = now();
          } else {
            room.players.set(playerId, {
              id: playerId,
              name,
              connected: true,
              joinedAt: now(),
              lastSeenAt: now(),
            });
          }

          socket.data.playerId = playerId;
          socket.data.roomCode = room.code;
          socket.join(room.code);

          await broadcastRoomState(io, room);
          return cb?.({ ok: true, code: room.code });
        } catch {
          return cb?.({ ok: false, error: "Failed to join room." });
        }
      });

      socket.on("room:setNarrator", async (payload, cb) => {
        try {
          const code = String(payload?.code || "").toUpperCase();
          const narratorId = String(payload?.narratorId || "");
          const room = ensureRoom(code);
          if (!room) return cb?.({ ok: false, error: "Room not found." });
          if (room.narratorMode !== "choose")
            return cb?.({ ok: false, error: "Room is set to random narrator." });
          if (!narratorId) return cb?.({ ok: false, error: "Missing narrator ID." });
          if (!room.players.has(narratorId))
            return cb?.({ ok: false, error: "Invalid narrator." });

          room.narratorId = narratorId;
          await broadcastRoomState(io, room);
          return cb?.({ ok: true });
        } catch {
          return cb?.({ ok: false, error: "Failed to set narrator." });
        }
      });

      socket.on("game:start", async (payload, cb) => {
        try {
          const code = String(payload?.code || "").toUpperCase();
          const room = ensureRoom(code);
          if (!room) return cb?.({ ok: false, error: "Room not found." });

          const res = assignRoles(room);
          if (!res.ok) return cb?.({ ok: false, error: res.error });

          io.to(room.code).emit("game:started", { phase: room.phase });
          await broadcastRoomState(io, room);
          return cb?.({ ok: true });
        } catch {
          return cb?.({ ok: false, error: "Failed to start game." });
        }
      });

      socket.on("game:requestRole", (payload, cb) => {
        try {
          const code = String(payload?.code || "").toUpperCase();
          const room = ensureRoom(code);
          if (!room) return cb?.({ ok: false, error: "Room not found." });

          const playerId = socket.data?.playerId;
          if (!playerId)
            return cb?.({ ok: false, error: "Not joined. Please refresh and rejoin the room." });
          if (!room.rolesById)
            return cb?.({ ok: false, error: "Game not started." });

          const role = room.rolesById[playerId];
          if (!role)
            return cb?.({ ok: false, error: "Role not found for your player ID." });

          const mafiaIds = Object.entries(room.rolesById)
            .filter(([, r]) => r === "Mafia")
            .map(([id]) => id);

          const mafiaMates =
            role === "Mafia"
              ? mafiaIds
                  .filter((id) => id !== playerId)
                  .map((id) => room.players.get(id)?.name)
                  .filter(Boolean)
              : [];

          return cb?.({
            ok: true,
            role,
            mafiaMates,
          });
        } catch {
          return cb?.({ ok: false, error: "Failed to fetch role." });
        }
      });

      socket.on("game:restart", async (payload, cb) => {
        try {
          const code = String(payload?.code || "").toUpperCase();
          const room = ensureRoom(code);
          if (!room) return cb?.({ ok: false, error: "Room not found." });

          room.phase = "lobby";
          room.rolesById = null;
          if (room.narratorMode === "choose") room.narratorId = null;

          io.to(room.code).emit("game:restarted", { phase: room.phase });
          await broadcastRoomState(io, room);
          return cb?.({ ok: true });
        } catch {
          return cb?.({ ok: false, error: "Failed to restart." });
        }
      });

      socket.on("disconnect", async () => {
        const code = socket.data?.roomCode;
        const playerId = socket.data?.playerId;
        if (!code || !playerId) return;
        const room = ensureRoom(code);
        if (!room) return;

        const p = room.players.get(playerId);
        if (p) {
          p.connected = false;
          p.lastSeenAt = now();
          try {
            await broadcastRoomState(io, room);
          } catch (err) {
            console.error("[disconnect] Failed to broadcast room state:", err);
          }
        }
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`> Ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
