import type { Component } from "solid-js";
import { For } from "solid-js";
import { store } from "./store";

function onHost() {
  window.navigator.clipboard.writeText(store.getId());
}

function onJoin() {
  const peer = prompt("peer");
  if (peer) store.addConnection(peer);
}

const App: Component = () => {
  return (
    <>
      <header>
        <details open>
          <summary>
            {store.getId()} ({store.getPeers().length})
          </summary>
          <ul>
            <For each={store.getPeers()}>{(peer) => <li>{peer}</li>}</For>
          </ul>
        </details>
      </header>
      <main>
        <menu>
          <li>
            <button onClick={onHost}>Host</button>
          </li>
          <li>
            <button onClick={onJoin}>Join</button>
          </li>
        </menu>

        <ol>
          <For each={store.getData()}>
            {(data) => (
              <li>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </li>
            )}
          </For>
        </ol>
      </main>
    </>
  );
};

export default App;
