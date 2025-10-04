// components/landing/FeaturesSection.tsx
import { Sparkles, LayoutGrid, Shirt } from 'lucide-react';

const features = [
  {
    icon: <Shirt size={28} className="text-indigo-400" />,
    title: "Digitize Your Closet",
    description: "Upload photos of your clothes and let our AI automatically tag them with colors, categories, and more."
  },
  {
    icon: <Sparkles size={28} className="text-indigo-400" />,
    title: "AI-Powered Styling",
    description: "Get daily outfit recommendations based on your items, personal style, and even the local weather."
  },
  {
    icon: <LayoutGrid size={28} className="text-indigo-400" />,
    title: "Build & Plan",
    description: "Create custom outfits, build curated capsule wardrobes, and plan what you'll wear with our calendar."
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-slate-900">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-slate-400 mb-12 max-w-2xl mx-auto">A smarter way to manage your style. Get more from your wardrobe with less effort.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-slate-800/50 rounded-xl p-8 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors">
              <div className="inline-block p-4 bg-slate-900 rounded-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}