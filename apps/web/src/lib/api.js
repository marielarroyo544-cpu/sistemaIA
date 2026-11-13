import { env } from '$env/dynamic/public';
import { supabase } from '$lib/supabase';

const apiBaseUrl = (env.PUBLIC_API_URL || '').replace(/\/$/, '');

export async function api(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}
