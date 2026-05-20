'use client';

import { useState } from 'react';
import { BarChart3, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

export default function MatchStatsSection({ teamStats, commentary, homeTeam, awayTeam }) {
  const [showStats, setShowStats] = useState(false);
  const [showCommentary, setShowCommentary] = useState(false);

  if (!teamStats.length && !commentary.length) return null;

  return (
    <div className="space-y-2">
      {teamStats.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Match Statistics
            </span>
            {showStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showStats && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  {homeTeam?.badge && (
                    <img src={homeTeam.badge} alt="" className="h-5 w-5 rounded-full object-contain bg-zinc-900" />
                  )}
                  <span className="text-xs font-medium text-zinc-300">{homeTeam?.name || 'Home'}</span>
                </div>
                <span className="text-xs text-zinc-600">Stats</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-300">{awayTeam?.name || 'Away'}</span>
                  {awayTeam?.badge && (
                    <img src={awayTeam.badge} alt="" className="h-5 w-5 rounded-full object-contain bg-zinc-900" />
                  )}
                </div>
              </div>
              {teamStats[0]?.statistics?.map((stat, idx) => {
                const homeVal = teamStats[0]?.statistics?.[idx]?.displayValue || '-';
                const awayVal = teamStats[1]?.statistics?.[idx]?.displayValue || '-';
                const homePct = teamStats[0]?.statistics?.[idx]?.percentage || 50;
                const awayPct = teamStats[1]?.statistics?.[idx]?.percentage || 50;
                return (
                  <div key={stat.name || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-100">{homeVal}</span>
                      <span className="text-zinc-500">{stat.label || stat.name}</span>
                      <span className="font-medium text-zinc-100">{awayVal}</span>
                    </div>
                    <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden bg-zinc-800">
                      <div
                        className="bg-violet-500 transition-all"
                        style={{ width: `${homePct}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${awayPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {commentary.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setShowCommentary(!showCommentary)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Match Commentary
            </span>
            {showCommentary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showCommentary && (
            <div className="px-4 pb-4 space-y-1 max-h-64 overflow-y-auto">
              {commentary.slice(0, 20).map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs py-1">
                  <span className="text-zinc-600 shrink-0 font-mono w-10 text-right">{item.time?.displayValue || ''}</span>
                  <span className="text-zinc-400">{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
