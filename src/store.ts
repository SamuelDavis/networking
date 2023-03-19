import type { DataConnection, default as Peer } from "peerjs";
import { writable } from "svelte/store";

export const client = writable<Peer>(null);
export const connections = writable<DataConnection[]>([]);
