// components/lookbook/LookbookItemCard.tsx
import Image from 'next/image';
import type { StaticImageData } from 'next/image';

type LookbookItemCardProps = {
  image: StaticImageData;
};

export default function LookbookItemCard({ image }: LookbookItemCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800 aspect-[3/4] transition-all duration-300 hover:shadow-xl hover:border-slate-700">
      <Image
        src={image}
        alt="Lookbook item"
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
}