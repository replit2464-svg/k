import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

const TEST_PORT = 3456;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function waitForServer(url: string, timeoutMs = 25000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch {
      // Waiting for server startup
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Test server tidak merespons tepat waktu.');
}

async function reqJson<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

async function runTests() {
  console.log('=== PEMIRA HIMATEKIA ITERA 2026 — End-to-End Test Suite ===');

  const serverProc: ChildProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      PEMIRA_EPHEMERAL: '1',
      ADMIN_USERNAME: 'test_admin_kpr',
      ADMIN_PASSWORD: 'test_secret_pass_2026',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let passed = 0;
  const check = (label: string, fn: () => Promise<void> | void) =>
    Promise.resolve()
      .then(fn)
      .then(() => {
        passed += 1;
        console.log(`  [PASS] ${label}`);
      });

  try {
    await waitForServer(BASE_URL);

    // 1. Public pages & overview API
    await check('GET / dan GET /login merender HTML SPA (status 200)', async () => {
      const home = await fetch(`${BASE_URL}/`);
      assert.equal(home.status, 200);
      const homeHtml = await home.text();
      assert.ok(homeHtml.includes('PEMIRA HIMATEKIA'));

      const loginPage = await fetch(`${BASE_URL}/login`);
      assert.equal(loginPage.status, 200);
    });

    await check('GET /api/public/overview memuat 428 DPT dan kandidat BPH & Senator', async () => {
      const res = await reqJson<{
        candidates: Array<{ id: string; chamber: string }>;
        stats: { totalDpt: number; totalValidated: number; totalVoted: number };
      }>('/api/public/overview');
      assert.equal(res.status, 200);
      assert.equal(res.data.stats.totalDpt, 428);
      assert.ok(res.data.candidates.filter((c) => c.chamber === 'bph').length >= 2);
      assert.ok(res.data.candidates.filter((c) => c.chamber === 'senator').length >= 3);
    });

    // 2. Admin auth & security checks
    await check('Endpoint admin menolak akses tanpa token (401)', async () => {
      for (const path of [
        '/api/admin/monitoring',
        '/api/admin/users',
        '/api/admin/candidates',
        '/api/admin/results',
      ]) {
        const res = await reqJson(path);
        assert.equal(res.status, 401, `${path} harus mengembalikan 401`);
      }
    });

    await check('GET /api/auth/admin-status mendeteksi konfigurasi .env', async () => {
      const res = await reqJson<{ envConfigured: boolean; suggestedUsername: string }>(
        '/api/auth/admin-status'
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.envConfigured, true);
      assert.equal(res.data.suggestedUsername, 'test_admin_kpr');
    });

    await check('Login admin gagal jika kata sandi salah (401)', async () => {
      const res = await reqJson('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test_admin_kpr', password: 'salah' }),
      });
      assert.equal(res.status, 401);
    });

    let adminToken = '';
    await check('Login admin berhasil menggunakan kredensial .env', async () => {
      const res = await reqJson<{ token: string; user: { role: string } }>(
        '/api/auth/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({
            username: 'test_admin_kpr',
            password: 'test_secret_pass_2026',
          }),
        }
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.user.role, 'admin');
      assert.ok(res.data.token.length > 20);
      adminToken = res.data.token;
    });

    // 3. Admin pages: Monitoring, User, Kandidat
    await check('Admin Monitoring menampilkan statistik 428 DPT dan 6 angkatan', async () => {
      const res = await reqJson<{
        summary: { totalDpt: number; bphCandidatesCount: number; senatorCandidatesCount: number };
        cohorts: Array<{ angkatan: string; total: number }>;
      }>('/api/admin/monitoring', {}, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.summary.totalDpt, 428);
      assert.equal(res.data.cohorts.length, 6);
    });

    await check('Admin User dapat mencari DPT, menambah pemilih, dan menetapkan Validator', async () => {
      const searchRes = await reqJson<{
        users: Array<{ nim: string; fullName: string }>;
      }>('/api/admin/users?search=Vionesa&angkatan=2023', {}, adminToken);
      assert.equal(searchRes.status, 200);
      assert.ok(searchRes.data.users.some((u) => u.nim === '123280001'));

      const addRes = await reqJson<{ user: { nim: string } }>(
        '/api/admin/users',
        {
          method: 'POST',
          body: JSON.stringify({
            nim: '125280999',
            fullName: 'Peserta Uji Sistem',
            angkatan: '2025',
            gender: 'Laki-laki',
            role: 'user',
          }),
        },
        adminToken
      );
      assert.equal(addRes.status, 201);

      const dupRes = await reqJson(
        '/api/admin/users',
        {
          method: 'POST',
          body: JSON.stringify({
            nim: '125280999',
            fullName: 'Duplikat',
            angkatan: '2025',
          }),
        },
        adminToken
      );
      assert.equal(dupRes.status, 409);

      const assignValidator = await reqJson<{ user: { role: string } }>(
        '/api/admin/users/122280001/role',
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'validator' }),
        },
        adminToken
      );
      assert.equal(assignValidator.status, 200);
      assert.equal(assignValidator.data.user.role, 'validator');

      const validatorFilterRes = await reqJson<{ users: Array<{ nim: string; role: string }> }>(
        '/api/admin/users?role=validator',
        {},
        adminToken
      );
      assert.equal(validatorFilterRes.status, 200);
      assert.ok(validatorFilterRes.data.users.some((u) => u.nim === '122280001'));

      const manualValRes = await reqJson<{ user: { validationStatus: string } }>(
        '/api/admin/users/125280999/validation',
        {
          method: 'PATCH',
          body: JSON.stringify({ validationStatus: 'validated' }),
        },
        adminToken
      );
      assert.equal(manualValRes.status, 200);
      assert.equal(manualValRes.data.user.validationStatus, 'validated');

      const resetValRes = await reqJson<{ user: { validationStatus: string } }>(
        '/api/admin/users/125280999/validation',
        {
          method: 'PATCH',
          body: JSON.stringify({ validationStatus: 'pending' }),
        },
        adminToken
      );
      assert.equal(resetValRes.status, 200);
      assert.equal(resetValRes.data.user.validationStatus, 'pending');
    });

    await check('Admin Kandidat CRUD + Upload Foto Perangkat & Tolak Format Ilegal', async () => {
      // Valid 1x1 PNG base64 sample
      const samplePngDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      // Reject disallowed SVG / XSS image payload
      const badPhotoRes = await reqJson(
        '/api/admin/candidates',
        {
          method: 'POST',
          body: JSON.stringify({
            chamber: 'senator',
            number: '04',
            name: 'Kandidat Ilegal',
            nim: '123280010',
            vision: 'Visi',
            photoUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
          }),
        },
        adminToken
      );
      assert.equal(badPhotoRes.status, 400);

      const createRes = await reqJson<{
        candidate: { id: string; name: string; photoUrl: string | null };
      }>(
        '/api/admin/candidates',
        {
          method: 'POST',
          body: JSON.stringify({
            chamber: 'senator',
            number: '04',
            name: 'Kandidat Uji Senator',
            nim: '123280010',
            cohort: 'Teknik Kimia 2023',
            origin: 'Lampung',
            motto: 'Motto Uji',
            vision: 'Visi Uji Senator',
            missions: ['Misi 1'],
            programs: [{ title: 'Program Uji', summary: 'Ringkas', target: '100%' }],
            trackRecord: ['Rekam 1'],
            plateVariant: 'lattice',
            photoUrl: samplePngDataUrl,
          }),
        },
        adminToken
      );
      assert.equal(createRes.status, 201);
      assert.equal(createRes.data.candidate.photoUrl, samplePngDataUrl);
      const createdId = createRes.data.candidate.id;

      const updateRes = await reqJson<{ candidate: { motto: string; photoUrl: string | null } }>(
        `/api/admin/candidates/${createdId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ motto: 'Motto Uji Diperbarui' }),
        },
        adminToken
      );
      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.data.candidate.motto, 'Motto Uji Diperbarui');
      assert.equal(updateRes.data.candidate.photoUrl, samplePngDataUrl);

      const adminCandList = await reqJson<{
        candidates: Array<{ id: string; photoUrl: string | null }>;
      }>('/api/admin/candidates', {}, adminToken);
      assert.equal(adminCandList.status, 200);
      assert.equal(
        adminCandList.data.candidates.find((c) => c.id === createdId)?.photoUrl,
        samplePngDataUrl
      );

      const pubRes = await reqJson<{
        candidates: Array<{ id: string; photoUrl: string | null }>;
      }>('/api/public/overview');
      assert.equal(
        pubRes.data.candidates.find((c) => c.id === createdId)?.photoUrl,
        samplePngDataUrl
      );

      // Clear photoUrl cleanly
      const clearPhotoRes = await reqJson<{ candidate: { photoUrl: string | null } }>(
        `/api/admin/candidates/${createdId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ photoUrl: null }),
        },
        adminToken
      );
      assert.equal(clearPhotoRes.status, 200);
      assert.equal(clearPhotoRes.data.candidate.photoUrl, null);

      const delRes = await reqJson(`/api/admin/candidates/${createdId}`, { method: 'DELETE' }, adminToken);
      assert.equal(delRes.status, 200);
    });

    // 4. Full E-Voting Flow: User Login -> Validator Validation -> User Votes
    let voterToken = '';
    let voterUniqueCode = '';
    await check('User lookup, aktivasi PIN pertama, dan cek penolakan PIN salah', async () => {
      const missingRes = await reqJson('/api/auth/voter/lookup', {
        method: 'POST',
        body: JSON.stringify({ nim: '999999999' }),
      });
      assert.equal(missingRes.status, 404);

      const lookup = await reqJson<{ nim: string; hasPassword: boolean }>(
        '/api/auth/voter/lookup',
        {
          method: 'POST',
          body: JSON.stringify({ nim: '123280001' }),
        }
      );
      assert.equal(lookup.status, 200);
      assert.equal(lookup.data.hasPassword, false);

      const login = await reqJson<{
        token: string;
        voter: { uniqueCode: string; validationStatus: string; role: string };
      }>('/api/auth/voter/login', {
        method: 'POST',
        body: JSON.stringify({ nim: '123280001', password: 'pin_vionesa_2026' }),
      });
      assert.equal(login.status, 200);
      assert.equal(login.data.voter.validationStatus, 'pending');
      assert.equal(login.data.voter.role, 'user');
      assert.ok(login.data.voter.uniqueCode.startsWith('HMTK-'));
      voterToken = login.data.token;
      voterUniqueCode = login.data.voter.uniqueCode;

      const wrongPin = await reqJson('/api/auth/voter/login', {
        method: 'POST',
        body: JSON.stringify({ nim: '123280001', password: 'pin_salah' }),
      });
      assert.equal(wrongPin.status, 401);
    });

    await check('User tidak bisa voting sebelum divalidasi (403) dan tidak bisa akses Admin/Validator (403)', async () => {
      const voteBefore = await reqJson(
        '/api/voter/vote',
        {
          method: 'POST',
          body: JSON.stringify({ bphCandidateId: 'bph-01', senatorCandidateId: 'sen-02' }),
        },
        voterToken
      );
      assert.equal(voteBefore.status, 403);

      const adminAttempt = await reqJson('/api/admin/monitoring', {}, voterToken);
      assert.equal(adminAttempt.status, 403);

      const validatorAttempt = await reqJson(
        `/api/validator/lookup?code=${encodeURIComponent(voterUniqueCode)}`,
        {},
        voterToken
      );
      assert.equal(validatorAttempt.status, 403);
    });

    let validatorToken = '';
    await check('Validator login, scan barcode/kode unik, dan validasi pemilih', async () => {
      const valLogin = await reqJson<{ token: string; voter: { role: string } }>(
        '/api/auth/voter/login',
        {
          method: 'POST',
          body: JSON.stringify({ nim: '122280001', password: 'pin_validator_2026' }),
        }
      );
      assert.equal(valLogin.status, 200);
      assert.equal(valLogin.data.voter.role, 'validator');
      validatorToken = valLogin.data.token;

      // Lookup by raw unique code
      const lookupCode = await reqJson<{ voter: { nim: string } }>(
        `/api/validator/lookup?code=${encodeURIComponent(voterUniqueCode)}`,
        {},
        validatorToken
      );
      assert.equal(lookupCode.status, 200);
      assert.equal(lookupCode.data.voter.nim, '123280001');

      // Lookup by JSON barcode payload
      const qrPayload = JSON.stringify({ code: voterUniqueCode });
      const lookupQr = await reqJson<{ voter: { nim: string } }>(
        `/api/validator/lookup?code=${encodeURIComponent(qrPayload)}`,
        {},
        validatorToken
      );
      assert.equal(lookupQr.status, 200);
      assert.equal(lookupQr.data.voter.nim, '123280001');

      const validateRes = await reqJson<{
        alreadyValidated: boolean;
        voter: { validationStatus: string };
      }>(
        '/api/validator/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code: voterUniqueCode }),
        },
        validatorToken
      );
      assert.equal(validateRes.status, 200);
      assert.equal(validateRes.data.alreadyValidated, false);
      assert.equal(validateRes.data.voter.validationStatus, 'validated');

      const recentRes = await reqJson<{ items: Array<{ nim: string }> }>(
        '/api/validator/recent',
        {},
        validatorToken
      );
      assert.equal(recentRes.status, 200);
      assert.ok(recentRes.data.items.some((i) => i.nim === '123280001'));
    });

    await check('User yang sudah tervalidasi berhasil mencoblos dan diblokir dari voting ganda (409)', async () => {
      const meRes = await reqJson<{ voter: { validationStatus: string; hasVoted: boolean } }>(
        '/api/auth/me',
        {},
        voterToken
      );
      assert.equal(meRes.status, 200);
      assert.equal(meRes.data.voter.validationStatus, 'validated');
      assert.equal(meRes.data.voter.hasVoted, false);

      const voteRes = await reqJson<{ receiptCode: string }>(
        '/api/voter/vote',
        {
          method: 'POST',
          body: JSON.stringify({ bphCandidateId: 'bph-01', senatorCandidateId: 'sen-02' }),
        },
        voterToken
      );
      assert.equal(voteRes.status, 201);
      assert.ok(voteRes.data.receiptCode.startsWith('HMTK26-'));

      const doubleVote = await reqJson(
        '/api/voter/vote',
        {
          method: 'POST',
          body: JSON.stringify({ bphCandidateId: 'bph-02', senatorCandidateId: 'sen-01' }),
        },
        voterToken
      );
      assert.equal(doubleVote.status, 409);

      const reValidateAfterVote = await reqJson(
        '/api/validator/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code: voterUniqueCode }),
        },
        validatorToken
      );
      assert.equal(reValidateAfterVote.status, 409);
    });

    await check('Admin Hasil Pemira dan Monitoring merekap suara secara akurat & anonim', async () => {
      const resultsRes = await reqJson<{
        totalBallots: number;
        bphResults: Array<{ id: string; votes: number }>;
        senatorResults: Array<{ id: string; votes: number }>;
      }>('/api/admin/results', {}, adminToken);
      assert.equal(resultsRes.status, 200);
      assert.equal(resultsRes.data.totalBallots, 1);
      assert.equal(resultsRes.data.bphResults.find((c) => c.id === 'bph-01')?.votes, 1);
      assert.equal(resultsRes.data.senatorResults.find((c) => c.id === 'sen-02')?.votes, 1);

      const monRes = await reqJson<{
        summary: { totalVoted: number };
        logs: Array<{ action: string; actorId: string }>;
      }>('/api/admin/monitoring', {}, adminToken);
      assert.equal(monRes.status, 200);
      assert.equal(monRes.data.summary.totalVoted, 1);
      const castLog = monRes.data.logs.find((l) => l.action === 'CAST_VOTE');
      assert.ok(castLog);
      assert.equal(castLog?.actorId, 'ANONIM');
    });

    console.log(`\nSeluruh ${passed} skenario pengujian lulus dengan sukses.`);
  } finally {
    serverProc.kill('SIGTERM');
  }
}

runTests().catch((err) => {
  console.error('\nPengujian gagal:', err);
  process.exit(1);
});
