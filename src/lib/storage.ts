"use client";

const KEY_PLAYER_ID = "mafia:playerId";
const KEY_NAME = "mafia:name";

export function getOrCreatePlayerId() {
  const existing = window.localStorage.getItem(KEY_PLAYER_ID);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(KEY_PLAYER_ID, id);
  return id;
}

export function getSavedName() {
  return window.localStorage.getItem(KEY_NAME) ?? "";
}

export function saveName(name: string) {
  window.localStorage.setItem(KEY_NAME, name);
}

export function savePlayerId(playerId: string) {
  window.localStorage.setItem(KEY_PLAYER_ID, playerId);
}

