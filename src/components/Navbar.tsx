import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenPortal: () => void;
  sessionLabel?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPortal, sessionLabel }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Kandidat BPH', href: '#kandidat-bph' },
    { label: 'Kandidat Senator', href: '#kandidat-senator' },
    { label: 'Linimasa', href: '#linimasa' },
    { label: 'Mekanisme', href: '#mekanisme' },
  ];

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const ctaText = sessionLabel || 'Masuk E-Voting';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E2DFD7]">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#beranda"
          className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0B0B0E] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#480E8A]"
        >
          PEMIRA HIMATEKIA 2026
        </a>

        {/* Zone 2: 4 concise single-line text links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#0B0B0E]/75"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative py-1 whitespace-nowrap shrink-0 hover:text-[#480E8A] transition-colors duration-150 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[1.5px] after:bg-[#480E8A] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#480E8A]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenPortal}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#480E8A] text-white text-sm font-medium hover:bg-[#320863] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#480E8A]"
          >
            <span>{ctaText}</span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-[#E2DFD7] text-[#0B0B0E] hover:bg-[#F1EFE9] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E2DFD7] bg-[#FAF9F6] px-5 py-5 space-y-4">
          <nav className="flex flex-col space-y-3" aria-label="Navigasi seluler">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className="py-2 text-base font-medium text-[#0B0B0E] hover:text-[#480E8A] border-b border-[#E2DFD7]/60"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenPortal();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#480E8A] text-white text-sm font-medium hover:bg-[#320863] transition-colors cursor-pointer"
          >
            <span>{ctaText}</span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
};
