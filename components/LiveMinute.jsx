'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function LiveMinute({ apiMinute, apiMinuteNumber }) {
  const [offset, setOffset] = useState(0);
  const adjusted = (apiMinuteNumber || 0) + offset;
  const display = offset === 0
    ? (apiMinute || (apiMinuteNumber ? `${apiMinuteNumber}'` : ''))
    : `${adjusted}'`;

  const isFT = adjusted >= 90;
  const isHT = adjusted === 45;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setOffset(o => Math.max(o - 1, -5))}
          className="rounded bg-zinc-800 p-0.5 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400 transition-colors"
          aria-label="Minus 1 minute"
        >
          <Minus className="h-2.5 w-2.5" />
        </button>
        <span className="text-xs text-zinc-500 font-mono min-w-[2ch] text-center tabular-nums">{display}</span>
        <button
          onClick={() => setOffset(o => Math.min(o + 1, 10))}
          className="rounded bg-zinc-800 p-0.5 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400 transition-colors"
          aria-label="Plus 1 minute"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        {isFT || isHT ? (
          <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
            {isFT ? 'FT' : 'HT'}
          </span>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        )}
      </div>
    </div>
  );
}
