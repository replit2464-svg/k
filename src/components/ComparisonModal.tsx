import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Candidate } from '../data/pemiraData';

interface ComparisonModalProps {
  isOpen: boolean;
  candidates: Candidate[];
  onClose: () => void;
  onRemoveCandidate: (id: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  candidates,
  onClose,
  onRemoveCandidate,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || candidates.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B0B0E]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#FAF9F6] text-[#0B0B0E] border border-[#0B0B0E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#FAF9F6]/95 backdrop-blur-xs border-b border-[#E2DFD7]">
          <div>
            <h2 id="compare-modal-title" className="font-display text-lg font-bold">
              Matriks Perbandingan Gagasan Kandidat
            </h2>
            <p className="text-xs text-[#0B0B0E]/60">
              Membandingkan {candidates.length} kandidat terpilih secara berdampingan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup matriks perbandingan"
            className="inline-flex items-center justify-center w-9 h-9 border border-[#E2DFD7] hover:bg-[#0B0B0E] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div
            className={`grid gap-6 ${
              candidates.length === 1
                ? 'grid-cols-1 max-w-xl'
                : candidates.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="border border-[#E2DFD7] bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="p-5 border-b border-[#E2DFD7] bg-[#F1EFE9]/60 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {cand.photoUrl && (
                        <img
                          src={cand.photoUrl}
                          alt={`Foto ${cand.name}`}
                          className="w-12 h-14 object-cover object-top border border-[#E2DFD7] shrink-0 bg-white"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-[#480E8A] font-medium">
                          No. {cand.number} · {cand.chamber === 'bph' ? 'Ketua BPH' : 'Senator'}
                        </div>
                        <h3 className="font-display text-lg font-bold mt-1 leading-snug">
                          {cand.name}
                        </h3>
                        <div className="mt-1 text-xs text-[#0B0B0E]/65">
                          {cand.cohort} · {cand.nim}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCandidate(cand.id)}
                      className="text-xs text-[#0B0B0E]/55 hover:text-[#C61D1D] underline cursor-pointer shrink-0"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="p-5 space-y-5 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-[#0B0B0E]/55 mb-1">
                        Visi
                      </div>
                      <p className="text-[#0B0B0E]/85 leading-relaxed">
                        {cand.vision}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#E2DFD7]">
                      <div className="text-xs font-semibold text-[#0B0B0E]/55 mb-2">
                        Fokus Program Kerja
                      </div>
                      <ul className="space-y-2.5">
                        {cand.programs.map((p, idx) => (
                          <li key={idx}>
                            <div className="font-semibold text-[#0B0B0E]">
                              {p.title}
                            </div>
                            <p className="text-xs text-[#0B0B0E]/70 mt-0.5 leading-relaxed">
                              {p.summary}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[#E2DFD7]">
                      <div className="text-xs font-semibold text-[#0B0B0E]/55 mb-2">
                        Rekam Jejak Utama
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#0B0B0E]/80">
                        {cand.trackRecord.map((tr, idx) => (
                          <li key={idx}>— {tr}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
