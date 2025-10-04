// app/(main)/create/page.tsx
'use client';
import { useState } from 'react';
import { OutfitCanvas } from '@/components/outfit/OutfitCanvas';
import { ItemSelectorDrawer } from '@/components/outfit/ItemSelectorDrawer';
import Button from '@/components/ui/Button';

export default function CreatePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Outfit Canvas
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Mix and match pieces from your wardrobe to create a new look.
          </p>
        </div>
        <Button>Save Outfit</Button>
      </header>

      <OutfitCanvas />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <Button onClick={() => setIsDrawerOpen(true)}>+ Add Items</Button>
      </div>

      <ItemSelectorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}