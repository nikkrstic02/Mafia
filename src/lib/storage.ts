"use client";

const KEY_PLAYER_ID = "mafia:playerId";
const KEY_NAME = "mafia:name";

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getOrCreatePlayerId() {
  const storage = getStorage();
  if (!storage) {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  const existing = storage.getItem(KEY_PLAYER_ID);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  storage.setItem(KEY_PLAYER_ID, id);
  return id;
}

export function getSavedName() {
  const storage = getStorage();
  return storage?.getItem(KEY_NAME) ?? "";
}

export function saveName(name: string) {
  const storage = getStorage();
  storage?.setItem(KEY_NAME, name);
}

export function savePlayerId(playerId: string) {
  const storage = getStorage();
  storage?.setItem(KEY_PLAYER_ID, playerId);
}

