// components/outfit/ItemSelectorDrawer.tsx
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';

type ItemSelectorDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ItemSelectorDrawer = ({ isOpen, onClose }: ItemSelectorDrawerProps) => {
  if (!isOpen) return null;

  // We are reusing the WardrobeGrid component your friend made!
  // In a real app, you would pass real data to it.
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
      <button onClick={onClose} className="flex-grow" aria-label="Close panel"></button>
      <div className="bg-slate-900 border-t border-slate-800 p-6">
        <WardrobeGrid items={[]} isLoading={false} onRefresh={() => {}} />
      </div>
    </div>
  );
};