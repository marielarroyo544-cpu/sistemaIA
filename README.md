# Monorepo — Sistema de Administración

- `apps/web` — Frontend SvelteKit (Svelte 5), desplegado en Vercel con `@sveltejs/adapter-vercel`.
- `apps/api` — Backend Express (Node.js) como service `api` de Vercel.
- `supabase/schema.sql` — Esquema de base de datos + políticas RLS.

## Despliegue en Vercel (un proyecto con services)

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta `supabase/schema.sql`.
3. En **Authentication → Users**, crea un usuario administrador.
4. Copia `Project URL`, `anon key` y `service_role key` (Settings → API).

### 2. Vercel

1. En Vercel → **Add New → Project** → importa el repo desde la raíz.
2. `vercel.json` define los services `web` (`apps/web`) y `api` (`apps/api`), y enruta `/api/*` al API y el resto al frontend.
3. Agrega las variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
4. No configures `PUBLIC_API_URL` en Vercel: el frontend usa `/api` en el mismo dominio.
5. Despliega.

## Desarrollo local

```bash
npm install

# Terminal 1 — API
cd apps/api
cp .env.example .env   # rellena las variables
npm run dev            # http://localhost:3000/api/health

# Terminal 2 — Web
cd apps/web
cp .env.example .env   # PUBLIC_API_URL=http://localhost:3000
npm run dev            # http://localhost:5173
```
