import { X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { env } from '../../lib/env';
import { Header } from '../navigation/Header';
import { Footer } from './Footer';

export function PublicLayout({ children }: { children: ReactNode }) {
  const [dismissedBanner, setDismissedBanner] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0B0D] text-[#F7F5EF]">
      {!env.isSupabaseConfigured && !dismissedBanner && (
        <div className="border-b border-[#343238] bg-[#151518] px-4 py-2 text-xs text-[#AAA69C]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <p className="truncate">
              <span className="font-semibold text-[#E7CB78]">Preview Mode:</span> Sample menu
              catalogue active. Live Supabase backend is pending setup.{' '}
              <Link to="/login" className="text-[#F7F5EF] underline underline-offset-2">
                Preview roles
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setDismissedBanner(true)}
              aria-label="Dismiss preview notice"
              className="rounded p-1 text-[#AAA69C] hover:text-[#F7F5EF]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
