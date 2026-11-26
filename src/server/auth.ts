import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export type AuthRole = 'admin' | 'validator' | 'user';

export interface AuthTokenPayload {
  sub: string;
  role: AuthRole;
  name: string;
  exp: number;
}

export interface AuthedRequest extends Request {
  auth?: AuthTokenPayload;
}

const EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  return process.env.SESSION_SECRET || EPHEMERAL_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

export function safeCompareStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signAuthToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  const fullPayload: AuthTokenPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');

  if (!safeCompareStrings(sig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AuthTokenPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sesi tidak ditemukan. Silakan masuk terlebih dahulu.' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Sesi telah kedaluwarsa atau tidak valid. Silakan masuk kembali.' });
    return;
  }

  req.auth = payload;
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== 'admin') {
    res.status(403).json({ error: 'Akses ditolak. Hanya Admin KPR yang diizinkan.' });
    return;
  }
  next();
}

export function requireValidatorOrAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.auth || (req.auth.role !== 'validator' && req.auth.role !== 'admin')) {
    res.status(403).json({ error: 'Akses ditolak. Hanya Validator atau Admin KPR yang diizinkan.' });
    return;
  }
  next();
}
