import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  LogOut,
  ScanLine,
  AlertCircle,
} from 'lucide-react';
import { Candidate, LOGO_ASSET_PATH } from '../data/pemiraData';
import { apiRequest, VoterProfile } from '../lib/api';

interface VoterWorkspaceProps {
  token: string;
  voter: VoterProfile;
  candidates: Candidate[];
  onRefreshProfile: () => Promise<void>;
  onSwitchToValidator?: () => void;
  onExitToPublic: () => void;
  onLogout: () => void;
}

export const VoterWorkspace: React.FC<VoterWorkspaceProps> = ({
  token,
  voter,
  candidates,
  onRefreshProfile,
  onSwitchToValidator,
  onExitToPublic,
  onLogout,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedBphId, setSelectedBphId] = useState('');
  const [selectedSenatorId, setSelectedSenatorId] = useState('');
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [receiptCode, setReceiptCode] = useState('');

  const bphCandidates = candidates.filter((c) => c.chamber === 'bph');
  const senatorCandidates = candidates.filter((c) => c.chamber === 'senator');

  // Generate QR code image for this voter's unique code
  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(voter.uniqueCode, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0B0B0E',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch(() => {
        // Fallback handled in UI
      });
    return () => {
      mounted = false;
    };
  }, [voter.uniqueCode]);

  // Auto-poll validation status every 3 seconds while pending
  useEffect(() => {
    if (voter.validationStatus === 'validated' || voter.hasVoted) return;
    const timer = window.setInterval(() => {
      onRefreshProfile().catch(() => {});
    }, 3000);
    return () => window.clearInterval(timer);
  }, [voter.validationStatus, voter.hasVoted, onRefreshProfile]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(voter.uniqueCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCastVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBphId || !selectedSenatorId) {
      setVoteError('Pilih 1 Calon Ketua BPH dan 1 Calon Senator sebelum menyegel surat suara.');
      return;
    }

    setVoteError('');
    setSubmittingVote(true);
    try {
      const res = await apiRequest<{ receiptCode: string }>(
        '/api/voter/vote',
        {
          method: 'POST',
          body: JSON.stringify({
            bphCandidateId: selectedBphId,
            senatorCandidateId: selectedSenatorId,
          }),
        },
        token
      );
      setReceiptCode(res.receiptCode);
      await onRefreshProfile();
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : 'Gagal mengirim suara.');
    } finally {
      setSubmittingVote(false);
    }
  };

  // Deterministic 1D barcode bar widths from uniqueCode characters
  const barcodeBars = voter.uniqueCode.split('').flatMap((ch, idx) => {
    const code = ch.charCodeAt(0);
    return [
      { w: (code % 3) + 1, dark: true, key: `${idx}-a` },
      { w: ((code >> 2) % 2) + 1, dark: false, key: `${idx}-b` },
      { w: ((code >> 4) % 3) + 1, dark: true, key: `${idx}-c` },
      { w: 1, dark: false, key: `${idx}-d` },
    ];
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0B0B0E] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E2DFD7]">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-[#E2DFD7] shrink-0">
              <img
                src={LOGO_ASSET_PATH}
                alt="Logo HIMATEKIA ITERA"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display text-sm sm:text-base font-bold truncate">
              Portal Pemilih · PEMIRA HIMATEKIA 2026
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {voter.role === 'validator' && onSwitchToValidator && (
              <button
                type="button"
                onClick={onSwitchToValidator}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#D59B0A] bg-[#D59B0A]/15 text-xs font-semibold text-[#0B0B0E] hover:bg-[#D59B0A] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Konsol Validator</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExitToPublic}
              className="hidden sm:inline-flex items-center px-3.5 py-2 border border-[#E2DFD7] bg-white text-xs font-medium hover:border-[#0B0B0E] transition-colors cursor-pointer whitespace-nowrap"
            >
              Beranda Publik
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B0B0E] text-white text-xs font-semibold hover:bg-[#480E8A] transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-5 sm:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Digital Voter Pass (Barcode + Unique Code + Validation Status) */}
          <aside className="lg:col-span-4 border border-[#0B0B0E] bg-white">
            <div className="px-6 py-4 bg-[#0B0B0E] text-white flex items-center justify-between">
              <span className="text-xs font-medium text-[#D59B0A]">
                Kartu Pemilih Digital
              </span>
              <span className="font-mono text-xs tabular-nums">
                {voter.angkatan}
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h1 className="font-display text-xl font-bold text-[#0B0B0E] leading-snug">
                  {voter.fullName}
                </h1>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#0B0B0E]/65">
                  <span className="font-mono tabular-nums">{voter.nim}</span>
                  <span aria-hidden="true">·</span>
                  <span>{voter.programStudi}</span>
                  <span aria-hidden="true">·</span>
                  <span>{voter.membershipStatus}</span>
                </div>
              </div>

              {/* Explicit Status Indicator */}
              <div
                className={`p-3.5 border flex items-start gap-3 ${
                  voter.hasVoted
                    ? 'border-[#480E8A] bg-[#480E8A]/5 text-[#480E8A]'
                    : voter.validationStatus === 'validated'
                    ? 'border-[#16A34A] bg-[#16A34A]/5 text-[#15803D]'
                    : 'border-[#D59B0A] bg-[#D59B0A]/10 text-[#0B0B0E]'
                }`}
              >
                {voter.hasVoted ? (
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                ) : voter.validationStatus === 'validated' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 shrink-0 mt-0.5 text-[#D59B0A]" />
                )}
                <div className="text-xs leading-relaxed">
                  <div className="font-bold">
                    {voter.hasVoted
                      ? 'Hak Suara Telah Digunakan'
                      : voter.validationStatus === 'validated'
                      ? 'Tervalidasi · Siap Memilih'
                      : 'Menunggu Validasi Validator'}
                  </div>
                  <div className="mt-0.5 opacity-80">
                    {voter.hasVoted
                      ? 'Suara Anda telah disegel secara anonim ke kotak suara.'
                      : voter.validationStatus === 'validated'
                      ? `Divalidasi oleh ${voter.validatedBy || 'Validator KPR'}.`
                      : 'Tunjukkan QR Barcode atau Kode Unik ini kepada Validator KPR di meja verifikasi.'}
                  </div>
                </div>
              </div>

              {/* QR Barcode + Linear Barcode + Unique Code */}
              <div className="border border-[#E2DFD7] bg-[#FAF9F6] p-5 flex flex-col items-center text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Barcode validasi pemilih ${voter.uniqueCode}`}
                    className="w-44 h-44 border border-[#E2DFD7] bg-white p-2"
                  />
                ) : (
                  <div className="w-44 h-44 border border-[#E2DFD7] bg-white flex items-center justify-center text-xs text-[#0B0B0E]/50">
                    Memuat QR Barcode...
                  </div>
                )}

                {/* Crisp 1D Barcode */}
                <div
                  className="mt-4 flex items-stretch justify-center h-9 bg-white px-3 py-1.5 border border-[#E2DFD7]"
                  aria-hidden="true"
                >
                  {barcodeBars.map((b) => (
                    <span
                      key={b.key}
                      style={{ width: `${b.w * 1.5}px` }}
                      className={b.dark ? 'bg-[#0B0B0E]' : 'bg-transparent'}
                    />
                  ))}
                </div>

                <div className="mt-3 text-xs text-[#0B0B0E]/60">Kode Unik Pemilih</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-base font-bold tracking-wider text-[#0B0B0E] tabular-nums">
                    {voter.uniqueCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    aria-label="Salin kode unik pemilih"
                    className="p-1.5 border border-[#E2DFD7] bg-white hover:border-[#0B0B0E] transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {voter.validationStatus === 'pending' && (
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E2DFD7] bg-[#FAF9F6] text-xs font-semibold hover:border-[#0B0B0E] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Memeriksa...' : 'Periksa Status Validasi'}</span>
                </button>
              )}
            </div>
          </aside>

          {/* Right: Voting Area */}
          <section className="lg:col-span-8">
            {voter.validationStatus === 'pending' && !voter.hasVoted && (
              <div className="border border-[#E2DFD7] bg-white p-8 sm:p-10">
                <div className="text-xs font-medium text-[#D59B0A] mb-2">
                  Tahap 1 dari 2 · Verifikasi Kehadiran
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0E] text-balance">
                  Menunggu Validasi oleh Validator KPR
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#0B0B0E]/75 leading-relaxed max-w-2xl">
                  Sesuai mekanisme PEMIRA HIMATEKIA-ITERA 2026, surat suara elektronik baru akan terbuka setelah Validator memindai QR Barcode atau memverifikasi Kode Unik Anda (<span className="font-mono font-semibold text-[#480E8A]">{voter.uniqueCode}</span>).
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#E2DFD7] pt-6 text-xs">
                  <div>
                    <div className="font-mono font-bold text-[#480E8A] mb-1">01</div>
                    <div className="font-semibold text-[#0B0B0E]">Tunjukkan Kode</div>
                    <p className="mt-1 text-[#0B0B0E]/65 leading-relaxed">
                      Perlihatkan QR Barcode atau sebutkan Kode Unik kepada petugas Validator.
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-[#D59B0A] mb-1">02</div>
                    <div className="font-semibold text-[#0B0B0E]">Validasi Otomatis</div>
                    <p className="mt-1 text-[#0B0B0E]/65 leading-relaxed">
                      Halaman ini otomatis memeriksa status validasi setiap beberapa detik.
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-[#0B0B0E] mb-1">03</div>
                    <div className="font-semibold text-[#0B0B0E]">Bilik Suara Terbuka</div>
                    <p className="mt-1 text-[#0B0B0E]/65 leading-relaxed">
                      Pilih Calon Ketua BPH dan Calon Senator secara bebas dan rahasia.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {voter.validationStatus === 'validated' && !voter.hasVoted && (
              <form
                onSubmit={handleCastVote}
                className="border border-[#0B0B0E] bg-white p-6 sm:p-10 space-y-10"
              >
                <div className="border-b border-[#E2DFD7] pb-6">
                  <div className="text-xs font-medium text-[#480E8A] mb-1">
                    Bilik Suara Resmi · Tervalidasi
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0E]">
                    Surat Suara PEMIRA HIMATEKIA-ITERA 2026
                  </h2>
                  <p className="mt-2 text-sm text-[#0B0B0E]/70">
                    Pilih tepat satu kandidat untuk masing-masing jabatan di bawah ini. Pilihan Anda dicatat tanpa menautkan NIM pada kotak suara.
                  </p>
                </div>

                {voteError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3.5 border border-[#C61D1D] bg-[#C61D1D]/5 text-sm text-[#C61D1D]"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{voteError}</span>
                  </div>
                )}

                {/* Ballot 1: Ketua BPH */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-[#E2DFD7] pb-2">
                    <h3 className="font-display text-lg font-bold text-[#0B0B0E]">
                      1. Calon Ketua Badan Pengurus Harian (BPH) 2026
                    </h3>
                    <span className="text-xs text-[#480E8A] font-medium">Wajib pilih 1</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bphCandidates.map((cand) => {
                      const active = selectedBphId === cand.id;
                      return (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => setSelectedBphId(cand.id)}
                          className={`text-left p-5 border transition-colors cursor-pointer flex flex-col justify-between ${
                            active
                              ? 'border-[#480E8A] bg-[#480E8A]/[0.06] ring-1 ring-[#480E8A]'
                              : 'border-[#E2DFD7] bg-[#FAF9F6] hover:border-[#0B0B0E]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm font-bold text-[#480E8A] tabular-nums">
                                No. Urut {cand.number}
                              </span>
                              <span
                                className={`w-6 h-6 border flex items-center justify-center ${
                                  active
                                    ? 'bg-[#480E8A] border-[#480E8A] text-white'
                                    : 'border-[#E2DFD7] bg-white'
                                }`}
                              >
                                {active && <Check className="w-3.5 h-3.5" />}
                              </span>
                            </div>
                            <div className="mt-3 flex items-start gap-3">
                              {cand.photoUrl && (
                                <img
                                  src={cand.photoUrl}
                                  alt={`Foto ${cand.name}`}
                                  className="w-14 h-16 object-cover object-top border border-[#E2DFD7] shrink-0 bg-white"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="font-display text-lg font-bold text-[#0B0B0E] leading-snug">
                                  {cand.name}
                                </div>
                                <div className="mt-1 text-xs text-[#0B0B0E]/60">
                                  {cand.cohort} · {cand.nim}
                                </div>
                              </div>
                            </div>
                            <p className="mt-3 text-xs italic text-[#0B0B0E]/75">
                              “{cand.motto}”
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ballot 2: Senator */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-[#E2DFD7] pb-2">
                    <h3 className="font-display text-lg font-bold text-[#0B0B0E]">
                      2. Calon Senator HIMATEKIA-ITERA 2026
                    </h3>
                    <span className="text-xs text-[#D59B0A] font-semibold">Wajib pilih 1</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {senatorCandidates.map((cand) => {
                      const active = selectedSenatorId === cand.id;
                      return (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => setSelectedSenatorId(cand.id)}
                          className={`text-left p-5 border transition-colors cursor-pointer flex flex-col justify-between ${
                            active
                              ? 'border-[#0B0B0E] bg-[#0B0B0E] text-white'
                              : 'border-[#E2DFD7] bg-[#FAF9F6] text-[#0B0B0E] hover:border-[#0B0B0E]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-mono text-sm font-bold tabular-nums ${
                                  active ? 'text-[#D59B0A]' : 'text-[#480E8A]'
                                }`}
                              >
                                No. {cand.number}
                              </span>
                              <span
                                className={`w-6 h-6 border flex items-center justify-center ${
                                  active
                                    ? 'bg-[#D59B0A] border-[#D59B0A] text-[#0B0B0E]'
                                    : 'border-[#E2DFD7] bg-white'
                                }`}
                              >
                                {active && <Check className="w-3.5 h-3.5" />}
                              </span>
                            </div>
                            {cand.photoUrl && (
                              <div className="mt-3 aspect-[4/3.6] w-full overflow-hidden border border-white/15 bg-black/10">
                                <img
                                  src={cand.photoUrl}
                                  alt={`Foto ${cand.name}`}
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                            )}
                            <div className="mt-3 font-display text-base font-bold leading-snug">
                              {cand.name}
                            </div>
                            <div
                              className={`mt-1 text-xs ${
                                active ? 'text-white/70' : 'text-[#0B0B0E]/60'
                              }`}
                            >
                              {cand.cohort}
                            </div>
                            <p
                              className={`mt-3 text-xs italic ${
                                active ? 'text-white/80' : 'text-[#0B0B0E]/75'
                              }`}
                            >
                              “{cand.motto}”
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E2DFD7] flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs text-[#0B0B0E]/60">
                    Pilihan bersifat final dan tidak dapat diubah setelah dikirim.
                  </span>
                  <button
                    type="submit"
                    disabled={submittingVote || !selectedBphId || !selectedSenatorId}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#480E8A] text-white text-sm font-semibold hover:bg-[#320863] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <span>
                      {submittingVote ? 'Menyegel Surat Suara...' : 'Kirim & Segel Suara Sah'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {voter.hasVoted && (
              <div className="border border-[#480E8A] bg-white p-8 sm:p-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#480E8A] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#480E8A]">
                      Partisipasi Tercatat
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0E] mt-1">
                      Suara Anda Telah Sah Direkam
                    </h2>
                    <p className="mt-2 text-sm text-[#0B0B0E]/75 leading-relaxed max-w-xl">
                      Terima kasih telah berpartisipasi dalam PEMIRA HIMATEKIA-ITERA 2026. Demi menjamin asas kerahasiaan (LUBER JURDIL), pilihan kandidat Anda tidak disimpan pada profil pemilih ini.
                    </p>
                  </div>
                </div>

                <div className="border border-[#E2DFD7] bg-[#FAF9F6] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-[#0B0B0E]/55">Status Pemilih</div>
                    <div className="font-semibold text-[#0B0B0E] mt-0.5">
                      Sudah Menggunakan Hak Pilih
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#0B0B0E]/55">
                      {receiptCode ? 'Kode Tanda Terima Surat Suara' : 'Waktu Pencoblosan'}
                    </div>
                    <div className="font-mono font-semibold text-[#480E8A] mt-0.5 tabular-nums">
                      {receiptCode ||
                        (voter.votedAt
                          ? new Date(voter.votedAt).toLocaleString('id-ID')
                          : 'Tercatat')}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={onExitToPublic}
                    className="px-5 py-2.5 bg-[#0B0B0E] text-white text-sm font-semibold hover:bg-[#480E8A] transition-colors cursor-pointer"
                  >
                    Kembali ke Beranda Publik
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
