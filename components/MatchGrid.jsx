'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import MatchCard from './MatchCard';
import { useRouter } from 'next/navigation';

function Ball({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.2">
      <circle cx="12" cy="12" r="9" className="stroke-violet-400" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" className="stroke-violet-400" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" className="stroke-violet-400" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" className="stroke-violet-400" />
      <circle cx="12" cy="12" r="2.5" className="fill-violet-400" opacity="0.4" />
    </svg>
  );
}

function Whistle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="17" r="3.5" className="stroke-amber-400" />
      <path d="M9 17V4l10 2v4" className="stroke-amber-400" />
      <path d="M9 11l10 2" className="stroke-amber-300" />
    </svg>
  );
}

function Boot({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19l2-7 3-1 1-4 4-2 2 2-2 4-3 1-1 3 2 3-2 2H6l-2-1z" className="stroke-sky-400" />
      <path d="M6 14l-2 1" className="stroke-sky-300" />
      <circle cx="14" cy="5" r="1.5" className="stroke-sky-400" />
    </svg>
  );
}

function Trophy({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v4a6 6 0 0 1-12 0V3z" className="stroke-emerald-400" />
      <path d="M8 3a4 4 0 0 0-4 4 3 3 0 0 0 3 3h1" className="stroke-emerald-400" />
      <path d="M16 3a4 4 0 0 1 4 4 3 3 0 0 1-3 3h-1" className="stroke-emerald-400" />
      <path d="M12 14v4" className="stroke-emerald-400" />
      <path d="M8 21h8" className="stroke-emerald-300" />
      <path d="M10 17l-2 4" className="stroke-emerald-300" />
      <path d="M14 17l2 4" className="stroke-emerald-300" />
    </svg>
  );
}

function Goal({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="1" className="stroke-indigo-400" />
      <path d="M3 9h18" className="stroke-indigo-300" />
      <path d="M3 13h18" className="stroke-indigo-300" />
      <circle cx="12" cy="12" r="1.5" className="fill-indigo-400" opacity="0.4" />
      <circle cx="8" cy="12" r="0.8" className="fill-indigo-300" opacity="0.3" />
      <circle cx="16" cy="12" r="0.8" className="fill-indigo-300" opacity="0.3" />
    </svg>
  );
}

function Stadium({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="16" rx="9" ry="3" className="stroke-rose-400" />
      <path d="M3 16V8c0-2 3-4 9-4s9 2 9 4v8" className="stroke-rose-400" />
      <path d="M12 12v4" className="stroke-rose-300" />
      <path d="M6 14v2" className="stroke-rose-300" />
      <path d="M18 14v2" className="stroke-rose-300" />
    </svg>
  );
}

export default function MatchGrid({ matches, leagues, defaultTab }) {
  const router = useRouter();
  const [tab, setTab] = useState(defaultTab);
  const [search, setSearch] = useState('');
  const [league, setLeague] = useState('all');

  useEffect(() => {
    if (tab !== 'live') return;
    const interval = setInterval(() => { router.refresh(); }, 60000);
    return () => clearInterval(interval);
  }, [tab, router]);

  const live = useMemo(() => matches.filter(m => m.status === 'live'), [matches]);
  const upcoming = useMemo(() => matches.filter(m => m.status === 'upcoming'), [matches]);

  const baseMatches = tab === 'upcoming' ? upcoming : live;

  const filtered = useMemo(() => {
    let result = baseMatches;
    if (league !== 'all') {
      result = result.filter(m => m.tournament === league);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(m =>
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.tournament.toLowerCase().includes(q)
      );
    }
    return result;
  }, [baseMatches, league, search]);

  const leaguesWithLogos = useMemo(() => {
    const leagueMap = new Map();
    for (const m of matches) {
      if (m.tournament && !leagueMap.has(m.tournament)) {
        leagueMap.set(m.tournament, { name: m.tournament, logo: m.leagueLogo || '' });
      }
    }
    return Array.from(leagueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  return (
    <div className="space-y-5">
      <Ball className="fixed left-2 top-16 h-10 w-10 text-violet-500/5 rotate-12 hidden xl:block" />
      <Whistle className="fixed right-2 top-20 h-9 w-9 text-amber-500/5 hidden xl:block" />
      <Goal className="fixed left-2 top-40 h-12 w-12 text-indigo-500/5 -rotate-12 hidden xl:block" />
      <Trophy className="fixed right-2 top-44 h-10 w-10 text-emerald-500/5 rotate-45 hidden xl:block" />
      <Stadium className="fixed left-2 top-72 h-11 w-11 text-rose-500/5 hidden xl:block" />
      <Boot className="fixed right-2 top-72 h-10 w-10 text-sky-500/5 -rotate-12 hidden xl:block" />
      <Ball className="fixed left-2 top-[22rem] h-9 w-9 text-violet-500/5 -rotate-12 hidden xl:block" />
      <Whistle className="fixed right-2 top-96 h-10 w-10 text-amber-500/5 hidden xl:block" />
      <Trophy className="fixed left-2 top-[30rem] h-11 w-11 text-emerald-500/5 rotate-90 hidden xl:block" />
      <Goal className="fixed right-2 top-[32rem] h-12 w-12 text-indigo-500/5 rotate-45 hidden xl:block" />

      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">
            {tab === 'upcoming' ? 'Upcoming' : 'Live Now'}
          </h1>
          <p className="text-sm text-zinc-500">{baseMatches.length} match{baseMatches.length !== 1 ? 'es' : ''}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border bg-zinc-900 p-0.5">
          <button
            onClick={() => setTab('live')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'live'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Live
          </button>
          <button
            onClick={() => setTab('upcoming')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'upcoming'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Upcoming
          </button>
        </div>

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-lg border border-border bg-zinc-900 py-1.5 pl-8 pr-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <select
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className="w-40 appearance-none rounded-lg border border-border bg-zinc-900 py-1.5 pl-8 pr-8 text-sm text-zinc-100 outline-none focus:border-zinc-700 transition-colors"
          >
            <option value="all">All Leagues</option>
            {leaguesWithLogos.map(l => (
              <option key={l.name} value={l.name}>{l.name}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
            <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-400">
            {search || league !== 'all' ? 'No matches match your filters' : tab === 'live' ? 'No live matches right now' : 'No upcoming matches'}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {search || league !== 'all' ? 'Try adjusting your search or filter.' : tab === 'live' ? 'Check the Upcoming tab for scheduled fixtures.' : 'Check back later for new fixtures.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(match => (
            <MatchCard key={match.id} match={match} tab={tab} />
          ))}
        </div>
      )}
    </div>
  );
}
