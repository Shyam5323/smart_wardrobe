'use client';

import { useState, useEffect } from 'react';
import full1 from '@/components/assets/full1.png';
import full2 from '@/components/assets/full2.png';
import full3 from '@/components/assets/full3.png';
import styleImg from '@/components/assets/up1.png';
import plannerImg from '@/components/assets/up2.png';
import lookbookImg from '@/components/assets/men3.png';

const carouselImages = [full1, full2, full3];

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ---------------- About Section with Carousel ---------------- */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side Text */}
          <div className="space-y-6">
            <h2 className="text-5xl font-extrabold text-indigo-500">Smart Wardrobe</h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Effortlessly manage your clothing with AI-powered outfit suggestions.
              Upload your items, get automatic tagging, and discover new styles.
            </p>
            <p className="text-lg text-slate-400 leading-relaxed">
              Track cost-per-wear, save favorite looks, and stay sustainable while
              having fun styling your wardrobe.
            </p>
            <a
              href="/create"
              className="inline-block mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors shadow-lg"
            >
              Style Me!
            </a>
          </div>

          {/* Right Side Carousel */}
          <div className="relative w-full h-96 md:h-[28rem] lg:h-[32rem] rounded-xl overflow-hidden shadow-2xl">
            <img
              src={carouselImages[currentImage].src}
              alt="Wardrobe Carousel"
              className="w-full h-full object-cover transition-all duration-700"
            />
          </div>
        </div>
      </section>

      {/* ---------------- Features Section (3 Cards) ---------------- */}
      <section className="py-20 px-4 bg-slate-900">
        <h2 className="text-4xl font-bold text-center mb-12">Core Features</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <img
              src={styleImg.src}
              alt="Outfit Generator"
              className="mx-auto mb-4 rounded-lg object-cover w-40 h-40"
            />
            <h3 className="text-xl font-semibold mb-2">AI Outfit Generator</h3>
            <p>Automatically generate outfits based on your wardrobe and preferences.</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <img
              src={plannerImg.src}
              alt="Planner"
              className="mx-auto mb-4 rounded-lg object-cover w-40 h-40"
            />
            <h3 className="text-xl font-semibold mb-2">Outfit Planner</h3>
            <p>Plan your week, log outfits, and track your clothing usage effortlessly.</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <img
              src={lookbookImg.src}
              alt="Lookbook"
              className="mx-auto mb-4 rounded-lg object-cover w-40 h-40"
            />
            <h3 className="text-xl font-semibold mb-2">Lookbook</h3>
            <p>Save and favorite your best outfits to mix and match anytime.</p>
          </div>
        </div>
      </section>
    </>
  );
}
