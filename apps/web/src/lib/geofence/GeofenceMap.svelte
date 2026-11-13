<script>
  import { onMount, onDestroy } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
  import markerIcon from 'leaflet/dist/images/marker-icon.png';
  import markerShadow from 'leaflet/dist/images/marker-shadow.png';

  // value: geocerca dibujada
  //   { kind: 'circle',   center: [lat, lng], radius: <metros> }
  //   { kind: 'polygon',  points: [[lat, lng], ...] }
  let {
    value = $bindable(null),
    center = [19.4326, -99.1332], // Ciudad de México por defecto
    zoom = 13,
    onChange = null
  } = $props();

  // Leaflet no es SSR-safe: se importa dinámicamente en onMount
  let L = null;
  let mapEl;
  let map = null;
  let overlays = null; // capa con la geocerca confirmada
  let draftLayer = null; // vista previa del polígono en dibujo
  let circleMarker = null; // marcador de centro arrastrable (modo círculo)
  let circleLayer = null;

  let mode = $state('pan'); // 'pan' | 'circle' | 'polygon'
  let draft = $state([]); // vértices del polígono en dibujo
  let radius = $state(500); // metros
  let hint = $state('');

  const clampRadius = (m) => Math.min(50000, Math.max(10, Math.round(m)));

  function fixDefaultIcon() {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  function emit(next) {
    value = next;
    onChange?.(next);
  }

  function clearOverlays() {
    overlays?.clearLayers();
    draftLayer?.remove();
    draftLayer = null;
    circleMarker?.remove();
    circleMarker = null;
    circleLayer?.remove();
    circleLayer = null;
  }

  function renderValue() {
    clearOverlays();
    if (!value || !overlays) return;

    if (value.kind === 'circle') {
      circleLayer = L.circle(value.center, {
        radius: value.radius,
        color: '#3b82f6',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.15
      }).addTo(overlays);

      circleMarker = L.marker(value.center, { draggable: true }).addTo(overlays);
      circleMarker.on('drag', () => {
        const latlng = circleMarker.getLatLng();
        emit({ kind: 'circle', center: [latlng.lat, latlng.lng], radius: value.radius });
      });
      circleLayer.bindTooltip(`Radio: ${(value.radius / 1000).toFixed(2)} km`);
    } else if (value.kind === 'polygon') {
      L.polygon(value.points, {
        color: '#3b82f6',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.15
      }).addTo(overlays);
      value.points.forEach((pt) => L.circleMarker(pt, { radius: 5 }).addTo(overlays));
    }
  }

  function syncDraft() {
    draftLayer?.remove();
    draftLayer = null;
    if (draft.length === 0) return;
    const latlngs = draft.map(([lat, lng]) => [lat, lng]);
    // vista previa: línea + polígono fantasma si hay >= 3 puntos
    const layers = [L.polyline(latlngs, { color: '#f59e0b', dashArray: '6 6', weight: 2 })];
    if (draft.length >= 3) {
      layers.push(
        L.polygon(latlngs, { color: '#f59e0b', weight: 1, fillOpacity: 0.05 })
      );
    }
    draft.forEach((pt) => layers.push(L.circleMarker(pt, { radius: 5, color: '#f59e0b' })));
    draftLayer = L.layerGroup(layers).addTo(map);
  }

  function setMode(next) {
    mode = next;
    draft = [];
    draftLayer?.remove();
    draftLayer = null;
    hint =
      next === 'circle'
        ? 'Haz clic en el mapa para colocar el centro de la geocerca circular.'
        : next === 'polygon'
          ? 'Haz clic para agregar vértices. Doble clic o "Cerrar polígono" para terminar.'
          : '';
    map?.doubleClickZoom?.[next === 'polygon' ? 'disable' : 'enable']();
    if (next === 'pan') renderValue();
  }

  function handleMapClick(e) {
    if (mode === 'circle') {
      emit({ kind: 'circle', center: [e.latlng.lat, e.latlng.lng], radius });
    } else if (mode === 'polygon') {
      draft = [...draft, [e.latlng.lat, e.latlng.lng]];
      syncDraft();
    }
  }

  function handleMapDblClick(e) {
    if (mode === 'polygon') {
      L.DomEvent.stop(e);
      closePolygon();
    }
  }

  function undoVertex() {
    draft = draft.slice(0, -1);
    syncDraft();
  }

  function closePolygon() {
    if (draft.length < 3) return;
    emit({ kind: 'polygon', points: draft.map(([lat, lng]) => [lat, lng]) });
    draft = [];
    draftLayer?.remove();
    draftLayer = null;
    mode = 'pan';
    map?.doubleClickZoom?.enable();
    hint = '';
    renderValue();
  }

  function clearAll() {
    emit(null);
    draft = [];
    draftLayer?.remove();
    draftLayer = null;
  }

  function onRadiusInput(e) {
    radius = clampRadius(Number(e.target.value));
    if (value?.kind === 'circle' && mode === 'circle') {
      emit({ kind: 'circle', center: value.center, radius });
    }
  }

  onMount(async () => {
    L = (await import('leaflet')).default;
    fixDefaultIcon();
    map = L.map(mapEl).setView(center, zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    overlays = L.layerGroup().addTo(map);
    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDblClick);

    renderValue();
  });

  onDestroy(() => {
    map?.remove();
    map = null;
  });

  // Re-render cuando `value` cambia (desde el dibujo o desde fuera)
  $effect(() => {
    if (map) renderValue();
  });
</script>

<div class="geofence-module">
  <div class="toolbar">
    <div class="tools">
      <button
        class:active={mode === 'pan'}
        onclick={() => setMode('pan')}
        type="button"
      >Pan</button>
      <button
        class:active={mode === 'circle'}
        onclick={() => setMode('circle')}
        type="button"
      >Círculo</button>
      <button
        class:active={mode === 'polygon'}
        onclick={() => setMode('polygon')}
        type="button"
      >Polígono</button>
      <button onclick={clearAll} type="button">Borrar</button>
    </div>

    {#if mode === 'circle'}
      <label class="radius">
        Radio: <strong>{(radius / 1000).toFixed(2)} km</strong>
        <input type="range" min="50" max="5000" step="50" value={radius} oninput={onRadiusInput} />
      </label>
    {/if}

    {#if mode === 'polygon'}
      <div class="tools">
        <button onclick={undoVertex} type="button" disabled={draft.length === 0}>Deshacer</button>
        <button onclick={closePolygon} type="button" disabled={draft.length < 3}>Cerrar polígono</button>
      </div>
    {/if}
  </div>

  {#if hint}<p class="hint">{hint}</p>{/if}

  <div class="map" bind:this={mapEl}></div>
</div>

<style>
  .geofence-module {
    border: 1px solid #334155;
    border-radius: 0.5rem;
    overflow: hidden;
    background: #1e293b;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
  }

  .tools {
    display: flex;
    gap: 0.5rem;
  }

  button {
    font: inherit;
    padding: 0.4rem 0.7rem;
    border-radius: 0.375rem;
    border: 1px solid #334155;
    background: #0f172a;
    color: inherit;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #334155;
  }

  button.active {
    background: #3b82f6;
    border-color: #3b82f6;
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .radius {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .radius input[type='range'] {
    width: 160px;
  }

  .hint {
    margin: 0;
    padding: 0 0.75rem 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .map {
    height: 420px;
    width: 100%;
    background: #0f172a;
  }

  .map :global(.leaflet-container) {
    height: 100%;
    width: 100%;
  }
</style>
