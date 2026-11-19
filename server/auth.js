import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from './db.js';

const cookieName = 'bus_admin_session';
const email = () => (process.env.ADMIN_EMAIL || 'sanjutechzzz@gmail.com').toLowerCase();

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured');
  return process.env.SESSION_SECRET;
}

export async function ensureAdmin() {
  if (!process.env.MONGODB_URI || !process.env.ADMIN_PASSWORD) return;
  const admins = (await getDatabase()).collection('admins');
  const existing = await admins.findOne({ email: email() });
  if (!existing) {
    await admins.insertOne({ email: email(), passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), createdAt: new Date() });
  }
}

export async function loginAdmin(input) {
  if (!process.env.MONGODB_URI) {
    const suppliedEmail = String(input.email || '').trim().toLowerCase();
    const suppliedPassword = String(input.password || '');
    if (suppliedEmail !== email() || suppliedPassword !== String(process.env.ADMIN_PASSWORD || '')) return false;
    return jwt.sign({ sub: 'local-admin', email: email() }, secret(), { expiresIn: '8h' });
  }
  const admins = (await getDatabase()).collection('admins');
  const admin = await admins.findOne({ email: String(input.email || '').trim().toLowerCase() });
  if (!admin || !(await bcrypt.compare(String(input.password || ''), admin.passwordHash))) return false;
  return jwt.sign({ sub: String(admin._id), email: admin.email }, secret(), { expiresIn: '8h' });
}

export function setSession(response, token) {
  response.cookie(cookieName, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 });
}

export function clearSession(response) {
  response.clearCookie(cookieName);
}

export function requireAdmin(request, response, next) {
  try {
    const token = request.cookies?.[cookieName];
    if (!token) return response.status(401).json({ error: 'Admin authentication required' });
    request.admin = jwt.verify(token, secret());
    return next();
  } catch {
    return response.status(401).json({ error: 'Admin session is invalid or expired' });
  }
}
