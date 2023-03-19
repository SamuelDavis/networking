import type { DataConnection } from "peerjs";
import Peer from "peerjs";
import { client, connections } from "./store";
import { get } from "svelte/store";

const peerId =
  new URLSearchParams(window.location.search).get("peer") || undefined;
const _peer = new Peer(peerId, {
  host: "localhost",
  port: 9000,
  path: "/",
  key: "peerjs",
});

export function initClient() {
  _peer.on("open", () => client.set(_peer));
  _peer.on("connection", initializeConnection);
}

export function connectTo(peer: DataConnection["peer"]) {
  if (peer === _peer.id) return;
  if (
    get(connections)
      .map(({ peer }) => peer)
      .includes(peer)
  )
    return;
  initializeConnection(_peer.connect(peer));
}

function initializeConnection(connection: DataConnection) {
  const timeout = setTimeout(
    () =>
      console.error(
        `Failed to establish connection between ${_peer.id} and ${connection.peer}`
      ),
    3000
  );
  connection.on("open", () => {
    clearTimeout(timeout);
    connections.update((connections) => {
      connection.send(
        createAction(
          "peers",
          connections.map(({ peer }) => peer)
        )
      );
      connections.forEach((connection) =>
        connection.send(createAction("peers", [connection.peer]))
      );
      return [...connections, connection];
    });
  });
  connection.on("close", () => {
    connections.update((connections) =>
      connections.filter(
        ({ connectionId }) => connectionId !== connection.connectionId
      )
    );
  });
  connection.on("data", (data: any) => {
    if (!isAction(data)) return;

    const action = { ...data, date: new Date(data.date) };
    const { type, payload } = action;

    switch (type) {
      case "peers":
        payload.forEach(connectTo);
        break;
    }
  });
}

interface ActionTypePayloadMap {
  peers: DataConnection["peer"][];
}

type Action<T extends keyof ActionTypePayloadMap> = {
  type: T;
  payload: ActionTypePayloadMap[T];
  date: Date;
  source: Peer["id"];
};

function isAction<T extends keyof ActionTypePayloadMap>(value: {
  type: T;
}): value is Action<T> {
  return (
    typeof value === "object" &&
    ["type", "payload", "date", "source"].every((prop) => prop in value)
  );
}

function createAction<T extends keyof ActionTypePayloadMap>(
  type: T,
  payload: ActionTypePayloadMap[T]
): Action<T> {
  return { type, payload, date: new Date(), source: _peer.id };
}
