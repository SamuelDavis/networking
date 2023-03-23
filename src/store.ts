import { createRoot, createSignal } from "solid-js";
import Peer, { type DataConnection } from "peerjs";
import { isNetworkMessage, type NetworkMessage } from "./types";

export const store = createRoot(() => {
  const peer = new Peer(
    new URLSearchParams(window.location.search).get("peer") ?? "",
    {
      host: "localhost",
      port: 9000,
      path: "/",
      key: "peerjs",
    }
  );
  peer.on("open", () => setPeer(peer));
  peer.on("connection", initConnection);
  const [getPeer, setPeer] = createSignal<Peer>(new Peer());
  const [getConnections, setConnections] = createSignal<DataConnection[]>([]);
  const [getData, setData] = createSignal<NetworkMessage[]>([]);

  function getId() {
    return getPeer().id;
  }

  function getPeers() {
    return getConnections().map((connection) => connection.peer);
  }

  function addConnection(peer: DataConnection["peer"]) {
    const connection = getPeer().connect(peer);
    initConnection(connection);
  }

  function initConnection(connection: DataConnection) {
    const timeout = setTimeout(() => {
      connection.close();
      console.error(`Failed to connect ${getPeer().id} to ${connection.peer}.`);
    }, 3000);

    connection.on("open", () => {
      clearTimeout(timeout);
      setConnections((prev) => [...prev, connection]);
    });

    connection.on("close", () => {
      setConnections((prev) =>
        prev.filter(
          ({ connectionId }) => connectionId !== connection.connectionId
        )
      );
    });

    connection.on("data", (data) => {
      if (isNetworkMessage(data)) return setData((prev) => [...prev, data]);
      else
        console.error(
          `Received malformed data from ${connection.peer}: ${JSON.stringify(
            data
          )}`
        );
    });
  }

  function send(data: NetworkMessage) {
    getConnections().forEach((connection) => connection.send(data));
  }

  return { getId, getPeers, getData, addConnection, send };
});
