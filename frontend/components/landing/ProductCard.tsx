// components/landing/ProductCard.tsx
import Image from 'next/image';
import type { StaticImageData } from 'next/image';

type ProductCardProps = {
  product: {
    name: string;
    price: number;
    image: StaticImageData;
  }
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-sm text-slate-100">
            <span aria-hidden="true" className="absolute inset-0" />
            {product.name}
          </h3>
        </div>
        <p className="text-sm font-medium text-slate-300">₹{product.price}</p>
      </div>
    </div>
  );
}