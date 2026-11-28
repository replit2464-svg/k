import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DbAdapter } from './db.ts';
import { BPH_CANDIDATES, SENATOR_CANDIDATES } from '../data/pemiraData.ts';

interface ParsedVoter {
  nim: string;
  fullName: string;
  programStudi: string;
  angkatan: string;
  gender: string;
  membershipStatus: string;
}

export function generateVoterUniqueCode(nim: string, angkatan: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`HIMATEKIA-PEMIRA-2026-${nim}`)
    .digest('hex')
    .slice(0, 4)
    .toUpperCase();
  const yr = angkatan.slice(-2) || '26';
  return `HMTK-${yr}-${nim.slice(-4)}-${hash}`;
}

function parseMarkdownVoterFile(): ParsedVoter[] {
  const baseDir = path.resolve(process.cwd(), 'public', 'assets', 'aistudio');
  const filePath = path.resolve(baseDir, 'Data_Pemira_-_Full_48584cee.md');

  if (!filePath.startsWith(baseDir + path.sep) || !fs.existsSync(filePath)) {
    console.warn('Voter dataset markdown file not found at:', filePath);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const seenNims = new Set<string>();
  const voters: ParsedVoter[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith('|')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length < 6) continue;
    const [noCol, nameCol, nimCol, prodiCol, angkatanCol, genderCol, statusCol] = cells;

    if (!noCol || !/^\d+$/.test(noCol)) continue;
    if (!nameCol || !nimCol || !/^\d{6,12}$/.test(nimCol)) continue;
    if (seenNims.has(nimCol)) continue;

    seenNims.add(nimCol);
    voters.push({
      nim: nimCol,
      fullName: nameCol,
      programStudi: prodiCol || 'Teknik Kimia',
      angkatan: angkatanCol || `20${nimCol.slice(1, 3)}`,
      gender: genderCol || 'Laki-laki',
      membershipStatus: statusCol && statusCol.length > 0 ? statusCol : 'Anggota Biasa',
    });
  }

  return voters;
}

export async function ensureSeeded(db: DbAdapter): Promise<void> {
  const existingVotersRes = await db.query('SELECT COUNT(*) AS cnt FROM voters');
  const voterCount = Number(existingVotersRes.rows[0]?.cnt ?? 0);

  if (voterCount === 0) {
    const parsedVoters = parseMarkdownVoterFile();
    for (const v of parsedVoters) {
      const uniqueCode = generateVoterUniqueCode(v.nim, v.angkatan);
      await db.query(
        `INSERT INTO voters (nim, full_name, program_studi, angkatan, gender, membership_status, role, unique_code)
         VALUES ($1, $2, $3, $4, $5, $6, 'user', $7)
         ON CONFLICT (nim) DO NOTHING`,
        [v.nim, v.fullName, v.programStudi, v.angkatan, v.gender, v.membershipStatus, uniqueCode]
      );
    }
  }

  const initialCandidates = [...BPH_CANDIDATES, ...SENATOR_CANDIDATES];
  for (const c of initialCandidates) {
    await db.query(
      `INSERT INTO candidates (id, number, chamber, name, nim, cohort, origin, motto, vision, missions_json, programs_json, track_record_json, plate_variant, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET
         number = EXCLUDED.number,
         chamber = EXCLUDED.chamber,
         name = EXCLUDED.name,
         nim = EXCLUDED.nim,
         cohort = EXCLUDED.cohort,
         origin = EXCLUDED.origin,
         motto = EXCLUDED.motto,
         vision = EXCLUDED.vision,
         missions_json = EXCLUDED.missions_json,
         programs_json = EXCLUDED.programs_json,
         track_record_json = EXCLUDED.track_record_json,
         plate_variant = EXCLUDED.plate_variant,
         photo_url = EXCLUDED.photo_url`,
      [
        c.id,
        c.number,
        c.chamber,
        c.name,
        c.nim,
        c.cohort,
        c.origin,
        c.motto,
        c.vision,
        JSON.stringify(c.missions),
        JSON.stringify(c.programs),
        JSON.stringify(c.trackRecord),
        c.plateVariant,
        c.photoUrl ?? null,
      ]
    );
  }

  await db.query(
    'DELETE FROM candidates WHERE id NOT IN ($1, $2, $3, $4)',
    ['bph-01', 'bph-02', 'sen-01', 'sen-02']
  );

  await db.persistSnapshot();
}
