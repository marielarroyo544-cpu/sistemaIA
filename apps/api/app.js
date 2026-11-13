import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

async function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Token inválido' });
  req.user = data.user;
  next();
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/items', auth, async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('items').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/items', auth, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const { data, error } = await supabaseAdmin
    .from('items')
    .insert({ name, description: description || null, created_by: req.user.id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/items/:id', auth, async (req, res) => {
  const { error } = await supabaseAdmin.from('items').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get('/api/geocercas', auth, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('geocercas')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/geocercas', auth, async (req, res) => {
  const { nombre, geocerca } = req.body || {};
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (!geocerca || !['circle', 'polygon'].includes(geocerca.kind)) {
    return res.status(400).json({ error: 'Geocerca inválida' });
  }
  const { data, error } = await supabaseAdmin
    .from('geocercas')
    .insert({
      nombre,
      kind: geocerca.kind,
      datos: geocerca,
      created_by: req.user.id
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/geocercas/:id', auth, async (req, res) => {
  const { error } = await supabaseAdmin.from('geocercas').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default app;
