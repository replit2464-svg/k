import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MECHANISM_RULES } from '../data/pemiraData';

export const TimelineAndMechanism: React.FC = () => {
  const [openRuleId, setOpenRuleId] = useState<string>(MECHANISM_RULES[0].id);

  return (
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
  );
};
