import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { getDb } from './src/server/db.ts';
import type { DbAdapter } from './src/server/db.ts';
import { ensureSeeded, generateVoterUniqueCode } from './src/server/seedData.ts';
import {
  hashPassword,
  verifyPassword,
  safeCompareStrings,
  signAuthToken,
  requireAuth,
  requireAdmin,
  requireValidatorOrAdmin,
} from './src/server/auth.ts';
import type { AuthedRequest } from './src/server/auth.ts';

const PORT = Number(process.env.PORT || 3000);

let seededOnce = false;

async function dbReady(): Promise<DbAdapter> {
  const db = await getDb();
  if (!seededOnce) {
    await ensureSeeded(db);
    seededOnce = true;
  }
  return db;
}

function mapCandidateRow(row: Record<string, unknown>) {
  const chamber = row.chamber === 'senator' ? 'senator' : 'bph';
  return {
    id: String(row.id),
    number: String(row.number),
    chamber,
    chamberLabel:
      chamber === 'bph'
        ? 'Calon Ketua BPH HIMATEKIA-ITERA 2026'
        : 'Calon Senator HIMATEKIA-ITERA 2026',
    name: String(row.name),
    nim: String(row.nim),
    cohort: String(row.cohort),
    origin: String(row.origin),
    motto: String(row.motto),
    vision: String(row.vision),
    missions: JSON.parse(String(row.missions_json || '[]')) as string[],
    programs: JSON.parse(String(row.programs_json || '[]')) as Array<{
      title: string;
      summary: string;
      target: string;
    }>,
    trackRecord: JSON.parse(String(row.track_record_json || '[]')) as string[],
    plateVariant: String(row.plate_variant || 'distillation'),
    photoUrl: row.photo_url ? String(row.photo_url) : null,
  };
}

function mapVoterRow(row: Record<string, unknown>) {
  return {
    nim: String(row.nim),
    fullName: String(row.full_name),
    programStudi: String(row.program_studi),
    angkatan: String(row.angkatan),
    gender: String(row.gender),
    membershipStatus: String(row.membership_status),
    role: (row.role === 'validator' ? 'validator' : 'user') as 'validator' | 'user',
    uniqueCode: String(row.unique_code),
    hasPassword: Boolean(row.password_hash),
    validationStatus: row.validation_status === 'validated' ? 'validated' : 'pending',
    validatedBy: row.validated_by ? String(row.validated_by) : null,
    validatedAt: row.validated_at ? String(row.validated_at) : null,
    hasVoted: Boolean(row.has_voted),
    votedAt: row.voted_at ? String(row.voted_at) : null,
  };
}

function extractCodeFromInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { code?: string; nim?: string };
      if (parsed.code) return String(parsed.code).trim();
      if (parsed.nim) return String(parsed.nim).trim();
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

