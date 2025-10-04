// app/(main)/planner/page.tsx
import CalendarView from '@/components/planner/CalendarView';

export default function PlannerPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Outfit Planner
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Plan your looks for the week ahead and never stress about what to wear.
        </p>
      </header>

      <CalendarView />
    </div>
  );
}