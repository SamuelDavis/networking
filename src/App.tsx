import Peer, { DataConnection } from "peerjs";
import { For } from "solid-js";
import { createStore, produce } from "solid-js/store";

type State = {
  id: string;
  connections: DataConnection[];
};
export default function App() {
  const [state, setState] = createStore<State>({ id: "", connections: [] });
  const peer = new Peer(window.location.hash.slice(1));
  peer.on("open", (id) =>
    setState((state) => ({ ...state, id, connections: [] })),
  );
  peer.on("close", () =>
    setState((state) => ({ ...state, id: "", connections: [] })),
  );
  peer.on("disconnected", () =>
    setState((state) => ({ ...state, id: "", connections: [] })),
  );
  peer.on("error", (error) => console.error(error));
  peer.on("connection", initializeConnection);

  function initializeConnection(connection: DataConnection): void {
    if (connection.peer === state.id) return;
    if (state.connections.some((existing) => existing.peer === connection.peer))
      return;

    connection.on("error", (error) => console.error(error));
    connection.on("open", () => {
      setState(
        produce((state) => {
          state.connections = [...state.connections, connection];
        }),
      );
    });
    connection.on("close", () => {
      setState(
        produce((state) => {
          state.connections = state.connections.filter(
            (existing) => existing.peer !== connection.peer,
          );
        }),
      );
    });
  }

  function onCopyId() {
    navigator.clipboard.writeText(state.id);
  }

  function onConnect() {
    const id = prompt("ID:") ?? "";
    if (id) initializeConnection(peer.connect(id));
  }

  return (
    <main>
      <header>
        <output>{state.id}</output>
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
            <For each={state.connections}>
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
