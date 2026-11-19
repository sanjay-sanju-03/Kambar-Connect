import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRoute, normaliseTrips, readSchedule } from './schedule.js';
import { getDatabase } from './db.js';
import { clearSession, ensureAdmin, loginAdmin, requireAdmin, setSession } from './auth.js';

const app = express();
const port = process.env.PORT || 3001;
const localSchedulePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'schedule.json');
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

async function getStoredSchedule() {
  if (!process.env.MONGODB_URI) return readSchedule();
  const schedules = (await getDatabase()).collection('schedules');
  const stored = await schedules.findOne({ key: 'current' }, { projection: { _id: 0, key: 0 } });
  if (stored) return stored;
  const local = JSON.parse(await fs.readFile(localSchedulePath, 'utf8'));
  await schedules.insertOne({ key: 'current', ...local });
  return local;
}

app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'kasargod-bus-guide-api', database: Boolean(process.env.MONGODB_URI) }));
app.get('/api/schedule', async (_request, response) => {
  try { return response.json(await getStoredSchedule()); }
  catch { return response.status(500).json({ error: 'Unable to read schedule' }); }
});
app.get('/api/routes/:routeId/trips', async (request, response) => {
  try {
    const route = findRoute(await getStoredSchedule(), request.params.routeId);
    if (!route) return response.status(404).json({ error: 'Route not found' });
    return response.json({ route, trips: normaliseTrips(route) });
  } catch { return response.status(500).json({ error: 'Unable to read route' }); }
});
app.post('/api/suggestions', (request, response) => {
  const { message } = request.body || {};
  if (!message || message.length > 1000) return response.status(400).json({ error: 'A short correction message is required.' });
  return response.status(202).json({ received: true, message: 'Thanks — the correction is queued for review.' });
});

app.post('/api/admin/login', async (request, response) => {
  try {
    const token = await loginAdmin(request.body || {});
    if (!token) return response.status(401).json({ error: 'Invalid email or password' });
    setSession(response, token);
    return response.json({ authenticated: true });
  } catch { return response.status(503).json({ error: 'Admin authentication is not configured' }); }
});
app.post('/api/admin/logout', (_request, response) => { clearSession(response); response.status(204).end(); });
app.get('/api/admin/session', requireAdmin, (request, response) => response.json({ authenticated: true, email: request.admin.email }));
app.put('/api/admin/schedule', requireAdmin, async (request, response) => {
  try {
    const schedule = request.body;
    if (!schedule || !Array.isArray(schedule.routes)) return response.status(400).json({ error: 'A valid schedule with routes is required' });
    if (process.env.MONGODB_URI) {
      await (await getDatabase()).collection('schedules').replaceOne({ key: 'current' }, { key: 'current', ...schedule }, { upsert: true });
    } else {
      await fs.writeFile(localSchedulePath, `${JSON.stringify(schedule, null, 2)}\n`, 'utf8');
    }
    return response.json(schedule);
  } catch { return response.status(500).json({ error: 'Unable to save schedule' }); }
});

const distDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
app.use(express.static(distDirectory));
app.get('*', (_request, response) => response.sendFile(path.join(distDirectory, 'index.html')));

ensureAdmin().catch((error) => {
  console.error(`Unable to initialise admin database: ${error.message}`);
});

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Kasargod Bus Guide API listening on http://localhost:${port}`));
}

export default app;
