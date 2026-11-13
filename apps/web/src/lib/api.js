import { PUBLIC_API_URL } from '$env/static/public';
import { supabase } from '$lib/supabase';

export async function api(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`${PUBLIC_API_URL}${path}`, {
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
