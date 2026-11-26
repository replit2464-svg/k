import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import type { PoolClient, QueryResult } from 'pg';
import { newDb } from 'pg-mem';

export interface DbAdapter {
  query: (text: string, params?: unknown[]) => Promise<QueryResult>;
  withTransaction: <T>(fn: (client: { query: (text: string, params?: unknown[]) => Promise<QueryResult> }) => Promise<T>) => Promise<T>;
  isExternalPostgres: boolean;
  persistSnapshot: () => Promise<void>;
}

const SNAPSHOT_FILE = path.resolve(process.cwd(), '.pemira-pg-snapshot.json');

let adapterPromise: Promise<DbAdapter> | null = null;

export async function initSchema(executor: { query: (text: string, params?: unknown[]) => Promise<QueryResult> }) {
  await executor.query(`
    CREATE TABLE IF NOT EXISTS admin_config (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await executor.query(`
    CREATE TABLE IF NOT EXISTS voters (
      nim TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      program_studi TEXT NOT NULL DEFAULT 'Teknik Kimia',
      angkatan TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'Laki-laki',
      membership_status TEXT NOT NULL DEFAULT 'Anggota Biasa',
      role TEXT NOT NULL DEFAULT 'user',
      unique_code TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      validation_status TEXT NOT NULL DEFAULT 'pending',
      validated_by TEXT,
      validated_at TIMESTAMP,
      has_voted BOOLEAN NOT NULL DEFAULT FALSE,
      voted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await executor.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      chamber TEXT NOT NULL,
      name TEXT NOT NULL,
      nim TEXT NOT NULL,
      cohort TEXT NOT NULL,
      origin TEXT NOT NULL,
      motto TEXT NOT NULL,
      vision TEXT NOT NULL,
      missions_json TEXT NOT NULL,
      programs_json TEXT NOT NULL,
      track_record_json TEXT NOT NULL,
      plate_variant TEXT NOT NULL DEFAULT 'distillation',
      photo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await executor.query(`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      bph_candidate_id TEXT NOT NULL,
      senator_candidate_id TEXT NOT NULL,
      receipt_code TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await executor.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      actor_role TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      details TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await executor.query(`CREATE INDEX IF NOT EXISTS idx_voters_angkatan ON voters(angkatan)`);
  await executor.query(`CREATE INDEX IF NOT EXISTS idx_voters_role ON voters(role)`);
  await executor.query(`CREATE INDEX IF NOT EXISTS idx_candidates_chamber ON candidates(chamber)`);
}

export async function getDb(): Promise<DbAdapter> {
  if (adapterPromise) return adapterPromise;

  adapterPromise = (async () => {
    const hasPgEnv = Boolean(
      process.env.PGHOST &&
        process.env.PGDATABASE &&
        process.env.PGUSER &&
        process.env.PGHOST !== 'MY_PGHOST'
    );

    if (hasPgEnv) {
      const pool = new Pool({
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD || '',
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 10,
        connectionTimeoutMillis: 10000,
      });

      pool.on('error', (err) => {
        console.error('Unexpected PostgreSQL pool error:', err);
      });

      await initSchema(pool);

      return {
        isExternalPostgres: true,
        query: (text: string, params?: unknown[]) => pool.query(text, params),
        withTransaction: async <T>(
          fn: (client: { query: (text: string, params?: unknown[]) => Promise<QueryResult> }) => Promise<T>
        ) => {
          const client: PoolClient = await pool.connect();
          try {
            await client.query('BEGIN');
            const result = await fn(client);
            await client.query('COMMIT');
            return result;
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          } finally {
            client.release();
          }
        },
        persistSnapshot: async () => {
          // Real PostgreSQL persists directly on disk
        },
      };
    }

    // Embedded PostgreSQL SQL engine for preview environments without external Postgres configured
    const memDb = newDb({ autoCreateForeignKeyIndices: true });
    const { Pool: MemPool } = memDb.adapters.createPg();
    const memPool = new MemPool() as unknown as Pool;

    await initSchema(memPool);

    const isEphemeral = process.env.PEMIRA_EPHEMERAL === '1';

    // Restore snapshot if present
    if (!isEphemeral && fs.existsSync(SNAPSHOT_FILE)) {
      try {
        const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
        const snap = JSON.parse(raw) as {
          admin_config?: Array<Record<string, unknown>>;
          voters?: Array<Record<string, unknown>>;
          candidates?: Array<Record<string, unknown>>;
          votes?: Array<Record<string, unknown>>;
          audit_logs?: Array<Record<string, unknown>>;
        };

        for (const row of snap.admin_config ?? []) {
          await memPool.query(
            `INSERT INTO admin_config (id, username, password_hash, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
            [row.id, row.username, row.password_hash, row.created_at ?? new Date().toISOString()]
          );
        }

        for (const row of snap.voters ?? []) {
          await memPool.query(
            `INSERT INTO voters (nim, full_name, program_studi, angkatan, gender, membership_status, role, unique_code, password_hash, validation_status, validated_by, validated_at, has_voted, voted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (nim) DO NOTHING`,
            [
              row.nim,
              row.full_name,
              row.program_studi,
              row.angkatan,
              row.gender,
              row.membership_status,
              row.role,
              row.unique_code,
              row.password_hash ?? null,
              row.validation_status,
              row.validated_by ?? null,
              row.validated_at ?? null,
              Boolean(row.has_voted),
              row.voted_at ?? null,
            ]
          );
        }

        for (const row of snap.candidates ?? []) {
          await memPool.query(
            `INSERT INTO candidates (id, number, chamber, name, nim, cohort, origin, motto, vision, missions_json, programs_json, track_record_json, plate_variant, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING`,
            [
              row.id,
              row.number,
              row.chamber,
              row.name,
              row.nim,
              row.cohort,
              row.origin,
              row.motto,
              row.vision,
              row.missions_json,
              row.programs_json,
              row.track_record_json,
              row.plate_variant,
              row.photo_url ?? null,
            ]
          );
        }

        for (const row of snap.votes ?? []) {
          await memPool.query(
            `INSERT INTO votes (bph_candidate_id, senator_candidate_id, receipt_code, created_at)
             VALUES ($1, $2, $3, $4) ON CONFLICT (receipt_code) DO NOTHING`,
            [
              row.bph_candidate_id,
              row.senator_candidate_id,
              row.receipt_code,
              row.created_at ?? new Date().toISOString(),
            ]
          );
        }

        for (const row of snap.audit_logs ?? []) {
          await memPool.query(
            `INSERT INTO audit_logs (actor_role, actor_id, action, target_id, details, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              row.actor_role,
              row.actor_id,
              row.action,
              row.target_id ?? null,
              row.details,
              row.created_at ?? new Date().toISOString(),
            ]
          );
        }
      } catch (err) {
        console.warn('Could not restore PEMIRA snapshot, starting fresh:', err);
      }
    }

    const persistSnapshot = async () => {
      if (isEphemeral) return;
      try {
        const [adminRes, votersRes, candRes, votesRes, logsRes] = await Promise.all([
          memPool.query('SELECT * FROM admin_config'),
          memPool.query('SELECT * FROM voters'),
          memPool.query('SELECT * FROM candidates'),
          memPool.query('SELECT * FROM votes'),
          memPool.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200'),
        ]);
        fs.writeFileSync(
          SNAPSHOT_FILE,
          JSON.stringify(
            {
              admin_config: adminRes.rows,
              voters: votersRes.rows,
              candidates: candRes.rows,
              votes: votesRes.rows,
              audit_logs: logsRes.rows,
            },
            null,
            2
          ),
          'utf8'
        );
      } catch (err) {
        console.error('Failed to persist PEMIRA snapshot:', err);
      }
    };

    const adapter: DbAdapter = {
      isExternalPostgres: false,
      query: (text: string, params?: unknown[]) => memPool.query(text, params),
      withTransaction: async <T>(
        fn: (client: { query: (text: string, params?: unknown[]) => Promise<QueryResult> }) => Promise<T>
      ) => {
        const client = await memPool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn(client);
          await client.query('COMMIT');
          await persistSnapshot();
          return result;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      },
      persistSnapshot,
    };

    return adapter;
  })();

  return adapterPromise;
}
