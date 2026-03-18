'use client';

import React, { Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';
import Footer from './Footer';
import Navbar from './Navbar';
import { MovieStorageProvider } from '@/hooks/useMovieStorage';

interface ClientLayoutProps {
  children: React.ReactNode;
}

function AnimatedShell({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, searchParams]);

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={`${pathname}-${searchParams.toString()}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex-grow"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

function ShellFallback({ children }: ClientLayoutProps) {
  return <main className="flex-grow">{children}</main>;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <MovieStorageProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <Suspense fallback={<ShellFallback>{children}</ShellFallback>}>
          <AnimatedShell>{children}</AnimatedShell>
        </Suspense>
        <Footer />
      </div>
    </MovieStorageProvider>
  );
};

export default ClientLayout;
