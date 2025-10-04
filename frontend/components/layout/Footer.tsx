// components/layout/Footer.tsx
import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 bg-slate-900 border-t border-slate-800 py-12 text-slate-400">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Logo & Tagline */}
          <div className="col-span-full md:col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center text-3xl font-bold tracking-tight text-slate-100">
              👕 Wardrobe
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              Your AI-Powered virtual wardrobe and personal stylist.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" aria-label="Facebook" className="text-slate-500 hover:text-indigo-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Instagram" className="text-slate-500 hover:text-indigo-400 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="text-slate-500 hover:text-indigo-400 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-slate-200">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-slate-200">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="mb-4 text-base font-semibold text-slate-200">Stay Updated</h3>
            <p className="text-sm">Get exclusive updates and style tips.</p>
            <form className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-grow rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          © 2025 Wardrobe. All rights reserved.
        </div>
      </div>
    </footer>
  );
}