<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { api } from '$lib/api';
  import GeofenceMap from '$lib/geofence/GeofenceMap.svelte';

  let geofence = $state(null);
  let geofences = $state([]);
  let nombre = $state('');
  let error = $state('');
  let notice = $state('');
  let saving = $state(false);

  let geojson = $derived(
    !geofence
      ? null
      : geofence.kind === 'circle'
        ? {
            type: 'Feature',
            properties: { kind: 'circle' },
            geometry: {
              type: 'Point',
              coordinates: [geofence.center[1], geofence.center[0]]
            },
            radius_meters: geofence.radius
          }
        : {
            type: 'Feature',
            properties: { kind: 'polygon' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  ...geofence.points.map(([lat, lng]) => [lng, lat]),
                  [geofence.points[0][1], geofence.points[0][0]]
                ]
              ]
            }
          }
  );

  async function load() {
    try {
      geofences = await api('/api/geocercas');
    } catch (e) {
      error = e.message;
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!geofence) {
      error = 'Dibuja una geocerca primero';
      return;
    }
    saving = true;
    error = '';
    notice = '';
    try {
      await api('/api/geocercas', {
        method: 'POST',
        body: JSON.stringify({ nombre, geocerca: geofence })
      });
      nombre = '';
      notice = 'Geocerca guardada';
      await load();
    } catch (e2) {
      error = e2.message;
    } finally {
      saving = false;
    }
  }

  function editGeo(g) {
    geofence = g.datos;
    error = '';
    notice = '';
  }

  async function removeGeo(id) {
    try {
      await api(`/api/geocercas/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    goto('/');
  }

  onMount(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return goto('/');
    await load();
  });
</script>

<main>
  <header style="display:flex;justify-content:space-between;align-items:center">
    <h1>Geocercas</h1>
    <div style="display:flex;gap:0.75rem;align-items:center">
      <a href="/dashboard">Panel</a>
      <button onclick={logout}>Salir</button>
    </div>
  </header>

  <p>Dibuja una geocerca circular o poligonal sobre el mapa y guárdala.</p>

  <GeofenceMap bind:value={geofence} />

  {#if geojson}
    <h2>Geocerca actual</h2>
    <pre>{JSON.stringify(geojson, null, 2)}</pre>
  {/if}

  <form onsubmit={save} style="margin-top:1rem;display:flex;gap:0.5rem">
    <input bind:value={nombre} placeholder="Nombre de la geocerca" required />
    <button type="submit" disabled={saving || !geofence}>
      {saving ? 'Guardando…' : 'Guardar'}
    </button>
  </form>

  {#if error}<p class="error">{error}</p>{/if}
  {#if notice}<p>{notice}</p>{/if}

  {#if geofences.length > 0}
    <h2>Geocercas guardadas</h2>
    <table>
      <thead>
        <tr><th>Nombre</th><th>Tipo</th><th>Creada</th><th></th></tr>
      </thead>
      <tbody>
        {#each geofences as g (g.id)}
          <tr>
            <td>{g.nombre}</td>
            <td>{g.kind === 'circle' ? 'Círculo' : 'Polígono'}</td>
            <td>{new Date(g.created_at).toLocaleString()}</td>
            <td style="display:flex;gap:0.5rem">
              <button onclick={() => editGeo(g)}>Ver</button>
              <button onclick={() => removeGeo(g.id)}>Eliminar</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>

<style>
  main {
    max-width: 900px;
  }
  pre {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.8rem;
  }
</style>
