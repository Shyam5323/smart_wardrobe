// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar'; // Your main Navbar
import Footer from '@/components/layout/Footer'; // Import the new Footer

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow"> {/* Add this <main> tag to push footer to bottom */}
            {children}
          </main>
          <Footer /> {/* Add the Footer here */}
        </AuthProvider>
      </body>
    </html>
  );
}