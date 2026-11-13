<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  onMount(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) goto('/dashboard');
  });

  async function login() {
    loading = true;
    error = '';
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    loading = false;
    if (err) error = err.message;
    else goto('/dashboard');
  }
</script>

<main>
  <h1>Iniciar sesión</h1>
  {#if error}<p class="error">{error}</p>{/if}
  <form onsubmit={(e) => { e.preventDefault(); login(); }}>
    <input type="email" bind:value={email} placeholder="Email" required />
    <input type="password" bind:value={password} placeholder="Contraseña" required />
    <button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
  </form>
  <p><a href="/registro">Registrarse</a></p>
</main>
