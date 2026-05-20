'use client';

import Link from 'next/link';
import { Play, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

function TeamBadge({ team, size = 'h-8 w-8' }) {
  const [imgError, setImgError] = useState(false);
  const hasBadge = team.badge && !imgError;
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name)}&background=27272a&color=a1a1aa&size=128&bold=true&format=png`;

  if (hasBadge) {
    return (
      <img
        src={team.badge}
        alt={team.name}
        className={`${size} rounded-full object-contain bg-zinc-900 ring-1 ring-border`}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <img
      src={fallbackUrl}
      alt={team.name}
      className={`${size} rounded-full object-contain`}
      loading="lazy"
    />
  );
}

export default function MatchCard({ match, tab }) {
  const { id, status, timestamp, homeTeam, awayTeam, sources, tournament, homeScore, awayScore, leagueLogo, currentMinuteNumber } = match;

  const [liveData, setLiveData] = useState(null);
  const polling = useRef(null);

  useEffect(() => {
    if (status !== 'live') { setLiveData(null); return; }
    const poll = async () => {
      try {
        const res = await fetch(`/api/match/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.match) setLiveData(data.match);
      } catch {}
    };
    poll();
    polling.current = setInterval(poll, 30000);
    return () => { if (polling.current) clearInterval(polling.current); polling.current = null; };
  }, [id, status]);

  const liveMinute = liveData?.currentMinute || match.currentMinute;
  const liveMinuteNumber = liveData?.currentMinuteNumber ?? match.currentMinuteNumber;
  const displayHomeScore = liveData?.homeScore ?? homeScore;
  const displayAwayScore = liveData?.awayScore ?? awayScore;

  const currentMinute = liveMinute || (liveMinuteNumber ? `${liveMinuteNumber}'` : '');
  const timeStr = status === 'live'
    ? (currentMinute ? `${currentMinute}` : 'LIVE')
    : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const timeLeft = status === 'upcoming' ? getTimeLeft(timestamp) : '';

  return (
    <Link
      href={`/watch/${id}?tab=${tab || 'live'}`}
      className="group relative flex flex-col rounded-lg border border-border bg-zinc-900/50 p-3.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          {status === 'live' ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {currentMinute || 'LIVE'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              {timeStr}
            </span>
          )}
        </div>
        {tournament && (
          <span className="text-xs text-zinc-600 truncate max-w-[120px]" title={tournament}>
            {leagueLogo && (
              <img src={leagueLogo} alt="" className="h-3.5 w-3.5 rounded-full object-contain bg-zinc-900 inline-block -mt-0.5 mr-1" />
            )}
            {tournament}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <TeamBadge team={homeTeam} />
          <span className="text-sm font-medium truncate text-zinc-200">{homeTeam.name}</span>
        </div>
        {status === 'live' && displayHomeScore !== undefined && (
          <span className="text-lg font-semibold text-zinc-100 tabular-nums shrink-0">{displayHomeScore}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <TeamBadge team={awayTeam} />
          <span className="text-sm font-medium truncate text-zinc-200">{awayTeam.name}</span>
        </div>
        {status === 'live' && displayAwayScore !== undefined && (
          <span className="text-lg font-semibold text-zinc-100 tabular-nums shrink-0">{displayAwayScore}</span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-xs text-zinc-600">
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </span>
        {sources.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
            <Play className="h-3 w-3" />
            Watch
          </span>
        )}
      </div>

      {status === 'upcoming' && timeLeft && (
        <div className="mt-2 rounded bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-500">
          Starts in {timeLeft}
        </div>
      )}
    </Link>
  );
}

function getTimeLeft(timestamp) {
  const diff = timestamp - Date.now();
  if (diff <= 0) return 'Starting soon';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
