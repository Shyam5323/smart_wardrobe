// app/(main)/lookbook/page.tsx
import OutfitCategorySection from '@/components/lookbook/OutfitCategorySection';

// Import all your categorized assets
import ethnic1 from '@/components/assets/ethnic1.png';
import ethnic2 from '@/components/assets/ethnic2.png';
import ethnic3 from '@/components/assets/ethnic3.png';
import top1 from '@/components/assets/top1.png';
import top2 from '@/components/assets/top2.png';
import top3 from '@/components/assets/top3.png';
import bottom1 from '@/components/assets/bottom1.png';
import bottom2 from '@/components/assets/bottom2.png';
import bottom3 from '@/components/assets/bottom3.png';
import full1 from '@/components/assets/full1.png';
import full2 from '@/components/assets/full2.png';
import full3 from '@/components/assets/full3.png';
import midi1 from '@/components/assets/midi1.png'; // <-- Import midi assets
import midi2 from '@/components/assets/midi2.png';
import midi3 from '@/components/assets/midi3.png';

const categories = [
  // --- Moved this section to the top ---
  {
    title: 'Midi Styles',
    images: [midi1, midi2, midi3],
  },
  {
    title: 'Ethnic Looks',
    images: [ethnic1, ethnic2, ethnic3],
  },
  {
    title: 'Tops Collection',
    images: [top1, top2, top3],
  },
  {
    title: 'Bottoms & Denim',
    images: [bottom1, bottom2, bottom3],
  },
  {
    title: 'Full Outfits',
    images: [full1, full2, full3],
  },
];

export default function LookbookPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Lookbook
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Explore curated collections from your wardrobe.
        </p>
      </header>

      <div className="space-y-16">
        {categories.map((category) => (
          <OutfitCategorySection 
            key={category.title} 
            title={category.title} 
            images={category.images} 
          />
        ))}
      </div>
    </div>
  );
}