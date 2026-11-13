<script>
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  let done = $state(false);

  async function signup() {
    loading = true;
    error = '';
    const { error: err } = await supabase.auth.signUp({ email, password });
    loading = false;
    if (err) error = err.message;
    else done = true;
  }
</script>

<main>
  <h1>Crear cuenta</h1>
  {#if done}
    <p>Revisa tu correo para confirmar tu cuenta.</p>
  {:else}
    {#if error}<p class="error">{error}</p>{/if}
    <form onsubmit={(e) => { e.preventDefault(); signup(); }}>
      <input type="email" bind:value={email} placeholder="Email" required />
      <input type="password" bind:value={password} placeholder="Contraseña" required />
      <button type="submit" disabled={loading}>{loading ? 'Registrando…' : 'Registrarse'}</button>
    </form>
  {/if}
  <p><a href="/">Iniciar sesión</a></p>
</main>
