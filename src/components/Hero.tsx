import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { LOGO_ASSET_PATH } from '../data/pemiraData';

interface HeroProps {
  onOpenPortal: () => void;
  bphCount: number;
  senatorCount: number;
  totalDpt: number;
  totalVoted: number;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenPortal,
  bphCount,
  senatorCount,
  totalDpt,
  totalVoted,
}) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <section id="beranda" className="border-b border-[#E2DFD7] bg-[#FAF9F6]">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Editorial Column */}
          <div className="lg:col-span-7 flex flex-col justify-between py-2">
            <div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium tracking-wide text-[#0B0B0E]/65 mb-6">
                <span>Pemilihan Raya Mahasiswa</span>
                <span aria-hidden="true">·</span>
                <span>HIMATEKIA-ITERA</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#480E8A] font-semibold">Periode 2026</span>
              </div>

              <h1 className="font-display text-[clamp(2.5rem,4.4vw,4.35rem)] font-bold leading-[1.03] tracking-[-0.025em] text-[#0B0B0E] text-balance">
                Menentukan Arah Kepemimpinan Teknik Kimia ITERA 2026.
              </h1>

              <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#0B0B0E]/75">
                Forum kedaulatan tertinggi anggota biasa Himpunan Mahasiswa Teknik
                Kimia Institut Teknologi Sumatera untuk memilih{' '}
                <strong className="font-semibold text-[#0B0B0E]">
                  Ketua Badan Pengurus Harian
                </strong>{' '}
                serta{' '}
                <strong className="font-semibold text-[#0B0B0E]">
                  Senator HIMATEKIA-ITERA 2026
                </strong>{' '}
                melalui validasi barcode pemilih yang akuntabel.
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-[#E2DFD7] flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenPortal}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#480E8A] text-white text-sm font-semibold hover:bg-[#320863] transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#480E8A]"
              >
                <span>Masuk Portal E-Voting</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <a
                href="#kandidat-bph"
                className="inline-flex items-center gap-2 px-5 py-3.5 border border-[#0B0B0E]/20 bg-white text-[#0B0B0E] text-sm font-semibold hover:border-[#0B0B0E] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#480E8A]"
              >
                <span>Telaah Gagasan Kandidat</span>
                <ArrowDown className="w-4 h-4 text-[#D59B0A]" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right Architectural Seal Showcase */}
          <div className="lg:col-span-5 flex">
            <div className="relative w-full min-h-[360px] lg:min-h-full bg-[#0B0B0E] text-[#FAF9F6] border border-[#0B0B0E] p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
              {/* Subtle engineering crosshairs */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              <div className="relative z-10 flex items-center justify-between text-xs text-[#FAF9F6]/70">
                <span>Lambang Resmi Organisasi</span>
                <span className="font-mono tabular-nums text-[#D59B0A]">ITERA · 2026</span>
              </div>

              {/* Orbital Seal Centerpiece */}
              <div className="relative z-10 my-8 flex items-center justify-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                  {/* Outer rotating dashed indigo ring */}
                  <motion.svg
                    viewBox="0 0 260 260"
                    className="absolute inset-0 w-full h-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
                    aria-hidden="true"
                  >
                    <circle
                      cx="130"
                      cy="130"
                      r="125"
                      fill="none"
                      stroke="#480E8A"
                      strokeWidth="1.5"
                      strokeDasharray="6 8"
                    />
                  </motion.svg>

                  {/* Counter-rotating gold caliper arc */}
                  <motion.svg
                    viewBox="0 0 260 260"
                    className="absolute inset-0 w-full h-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 64, repeat: Infinity, ease: 'linear' }}
                    aria-hidden="true"
                  >
                    <circle
                      cx="130"
                      cy="130"
                      r="112"
                      fill="none"
                      stroke="#D59B0A"
                      strokeWidth="1.5"
                      strokeDasharray="48 130"
                    />
                  </motion.svg>

                  {/* Authentic HIMATEKIA ITERA Circular Emblem */}
                  <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-white ring-2 ring-[#D59B0A]/60 shadow-2xl flex items-center justify-center">
                    {!logoError ? (
                      <img
                        src={LOGO_ASSET_PATH}
                        alt="Lambang resmi HIMATEKIA ITERA dengan siluet pabrik kimia ungu, menara proses emas, daun putih, dan roda gigi hitam"
                        referrerPolicy="no-referrer"
                        onError={() => setLogoError(true)}
                        className="w-[106%] h-[106%] max-w-none object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F6] text-[#0B0B0E] p-4 text-center">
                        <span className="font-display font-bold text-lg text-[#480E8A]">
                          HIMATEKIA
                        </span>
                        <span className="text-xs font-semibold tracking-widest text-[#D59B0A]">
                          ITERA
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative z-10 border-t border-white/15 pt-4 flex items-center justify-between gap-4 text-xs text-[#FAF9F6]/75">
                <span>Himpunan Mahasiswa Teknik Kimia</span>
                <span className="text-[#FAF9F6]/50">Lampung Selatan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Architectural Strip */}
        <div className="mt-10 border border-[#E2DFD7] bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2DFD7]">
          <div className="p-5 sm:p-6">
            <div className="font-mono text-xs text-[#480E8A] tabular-nums mb-1.5">01</div>
            <div className="font-display text-base font-bold text-[#0B0B0E]">
              Ketua BPH · {bphCount} Kandidat
            </div>
            <p className="mt-1 text-xs text-[#0B0B0E]/65 leading-relaxed">
              Calon pemimpin eksekutif himpunan masa bakti 2026–2027.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="font-mono text-xs text-[#D59B0A] tabular-nums mb-1.5">02</div>
            <div className="font-display text-base font-bold text-[#0B0B0E]">
              Senator · {senatorCount} Kandidat
            </div>
            <p className="mt-1 text-xs text-[#0B0B0E]/65 leading-relaxed">
              Calon wakil legislatif Teknik Kimia pada Senat Mahasiswa KM-ITERA.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="font-mono text-xs text-[#0B0B0E]/55 tabular-nums mb-1.5">03</div>
            <div className="font-display text-base font-bold text-[#0B0B0E] tabular-nums">
              {totalDpt > 0 ? `${totalDpt} Pemilih DPT` : 'Daftar Pemilih Tetap'}
            </div>
            <p className="mt-1 text-xs text-[#0B0B0E]/65 leading-relaxed">
              Mahasiswa aktif Teknik Kimia angkatan 2020–2025 dengan kode unik & barcode.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="font-mono text-xs text-[#0B0B0E]/55 tabular-nums mb-1.5">04</div>
            <div className="font-display text-base font-bold text-[#0B0B0E] tabular-nums">
              {totalVoted} Suara Masuk
            </div>
            <p className="mt-1 text-xs text-[#0B0B0E]/65 leading-relaxed">
              Validasi langsung oleh Validator KPR sebelum pembukaan surat suara.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
