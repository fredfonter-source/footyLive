'use client';

import { useState } from 'react';
import { BarChart3, MessageSquare, ChevronDown, ChevronUp, Trophy } from 'lucide-react';

export default function MatchStatsSection({ teamStats, commentary, homeTeam, awayTeam }) {
  const [showStats, setShowStats] = useState(true);
  const [showCommentary, setShowCommentary] = useState(false);

  if (!teamStats.length && !commentary.length) return null;

  return (
    <div className="space-y-4">
      {/* Match Statistics panel */}
      {teamStats.length > 0 && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden shadow-lg">
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-zinc-350 hover:text-white transition-colors border-b border-zinc-900"
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-violet-400" />
              Match Statistics
            </span>
            {showStats ? (
              <ChevronUp className="h-4.5 w-4.5 text-zinc-500" />
            ) : (
              <ChevronDown className="h-4.5 w-4.5 text-zinc-500" />
            )}
          </button>
          
          {showStats && (
            <div className="px-5 py-5 space-y-4">
              {/* Teams Header row */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <div className="flex items-center gap-2">
                  {homeTeam?.badge && (
                    <img src={homeTeam.badge} alt="" className="h-5 w-5 rounded-full object-contain bg-zinc-900" />
                  )}
                  <span className="text-zinc-350">{homeTeam?.name || 'Home'}</span>
                </div>
                <span>Comparison</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-350">{awayTeam?.name || 'Away'}</span>
                  {awayTeam?.badge && (
                    <img src={awayTeam.badge} alt="" className="h-5 w-5 rounded-full object-contain bg-zinc-900" />
                  )}
                </div>
              </div>

              {/* Stats Rows */}
              {teamStats[0]?.statistics?.map((stat, idx) => {
                const homeVal = teamStats[0]?.statistics?.[idx]?.displayValue || '-';
                const awayVal = teamStats[1]?.statistics?.[idx]?.displayValue || '-';
                const homePct = teamStats[0]?.statistics?.[idx]?.percentage || 50;
                const awayPct = teamStats[1]?.statistics?.[idx]?.percentage || 50;
                
                return (
                  <div key={stat.name || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-200">{homeVal}</span>
                      <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">{stat.label || stat.name}</span>
                      <span className="text-zinc-200">{awayVal}</span>
                    </div>
                    {/* Visual bar split */}
                    <div className="flex h-2 rounded-full overflow-hidden bg-zinc-900 border border-zinc-850 p-0.5">
                      <div
                        className="bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${homePct}%` }}
                      />
                      <div className="w-1 bg-transparent" />
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all ml-auto"
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

      {/* Commentary log panel */}
      {commentary.length > 0 && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden shadow-lg">
          <button
            onClick={() => setShowCommentary(!showCommentary)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-zinc-350 hover:text-white transition-colors border-b border-zinc-900"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-emerald-400" />
              Live Play-by-Play Logs
            </span>
            {showCommentary ? (
              <ChevronUp className="h-4.5 w-4.5 text-zinc-500" />
            ) : (
              <ChevronDown className="h-4.5 w-4.5 text-zinc-500" />
            )}
          </button>
          
          {showCommentary && (
            <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto divide-y divide-zinc-900">
              {commentary.slice(0, 30).map((item, idx) => (
                <div key={idx} className="flex gap-4 text-xs py-3.5 items-start">
                  {/* Time badge */}
                  <span className="text-violet-400 shrink-0 font-mono font-bold w-12 text-right bg-violet-950/40 border border-violet-900/60 px-1.5 py-0.5 rounded">
                    {item.time?.displayValue || 'Kickoff'}
                  </span>
                  
                  {/* Log description */}
                  <div className="space-y-1 flex-1">
                    <p className="text-zinc-300 font-medium leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
