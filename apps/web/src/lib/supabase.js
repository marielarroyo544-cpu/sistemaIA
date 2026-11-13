import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

export const supabase = createClient(
  env.PUBLIC_SUPABASE_URL ?? 'https://orlvidivqyxbieytsxqo.supabase.co',
  env.PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybHZpZGl2cXl4YmlleXRzeHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0OTc2NzgsImV4cCI6MjExMDA3MzY3OH0.pNgyq6jnJGspfrP8UKG5EQbt0CRbSFNL7CL_spJDuNE'
);
