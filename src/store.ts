import type { DataConnection, default as Peer } from "peerjs";
import { writable } from "svelte/store";
import type { Action } from "./networking";
import { connectTo } from "./networking";

export const client = writable<Peer>(null);
export const connections = writable<DataConnection[]>([]);
export const actions = writable<Action[]>([]);

actions.subscribe(([action]) => {
  if (!action) return;
  const { type, payload } = action;

  switch (type) {
    case "peers":
      payload.forEach(connectTo);
      break;
  }
});
