import React from 'react';
import { Candidate } from '../data/pemiraData';

interface CandidatePlateArtProps {
  candidate: Candidate;
  className?: string;
}

export const CandidatePlateArt: React.FC<CandidatePlateArtProps> = ({
  candidate,
  className = '',
}) => {
  const isSenator = candidate.chamber === 'senator';

  const bgClass = isSenator
    ? 'bg-[#121218] text-[#FAF9F6]'
    : 'bg-[#F1EFE9] text-[#0B0B0E]';

  const borderClass = isSenator
    ? 'border-[#272733]'
    : 'border-[#E2DFD7]';

  const renderGeometry = () => {
    switch (candidate.plateVariant) {
      case 'distillation':
        return (
          <svg
            viewBox="0 0 320 380"
            className="w-full h-full"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id={`grid-${candidate.id}`}
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="#0B0B0E"
                  strokeOpacity="0.06"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="320" height="380" fill={`url(#grid-${candidate.id})`} />
            {/* Architectural distillation tower inspired by HIMATEKIA seal */}
            <rect
              x="64"
              y="72"
              width="76"
              height="236"
              rx="38"
              fill="#480E8A"
            />
            <rect
              x="156"
              y="112"
              width="100"
              height="196"
              fill="#D59B0A"
            />
            <circle cx="196" cy="112" r="44" fill="#FAF9F6" />
            <circle cx="196" cy="112" r="22" fill="#0B0B0E" />
            {/* Tray lines */}
            <line x1="64" y1="140" x2="140" y2="140" stroke="#FAF9F6" strokeWidth="2" />
            <line x1="64" y1="184" x2="140" y2="184" stroke="#FAF9F6" strokeWidth="2" />
            <line x1="64" y1="228" x2="140" y2="228" stroke="#FAF9F6" strokeWidth="2" />
            <line x1="64" y1="272" x2="140" y2="272" stroke="#FAF9F6" strokeWidth="2" />
            {/* Process flow arc */}
            <path
              d="M 102 72 C 102 36, 196 36, 196 68"
              fill="none"
              stroke="#0B0B0E"
              strokeWidth="2"
            />
            <rect x="44" y="308" width="232" height="10" fill="#0B0B0E" />
          </svg>
        );

      case 'reactor':
        return (
          <svg
            viewBox="0 0 320 380"
            className="w-full h-full"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id={`dots-${candidate.id}`}
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.2" fill="#480E8A" fillOpacity="0.14" />
              </pattern>
            </defs>
            <rect width="320" height="380" fill={`url(#dots-${candidate.id})`} />
            {/* Leaf & golden vessel geometry */}
            <circle cx="160" cy="175" r="96" fill="#0B0B0E" />
            <path
              d="M 160 79 A 96 96 0 0 1 256 175 L 160 175 Z"
              fill="#D59B0A"
            />
            <path
              d="M 64 175 A 96 96 0 0 1 160 79 L 160 175 Z"
              fill="#480E8A"
            />
            {/* Botanical sustainability leaf cutout from logo */}
            <path
              d="M 160 112 C 194 128, 196 176, 160 202 C 124 176, 126 128, 160 112 Z"
              fill="#FAF9F6"
            />
            <line x1="160" y1="126" x2="160" y2="232" stroke="#0B0B0E" strokeWidth="2.5" />
            <rect x="64" y="294" width="192" height="14" fill="#480E8A" />
          </svg>
        );

      case 'lattice':
        return (
          <svg
            viewBox="0 0 320 380"
            className="w-full h-full"
            aria-hidden="true"
          >
            <rect width="320" height="380" fill="#121218" />
            {/* Angled lattice inspired by ITERA & HIMATEKIA seal */}
            <g stroke="#2A2A38" strokeWidth="1">
              <line x1="0" y1="95" x2="320" y2="95" />
              <line x1="0" y1="190" x2="320" y2="190" />
              <line x1="0" y1="285" x2="320" y2="285" />
              <line x1="106" y1="0" x2="106" y2="380" />
              <line x1="214" y1="0" x2="214" y2="380" />
            </g>
            <rect x="78" y="88" width="164" height="164" transform="rotate(45 160 170)" fill="#480E8A" />
            <rect x="102" y="112" width="116" height="116" transform="rotate(45 160 170)" fill="none" stroke="#D59B0A" strokeWidth="3" />
            <circle cx="160" cy="170" r="34" fill="#D59B0A" />
            <circle cx="160" cy="170" r="14" fill="#0B0B0E" />
          </svg>
        );

      case 'equilibrium':
        return (
          <svg
            viewBox="0 0 320 380"
            className="w-full h-full"
            aria-hidden="true"
          >
            <rect width="320" height="380" fill="#121218" />
            <circle cx="160" cy="180" r="108" fill="none" stroke="#2D2D3D" strokeWidth="1.5" />
            <circle cx="160" cy="180" r="76" fill="none" stroke="#D59B0A" strokeWidth="2" />
            <path d="M 52 180 L 268 180" stroke="#FAF9F6" strokeOpacity="0.25" strokeWidth="1.5" />
            <path d="M 160 72 L 160 288" stroke="#FAF9F6" strokeOpacity="0.25" strokeWidth="1.5" />
            <rect x="84" y="142" width="76" height="76" fill="#480E8A" />
            <circle cx="198" cy="180" r="38" fill="#D59B0A" />
            <circle cx="122" cy="180" r="14" fill="#FAF9F6" />
          </svg>
        );

      case 'catalyst':
        return (
          <svg
            viewBox="0 0 320 380"
            className="w-full h-full"
            aria-hidden="true"
          >
            <rect width="320" height="380" fill="#121218" />
            {/* Precision gear arc & catalyst column */}
            <path
              d="M 60 260 A 100 100 0 0 0 260 260"
              fill="none"
              stroke="#D59B0A"
              strokeWidth="18"
              strokeDasharray="18 14"
            />
            <polygon points="160,64 236,196 84,196" fill="#480E8A" />
            <polygon points="160,108 202,182 118,182" fill="#121218" />
            <circle cx="160" cy="156" r="18" fill="#D59B0A" />
          </svg>
        );
    }
  };

  const hasPhoto = Boolean(candidate.photoUrl);

  return (
    <div
      className={`relative overflow-hidden border ${borderClass} ${bgClass} ${className}`}
    >
      <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
        {hasPhoto ? (
          <img
            src={candidate.photoUrl!}
            alt={`Foto resmi ${candidate.name}`}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          renderGeometry()
        )}
      </div>

      {hasPhoto && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0B0B0E]/65 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Editorial Corner Plate Number */}
      <div
        className={`absolute top-4 left-4 flex items-baseline gap-2 ${
          hasPhoto ? 'px-2.5 py-1 bg-[#0B0B0E]/85 text-[#FAF9F6] border border-white/15' : ''
        }`}
      >
        <span
          className={`font-mono text-xs tracking-wider ${
            hasPhoto
              ? 'text-[#D59B0A]'
              : isSenator
              ? 'text-[#D59B0A]'
              : 'text-[#480E8A]'
          }`}
        >
          No. Urut
        </span>
        <span className="font-display text-2xl font-bold tabular-nums leading-none">
          {candidate.number}
        </span>
      </div>

      {/* Subtle architectural nameplate footer inside plate */}
      <div
        className={`absolute bottom-0 inset-x-0 px-4 py-3 border-t backdrop-blur-xs flex items-center justify-between text-xs ${
          isSenator || hasPhoto
            ? 'border-[#272733] bg-[#0B0B0E]/85 text-[#FAF9F6]/85'
            : 'border-[#E2DFD7] bg-[#FAF9F6]/90 text-[#0B0B0E]/80'
        }`}
      >
        <span className="font-mono tabular-nums">{candidate.nim}</span>
        <span>{candidate.cohort}</span>
      </div>
    </div>
  );
};