async function logAudit(
  db: DbAdapter,
  actorRole: string,
  actorId: string,
  action: string,
  targetId: string | null,
  details: string
) {
  await db.query(
    `INSERT INTO audit_logs (actor_role, actor_id, action, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
    [actorRole, actorId, action, targetId, details]
  );
  await db.persistSnapshot();
}

function validateCandidatePhotoUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const val = String(raw).trim();
  if (!val) return null;

  // Allow safe internal static paths only
  if (val.startsWith('/assets/') && !val.includes('..') && !val.includes('\\')) {
    return val;
  }

  // Validate base64 data URI for raster images only (PNG, JPEG, WebP)
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(val);
  if (!match) {
    throw Object.assign(
      new Error('Format foto kandidat harus berupa gambar PNG, JPG/JPEG, atau WebP.'),
      { statusCode: 400 }
    );
  }

  const ext = match[1].toLowerCase();
  const buf = Buffer.from(match[2], 'base64');
  if (buf.length === 0 || buf.length > 3 * 1024 * 1024) {
    throw Object.assign(
      new Error('Ukuran foto kandidat maksimal 3 MB.'),
      { statusCode: 400 }
    );
  }

  const isPng =
    buf.length >= 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;
  const isJpeg =
    buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isWebp =
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP';

  const validBytes =
    (ext === 'png' && isPng) ||
    ((ext === 'jpeg' || ext === 'jpg') && isJpeg) ||
    (ext === 'webp' && isWebp);

  if (!validBytes) {
    throw Object.assign(
      new Error('Isi file gambar tidak valid atau rusak.'),
      { statusCode: 400 }
    );
  }

  return val;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public overview: candidates + aggregate counts
  app.get('/api/public/overview', async (_req, res) => {
    try {
      const db = await dbReady();
      const [candRes, statsRes] = await Promise.all([
        db.query('SELECT * FROM candidates ORDER BY chamber ASC, number ASC'),
        db.query(`
          SELECT
            COUNT(*) AS total_dpt,
            SUM(CASE WHEN validation_status = 'validated' THEN 1 ELSE 0 END) AS total_validated,
            SUM(CASE WHEN has_voted = TRUE THEN 1 ELSE 0 END) AS total_voted
          FROM voters
        `),
      ]);

      const candidates = candRes.rows.map((r) => mapCandidateRow(r as Record<string, unknown>));
      const statRow = (statsRes.rows[0] ?? {}) as Record<string, unknown>;

      res.json({
        candidates,
        stats: {
          totalDpt: Number(statRow.total_dpt ?? 0),
          totalValidated: Number(statRow.total_validated ?? 0),
          totalVoted: Number(statRow.total_voted ?? 0),
        },
      });
    } catch (err) {
      console.error('Failed loading public overview:', err);
      res.status(500).json({ error: 'Gagal memuat data pemilihan.' });
    }
  });

  // Admin auth status
  app.get('/api/auth/admin-status', async (_req, res) => {
    try {
      const db = await dbReady();
      const envPassword = process.env.ADMIN_PASSWORD?.trim() || '';
      const envUsername = process.env.ADMIN_USERNAME?.trim() || 'admin_kpr_himatekia';
      const existing = await db.query('SELECT id, username FROM admin_config WHERE id = 1');

      res.json({
        envConfigured: envPassword.length > 0,
        bootstrapped: existing.rows.length > 0,
        suggestedUsername: envPassword.length > 0 ? envUsername : String(existing.rows[0]?.username || envUsername),
      });
    } catch (err) {
      console.error('Failed checking admin status:', err);
      res.status(500).json({ error: 'Gagal memeriksa status admin.' });
    }
  });

  // First-run admin claim (only active when ADMIN_PASSWORD env is empty and not yet bootstrapped)
  app.post('/api/auth/admin/bootstrap', async (req, res) => {
    try {
      const db = await dbReady();
      const envPassword = process.env.ADMIN_PASSWORD?.trim() || '';
      if (envPassword.length > 0) {
        res.status(403).json({
          error: 'Kredensial admin sudah diatur melalui variabel lingkungan (.env).',
        });
        return;
      }

      const existing = await db.query('SELECT id FROM admin_config WHERE id = 1');
      if (existing.rows.length > 0) {
        res.status(409).json({
          error: 'Akun admin awal sudah diklaim. Silakan masuk dengan kata sandi admin.',
        });
        return;
      }

      const username = String(req.body?.username || '').trim();
      const password = String(req.body?.password || '');

      if (username.length < 3) {
        res.status(400).json({ error: 'Username admin minimal 3 karakter.' });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: 'Kata sandi admin minimal 6 karakter.' });
        return;
      }

      const passwordHash = hashPassword(password);
      await db.query(
        'INSERT INTO admin_config (id, username, password_hash) VALUES (1, $1, $2)',
        [username, passwordHash]
      );
      await logAudit(db, 'admin', username, 'ADMIN_BOOTSTRAP', username, 'Aktivasi kredensial awal Admin KPR');

      const token = signAuthToken({
        sub: username,
        role: 'admin',
        name: 'Administrator KPR',
      });

      res.status(201).json({
        token,
        user: { role: 'admin', username, name: 'Administrator KPR' },
      });
    } catch (err) {
      console.error('Admin bootstrap failed:', err);
      res.status(500).json({ error: 'Gagal mengaktifkan akun admin.' });
    }
  });

  // Admin login
  app.post('/api/auth/admin/login', async (req, res) => {
    try {
      const db = await dbReady();
      const username = String(req.body?.username || '').trim();
      const password = String(req.body?.password || '');

      if (!username || !password) {
        res.status(400).json({ error: 'Username dan kata sandi wajib diisi.' });
        return;
      }

      const envPassword = process.env.ADMIN_PASSWORD?.trim() || '';
      const envUsername = process.env.ADMIN_USERNAME?.trim() || 'admin_kpr_himatekia';

      if (envPassword.length > 0) {
        if (!safeCompareStrings(username, envUsername) || !safeCompareStrings(password, envPassword)) {
          res.status(401).json({ error: 'Username atau kata sandi admin tidak sesuai.' });
          return;
        }
      } else {
        const adminRes = await db.query('SELECT username, password_hash FROM admin_config WHERE id = 1');
        if (adminRes.rows.length === 0) {
          res.status(409).json({
            error: 'Admin belum diaktivasi. Silakan buat kata sandi admin awal terlebih dahulu.',
          });
          return;
        }
        const row = adminRes.rows[0] as Record<string, unknown>;
        if (
          !safeCompareStrings(username, String(row.username)) ||
          !verifyPassword(password, String(row.password_hash))
        ) {
          res.status(401).json({ error: 'Username atau kata sandi admin tidak sesuai.' });
          return;
        }
      }

      await logAudit(db, 'admin', username, 'ADMIN_LOGIN', null, 'Admin masuk ke konsol pengelolaan');

      const token = signAuthToken({
        sub: username,
        role: 'admin',
        name: 'Administrator KPR',
      });

      res.json({
        token,
        user: { role: 'admin', username, name: 'Administrator KPR' },
      });
    } catch (err) {
      console.error('Admin login failed:', err);
      res.status(500).json({ error: 'Gagal memproses login admin.' });
    }
  });

  // Voter / Validator NIM lookup before login
  app.post('/api/auth/voter/lookup', async (req, res) => {
    try {
      const db = await dbReady();
      const nim = String(req.body?.nim || '').trim();

      if (!/^\d{6,12}$/.test(nim)) {
        res.status(400).json({ error: 'Format NIM tidak valid.' });
        return;
      }

      const result = await db.query(
        'SELECT nim, full_name, angkatan, role, password_hash FROM voters WHERE nim = $1',
        [nim]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'NIM tidak terdaftar dalam Daftar Pemilih Tetap (DPT) Teknik Kimia ITERA.',
        });
        return;
      }

      const row = result.rows[0] as Record<string, unknown>;
      res.json({
        nim: String(row.nim),
        fullName: String(row.full_name),
        angkatan: String(row.angkatan),
        role: row.role === 'validator' ? 'validator' : 'user',
        hasPassword: Boolean(row.password_hash),
      });
    } catch (err) {
      console.error('Voter lookup failed:', err);
      res.status(500).json({ error: 'Gagal mencari data pemilih.' });
    }
  });

  // Voter / Validator login (activates PIN/password on first sign-in)
  app.post('/api/auth/voter/login', async (req, res) => {
    try {
      const db = await dbReady();
      const nim = String(req.body?.nim || '').trim();
      const password = String(req.body?.password || '');

      if (!/^\d{6,12}$/.test(nim)) {
        res.status(400).json({ error: 'NIM tidak valid.' });
        return;
      }
      if (password.length < 4) {
        res.status(400).json({ error: 'PIN / kata sandi minimal 4 karakter.' });
        return;
      }

      const result = await db.query('SELECT * FROM voters WHERE nim = $1', [nim]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'NIM tidak ditemukan dalam DPT.' });
        return;
      }

      const row = result.rows[0] as Record<string, unknown>;
      if (!row.password_hash) {
        const newHash = hashPassword(password);
        await db.query('UPDATE voters SET password_hash = $1 WHERE nim = $2', [newHash, nim]);
        await logAudit(
          db,
          row.role === 'validator' ? 'validator' : 'user',
          nim,
          'VOTER_ACTIVATE',
          nim,
          `${String(row.full_name)} mengaktifkan akun pemilih`
        );
      } else if (!verifyPassword(password, String(row.password_hash))) {
        res.status(401).json({ error: 'PIN / kata sandi tidak sesuai.' });
        return;
      }

      const updatedRes = await db.query('SELECT * FROM voters WHERE nim = $1', [nim]);
      const voter = mapVoterRow(updatedRes.rows[0] as Record<string, unknown>);

      const token = signAuthToken({
        sub: voter.nim,
        role: voter.role,
        name: voter.fullName,
      });

      res.json({ token, voter });
    } catch (err) {
      console.error('Voter login failed:', err);
      res.status(500).json({ error: 'Gagal masuk ke portal pemilih.' });
    }
  });

  // Refresh current session profile
  app.get('/api/auth/me', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const db = await dbReady();
      if (req.auth?.role === 'admin') {
        res.json({
          role: 'admin',
          user: { role: 'admin', username: req.auth.sub, name: req.auth.name },
        });
        return;
      }

      const voterRes = await db.query('SELECT * FROM voters WHERE nim = $1', [req.auth?.sub]);
      if (voterRes.rows.length === 0) {
        res.status(404).json({ error: 'Data pemilih tidak ditemukan.' });
        return;
      }

      const voter = mapVoterRow(voterRes.rows[0] as Record<string, unknown>);
      res.json({ role: voter.role, voter });
    } catch (err) {
      console.error('Failed loading session profile:', err);
      res.status(500).json({ error: 'Gagal memuat profil sesi.' });
    }
  });

  // Voter submits ballot (requires validated status!)
  app.post('/api/voter/vote', requireAuth, async (req: AuthedRequest, res) => {
    try {
      if (!req.auth || req.auth.role === 'admin') {
        res.status(403).json({ error: 'Hanya pemilih terdaftar (DPT) yang dapat mencoblos.' });
        return;
      }

      const bphCandidateId = String(req.body?.bphCandidateId || '').trim();
      const senatorCandidateId = String(req.body?.senatorCandidateId || '').trim();

      if (!bphCandidateId || !senatorCandidateId) {
        res.status(400).json({ error: 'Wajib memilih 1 Calon Ketua BPH dan 1 Calon Senator.' });
        return;
      }

      const db = await dbReady();
      const nim = req.auth.sub;

      const receiptCode = await db.withTransaction(async (client) => {
        const voterRes = await client.query('SELECT * FROM voters WHERE nim = $1', [nim]);
        if (voterRes.rows.length === 0) {
          throw Object.assign(new Error('Data pemilih tidak ditemukan.'), { statusCode: 404 });
        }

        const voter = voterRes.rows[0] as Record<string, unknown>;
        if (voter.validation_status !== 'validated') {
          throw Object.assign(
            new Error('Akun Anda belum divalidasi oleh Validator. Tunjukkan barcode atau kode unik Anda ke Validator terlebih dahulu.'),
            { statusCode: 403 }
          );
        }
        if (Boolean(voter.has_voted)) {
          throw Object.assign(new Error('Hak pilih Anda sudah digunakan sebelumnya.'), {
            statusCode: 409,
          });
        }

        const bphRes = await client.query(
          "SELECT id FROM candidates WHERE id = $1 AND chamber = 'bph'",
          [bphCandidateId]
        );
        const senRes = await client.query(
          "SELECT id FROM candidates WHERE id = $1 AND chamber = 'senator'",
          [senatorCandidateId]
        );

        if (bphRes.rows.length === 0 || senRes.rows.length === 0) {
          throw Object.assign(new Error('Pilihan kandidat tidak valid.'), { statusCode: 400 });
        }

        const code = `HMTK26-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        await client.query(
          'INSERT INTO votes (bph_candidate_id, senator_candidate_id, receipt_code) VALUES ($1, $2, $3)',
          [bphCandidateId, senatorCandidateId, code]
        );

        await client.query(
          'UPDATE voters SET has_voted = TRUE, voted_at = CURRENT_TIMESTAMP WHERE nim = $1',
          [nim]
        );

        await client.query(
          'INSERT INTO audit_logs (actor_role, actor_id, action, target_id, details) VALUES ($1, $2, $3, $4, $5)',
          [
            'voter',
            'ANONIM',
            'CAST_VOTE',
            code,
            `Satu surat suara sah (BPH & Senator) disegel (Angkatan ${String(voter.angkatan)})`,
          ]
        );

        return code;
      });

      res.status(201).json({
        receiptCode,
        message: 'Suara Anda berhasil direkam secara rahasia.',
      });
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode || 500;
      const message = err instanceof Error ? err.message : 'Gagal mengirim suara.';
      res.status(status).json({ error: message });
    }
  });

  // Validator: look up voter by unique code, QR barcode payload, or NIM
  app.get('/api/validator/lookup', requireAuth, requireValidatorOrAdmin, async (req, res) => {
    try {
      const db = await dbReady();
      const rawCode = String(req.query.code || '');
      const extracted = extractCodeFromInput(rawCode);

      if (!extracted) {
        res.status(400).json({ error: 'Masukkan kode unik, hasil pindai barcode, atau NIM pemilih.' });
        return;
      }

      const upper = extracted.toUpperCase();
      const result = await db.query(
        'SELECT * FROM voters WHERE UPPER(unique_code) = $1 OR nim = $2',
        [upper, extracted]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Kode unik atau NIM pemilih tidak ditemukan dalam DPT.' });
        return;
      }

      res.json({ voter: mapVoterRow(result.rows[0] as Record<string, unknown>) });
    } catch (err) {
      console.error('Validator lookup failed:', err);
      res.status(500).json({ error: 'Gagal memeriksa data pemilih.' });
    }
  });

  // Validator: validate a voter so they can vote
  app.post(
    '/api/validator/validate',
    requireAuth,
    requireValidatorOrAdmin,
    async (req: AuthedRequest, res) => {
      try {
        const db = await dbReady();
        const rawCode = String(req.body?.code || '');
        const extracted = extractCodeFromInput(rawCode);

        if (!extracted) {
          res.status(400).json({ error: 'Kode unik atau barcode pemilih wajib diisi.' });
          return;
        }

        const upper = extracted.toUpperCase();
        const validatorLabel = `${req.auth?.name || req.auth?.sub} (${req.auth?.sub})`;

        const result = await db.withTransaction(async (client) => {
          const found = await client.query(
            'SELECT * FROM voters WHERE UPPER(unique_code) = $1 OR nim = $2',
            [upper, extracted]
          );

          if (found.rows.length === 0) {
            throw Object.assign(new Error('Pemilih tidak ditemukan dalam DPT.'), {
              statusCode: 404,
            });
          }

          const row = found.rows[0] as Record<string, unknown>;
          if (Boolean(row.has_voted)) {
            throw Object.assign(new Error('Pemilih ini sudah selesai memberikan suara.'), {
              statusCode: 409,
            });
          }

          if (row.validation_status === 'validated') {
            return { alreadyValidated: true, voter: mapVoterRow(row) };
          }

          await client.query(
            `UPDATE voters SET validation_status = 'validated', validated_by = $1, validated_at = CURRENT_TIMESTAMP WHERE nim = $2`,
            [validatorLabel, String(row.nim)]
          );

          await client.query(
            'INSERT INTO audit_logs (actor_role, actor_id, action, target_id, details) VALUES ($1, $2, $3, $4, $5)',
            [
              req.auth?.role || 'validator',
              req.auth?.sub || 'unknown',
              'VALIDATE_VOTER',
              String(row.nim),
              `Validasi pemilih ${String(row.full_name)} (${String(row.nim)})`,
            ]
          );

          const updated = await client.query('SELECT * FROM voters WHERE nim = $1', [
            String(row.nim),
          ]);
          return {
            alreadyValidated: false,
            voter: mapVoterRow(updated.rows[0] as Record<string, unknown>),
          };
        });

        res.json(result);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode || 500;
        const message = err instanceof Error ? err.message : 'Gagal memvalidasi pemilih.';
        res.status(status).json({ error: message });
      }
    }
  );

  // Validator: recent validated voters
  app.get('/api/validator/recent', requireAuth, requireValidatorOrAdmin, async (_req, res) => {
    try {
      const db = await dbReady();
      const result = await db.query(
        `SELECT * FROM voters WHERE validation_status = 'validated' ORDER BY validated_at DESC LIMIT 30`
      );
      res.json({
        items: result.rows.map((r) => mapVoterRow(r as Record<string, unknown>)),
      });
    } catch (err) {
      console.error('Failed loading recent validations:', err);
      res.status(500).json({ error: 'Gagal memuat riwayat validasi.' });
    }
  });

  // Admin: Monitoring overview
  app.get('/api/admin/monitoring', requireAuth, requireAdmin, async (_req, res) => {
    try {
      const db = await dbReady();
      const [summaryRes, cohortRes, candRes, logsRes] = await Promise.all([
        db.query(`
          SELECT
            COUNT(*) AS total_dpt,
            SUM(CASE WHEN role = 'validator' THEN 1 ELSE 0 END) AS total_validators,
            SUM(CASE WHEN validation_status = 'validated' THEN 1 ELSE 0 END) AS total_validated,
            SUM(CASE WHEN has_voted = TRUE THEN 1 ELSE 0 END) AS total_voted
          FROM voters
        `),
        db.query(`
          SELECT
            angkatan,
            COUNT(*) AS total,
            SUM(CASE WHEN validation_status = 'validated' THEN 1 ELSE 0 END) AS validated,
            SUM(CASE WHEN has_voted = TRUE THEN 1 ELSE 0 END) AS voted
          FROM voters
          GROUP BY angkatan
          ORDER BY angkatan ASC
        `),
        db.query(`
          SELECT
            SUM(CASE WHEN chamber = 'bph' THEN 1 ELSE 0 END) AS bph_count,
            SUM(CASE WHEN chamber = 'senator' THEN 1 ELSE 0 END) AS senator_count
          FROM candidates
        `),
        db.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 40'),
      ]);

      const sumRow = (summaryRes.rows[0] ?? {}) as Record<string, unknown>;
      const candRow = (candRes.rows[0] ?? {}) as Record<string, unknown>;

      res.json({
        summary: {
          totalDpt: Number(sumRow.total_dpt ?? 0),
          totalValidators: Number(sumRow.total_validators ?? 0),
          totalValidated: Number(sumRow.total_validated ?? 0),
          totalVoted: Number(sumRow.total_voted ?? 0),
          pendingValidation:
            Number(sumRow.total_dpt ?? 0) - Number(sumRow.total_validated ?? 0),
          bphCandidatesCount: Number(candRow.bph_count ?? 0),
          senatorCandidatesCount: Number(candRow.senator_count ?? 0),
        },
        cohorts: cohortRes.rows.map((r) => {
          const row = r as Record<string, unknown>;
          return {
            angkatan: String(row.angkatan),
            total: Number(row.total ?? 0),
            validated: Number(row.validated ?? 0),
            voted: Number(row.voted ?? 0),
          };
        }),
        logs: logsRes.rows.map((r) => {
          const row = r as Record<string, unknown>;
          return {
            id: Number(row.id),
            actorRole: String(row.actor_role),
            actorId: String(row.actor_id),
            action: String(row.action),
            targetId: row.target_id ? String(row.target_id) : null,
            details: String(row.details),
            createdAt: String(row.created_at),
          };
        }),
      });
    } catch (err) {
      console.error('Monitoring endpoint failed:', err);
      res.status(500).json({ error: 'Gagal memuat data monitoring.' });
    }
  });

  // Admin: Users list & search
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const db = await dbReady();
      const search = String(req.query.search || '').trim().toLowerCase();
      const angkatan = String(req.query.angkatan || 'all').trim();
      const role = String(req.query.role || 'all').trim();
      const status = String(req.query.status || 'all').trim();

      const allRes = await db.query('SELECT * FROM voters ORDER BY angkatan ASC, nim ASC');
      let users = allRes.rows.map((r) => mapVoterRow(r as Record<string, unknown>));

      if (search) {
        users = users.filter(
          (u) =>
            u.nim.toLowerCase().includes(search) ||
            u.fullName.toLowerCase().includes(search) ||
            u.uniqueCode.toLowerCase().includes(search)
        );
      }
      if (angkatan !== 'all') {
        users = users.filter((u) => u.angkatan === angkatan);
      }
      if (role !== 'all') {
        users = users.filter((u) => u.role === role);
      }
      if (status === 'pending') {
        users = users.filter((u) => u.validationStatus === 'pending');
      } else if (status === 'validated') {
        users = users.filter((u) => u.validationStatus === 'validated' && !u.hasVoted);
      } else if (status === 'voted') {
        users = users.filter((u) => u.hasVoted);
      }

      res.json({ users, total: users.length });
    } catch (err) {
      console.error('Admin users list failed:', err);
      res.status(500).json({ error: 'Gagal memuat daftar pengguna.' });
    }
  });

  // Admin: Add new DPT voter manually
  app.post('/api/admin/users', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    try {
      const db = await dbReady();
      const nim = String(req.body?.nim || '').trim();
      const fullName = String(req.body?.fullName || '').trim();
      const angkatan = String(req.body?.angkatan || '').trim();
      const gender = String(req.body?.gender || 'Laki-laki').trim();
      const role = req.body?.role === 'validator' ? 'validator' : 'user';

      if (!/^\d{6,12}$/.test(nim) || fullName.length < 2 || !/^\d{4}$/.test(angkatan)) {
        res.status(400).json({ error: 'NIM, nama lengkap, dan angkatan (4 digit) wajib valid.' });
        return;
      }

      const existing = await db.query('SELECT nim FROM voters WHERE nim = $1', [nim]);
      if (existing.rows.length > 0) {
        res.status(409).json({ error: 'NIM tersebut sudah terdaftar dalam DPT.' });
        return;
      }

      const uniqueCode = generateVoterUniqueCode(nim, angkatan);
      await db.query(
        `INSERT INTO voters (nim, full_name, program_studi, angkatan, gender, membership_status, role, unique_code)
         VALUES ($1, $2, 'Teknik Kimia', $3, $4, 'Anggota Biasa', $5, $6)`,
        [nim, fullName, angkatan, gender, role, uniqueCode]
      );

      await logAudit(
        db,
        'admin',
        req.auth?.sub || 'admin',
        'ADD_VOTER',
        nim,
        `Menambahkan pemilih ${fullName} (${nim}) sebagai ${role}`
      );

      const created = await db.query('SELECT * FROM voters WHERE nim = $1', [nim]);
      res.status(201).json({ user: mapVoterRow(created.rows[0] as Record<string, unknown>) });
    } catch (err) {
      console.error('Admin add user failed:', err);
      res.status(500).json({ error: 'Gagal menambahkan pemilih baru.' });
    }
  });

  // Admin: Assign or revoke Validator role
  app.patch('/api/admin/users/:nim/role', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    try {
      const db = await dbReady();
      const nim = String(req.params.nim || '').trim();
      const role = req.body?.role === 'validator' ? 'validator' : 'user';

      const found = await db.query('SELECT * FROM voters WHERE nim = $1', [nim]);
      if (found.rows.length === 0) {
        res.status(404).json({ error: 'Pemilih tidak ditemukan.' });
        return;
      }

      await db.query('UPDATE voters SET role = $1 WHERE nim = $2', [role, nim]);
      await logAudit(
        db,
        'admin',
        req.auth?.sub || 'admin',
        'SET_ROLE',
        nim,
        `Mengubah peran ${String(found.rows[0].full_name)} (${nim}) menjadi ${role}`
      );

      const updated = await db.query('SELECT * FROM voters WHERE nim = $1', [nim]);
      res.json({ user: mapVoterRow(updated.rows[0] as Record<string, unknown>) });
    } catch (err) {
      console.error('Update role failed:', err);
      res.status(500).json({ error: 'Gagal memperbarui peran pengguna.' });
    }
  });

  // Admin: Update validation status (only if not yet voted)
  app.patch(
    '/api/admin/users/:nim/validation',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res) => {
      try {
        const db = await dbReady();
        const nim = String(req.params.nim || '').trim();
        const validationStatus = req.body?.validationStatus === 'validated' ? 'validated' : 'pending';

        const found = await db.query('SELECT * FROM voters WHERE nim = $1', [nim]);
        if (found.rows.length === 0) {
          res.status(404).json({ error: 'Pemilih tidak ditemukan.' });
          return;
        }
        if (Boolean(found.rows[0].has_voted)) {
          res.status(409).json({ error: 'Status pemilih yang sudah mencoblos tidak dapat direset.' });
          return;
        }

        if (validationStatus === 'validated') {
          await db.query(
            `UPDATE voters SET validation_status = 'validated', validated_by = $1, validated_at = CURRENT_TIMESTAMP WHERE nim = $2`,
            [`Admin (${req.auth?.sub || 'admin'})`, nim]
          );
        } else {
          await db.query(
            `UPDATE voters SET validation_status = 'pending', validated_by = NULL, validated_at = NULL WHERE nim = $1`,
            [nim]
          );
        }

        await logAudit(
          db,
          'admin',
          req.auth?.sub || 'admin',
          'SET_VALIDATION',
          nim,
          `Mengatur status validasi ${nim} menjadi ${validationStatus}`
        );

        const updated = await db.query('SELECT * FROM voters WHERE nim = $1', [nim]);
        res.json({ user: mapVoterRow(updated.rows[0] as Record<string, unknown>) });
      } catch (err) {
        console.error('Update validation status failed:', err);
        res.status(500).json({ error: 'Gagal memperbarui status validasi.' });
      }
    }
  );

  // Admin: Candidates CRUD
  app.get('/api/admin/candidates', requireAuth, requireAdmin, async (_req, res) => {
    try {
      const db = await dbReady();
      const candRes = await db.query('SELECT * FROM candidates ORDER BY chamber ASC, number ASC');
      res.json({
        candidates: candRes.rows.map((r) => mapCandidateRow(r as Record<string, unknown>)),
      });
    } catch (err) {
      console.error('Admin candidates fetch failed:', err);
      res.status(500).json({ error: 'Gagal memuat daftar kandidat.' });
    }
  });

  app.post('/api/admin/candidates', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    try {
      const db = await dbReady();
      const chamber = req.body?.chamber === 'senator' ? 'senator' : 'bph';
      const number = String(req.body?.number || '').trim();
      const name = String(req.body?.name || '').trim();
      const nim = String(req.body?.nim || '').trim();
      const cohort = String(req.body?.cohort || '').trim();
      const origin = String(req.body?.origin || 'Lampung').trim();
      const motto = String(req.body?.motto || '').trim();
      const vision = String(req.body?.vision || '').trim();
      const missions = Array.isArray(req.body?.missions)
        ? req.body.missions.map((m: unknown) => String(m).trim()).filter(Boolean)
        : [];
      const programs = Array.isArray(req.body?.programs) ? req.body.programs : [];
      const trackRecord = Array.isArray(req.body?.trackRecord)
        ? req.body.trackRecord.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [];
      const plateVariant = String(
        req.body?.plateVariant || (chamber === 'bph' ? 'distillation' : 'lattice')
      );
      const photoUrl = validateCandidatePhotoUrl(req.body?.photoUrl);

      if (!number || !name || !nim || !vision) {
        res.status(400).json({ error: 'Nomor urut, nama, NIM, dan visi wajib diisi.' });
        return;
      }

      const id = `${chamber}-${crypto.randomBytes(3).toString('hex')}`;
      await db.query(
        `INSERT INTO candidates (id, number, chamber, name, nim, cohort, origin, motto, vision, missions_json, programs_json, track_record_json, plate_variant, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          id,
          number.padStart(2, '0'),
          chamber,
          name,
          nim,
          cohort || `Teknik Kimia 20${nim.slice(1, 3)}`,
          origin,
          motto || 'Mengabdi untuk HIMATEKIA-ITERA.',
          vision,
          JSON.stringify(missions),
          JSON.stringify(programs),
          JSON.stringify(trackRecord),
          plateVariant,
          photoUrl,
        ]
      );

      await logAudit(
        db,
        'admin',
        req.auth?.sub || 'admin',
        'CREATE_CANDIDATE',
        id,
        `Menetapkan kandidat ${chamber.toUpperCase()} No. ${number}: ${name} (${nim})`
      );

      const created = await db.query('SELECT * FROM candidates WHERE id = $1', [id]);
      res.status(201).json({
        candidate: mapCandidateRow(created.rows[0] as Record<string, unknown>),
      });
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode || 500;
      const message = err instanceof Error ? err.message : 'Gagal menambahkan kandidat.';
      if (status >= 500) console.error('Create candidate failed:', err);
      res.status(status).json({ error: message });
    }
  });

  app.put('/api/admin/candidates/:id', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    try {
      const db = await dbReady();
      const id = String(req.params.id || '').trim();
      const found = await db.query('SELECT * FROM candidates WHERE id = $1', [id]);
      if (found.rows.length === 0) {
        res.status(404).json({ error: 'Kandidat tidak ditemukan.' });
        return;
      }

      const chamber = req.body?.chamber === 'senator' ? 'senator' : 'bph';
      const number = String(req.body?.number || found.rows[0].number).trim();
      const name = String(req.body?.name || found.rows[0].name).trim();
      const nim = String(req.body?.nim || found.rows[0].nim).trim();
      const cohort = String(req.body?.cohort || found.rows[0].cohort).trim();
      const origin = String(req.body?.origin || found.rows[0].origin).trim();
      const motto = String(req.body?.motto || found.rows[0].motto).trim();
      const vision = String(req.body?.vision || found.rows[0].vision).trim();
      const missions = Array.isArray(req.body?.missions)
        ? req.body.missions.map((m: unknown) => String(m).trim()).filter(Boolean)
        : JSON.parse(String(found.rows[0].missions_json || '[]'));
      const programs = Array.isArray(req.body?.programs)
        ? req.body.programs
        : JSON.parse(String(found.rows[0].programs_json || '[]'));
      const trackRecord = Array.isArray(req.body?.trackRecord)
        ? req.body.trackRecord.map((t: unknown) => String(t).trim()).filter(Boolean)
        : JSON.parse(String(found.rows[0].track_record_json || '[]'));
      const plateVariant = String(req.body?.plateVariant || found.rows[0].plate_variant);
      const photoUrl =
        req.body?.photoUrl === undefined
          ? found.rows[0].photo_url
            ? String(found.rows[0].photo_url)
            : null
          : validateCandidatePhotoUrl(req.body.photoUrl);

      await db.query(
        `UPDATE candidates
         SET number = $1, chamber = $2, name = $3, nim = $4, cohort = $5, origin = $6, motto = $7, vision = $8, missions_json = $9, programs_json = $10, track_record_json = $11, plate_variant = $12, photo_url = $13
         WHERE id = $14`,
        [
          number.padStart(2, '0'),
          chamber,
          name,
          nim,
          cohort,
          origin,
          motto,
          vision,
          JSON.stringify(missions),
          JSON.stringify(programs),
          JSON.stringify(trackRecord),
          plateVariant,
          photoUrl,
          id,
        ]
      );

      await logAudit(
        db,
        'admin',
        req.auth?.sub || 'admin',
        'UPDATE_CANDIDATE',
        id,
        `Memperbarui data kandidat ${name} (No. ${number})`
      );

      const updated = await db.query('SELECT * FROM candidates WHERE id = $1', [id]);
      res.json({
        candidate: mapCandidateRow(updated.rows[0] as Record<string, unknown>),
      });
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode || 500;
      const message = err instanceof Error ? err.message : 'Gagal memperbarui data kandidat.';
      if (status >= 500) console.error('Update candidate failed:', err);
      res.status(status).json({ error: message });
    }
  });

  app.delete('/api/admin/candidates/:id', requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
    try {
      const db = await dbReady();
      const id = String(req.params.id || '').trim();

      const voteCheck = await db.query(
        'SELECT COUNT(*) AS cnt FROM votes WHERE bph_candidate_id = $1 OR senator_candidate_id = $1',
        [id]
      );
      if (Number(voteCheck.rows[0]?.cnt ?? 0) > 0) {
        res.status(409).json({
          error: 'Kandidat tidak dapat dihapus karena sudah memiliki suara masuk.',
        });
        return;
      }

      const found = await db.query('SELECT name FROM candidates WHERE id = $1', [id]);
      if (found.rows.length === 0) {
        res.status(404).json({ error: 'Kandidat tidak ditemukan.' });
        return;
      }

      await db.query('DELETE FROM candidates WHERE id = $1', [id]);
      await logAudit(
        db,
        'admin',
        req.auth?.sub || 'admin',
        'DELETE_CANDIDATE',
        id,
        `Menghapus kandidat ${String(found.rows[0].name)}`
      );

      res.json({ ok: true });
    } catch (err) {
      console.error('Delete candidate failed:', err);
      res.status(500).json({ error: 'Gagal menghapus kandidat.' });
    }
  });

  // Admin: Hasil Pemira (Tally)
  app.get('/api/admin/results', requireAuth, requireAdmin, async (_req, res) => {
    try {
      const db = await dbReady();
      const [candRes, votesRes, dptRes] = await Promise.all([
        db.query('SELECT * FROM candidates ORDER BY chamber ASC, number ASC'),
        db.query('SELECT bph_candidate_id, senator_candidate_id FROM votes'),
        db.query('SELECT COUNT(*) AS cnt FROM voters'),
      ]);

      const bphCounts = new Map<string, number>();
      const senatorCounts = new Map<string, number>();

      for (const row of votesRes.rows) {
        const bphId = String(row.bph_candidate_id);
        const senId = String(row.senator_candidate_id);
        bphCounts.set(bphId, (bphCounts.get(bphId) ?? 0) + 1);
        senatorCounts.set(senId, (senatorCounts.get(senId) ?? 0) + 1);
      }

      const totalBallots = votesRes.rows.length;
      const totalDpt = Number(dptRes.rows[0]?.cnt ?? 0);

      const candidates = candRes.rows.map((r) => mapCandidateRow(r as Record<string, unknown>));

      const bphResults = candidates
        .filter((c) => c.chamber === 'bph')
        .map((c) => {
          const votes = bphCounts.get(c.id) ?? 0;
          return {
            ...c,
            votes,
            percentage: totalBallots > 0 ? Number(((votes / totalBallots) * 100).toFixed(1)) : 0,
          };
        })
        .sort((a, b) => b.votes - a.votes);

      const senatorResults = candidates
        .filter((c) => c.chamber === 'senator')
        .map((c) => {
          const votes = senatorCounts.get(c.id) ?? 0;
          return {
            ...c,
            votes,
            percentage: totalBallots > 0 ? Number(((votes / totalBallots) * 100).toFixed(1)) : 0,
          };
        })
        .sort((a, b) => b.votes - a.votes);

      res.json({
        totalDpt,
        totalBallots,
        turnoutPercentage:
          totalDpt > 0 ? Number(((totalBallots / totalDpt) * 100).toFixed(1)) : 0,
        bphResults,
        senatorResults,
      });
    } catch (err) {
      console.error('Results endpoint failed:', err);
      res.status(500).json({ error: 'Gagal memuat hasil PEMIRA.' });
    }
  });

  // Mount Vite in dev or serve static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PEMIRA HIMATEKIA ITERA 2026 server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Express server:', err);
  process.exit(1);
});
