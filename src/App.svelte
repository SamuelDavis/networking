<script lang="ts">
  import { client, connections } from "./store.js";
  import { createAction, dispatch, initClient } from "./networking";
  import { onMount } from "svelte";

  onMount(initClient);

  function onHost() {
    window.navigator.clipboard.writeText($client.id);
  }

  function onJoin() {
    const peer = (prompt("peer") ?? "").trim();
    if (peer) dispatch(createAction("peers", [peer]));
  }
</script>

<header>
  {#if $client}
    <span>{$client.id}</span>
  {/if}
</header>

<main>
  <menu>
    <li>
      <button on:click={onHost}>Host</button>
    </li>
    <li>
      <button on:click={onJoin}>Join</button>
    </li>
  </menu>
  <ol>
    {#each $connections as connection}
      <li>{connection.peer}</li>
    {:else}
      <li><em>No connections...</em></li>
    {/each}
  </ol>
</main>

<style lang="css">
</style>
