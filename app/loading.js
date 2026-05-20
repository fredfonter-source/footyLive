export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-5 w-16 rounded bg-zinc-800 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-lg border border-border bg-zinc-900/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-12 rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse" />
              <div className="h-4 w-28 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse" />
              <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-border">
              <div className="h-3 w-12 rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-10 rounded bg-zinc-800 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
