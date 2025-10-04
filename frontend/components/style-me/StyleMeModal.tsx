'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Sun, Briefcase, Coffee } from 'lucide-react';

// 1. Import all your new outfit images
import dailywear1 from '@/components/assets/dailywear1.png';
import dailywear2 from '@/components/assets/dailywear2.png';
import eveningwear1 from '@/components/assets/eveningwear1.png';
import eveningwear2 from '@/components/assets/eveningwear2.png';
import workwear1 from '@/components/assets/workwear1.png';
import workwear2 from '@/components/assets/workwear2.png';

type StyleMeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type WizardStep = 'selecting' | 'loading' | 'result';
type Occasion = 'Daily Wear' | 'Work' | 'Evening Out';

const occasions: { name: Occasion; icon: JSX.Element }[] = [
  { name: 'Daily Wear', icon: <Coffee size={24} /> },
  { name: 'Work', icon: <Briefcase size={24} /> },
  { name: 'Evening Out', icon: <Sun size={24} /> },
];

// 2. Create a map to link occasions to their images
const outfitMap = {
  'Daily Wear': [dailywear1, dailywear2],
  'Work': [workwear1, workwear2],
  'Evening Out': [eveningwear1, eveningwear2],
};

export default function StyleMeModal({ isOpen, onClose }: StyleMeModalProps) {
  const [step, setStep] = useState<WizardStep>('selecting');
  // 3. Add new state to track the selected occasion and outfit index
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [outfitIndex, setOutfitIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('selecting');
      setOutfitIndex(0); // Reset index when modal opens
    }
  }, [isOpen]);

  // 4. Update the event handlers
  const handleSelectOccasion = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setStep('loading');
    setTimeout(() => {
      setStep('result');
    }, 1500); // Simulate AI thinking
  };

  const handleTryAnother = () => {
    // Cycle between the 2 available outfits for the selected occasion
    setOutfitIndex(prevIndex => (prevIndex + 1) % 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl p-8">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-slate-100 transition-colors">
          <X size={24} />
        </button>

        {step === 'selecting' && (
          <div>
            <h2 className="text-2xl font-bold text-center">What's the occasion?</h2>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {occasions.map((occasion) => (
                <button
                  key={occasion.name}
                  onClick={() => handleSelectOccasion(occasion.name)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  {occasion.icon}
                  <span className="text-sm font-medium">{occasion.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center h-48">
            <p className="text-indigo-400">Styling your look for "{selectedOccasion}"...</p>
          </div>
        )}

        {step === 'result' && selectedOccasion && (
          <div>
            <h2 className="text-2xl font-bold text-center">Your {selectedOccasion} Look!</h2>
            <p className="text-center text-slate-400 text-sm mt-1">Recommended for today's sunny weather.</p>
            
            {/* 5. Update the JSX to display the correct image dynamically */}
            <div className="mt-6 relative h-80 rounded-lg bg-slate-800/50 flex items-center justify-center overflow-hidden">
              <Image 
                src={outfitMap[selectedOccasion][outfitIndex]} 
                alt={`${selectedOccasion} outfit`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* --- End of Change --- */}

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleTryAnother}
                className="flex-1 rounded-lg bg-slate-700 px-5 py-2 text-sm font-semibold transition hover:bg-slate-600"
              >
                Try Another
              </button>
              <button className="flex-1 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold transition hover:bg-indigo-500">
                Save to Lookbook
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}