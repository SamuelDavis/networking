import { createRoot, createSignal, on } from "solid-js";
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
  const [, setPeer] = createSignal<Peer>(new Peer());
  const [getConnections, setConnections] = createSignal<DataConnection[]>([]);
  const [getData, setData] = createSignal<NetworkMessage[]>([]);

  function processData(data: NetworkMessage) {
    const { type, payload } = data;
    switch (type) {
      case "peers":
        const peers = getPeers();
        (payload as DataConnection["peer"][])
          .filter((peer) => !peers.includes(peer))
          .forEach(addConnection);
        break;
    }
  }

  function getId() {
    return peer.id;
  }

  function getPeers() {
    return getConnections().map((connection) => connection.peer);
  }

  function addConnection(id: DataConnection["peer"]) {
    initConnection(peer.connect(id));
  }

  function initConnection(connection: DataConnection) {
    const timeout = setTimeout(() => {
      connection.close();
      console.error(`Failed to connect ${peer.id} to ${connection.peer}.`);
    }, 3000);

    connection.on("open", () => {
      clearTimeout(timeout);
      setConnections((prev) => {
        if (prev.length)
          connection.send({
            type: "peers",
            payload: prev.map((connection) => connection.peer),
            date: new Date(),
            source: peer.id,
          });
        return [...prev, connection];
      });
    });

    connection.on("close", () => {
      setConnections((prev) =>
        prev.filter(
          ({ connectionId }) => connectionId !== connection.connectionId
        )
      );
    });

    connection.on("data", (data) => {
      if (isNetworkMessage(data)) {
        const hydrated = { ...data, date: new Date(data.date) };
        processData(hydrated);
        return setData((prev) => [...prev, hydrated]);
      } else
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
