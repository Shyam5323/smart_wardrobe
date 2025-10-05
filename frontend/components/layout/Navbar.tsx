
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wand2, PlusSquare, Calendar, Heart, LogIn, UserPlus, LogOut, Grid } from 'lucide-react';
import StyleMeModal from '@/components/style-me/StyleMeModal'; // Import the new modal
import { useAuth } from '@/components/providers/AuthProvider';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { status, user, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold tracking-tight text-slate-100">
            👕 Wardrobe
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/wardrobe"
              className="flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-100"
            >
              <Grid size={16} /> Wardrobe
            </Link>
            <Link
              href="/create"
              className="flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-100"
            >
              <PlusSquare size={16} /> Create
            </Link>
            <Link
              href="/planner"
              className="flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-100"
            >
              <Calendar size={16} /> Planner
            </Link>
            <Link
              href="/lookbook"
              className="flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-100"
            >
              <Heart size={16} /> Lookbook
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Main CTA - Changed from a Link to a button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-lg transition-colors hover:bg-indigo-700"
            >
              <Wand2 size={16} /> Style Me
            </button>

            {/* Auth state */}
            {status === 'loading' ? (
              <span className="text-sm text-slate-500">Checking session…</span>
            ) : status === 'authenticated' ? (
              <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm">
                <div className="text-left leading-tight">
                  <p className="font-medium text-slate-200">
                    {user?.displayName?.trim() || user?.email || 'Wardrobe member'}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-slate-500">{user.email}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-100"
                >
                  <LogIn size={16} /> Login
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-100"
                >
                  <UserPlus size={16} /> Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Render the modal, controlling its visibility with state */}
      <StyleMeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}