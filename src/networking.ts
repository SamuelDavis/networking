import type { DataConnection } from "peerjs";
import Peer from "peerjs";
import { actions, client, connections } from "./store";
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
    const action = { ...data, date: new Date(data.date) };
    actions.update((actions) => [action, ...actions]);
  });
}

export type Action = {
  type: string;
  payload: any;
  date: Date;
  source: Peer["id"];
};

export function createAction(type: string, payload: any): Action {
  return { type, payload, date: new Date(), source: _peer.id };
}

export function dispatch(action: Action) {
  actions.update((actions) => [action, ...actions]);
}
