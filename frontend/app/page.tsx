// app/page.tsx
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CapsuleSection from '@/components/landing/CapsuleSection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <CapsuleSection />
      
    </>
  );
}