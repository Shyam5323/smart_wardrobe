// components/landing/WhyChooseUsSection.tsx
import ProductCard from './ProductCard';

// Import your capsule assets, which we'll use as products
import capsule1 from '@/components/assets/capsule1.png';
import capsule2 from '@/components/assets/capsule2.png';
import capsule3 from '@/components/assets/capsule3.png';
import capsule4 from '@/components/assets/capsule4.png';
import capsule5 from '@/components/assets/capsule5.png';
import capsule6 from '@/components/assets/capsule6.png';

const tops = [
  { name: 'Graphic Tee', price: 1299, image: capsule1 },
  { name: 'Minimalist Tee', price: 999, image: capsule2 },
  { name: 'Striped Tee', price: 1199, image: capsule3 },
];

const bottoms = [
  { name: 'Classic Denim', price: 2999, image: capsule4 },
  { name: 'Cargo Pants', price: 2499, image: capsule5 },
  { name: 'Tailored Trousers', price: 3499, image: capsule6 },
];

export default function CapsuleShopSection() { // Renamed component for clarity
  return (
    <section className="py-20 px-4 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">Build Your Capsule Wardrobe</h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            Start with these essential, high-quality pieces.
          </p>
        </div>

        {/* Tops Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Tops</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
            {tops.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>

        {/* Bottoms Section */}
        <div>
          <h3 className="text-2xl font-semibold mb-6">Bottoms</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
            {bottoms.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}