import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TIMELINE_PHASES, MECHANISM_RULES } from '../data/pemiraData';

export const TimelineAndMechanism: React.FC = () => {
  const [activePhaseIndex, setActivePhaseIndex] = useState(1);
  const [openRuleId, setOpenRuleId] = useState<string>(MECHANISM_RULES[0].id);

  const activePhase = TIMELINE_PHASES[activePhaseIndex];

  return (
    <>
      {/* Section 03: Linimasa PEMIRA 2026 */}
      <section id="linimasa" className="border-b border-[#E2DFD7] bg-[#FAF9F6] py-16 lg:py-24">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-12">
            <div className="lg:col-span-7">
              <div className="text-xs font-medium text-[#480E8A] mb-2">
                03. Rangkaian Tahapan Resmi
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B0B0E] text-balance">
                Linimasa Pemilihan Raya HIMATEKIA-ITERA 2026
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="text-sm sm:text-base text-[#0B0B0E]/70 leading-relaxed">
                Pilih setiap fase di bawah untuk meninjau jadwal pelaksanaan, lokasi agenda di kampus ITERA, serta keluaran resmi Komisi Pemilihan Raya.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Stage Selector */}
            <div className="lg:col-span-5 border border-[#E2DFD7] bg-white divide-y divide-[#E2DFD7]">
              {TIMELINE_PHASES.map((phase, index) => {
                const isActive = index === activePhaseIndex;
                return (
                  <button
                    key={phase.step}
                    type="button"
                    onClick={() => setActivePhaseIndex(index)}
                    className={`w-full text-left p-5 transition-colors duration-150 cursor-pointer flex items-start gap-4 ${
                      isActive
                        ? 'bg-[#480E8A] text-white'
                        : 'bg-white text-[#0B0B0E] hover:bg-[#F1EFE9]'
                    }`}
                  >
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums shrink-0 mt-0.5 ${
                        isActive ? 'text-[#E5AC1A]' : 'text-[#480E8A]'
                      }`}
                    >
                      {phase.step}
                    </span>
                    <div>
                      <div className="font-display font-bold text-base leading-snug">
                        {phase.title}
                      </div>
                      <div
                        className={`mt-1 text-xs font-mono tabular-nums ${
                          isActive ? 'text-white/80' : 'text-[#0B0B0E]/55'
                        }`}
                      >
                        {phase.dateRange}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Active Phase Details */}
            <div className="lg:col-span-7 border border-[#E2DFD7] bg-white p-6 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#0B0B0E]/65 pb-4 border-b border-[#E2DFD7]">
                  <span className="font-mono font-semibold text-[#480E8A]">
                    Tahap {activePhase.step}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{activePhase.dateRange}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activePhase.location}</span>
                </div>

                <h3 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-[#0B0B0E] text-balance">
                  {activePhase.title}
                </h3>

                <p className="mt-4 text-base text-[#0B0B0E]/75 leading-relaxed max-w-2xl">
                  {activePhase.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2DFD7]">
                <div className="text-xs font-semibold text-[#0B0B0E]/60 mb-3">
                  Agenda & Ketetapan Utama
                </div>
                <ul className="space-y-2.5">
                  {activePhase.deliverables.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-[#0B0B0E]/85 leading-relaxed"
                    >
                      <span className="font-mono text-xs text-[#D59B0A] font-bold mt-0.5">
                        0{i + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Mekanisme & Tata Cara Pemilihan */}
      <section id="mekanisme" className="border-b border-[#E2DFD7] bg-[#F1EFE9]/60 py-16 lg:py-24">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Left Intro Column */}
            <div className="lg:col-span-5">
              <div className="text-xs font-medium text-[#D59B0A] font-semibold mb-2">
                04. Pedoman Pemilih
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B0B0E] text-balance">
                Mekanisme, Hak Pilih, dan Asas LUBER JURDIL
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#0B0B0E]/75 leading-relaxed">
                Setiap suara anggota biasa HIMATEKIA-ITERA bernilai setara untuk menentukan arah kebijakan internal himpunan maupun representasi Teknik Kimia di tingkat Senat Mahasiswa KM-ITERA.
              </p>

              <div className="mt-8 border border-[#E2DFD7] bg-white p-5 space-y-3 text-sm">
                <div className="font-display font-bold text-[#0B0B0E]">
                  Dua Mandat dalam Satu Pemilihan
                </div>
                <p className="text-xs text-[#0B0B0E]/70 leading-relaxed">
                  Pemilih memberikan suara pada dua surat suara berbeda: satu untuk{' '}
                  <strong className="text-[#480E8A]">Ketua BPH</strong> (eksekutif) dan satu untuk{' '}
                  <strong className="text-[#0B0B0E]">Senator</strong> (legislatif).
                </p>
              </div>
            </div>

            {/* Right Interactive FAQ Accordion */}
            <div className="lg:col-span-7 border border-[#E2DFD7] bg-white divide-y divide-[#E2DFD7]">
              {MECHANISM_RULES.map((rule) => {
                const isOpen = openRuleId === rule.id;
                return (
                  <div key={rule.id}>
                    <button
                      type="button"
                      onClick={() => setOpenRuleId(isOpen ? '' : rule.id)}
                      aria-expanded={isOpen}
                      className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                    >
                      <span className="font-display text-base sm:text-lg font-bold text-[#0B0B0E] leading-snug">
                        {rule.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 text-[#480E8A] transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 text-sm text-[#0B0B0E]/75 leading-relaxed max-w-2xl">
                        {rule.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
