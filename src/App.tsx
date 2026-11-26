import React, { useCallback, useEffect, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { ArrowUpRight, Check, Scale, X } from 'lucide-react';
import {
  BPH_CANDIDATES,
  SENATOR_CANDIDATES,
  Candidate,
  LOGO_ASSET_PATH,
} from './data/pemiraData';
import {
  AdminUser,
  apiRequest,
  PublicOverviewResponse,
  VoterProfile,
} from './lib/api';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CandidatePlateArt } from './components/CandidatePlateArt';
import { CandidateModal } from './components/CandidateModal';
import { ComparisonModal } from './components/ComparisonModal';
import { TimelineAndMechanism } from './components/TimelineAndMechanism';
import { LoginPage } from './components/LoginPage';
import { VoterWorkspace } from './components/VoterWorkspace';
import { ValidatorWorkspace } from './components/ValidatorWorkspace';
import { AdminWorkspace } from './components/AdminWorkspace';

type ActiveWorkspace = 'public' | 'login' | 'voter' | 'validator' | 'admin';

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([
    ...BPH_CANDIDATES,
    ...SENATOR_CANDIDATES,
  ]);
  const [publicStats, setPublicStats] = useState({
    totalDpt: 0,
    totalValidated: 0,
    totalVoted: 0,
  });

  // Modals on public landing
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [comparedCandidates, setComparedCandidates] = useState<Candidate[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Authenticated session state (held strictly in JS memory, never localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [voterSession, setVoterSession] = useState<VoterProfile | null>(null);
  const [adminSession, setAdminSession] = useState<AdminUser | null>(null);
  const [workspace, setWorkspace] = useState<ActiveWorkspace>(() =>
    typeof window !== 'undefined' && window.location.pathname === '/login'
      ? 'login'
      : 'public'
  );

  const navigateWorkspace = useCallback((next: ActiveWorkspace) => {
    setWorkspace(next);
    if (typeof window !== 'undefined') {
      const targetPath = next === 'login' ? '/login' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ workspace: next }, '', targetPath);
      }
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/login') {
        setWorkspace('login');
      } else {
        setWorkspace('public');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadPublicOverview = useCallback(async () => {
    try {
      const res = await apiRequest<PublicOverviewResponse>('/api/public/overview');
      if (res.candidates.length > 0) {
        setCandidates(res.candidates);
      }
      setPublicStats(res.stats);
    } catch {
      // Fallback to initial seed display if request fails
    }
  }, []);

  useEffect(() => {
    void loadPublicOverview();
  }, [loadPublicOverview]);

  const refreshVoterProfile = useCallback(async () => {
    if (!authToken) return;
    const res = await apiRequest<{ role: string; voter?: VoterProfile }>(
      '/api/auth/me',
      {},
      authToken
    );
    if (res.voter) {
      setVoterSession(res.voter);
    }
  }, [authToken]);

  const handleAuthenticatedVoter = (token: string, voter: VoterProfile) => {
    setAuthToken(token);
    setAdminSession(null);
    setVoterSession(voter);
    navigateWorkspace(voter.role === 'validator' ? 'validator' : 'voter');
  };

  const handleAuthenticatedAdmin = (token: string, admin: AdminUser) => {
    setAuthToken(token);
    setVoterSession(null);
    setAdminSession(admin);
    navigateWorkspace('admin');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setVoterSession(null);
    setAdminSession(null);
    navigateWorkspace('public');
    void loadPublicOverview();
  };

  const handleOpenPortalOrWorkspace = () => {
    setActiveCandidate(null);
    if (authToken && adminSession) {
      navigateWorkspace('admin');
      return;
    }
    if (authToken && voterSession) {
      navigateWorkspace(voterSession.role === 'validator' ? 'validator' : 'voter');
      return;
    }
    navigateWorkspace('login');
  };

  const handleToggleCompare = (candidate: Candidate) => {
    setComparedCandidates((prev) => {
      const exists = prev.some((c) => c.id === candidate.id);
      if (exists) {
        return prev.filter((c) => c.id !== candidate.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), candidate];
      }
      return [...prev, candidate];
    });
  };

  const handleRemoveCompare = (id: string) => {
    setComparedCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const bphCandidates = candidates.filter((c) => c.chamber === 'bph');
  const senatorCandidates = candidates.filter((c) => c.chamber === 'senator');

  // Dedicated Full-Width Full-Height Split Login Page
  if (workspace === 'login') {
    return (
      <MotionConfig reducedMotion="user">
        <LoginPage
          onBackToPublic={() => navigateWorkspace('public')}
          onAuthenticatedVoter={handleAuthenticatedVoter}
          onAuthenticatedAdmin={handleAuthenticatedAdmin}
        />
      </MotionConfig>
    );
  }

  // Role Workspaces
  if (workspace === 'admin' && authToken && adminSession) {
    return (
      <MotionConfig reducedMotion="user">
        <AdminWorkspace
          token={authToken}
          adminUser={adminSession}
          onCandidatesUpdated={loadPublicOverview}
          onExitToPublic={() => {
            void loadPublicOverview();
            navigateWorkspace('public');
          }}
          onLogout={handleLogout}
        />
      </MotionConfig>
    );
  }

  if (workspace === 'validator' && authToken && voterSession && voterSession.role === 'validator') {
    return (
      <MotionConfig reducedMotion="user">
        <ValidatorWorkspace
          token={authToken}
          validatorProfile={voterSession}
          onSwitchToVoting={async () => {
            await refreshVoterProfile();
            navigateWorkspace('voter');
          }}
          onExitToPublic={() => {
            void loadPublicOverview();
            navigateWorkspace('public');
          }}
          onLogout={handleLogout}
        />
      </MotionConfig>
    );
  }

  if (workspace === 'voter' && authToken && voterSession) {
    return (
      <MotionConfig reducedMotion="user">
        <VoterWorkspace
          token={authToken}
          voter={voterSession}
          candidates={candidates}
          onRefreshProfile={refreshVoterProfile}
          onSwitchToValidator={
            voterSession.role === 'validator'
              ? () => navigateWorkspace('validator')
              : undefined
          }
          onExitToPublic={() => {
            void loadPublicOverview();
            navigateWorkspace('public');
          }}
          onLogout={handleLogout}
        />
      </MotionConfig>
    );
  }

  const activeSessionLabel = adminSession
    ? 'Kembali ke Admin'
    : voterSession
    ? voterSession.role === 'validator'
      ? 'Konsol Validator'
      : 'Kartu & Bilik Suara'
    : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#0B0B0E]">
        <Navbar
          onOpenPortal={handleOpenPortalOrWorkspace}
          sessionLabel={activeSessionLabel}
        />

        <main className="flex-1">
          {/* Hero & Architectural Factual Strip */}
          <Hero
            onOpenPortal={handleOpenPortalOrWorkspace}
            bphCount={bphCandidates.length}
            senatorCount={senatorCandidates.length}
            totalDpt={publicStats.totalDpt}
            totalVoted={publicStats.totalVoted}
          />

          {/* Section 01: Calon Ketua Badan Pengurus Harian (BPH) HIMATEKIA-ITERA 2026 */}
          <section
            id="kandidat-bph"
            className="border-b border-[#E2DFD7] bg-[#FAF9F6] py-16 lg:py-24"
          >
            <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-12">
                <div className="lg:col-span-7">
                  <div className="text-xs font-medium text-[#480E8A] mb-2">
                    01. Surat Suara Eksekutif
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-[#0B0B0E] text-balance">
                    Calon Ketua Badan Pengurus Harian HIMATEKIA-ITERA 2026
                  </h2>
                </div>
                <div className="lg:col-span-5">
                  <p className="text-sm sm:text-base text-[#0B0B0E]/70 leading-relaxed">
                    Pemimpin eksekutif tertinggi himpunan yang merumuskan arah gerak kaderisasi, pengembangan riset keteknikkimiaan, dan kemitraan eksternal selama satu periode bakti.
                  </p>
                </div>
              </div>

              {/* 2-Column Editorial Candidate Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {bphCandidates.map((candidate) => {
                  const isCompared = comparedCandidates.some(
                    (c) => c.id === candidate.id
                  );

                  return (
                    <motion.article
                      key={candidate.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="group border border-[#E2DFD7] bg-white flex flex-col justify-between transition-colors duration-200 hover:border-[#0B0B0E]"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12">
                        {/* Plate Visual */}
                        <div className="sm:col-span-5 border-b sm:border-b-0 sm:border-r border-[#E2DFD7]">
                          <CandidatePlateArt
                            candidate={candidate}
                            className="h-72 sm:h-full min-h-[290px]"
                          />
                        </div>

                        {/* Candidate Manifesto Summary */}
                        <div className="sm:col-span-7 p-6 sm:p-7 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-[#0B0B0E]/60">
                              <span className="font-mono font-medium text-[#480E8A]">
                                Kandidat {candidate.number}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{candidate.origin}</span>
                            </div>

                            <h3 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-[#0B0B0E] leading-snug">
                              {candidate.name}
                            </h3>

                            <p className="mt-2 text-sm italic text-[#480E8A] font-medium">
                              “{candidate.motto}”
                            </p>

                            <p className="mt-4 text-sm text-[#0B0B0E]/75 leading-relaxed line-clamp-4">
                              {candidate.vision}
                            </p>

                            <div className="mt-5 pt-4 border-t border-[#E2DFD7]">
                              <div className="text-xs font-semibold text-[#0B0B0E]/55 mb-2">
                                Program Prioritas
                              </div>
                              <ul className="space-y-1.5 text-xs text-[#0B0B0E]/85">
                                {candidate.programs.slice(0, 2).map((prog, idx) => (
                                  <li key={idx} className="truncate">
                                    — {prog.title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E2DFD7] flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleCompare(candidate)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold py-2 px-3 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isCompared
                              ? 'border-[#D59B0A] bg-[#D59B0A]/15 text-[#0B0B0E]'
                              : 'border-[#E2DFD7] bg-white text-[#0B0B0E]/80 hover:border-[#0B0B0E]'
                          }`}
                        >
                          {isCompared ? (
                            <Check className="w-3.5 h-3.5 text-[#D59B0A]" />
                          ) : (
                            <Scale className="w-3.5 h-3.5 text-[#0B0B0E]/60" />
                          )}
                          <span>{isCompared ? 'Dibandingkan' : 'Bandingkan'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCandidate(candidate)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#480E8A] text-white text-xs font-semibold hover:bg-[#320863] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>Baca Visi & Program</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 02: Calon Senator HIMATEKIA-ITERA 2026 (Dark Obsidian Contrast Band) */}
          <section
            id="kandidat-senator"
            className="border-b border-[#272733] bg-[#0B0B0E] text-[#FAF9F6] py-16 lg:py-24"
          >
            <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-12">
                <div className="lg:col-span-7">
                  <div className="text-xs font-medium tracking-wide text-[#D59B0A] mb-2">
                    02. Surat Suara Legislatif
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-white text-balance">
                    Calon Senator HIMATEKIA-ITERA 2026
                  </h2>
                </div>
                <div className="lg:col-span-5">
                  <p className="text-sm sm:text-base text-[#FAF9F6]/75 tracking-[0.01em] leading-relaxed">
                    Mandat legislatif dan pengawasan yang menyalurkan aspirasi mahasiswa Teknik Kimia serta mengawal kebijakan strategis di Senat Mahasiswa KM-ITERA.
                  </p>
                </div>
              </div>

              {/* 3-Column Editorial Senator Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {senatorCandidates.map((candidate) => {
                  const isCompared = comparedCandidates.some(
                    (c) => c.id === candidate.id
                  );

                  return (
                    <motion.article
                      key={candidate.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="group border border-[#272733] bg-[#141419] flex flex-col justify-between transition-colors duration-200 hover:border-[#D59B0A]"
                    >
                      <div>
                        <CandidatePlateArt
                          candidate={candidate}
                          className="aspect-[4/3.6] w-full border-0 border-b border-[#272733]"
                        />

                        <div className="p-6">
                          <div className="flex items-center gap-2 text-xs text-[#FAF9F6]/65">
                            <span className="font-mono font-medium text-[#D59B0A]">
                              Senator {candidate.number}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{candidate.origin}</span>
                          </div>

                          <h3 className="mt-2.5 font-display text-xl font-bold text-white leading-snug tracking-[0.01em]">
                            {candidate.name}
                          </h3>

                          <p className="mt-2 text-xs italic text-[#E5AC1A] font-medium">
                            “{candidate.motto}”
                          </p>

                          <p className="mt-4 text-sm text-[#FAF9F6]/75 tracking-[0.01em] leading-relaxed line-clamp-3">
                            {candidate.vision}
                          </p>

                          <div className="mt-5 pt-4 border-t border-[#272733]">
                            <div className="text-xs font-medium text-[#FAF9F6]/55 mb-2">
                              Agenda Legislasi
                            </div>
                            <ul className="space-y-1.5 text-xs text-[#FAF9F6]/85">
                              {candidate.programs.map((prog, idx) => (
                                <li key={idx} className="truncate">
                                  — {prog.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 border-t border-[#272733] bg-[#0B0B0E] flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleCompare(candidate)}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium py-2 px-3 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isCompared
                              ? 'border-[#D59B0A] bg-[#D59B0A] text-[#0B0B0E]'
                              : 'border-[#272733] bg-transparent text-[#FAF9F6]/80 hover:border-white'
                          }`}
                        >
                          {isCompared ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Scale className="w-3.5 h-3.5" />
                          )}
                          <span>{isCompared ? 'Dibandingkan' : 'Bandingkan'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCandidate(candidate)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#480E8A] text-white text-xs font-semibold hover:bg-[#5E16B0] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>Baca Visi & Program</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 03 & 04: Linimasa & Mekanisme Pemilihan */}
          <TimelineAndMechanism />

          {/* Final Decision CTA Band */}
          <section className="bg-[#480E8A] text-white py-16 lg:py-20 border-b border-[#320863]">
            <div className="max-w-[1320px] mx-auto px-5 sm:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="text-xs font-medium text-[#E5AC1A] mb-2">
                  Partisipasi Anggota Biasa HIMATEKIA-ITERA
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-balance">
                  Gunakan Hak Pilih Anda untuk Kepengurusan 2026–2027.
                </h2>
                <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
                  Masuk menggunakan NIM Teknik Kimia ITERA, tunjukkan QR Barcode atau Kode Unik Anda ke Validator KPR, lalu pilih Ketua BPH dan Senator.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleOpenPortalOrWorkspace}
                  className="inline-flex items-center gap-3 px-7 py-4 bg-[#D59B0A] text-[#0B0B0E] text-sm font-bold hover:bg-[#E5AC1A] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{activeSessionLabel || 'Masuk Portal E-Voting'}</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Quiet Institutional Footer */}
        <footer className="bg-[#0B0B0E] text-[#FAF9F6] py-12">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/15 items-start">
              <div className="md:col-span-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white shrink-0 border border-[#D59B0A]/60">
                  <img
                    src={LOGO_ASSET_PATH}
                    alt="Lambang HIMATEKIA ITERA"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-display text-lg font-bold">
                    PEMIRA HIMATEKIA-ITERA 2026
                  </div>
                  <p className="mt-1 text-xs text-[#FAF9F6]/65 max-w-md leading-relaxed">
                    Komisi Pemilihan Raya Himpunan Mahasiswa Teknik Kimia Institut Teknologi Sumatera · Jalan Terusan Ryacudu, Way Huwi, Lampung Selatan.
                  </p>
                </div>
              </div>

              <div className="md:col-span-3 space-y-2 text-xs">
                <div className="font-semibold text-[#D59B0A] mb-3">Navigasi</div>
                <a href="#kandidat-bph" className="block text-[#FAF9F6]/75 hover:text-white">
                  Calon Ketua BPH 2026
                </a>
                <a href="#kandidat-senator" className="block text-[#FAF9F6]/75 hover:text-white">
                  Calon Senator 2026
                </a>
                <a href="#linimasa" className="block text-[#FAF9F6]/75 hover:text-white">
                  Linimasa Pemilihan
                </a>
                <a href="#mekanisme" className="block text-[#FAF9F6]/75 hover:text-white">
                  Mekanisme & Tata Cara
                </a>
              </div>

              <div className="md:col-span-3 space-y-2 text-xs">
                <div className="font-semibold text-[#D59B0A] mb-3">Portal Peran</div>
                <button
                  type="button"
                  onClick={handleOpenPortalOrWorkspace}
                  className="block text-left text-[#FAF9F6]/75 hover:text-white cursor-pointer"
                >
                  Masuk Pemilih / Validator / Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (comparedCandidates.length > 0) {
                      setIsCompareOpen(true);
                    } else if (bphCandidates.length >= 2) {
                      setComparedCandidates([bphCandidates[0], bphCandidates[1]]);
                      setIsCompareOpen(true);
                    }
                  }}
                  className="block text-left text-[#FAF9F6]/75 hover:text-white cursor-pointer"
                >
                  Bandingkan Kandidat Ketua BPH
                </button>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#FAF9F6]/50">
              <span>© 2026 Komisi Pemilihan Raya HIMATEKIA-ITERA.</span>
              <span>Pemilihan Ketua BPH & Senator Teknik Kimia ITERA.</span>
            </div>
          </div>
        </footer>

        {/* Floating Comparison Tray */}
        {comparedCandidates.length > 0 && (
          <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 z-30 max-w-lg bg-[#0B0B0E] text-white border border-[#D59B0A] px-4 py-3 shadow-2xl flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#D59B0A]">
                Daftar Perbandingan ({comparedCandidates.length}/3)
              </div>
              <div className="text-xs text-white/80 truncate">
                {comparedCandidates.map((c) => `No. ${c.number} ${c.name.split(' ')[0]}`).join(' · ')}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCompareOpen(true)}
                className="px-3.5 py-2 bg-[#480E8A] text-white text-xs font-semibold hover:bg-[#5E16B0] transition-colors cursor-pointer whitespace-nowrap"
              >
                Bandingkan
              </button>
              <button
                type="button"
                onClick={() => setComparedCandidates([])}
                aria-label="Kosongkan daftar perbandingan"
                className="p-2 border border-white/20 text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <CandidateModal
          candidate={activeCandidate}
          onClose={() => setActiveCandidate(null)}
          onOpenVotingWithCandidate={() => handleOpenPortalOrWorkspace()}
          onToggleCompare={handleToggleCompare}
          isCompared={
            activeCandidate
              ? comparedCandidates.some((c) => c.id === activeCandidate.id)
              : false
          }
        />

        <ComparisonModal
          isOpen={isCompareOpen}
          candidates={comparedCandidates}
          onClose={() => setIsCompareOpen(false)}
          onRemoveCandidate={handleRemoveCompare}
        />
      </div>
    </MotionConfig>
  );
}
