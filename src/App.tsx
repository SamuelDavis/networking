import Peer, { DataConnection } from "peerjs";
import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";

export default function App() {
  const [getPeer, setPeer] = createSignal<undefined | Peer>();
  const [getConnections, setConnections] = createSignal<DataConnection[]>([]);

  createEffect(() => {
    const connections = getConnections();
    const peers = connections.map((connection) => connection.peer);
    for (const connection of connections) connection.send(peers);
  });

  onMount(() => {
    const peer = new Peer(window.location.hash.slice(1), {
      host: "localhost",
      port: 8080,
    });
    peer.on("open", () => {
      setPeer(peer);
      setConnections([]);
    });
    peer.on("close", () => {
      setPeer(undefined);
      setConnections([]);
    });
    peer.on("disconnected", () => {
      setPeer(undefined);
      setConnections([]);
    });
    peer.on("error", (error) => console.error(error));
    peer.on("connection", initializeConnection);

    onCleanup(() => {
      peer.destroy();
    });
  });

  function initializeConnection(connection: string | DataConnection): void {
    if (typeof connection === "string") {
      const peer = getPeer();
      if (!connection || !peer || connection === peer.id) return;
      return initializeConnection(peer.connect(connection));
    }

    connection.on("open", () => {
      setConnections((connections) => {
        if (connections.some((existing) => existing.peer === connection.peer)) {
          connection.close();
          return connections;
        }

        connection.on("error", (error) => console.error(error));
        connection.on("close", () => {
          setConnections((connections) =>
            connections.filter((existing) => existing.peer !== connection.peer),
          );
        });
        connection.on("data", (data) => {
          if (Array.isArray(data))
            for (const peer of data) initializeConnection(peer);
        });
        return [...connections, connection];
      });
    });
  }

  function onCopyId() {
    navigator.clipboard.writeText(getPeer()?.id ?? "");
  }

  function onConnect() {
    initializeConnection(prompt("ID:") ?? "");
  }

  return (
    <main>
      <header>
        <output>{getPeer()?.id}</output>
        <button onClick={onCopyId}>Copy</button>
      </header>
      <section>
        <header>
          <h1>Connections</h1>
          <button onClick={onConnect}>Connect</button>
        </header>
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>peer</th>
              <th>provider</th>
            </tr>
          </thead>
          <tbody>
            <For each={getConnections()}>
              {(connection) => (
                <tr>
                  <td>{connection.connectionId}</td>
                  <td>{connection.peer}</td>
                  <td>{connection.provider.id}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </section>
    </main>
  );
}
