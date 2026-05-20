'use client';

import { useState, useEffect, useCallback } from 'react';
import LiveMinute from './LiveMinute';

export default function LiveScoreboard({ matchId, initial }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/match/${matchId}`);
      const json = await res.json();
      if (json.match) setData(json.match);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (data.status !== 'live') return;
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [data.status, refresh]);

  return (
    <div className="rounded-lg border border-border bg-zinc-900/50 px-5 py-4">
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2 min-w-0 flex-1">
          {data.homeBadge && (
            <img src={data.homeBadge} alt="" className="h-10 w-10 rounded-full object-contain bg-zinc-900 ring-1 ring-border" />
          )}
          <span className="text-sm font-medium text-zinc-300 text-center truncate max-w-full">{data.homeName}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-3xl font-bold tabular-nums text-zinc-100">{data.homeScore}</span>
          <LiveMinute apiMinute={data.currentMinute} apiMinuteNumber={data.currentMinuteNumber} />
          <span className="text-3xl font-bold tabular-nums text-zinc-100">{data.awayScore}</span>
        </div>
        <div className="flex flex-col items-center gap-2 min-w-0 flex-1">
          {data.awayBadge && (
            <img src={data.awayBadge} alt="" className="h-10 w-10 rounded-full object-contain bg-zinc-900 ring-1 ring-border" />
          )}
          <span className="text-sm font-medium text-zinc-300 text-center truncate max-w-full">{data.awayName}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-zinc-600">
        {data.tournament && (
          <span className="flex items-center gap-1">
            {data.leagueLogo && (
              <img src={data.leagueLogo} alt="" className="h-3.5 w-3.5 rounded-full object-contain bg-zinc-900" />
            )}
            {data.tournament}
          </span>
        )}
        <span>{data.dateStr} &middot; {data.timeStr}</span>
        {data.venue && data.venue !== 'N/A' && (
          <span>{data.venue}</span>
        )}
      </div>
    </div>
  );
}
