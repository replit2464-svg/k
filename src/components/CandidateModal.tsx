import React, { useEffect } from 'react';
import { X, ArrowUpRight, Check } from 'lucide-react';
import { Candidate } from '../data/pemiraData';
import { CandidatePlateArt } from './CandidatePlateArt';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onOpenVotingWithCandidate: (candidate: Candidate) => void;
  onToggleCompare: (candidate: Candidate) => void;
  isCompared: boolean;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  onClose,
  onOpenVotingWithCandidate,
  onToggleCompare,
  isCompared,
}) => {
  useEffect(() => {
    if (!candidate) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [candidate, onClose]);

  if (!candidate) return null;

  const isSenator = candidate.chamber === 'senator';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B0B0E]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#FAF9F6] text-[#0B0B0E] border border-[#0B0B0E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4 bg-[#FAF9F6]/95 backdrop-blur-xs border-b border-[#E2DFD7]">
          <div className="flex items-center gap-2 text-xs text-[#0B0B0E]/70">
            <span className="font-mono font-medium text-[#480E8A]">
              Nomor Urut {candidate.number}
            </span>
            <span aria-hidden="true">·</span>
            <span>{candidate.chamberLabel}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup profil kandidat"
            className="inline-flex items-center justify-center w-9 h-9 border border-[#E2DFD7] hover:bg-[#0B0B0E] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Plate & Identity */}
            <div className="md:col-span-5 space-y-5">
              <CandidatePlateArt
                candidate={candidate}
                className="aspect-[4/4.6] w-full"
              />

              <div className="border border-[#E2DFD7] bg-white p-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between border-b border-[#E2DFD7]/70 pb-2">
                  <span className="text-xs text-[#0B0B0E]/60">NIM</span>
                  <span className="font-mono font-medium tabular-nums">
                    {candidate.nim}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E2DFD7]/70 pb-2">
                  <span className="text-xs text-[#0B0B0E]/60">Angkatan</span>
                  <span className="font-medium">{candidate.cohort}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#0B0B0E]/60">Asal Daerah</span>
                  <span className="font-medium">{candidate.origin}</span>
                </div>
              </div>
            </div>

            {/* Right Editorial Manifesto */}
            <div className="md:col-span-7 space-y-8">
              <div>
                <h2
                  id="candidate-modal-title"
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0E]"
                >
                  {candidate.name}
                </h2>
                <p className="mt-2 text-base italic text-[#480E8A] font-medium">
                  “{candidate.motto}”
                </p>
              </div>

              {/* Visi */}
              <div className="pt-5 border-t border-[#E2DFD7]">
                <h3 className="text-xs font-semibold tracking-wider text-[#0B0B0E]/60 mb-2">
                  Visi Utama
                </h3>
                <p className="text-base leading-relaxed text-[#0B0B0E]">
                  {candidate.vision}
                </p>
              </div>

              {/* Misi */}
              <div className="pt-5 border-t border-[#E2DFD7]">
                <h3 className="text-xs font-semibold tracking-wider text-[#0B0B0E]/60 mb-3">
                  Misi Strategis
                </h3>
                <ol className="space-y-3">
                  {candidate.missions.map((mission, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-[#0B0B0E]/85">
                      <span className="font-mono text-xs text-[#D59B0A] font-semibold mt-0.5 tabular-nums">
                        0{idx + 1}.
                      </span>
                      <span>{mission}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Program Kerja */}
              <div className="pt-5 border-t border-[#E2DFD7]">
                <h3 className="text-xs font-semibold tracking-wider text-[#0B0B0E]/60 mb-3">
                  Program Kerja Unggulan
                </h3>
                <div className="space-y-3">
                  {candidate.programs.map((prog, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-[#E2DFD7]"
                    >
                      <div className="font-display font-bold text-base text-[#0B0B0E]">
                        {prog.title}
                      </div>
                      <p className="mt-1 text-sm text-[#0B0B0E]/75 leading-relaxed">
                        {prog.summary}
                      </p>
                      <div className="mt-2.5 text-xs text-[#480E8A] font-medium">
                        Capaian Terukur: {prog.target}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rekam Jejak */}
              <div className="pt-5 border-t border-[#E2DFD7]">
                <h3 className="text-xs font-semibold tracking-wider text-[#0B0B0E]/60 mb-3">
                  Rekam Jejak Organisasi & Akademik
                </h3>
                <ul className="space-y-2 text-sm text-[#0B0B0E]/80">
                  {candidate.trackRecord.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-[#D59B0A] font-bold" aria-hidden="true">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer Actions */}
        <div className="sticky bottom-0 z-20 px-6 py-4 bg-white border-t border-[#E2DFD7] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onToggleCompare(candidate)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border transition-colors cursor-pointer ${
              isCompared
                ? 'border-[#D59B0A] bg-[#D59B0A]/15 text-[#0B0B0E]'
                : 'border-[#E2DFD7] bg-[#FAF9F6] text-[#0B0B0E] hover:border-[#0B0B0E]'
            }`}
          >
            {isCompared && <Check className="w-4 h-4 text-[#D59B0A]" />}
            <span>{isCompared ? 'Masuk Daftar Bandingkan' : 'Bandingkan Gagasan'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenVotingWithCandidate(candidate);
            }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer ${
              isSenator
                ? 'bg-[#0B0B0E] hover:bg-[#480E8A]'
                : 'bg-[#480E8A] hover:bg-[#320863]'
            }`}
          >
            <span>Masuk Portal E-Voting</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
