import 'dotenv/config';
import { getDb } from '../src/server/db.ts';
import { ensureSeeded } from '../src/server/seedData.ts';

async function main() {
  console.log('=== PEMIRA HIMATEKIA ITERA 2026 — Database Push ===');

  const db = await getDb();
  console.log(
    db.isExternalPostgres
      ? `Target: External PostgreSQL (${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE})`
      : 'Target: Embedded PostgreSQL Engine (PGHOST belum disetel di .env — menggunakan mode pratinjau lokal + snapshot)'
  );
  console.log('Skema tabel & indeks berhasil disinkronkan.');

  // Seed initial voters from Data_Pemira_-_Full_48584cee.md & initial candidates
  await ensureSeeded(db);

  // Verify tables & row counts
  const tables = ['admin_config', 'voters', 'candidates', 'votes', 'audit_logs'];
  for (const table of tables) {
    const res = await db.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
    console.log(`  - Tabel ${table.padEnd(14, ' ')}: ${Number(res.rows[0]?.cnt ?? 0)} baris`);
  }

  // Verify schema columns if external Postgres
  if (db.isExternalPostgres) {
    const colRes = await db.query(
      `SELECT table_name, COUNT(*) AS col_count
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('admin_config', 'voters', 'candidates', 'votes', 'audit_logs')
       GROUP BY table_name
       ORDER BY table_name`
    );
    console.log('Verifikasi kolom PostgreSQL:');
    for (const row of colRes.rows) {
      console.log(`  * ${row.table_name}: ${row.col_count} kolom`);
    }
  }

  await db.persistSnapshot();
  console.log('Database push & seed selesai dengan sukses.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Database push gagal:', err);
  process.exit(1);
});
