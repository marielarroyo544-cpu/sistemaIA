<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { api } from '$lib/api';

  let items = $state([]);
  let name = $state('');
  let description = $state('');
  let error = $state('');
  let session = $state(null);

  async function load() {
    try {
      items = await api('/api/items');
    } catch (e) {
      error = e.message;
    }
  }

  async function addItem(e) {
    e.preventDefault();
    try {
      await api('/api/items', { method: 'POST', body: JSON.stringify({ name, description }) });
      name = '';
      description = '';
      await load();
    } catch (e2) {
      error = e2.message;
    }
  }

  async function removeItem(id) {
    await api(`/api/items/${id}`, { method: 'DELETE' });
    await load();
  }

  async function logout() {
    await supabase.auth.signOut();
    goto('/');
  }

  onMount(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return goto('/');
    session = data.session;
    await load();
  });
</script>

<main>
  <header style="display:flex;justify-content:space-between;align-items:center">
    <h1>Panel de administración</h1>
    <div style="display:flex;gap:0.75rem;align-items:center">
      <a href="/geocercas">Geocercas</a>
      <button onclick={logout}>Salir</button>
    </div>
  </header>

  <form onsubmit={addItem}>
    <input bind:value={name} placeholder="Nombre" required />
    <input bind:value={description} placeholder="Descripción" />
    <button type="submit">Agregar</button>
  </form>

  {#if error}<p class="error">{error}</p>{/if}

  <table>
    <thead>
      <tr><th>Nombre</th><th>Descripción</th><th></th></tr>
    </thead>
    <tbody>
      {#each items as item (item.id)}
        <tr>
          <td>{item.name}</td>
          <td>{item.description ?? ''}</td>
          <td><button onclick={() => removeItem(item.id)}>Eliminar</button></td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>
