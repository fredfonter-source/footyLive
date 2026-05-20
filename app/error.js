'use client';

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6m0-6 6 6" />
        </svg>
      </div>
      <h2 className="text-[15px] font-semibold text-zinc-300">Something went wrong</h2>
      <p className="mt-1.5 max-w-sm text-[13px] text-zinc-500">Failed to load content. Please try again.</p>
      <button
        onClick={reset}
        className="mt-5 rounded-lg bg-zinc-800 px-4 py-2 text-[13px] font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
