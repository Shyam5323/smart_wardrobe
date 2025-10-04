// components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { Wand2, PlusSquare, Calendar, Heart, LogIn, UserPlus, Grid } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight text-slate-100">
          👕 Wardrobe
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium">
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
          {/* Main CTA */}
          <Link
            href="/style-me"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg transition-colors"
          >
            <Wand2 size={16} /> Style Me
          </Link>

          {/* Auth buttons */}
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
        </div>
      </div>
    </header>
  );
}
