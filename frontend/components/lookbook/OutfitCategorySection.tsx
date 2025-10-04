// components/lookbook/OutfitCategorySection.tsx
import type { StaticImageData } from 'next/image';
import LookbookItemCard from '@/components/lookbook/LookbookItemCard';

type OutfitCategorySectionProps = {
  title: string;
  images: StaticImageData[];
};

export default function OutfitCategorySection({ title, images }: OutfitCategorySectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight text-slate-100 mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image, index) => (
          <LookbookItemCard key={index} image={image} />
        ))}
      </div>
    </section>
  );
}