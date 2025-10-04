// components/landing/HeroSection.tsx
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Import your carousel images
import full1 from '@/components/assets/up1.png';
import full2 from '@/components/assets/midi1.png';
import full3 from '@/components/assets/up2.png';
import full4 from '@/components/assets/top3.png';

const carouselImages = [full1, full2, full3, full4];

export default function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % carouselImages.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side Text */}
        <div className="space-y-6">
          <span className="inline-block px-3 py-1 text-sm font-semibold text-indigo-300 bg-indigo-500/20 rounded-full">
            Powered by AI
          </span>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight">
            Your AI-Powered Virtual Wardrobe
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Effortlessly manage your closet, discover new styles with AI-powered suggestions, and build a sustainable wardrobe you love.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/wardrobe"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-white transition-colors shadow-lg"
            >
              Enter Wardrobe
            </Link>
            <Link
              href="#features"
              className="inline-block px-6 py-3 border border-slate-700 hover:bg-slate-800 rounded-lg font-semibold transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Right Side Carousel */}
        <div className="relative w-full h-96 md:h-[28rem] lg:h-[32rem] rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10">
          {carouselImages.map((img, index) => (
            <Image
              key={index}
              src={img}
              alt="Wardrobe Carousel"
              fill
              className={`object-cover transition-opacity duration-1000 ${index === currentImage ? 'opacity-100' : 'opacity-0'}`}
              priority={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}