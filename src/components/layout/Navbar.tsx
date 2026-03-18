'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from '@/lib/catalog';
import SearchOverlay from '@/components/search/SearchOverlay';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <nav
          className={cn(
            'mx-auto flex w-full max-w-[1720px] items-center justify-between px-4 py-3 transition-all duration-500 md:px-8 md:py-4',
            isScrolled
              ? 'border-b border-white/8 bg-black/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)] backdrop-blur-2xl'
              : 'border-b border-transparent bg-gradient-to-b from-black/60 to-transparent'
          )}
        >
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(145deg,#ff5b61_0%,#cc1021_100%)] shadow-[0_16px_32px_rgba(205,16,33,0.35)]">
                <span className="font-display text-lg font-black text-white">XP</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-display text-xl font-bold tracking-tight text-white">XemPhimmm</p>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Streaming rebuilt</p>
              </div>
            </Link>

            <div className="hidden items-center gap-2 xl:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Search className="size-4" />
              Tìm phim, diễn viên...
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white sm:hidden"
            >
              <Search className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 xl:hidden"
              aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        <div
          className={cn(
            'mx-auto mt-3 w-full max-w-[1720px] overflow-hidden rounded-[1.7rem] border border-white/8 bg-black/72 backdrop-blur-2xl transition-all duration-300 xl:hidden',
            isMobileMenuOpen ? 'max-h-[460px] opacity-100' : 'max-h-0 border-transparent opacity-0'
          )}
        >
          <div className="space-y-4 p-5">
            <div className="grid gap-2 md:grid-cols-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 text-sm font-bold text-white/72 transition-all duration-300 hover:border-white/16 hover:bg-white/[0.08] hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;
