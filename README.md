# Monorepo — Sistema de Administración

- `apps/web` — Frontend SvelteKit (Svelte 5), desplegado en Vercel con `@sveltejs/adapter-vercel`.
- `apps/api` — Backend Express (Node.js) como serverless function de Vercel (`api/[[...slug]].js`).
- `supabase/schema.sql` — Esquema de base de datos + políticas RLS.

## Despliegue en Vercel (monorepo: 2 proyectos)

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta `supabase/schema.sql`.
3. En **Authentication → Users**, crea un usuario administrador.
4. Copia `Project URL`, `anon key` y `service_role key` (Settings → API).

### 2. Backend (`apps/api`)

1. En Vercel → **Add New → Project** → importa el repo y selecciona **Root Directory: `apps/api`**.
2. Framework preset: **Other** (o Node.js). No hace falta build command.
3. Agrega las variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Despliega y anota la URL, ej. `https://api-xyz.vercel.app`.

### 3. Frontend (`apps/web`)

1. Otro proyecto en Vercel con **Root Directory: `apps/web`**.
2. Framework preset: **SvelteKit** (se detecta solo).
3. Agrega las variables de entorno:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `PUBLIC_API_URL` → la URL del backend del paso 2
4. Despliega.

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
