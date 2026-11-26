import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Camera,
  CameraOff,
  LogOut,
  Vote,
} from 'lucide-react';
import { apiRequest, VoterProfile } from '../lib/api';
import { LOGO_ASSET_PATH } from '../data/pemiraData';

interface ValidatorWorkspaceProps {
  token: string;
  validatorProfile: VoterProfile;
  onSwitchToVoting: () => void;
  onExitToPublic: () => void;
  onLogout: () => void;
}

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

export const ValidatorWorkspace: React.FC<ValidatorWorkspaceProps> = ({
  token,
  validatorProfile,
  onSwitchToVoting,
  onExitToPublic,
  onLogout,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [lookupVoter, setLookupVoter] = useState<VoterProfile | null>(null);
  const [recentList, setRecentList] = useState<VoterProfile[]>([]);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadRecent = async () => {
    try {
      const res = await apiRequest<{ items: VoterProfile[] }>(
        '/api/validator/recent',
        {},
        token
      );
      setRecentList(res.items);
    } catch {
      // Ignore silent list fetch failure
    }
  };

  useEffect(() => {
    loadRecent();
  }, [token]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const performLookup = async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;
    setError('');
    setSuccessMsg('');
    setLoadingLookup(true);
    try {
      const res = await apiRequest<{ voter: VoterProfile }>(
        `/api/validator/lookup?code=${encodeURIComponent(trimmed)}`,
        {},
        token
      );
      setLookupVoter(res.voter);
    } catch (err) {
      setLookupVoter(null);
      setError(err instanceof Error ? err.message : 'Pemilih tidak ditemukan.');
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLookup(codeInput);
  };

  const handleValidateVoter = async () => {
    if (!lookupVoter) return;
    setError('');
    setSuccessMsg('');
    setValidating(true);
    try {
      const res = await apiRequest<{
        alreadyValidated: boolean;
        voter: VoterProfile;
      }>(
        '/api/validator/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code: lookupVoter.uniqueCode }),
        },
        token
      );
      setLookupVoter(res.voter);
      setSuccessMsg(
        res.alreadyValidated
          ? `${res.voter.fullName} (${res.voter.nim}) sudah berstatus tervalidasi.`
          : `Berhasil memvalidasi ${res.voter.fullName} (${res.voter.nim}). Pemilih kini dapat membuka surat suara.`
      );
      await loadRecent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memvalidasi pemilih.');
    } finally {
      setValidating(false);
    }
  };

  const startCameraScanner = async () => {
    setCameraError('');
    if (!window.BarcodeDetector) {
      setCameraError(
        'Peramban ini belum mendukung pemindaian kamera QR bawaan. Gunakan scanner barcode USB atau ketik Kode Unik / NIM pemilih secara langsung.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);

      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);

      const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128'] });
      const scanLoop = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          if (videoRef.current.readyState >= 2) {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              const foundCode = barcodes[0].rawValue;
              setCodeInput(foundCode);
              stopCamera();
              await performLookup(foundCode);
              return;
            }
          }
        } catch {
          // Ignore single frame detection error
        }
        if (streamRef.current) {
          window.requestAnimationFrame(() => {
            void scanLoop();
          });
        }
      };
      window.requestAnimationFrame(() => {
        void scanLoop();
      });
    } catch {
      setCameraError('Akses kamera ditolak atau tidak tersedia pada perangkat ini.');
      stopCamera();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0B0B0E] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0B0B0E] text-white border-b border-[#272733]">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white shrink-0">
              <img
                src={LOGO_ASSET_PATH}
                alt="Logo HIMATEKIA ITERA"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm sm:text-base font-bold truncate">
                Konsol Validator · PEMIRA HIMATEKIA 2026
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onSwitchToVoting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#480E8A] text-white text-xs font-semibold hover:bg-[#5E16B0] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Bilik Suara Saya</span>
            </button>

            <button
              type="button"
              onClick={onExitToPublic}
              className="hidden sm:inline-flex items-center px-3.5 py-2 border border-white/20 text-xs font-medium hover:bg-white hover:text-[#0B0B0E] transition-colors cursor-pointer whitespace-nowrap"
            >
              Beranda
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-white/20 text-xs font-semibold hover:bg-white hover:text-[#0B0B0E] transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-5 sm:px-8 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#E2DFD7] pb-6">
          <div>
            <div className="text-xs font-medium text-[#480E8A]">
              Petugas Validasi Resmi · {validatorProfile.fullName} ({validatorProfile.nim})
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
              Verifikasi Barcode & Kode Unik Pemilih
            </h1>
          </div>
          <div className="text-xs text-[#0B0B0E]/65">
            Total tervalidasi tercatat: <span className="font-mono font-bold text-[#0B0B0E] tabular-nums">{recentList.length}</span> terbaru
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Scanner & Validation Card */}
          <section className="lg:col-span-6 space-y-6">
            <div className="border border-[#0B0B0E] bg-white p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold">
                  Pindai atau Masukkan Kode Pemilih
                </h2>
                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : startCameraScanner}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E2DFD7] bg-[#FAF9F6] text-xs font-semibold hover:border-[#0B0B0E] cursor-pointer"
                >
                  {cameraActive ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5 text-[#C61D1D]" />
                      <span>Tutup Kamera</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5 text-[#480E8A]" />
                      <span>Pindai Kamera QR</span>
                    </>
                  )}
                </button>
              </div>

              {cameraError && (
                <div className="p-3 border border-[#D59B0A] bg-[#D59B0A]/10 text-xs text-[#0B0B0E] leading-relaxed">
                  {cameraError}
                </div>
              )}

              {cameraActive && (
                <div className="border border-[#0B0B0E] bg-[#0B0B0E] overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full max-h-64 object-cover"
                    playsInline
                    muted
                  />
                  <div className="px-3 py-2 text-xs text-white/80 flex items-center gap-2">
                    <ScanLine className="w-3.5 h-3.5 text-[#D59B0A]" />
                    <span>Arahkan kamera ke QR Barcode pada Kartu Pemilih Digital</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSearchSubmit} className="space-y-3">
                <label
                  htmlFor="validator-code-input"
                  className="block text-xs font-semibold text-[#0B0B0E]/75"
                >
                  Kode Unik / Hasil Scanner Barcode / NIM Mahasiswa
                </label>
                <div className="flex gap-2">
                  <input
                    id="validator-code-input"
                    type="text"
                    placeholder="Contoh: HMTK-23-0001-XXXX atau 123280001"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="flex-1 px-3.5 py-3 bg-[#FAF9F6] border border-[#E2DFD7] font-mono text-sm focus:outline-none focus:border-[#480E8A]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loadingLookup}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#0B0B0E] text-white text-sm font-semibold hover:bg-[#480E8A] transition-colors cursor-pointer shrink-0"
                  >
                    <Search className="w-4 h-4" />
                    <span>{loadingLookup ? 'Cari...' : 'Periksa'}</span>
                  </button>
                </div>
              </form>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 border border-[#C61D1D] bg-[#C61D1D]/5 text-sm text-[#C61D1D]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2.5 p-3.5 border border-[#16A34A] bg-[#16A34A]/5 text-sm text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>

            {/* Voter Inspection Result */}
            {lookupVoter && (
              <div className="border border-[#0B0B0E] bg-white p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-[#E2DFD7] pb-4">
                  <div>
                    <div className="font-mono text-xs text-[#480E8A] font-semibold tabular-nums">
                      {lookupVoter.nim} · {lookupVoter.uniqueCode}
                    </div>
                    <h3 className="font-display text-xl font-bold mt-1">
                      {lookupVoter.fullName}
                    </h3>
                    <div className="text-xs text-[#0B0B0E]/65 mt-1">
                      Angkatan {lookupVoter.angkatan} · {lookupVoter.gender} ·{' '}
                      {lookupVoter.membershipStatus}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 border border-[#E2DFD7] bg-[#FAF9F6]">
                    <div className="text-[#0B0B0E]/55">Status Validasi</div>
                    <div className="font-bold mt-1 text-[#0B0B0E]">
                      {lookupVoter.validationStatus === 'validated'
                        ? 'Sudah Tervalidasi'
                        : 'Belum Divalidasi'}
                    </div>
                  </div>
                  <div className="p-3 border border-[#E2DFD7] bg-[#FAF9F6]">
                    <div className="text-[#0B0B0E]/55">Status Surat Suara</div>
                    <div className="font-bold mt-1 text-[#0B0B0E]">
                      {lookupVoter.hasVoted ? 'Sudah Mencoblos' : 'Belum Mencoblos'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleValidateVoter}
                  disabled={
                    validating ||
                    lookupVoter.hasVoted ||
                    lookupVoter.validationStatus === 'validated'
                  }
                  className="w-full py-3.5 px-5 bg-[#480E8A] text-white text-sm font-semibold hover:bg-[#320863] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {lookupVoter.hasVoted
                    ? 'Pemilih Sudah Mencoblos'
                    : lookupVoter.validationStatus === 'validated'
                    ? 'Sudah Divalidasi'
                    : validating
                    ? 'Memvalidasi...'
                    : 'Validasi Pemilih Ini'}
                </button>
              </div>
            )}
          </section>

          {/* Right: Recent Validated Voters Table */}
          <section className="lg:col-span-6 border border-[#E2DFD7] bg-white">
            <div className="px-6 py-4 border-b border-[#E2DFD7] flex items-center justify-between">
              <h2 className="font-display text-base font-bold">
                Riwayat Validasi Terbaru
              </h2>
              <button
                type="button"
                onClick={() => void loadRecent()}
                className="text-xs font-medium text-[#480E8A] hover:underline cursor-pointer"
              >
                Segarkan
              </button>
            </div>

            {recentList.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#0B0B0E]/60">
                Belum ada pemilih yang divalidasi pada sesi ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] border-b border-[#E2DFD7] text-[#0B0B0E]/65">
                    <tr>
                      <th className="py-3 px-4 font-semibold">NIM</th>
                      <th className="py-3 px-4 font-semibold">Nama Pemilih</th>
                      <th className="py-3 px-4 font-semibold">Angkatan</th>
                      <th className="py-3 px-4 font-semibold">Status Suara</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DFD7]">
                    {recentList.map((item) => (
                      <tr key={item.nim} className="hover:bg-[#FAF9F6]">
                        <td className="py-2.5 px-4 font-mono tabular-nums font-medium">
                          {item.nim}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#0B0B0E]">
                          {item.fullName}
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums">
                          {item.angkatan}
                        </td>
                        <td className="py-2.5 px-4">
                          {item.hasVoted ? (
                            <span className="font-semibold text-[#480E8A]">
                              Sudah Memilih
                            </span>
                          ) : (
                            <span className="text-[#15803D] font-medium">
                              Tervalidasi
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
