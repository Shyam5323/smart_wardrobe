// components/outfit/OutfitCanvas.tsx
export const OutfitCanvas = () => {
  // In the future, this will hold the selected items
  return (
    <div className="relative w-full h-[60vh] rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-8 flex flex-col items-center justify-center gap-4">
        <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-slate-600">
            <p className="text-slate-500">Top</p>
        </div>
        <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-slate-600">
            <p className="text-slate-500">Bottom</p>
        </div>
    </div>
  );
};