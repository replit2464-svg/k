import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Shield,
  UserCheck,
} from 'lucide-react';
import {
  apiRequest,
  AdminStatusResponse,
  AdminUser,
  VoterProfile,
} from '../lib/api';
import { LOGO_ASSET_PATH } from '../data/pemiraData';

interface LoginPageProps {
  onBackToPublic: () => void;
  onAuthenticatedVoter: (token: string, voter: VoterProfile) => void;
  onAuthenticatedAdmin: (token: string, admin: AdminUser) => void;
}

type AuthTab = 'voter' | 'admin';

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToPublic,
  onAuthenticatedVoter,
  onAuthenticatedAdmin,
}) => {
  const [tab, setTab] = useState<AuthTab>('voter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Voter / Validator login states
  const [nim, setNim] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    nim: string;
    fullName: string;
    angkatan: string;
    role: 'user' | 'validator';
    hasPassword: boolean;
  } | null>(null);
  const [voterPassword, setVoterPassword] = useState('');

  // Admin login states
  const [adminStatus, setAdminStatus] = useState<AdminStatusResponse | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  useEffect(() => {
    if (tab !== 'admin') return;
    let active = true;
    apiRequest<AdminStatusResponse>('/api/auth/admin-status')
      .then((res) => {
        if (!active) return;
        setAdminStatus(res);
        setAdminUsername(res.suggestedUsername || '');
      })
      .catch(() => {
        // Ignore silent status check failure
      });
    return () => {
      active = false;
    };
  }, [tab]);

  const handleVoterLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{
        nim: string;
        fullName: string;
        angkatan: string;
        role: 'user' | 'validator';
        hasPassword: boolean;
      }>('/api/auth/voter/lookup', {
        method: 'POST',
        body: JSON.stringify({ nim: nim.trim() }),
      });
      setLookupResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencari NIM.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupResult) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; voter: VoterProfile }>(
        '/api/auth/voter/login',
        {
          method: 'POST',
          body: JSON.stringify({
            nim: lookupResult.nim,
            password: voterPassword,
          }),
        }
      );
      onAuthenticatedVoter(res.token, res.voter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const needsBootstrap =
      adminStatus && !adminStatus.envConfigured && !adminStatus.bootstrapped;

    if (needsBootstrap && adminPassword !== adminConfirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = needsBootstrap
        ? '/api/auth/admin/bootstrap'
        : '/api/auth/admin/login';

      const res = await apiRequest<{ token: string; user: AdminUser }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });
      onAuthenticatedAdmin(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk sebagai Admin.');
    } finally {
      setLoading(false);
    }
  };

  const needsBootstrap =
    adminStatus && !adminStatus.envConfigured && !adminStatus.bootstrapped;

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#FAF9F6] text-[#0B0B0E]">
      {/* Left Split Panel: Full-height Obsidian Architectural Brand Side */}
      <section className="lg:col-span-6 relative bg-[#0B0B0E] text-[#FAF9F6] flex flex-col justify-between p-6 sm:p-10 lg:p-14 lg:min-h-screen overflow-hidden border-b lg:border-b-0 lg:border-r border-[#272733]">
        {/* Precision coordinate grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Top Left Bar */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToPublic}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#FAF9F6]/80 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#D59B0A]" />
            <span>Kembali ke Beranda</span>
          </button>

          <span className="font-mono text-xs text-[#D59B0A] tabular-nums">
            PEMIRA · 2026
          </span>
        </div>

        {/* Center Brand Showcase */}
        <div className="relative z-10 my-10 lg:my-0 space-y-8 max-w-xl">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
              <motion.svg
                viewBox="0 0 120 120"
                className="absolute inset-0 w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
                aria-hidden="true"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="57"
                  fill="none"
                  stroke="#480E8A"
                  strokeWidth="1.5"
                  strokeDasharray="5 6"
                />
              </motion.svg>

              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white ring-2 ring-[#D59B0A]/70 flex items-center justify-center">
                {!logoError ? (
                  <img
                    src={LOGO_ASSET_PATH}
                    alt="Lambang resmi HIMATEKIA ITERA"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="w-[106%] h-[106%] max-w-none object-cover"
                  />
                ) : (
                  <span className="font-display text-xs font-bold text-[#480E8A]">
                    HIMATEKIA
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[#D59B0A] tracking-wide">
                Himpunan Mahasiswa Teknik Kimia
              </div>
              <div className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                Institut Teknologi Sumatera
              </div>
            </div>
          </div>

          <h1 className="font-display text-[clamp(2rem,3.6vw,3.4rem)] font-bold leading-[1.06] tracking-[-0.025em] text-white text-balance">
            Portal Autentikasi & Bilik Suara Digital 2026.
          </h1>

          <p className="text-sm sm:text-base text-[#FAF9F6]/75 tracking-[0.01em] leading-relaxed">
            Akses terpadu bagi pemilih terdaftar, petugas validator barcode, serta administrator Komisi Pemilihan Raya untuk pemilihan Ketua BPH dan Senator HIMATEKIA-ITERA.
          </p>

          {/* 3-Step Verification Flow Summary */}
          <div className="pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div>
              <div className="font-mono font-semibold text-[#D59B0A] mb-1">01</div>
              <div className="font-semibold text-white">Masuk Akun</div>
              <p className="mt-1 text-[#FAF9F6]/65 leading-relaxed">
                Gunakan NIM DPT atau kredensial Admin KPR.
              </p>
            </div>
            <div>
              <div className="font-mono font-semibold text-[#D59B0A] mb-1">02</div>
              <div className="font-semibold text-white">Validasi Barcode</div>
              <p className="mt-1 text-[#FAF9F6]/65 leading-relaxed">
                Validator memverifikasi QR Barcode atau kode unik.
              </p>
            </div>
            <div>
              <div className="font-mono font-semibold text-[#D59B0A] mb-1">03</div>
              <div className="font-semibold text-white">Salurkan Suara</div>
              <p className="mt-1 text-[#FAF9F6]/65 leading-relaxed">
                Pilih Ketua BPH dan Senator secara rahasia.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Institutional Caption */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-[#FAF9F6]/55">
          <span>Komisi Pemilihan Raya HIMATEKIA-ITERA</span>
          <span>Asas LUBER JURDIL</span>
        </div>
      </section>

      {/* Right Split Panel: Full-height Alabaster Authentication Workspace */}
      <section className="lg:col-span-6 bg-[#FAF9F6] flex flex-col justify-between p-6 sm:p-10 lg:p-16 lg:min-h-screen">
        <div className="hidden lg:flex items-center justify-end text-xs text-[#0B0B0E]/55">
          <span>Pemilihan Ketua BPH & Senator · Periode 2026–2027</span>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-8 lg:py-0">
          {/* Role Mode Switcher */}
          <div className="grid grid-cols-2 border border-[#E2DFD7] bg-white mb-8">
            <button
              type="button"
              onClick={() => {
                setTab('voter');
                setError('');
              }}
              className={`py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                tab === 'voter'
                  ? 'bg-[#480E8A] text-white'
                  : 'bg-white text-[#0B0B0E]/65 hover:text-[#0B0B0E]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Pemilih / Validator</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('admin');
                setError('');
              }}
              className={`py-3.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-l border-[#E2DFD7] transition-colors cursor-pointer ${
                tab === 'admin'
                  ? 'bg-[#0B0B0E] text-white'
                  : 'bg-white text-[#0B0B0E]/65 hover:text-[#0B0B0E]'
              }`}
            >
              <Shield className="w-4 h-4 text-[#D59B0A]" />
              <span>Admin KPR</span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 p-3.5 border border-[#C61D1D] bg-[#C61D1D]/5 text-sm text-[#C61D1D]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Voter / Validator Lookup */}
          {tab === 'voter' && !lookupResult && (
            <form onSubmit={handleVoterLookup} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0E] tracking-tight">
                  Masuk dengan NIM
                </h2>
                <p className="mt-2 text-sm text-[#0B0B0E]/70 leading-relaxed">
                  Masukkan Nomor Induk Mahasiswa (NIM) yang terdaftar pada Daftar Pemilih Tetap (DPT) Teknik Kimia ITERA.
                </p>
              </div>

              <div>
                <label
                  htmlFor="split-login-nim"
                  className="block text-xs font-semibold text-[#0B0B0E]/75 mb-2"
                >
                  NIM Teknik Kimia ITERA
                </label>
                <input
                  id="split-login-nim"
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 123280001"
                  value={nim}
                  onChange={(e) => setNim(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3.5 bg-white border border-[#E2DFD7] font-mono text-sm tabular-nums focus:outline-none focus:border-[#480E8A]"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#480E8A] text-white text-sm font-semibold hover:bg-[#320863] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <span>{loading ? 'Memeriksa DPT...' : 'Periksa NIM di DPT'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Tab 1 Step 2: Voter / Validator PIN Login */}
          {tab === 'voter' && lookupResult && (
            <form onSubmit={handleVoterLogin} className="space-y-6">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0E] tracking-tight">
                  {lookupResult.hasPassword ? 'Verifikasi Kata Sandi' : 'Aktivasi Akun Pemilih'}
                </h2>
                <p className="mt-1.5 text-sm text-[#0B0B0E]/70">
                  Identitas ditemukan pada basis data pemilih Teknik Kimia ITERA.
                </p>
              </div>

              <div className="p-4 bg-white border border-[#E2DFD7] space-y-1">
                <div className="flex items-center justify-between text-xs text-[#0B0B0E]/60">
                  <span className="font-mono tabular-nums">{lookupResult.nim}</span>
                  <span className="font-semibold text-[#480E8A]">
                    {lookupResult.role === 'validator' ? 'Validator & Pemilih' : 'Pemilih DPT'}
                  </span>
                </div>
                <div className="font-display text-lg font-bold text-[#0B0B0E]">
                  {lookupResult.fullName}
                </div>
                <div className="text-xs text-[#0B0B0E]/65">
                  Teknik Kimia · Angkatan {lookupResult.angkatan}
                </div>
              </div>

              <div>
                <label
                  htmlFor="split-voter-pin"
                  className="block text-xs font-semibold text-[#0B0B0E]/75 mb-2"
                >
                  {lookupResult.hasPassword
                    ? 'Masukkan PIN / Kata Sandi Anda'
                    : 'Buat PIN / Kata Sandi Pribadi'}
                </label>
                <input
                  id="split-voter-pin"
                  type="password"
                  minLength={4}
                  placeholder="Minimal 4 karakter"
                  value={voterPassword}
                  onChange={(e) => setVoterPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-[#E2DFD7] text-sm focus:outline-none focus:border-[#480E8A]"
                  required
                  autoFocus
                />
                {!lookupResult.hasPassword && (
                  <p className="mt-2 text-xs text-[#0B0B0E]/60 leading-relaxed">
                    Aktivasi pertama kali: PIN ini melindungi Kartu Pemilih Digital dan surat suara Anda.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLookupResult(null);
                    setVoterPassword('');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-3 border border-[#E2DFD7] bg-white text-sm font-medium hover:border-[#0B0B0E] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ganti NIM</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#480E8A] text-white text-sm font-semibold hover:bg-[#320863] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <span>
                    {loading
                      ? 'Memproses...'
                      : lookupResult.hasPassword
                      ? 'Masuk Sekarang'
                      : 'Aktifkan & Masuk'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Admin KPR Login */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0E] tracking-tight">
                  {needsBootstrap
                    ? 'Aktivasi Awal Admin KPR'
                    : 'Masuk Konsol Admin KPR'}
                </h2>
                <p className="mt-2 text-sm text-[#0B0B0E]/70 leading-relaxed">
                  {needsBootstrap
                    ? 'Kata sandi admin pada variabel lingkungan (.env) belum dikonfigurasi. Tetapkan kredensial admin awal untuk mengelola pemilih, validator, dan kandidat.'
                    : adminStatus?.envConfigured
                    ? 'Kredensial diverifikasi terhadap konfigurasi server (.env).'
                    : 'Masukkan kredensial administrator KPR HIMATEKIA-ITERA 2026.'}
                </p>
              </div>

              <div>
                <label
                  htmlFor="split-admin-username"
                  className="block text-xs font-semibold text-[#0B0B0E]/75 mb-1.5"
                >
                  Username Admin
                </label>
                <input
                  id="split-admin-username"
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E2DFD7] font-mono text-sm focus:outline-none focus:border-[#0B0B0E]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="split-admin-password"
                  className="block text-xs font-semibold text-[#0B0B0E]/75 mb-1.5"
                >
                  Kata Sandi Admin
                </label>
                <input
                  id="split-admin-password"
                  type="password"
                  minLength={needsBootstrap ? 6 : 1}
                  placeholder={needsBootstrap ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E2DFD7] text-sm focus:outline-none focus:border-[#0B0B0E]"
                  required
                  autoFocus
                />
              </div>

              {needsBootstrap && (
                <div>
                  <label
                    htmlFor="split-admin-password-confirm"
                    className="block text-xs font-semibold text-[#0B0B0E]/75 mb-1.5"
                  >
                    Konfirmasi Kata Sandi Admin
                  </label>
                  <input
                    id="split-admin-password-confirm"
                    type="password"
                    minLength={6}
                    placeholder="Ulangi kata sandi"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#E2DFD7] text-sm focus:outline-none focus:border-[#0B0B0E]"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#0B0B0E] text-white text-sm font-semibold hover:bg-[#480E8A] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Memverifikasi...'
                    : needsBootstrap
                    ? 'Simpan & Masuk Admin'
                    : 'Masuk Konsol Admin'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="pt-6 border-t border-[#E2DFD7] flex flex-wrap items-center justify-between gap-2 text-xs text-[#0B0B0E]/55">
          <span>Sesi terlindungi token terenkripsi</span>
          <span>Teknik Kimia ITERA</span>
        </div>
      </section>
    </div>
  );
};
