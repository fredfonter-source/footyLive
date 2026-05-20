import { getMatchDetails, getMatchStats, resolveAllStreams } from '@/lib/streamEngine';
import StreamPlayer from '@/components/StreamPlayer';
import MatchCountdown from '@/components/MatchCountdown';
import MatchStatsSection from '@/components/MatchStatsSection';
import LiveScoreboard from '@/components/LiveScoreboard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 30;

export default async function WatchPage({ params, searchParams }) {
  const { matchId } = params;
  const backTab = searchParams?.tab || 'live';

  let match = null;
  let streamUrl = null;
  let channels = [];
  let errorMsg = null;
  let stats = null;

const userFacingErrors = {
  'No streams available from any provider': 'No streams are available for this match right now.',
  'Match not found': 'This match could not be found. It may have been removed.',
};

  try {
    match = await getMatchDetails(matchId);
    if (!match) throw new Error('Match not found');

    const [resolved, statsResult] = await Promise.all([
      resolveAllStreams(match.title, matchId, match.homeTeam?.name || '', match.awayTeam?.name || '', match),
      getMatchStats(matchId),
    ]);
    streamUrl = resolved.proxiedUrl || resolved.url;
    channels = resolved.channels || [];
    stats = statsResult;
  } catch (err) {
    errorMsg = userFacingErrors[err.message] || 'Unable to load this match. Please try again.';
    match = await getMatchDetails(matchId);
  }

  if (!match) {
    match = {
      id: matchId,
      title: 'Match Not Found',
      tournament: '',
      timestamp: Date.now(),
      homeTeam: { name: 'Home', badge: '' },
      awayTeam: { name: 'Away', badge: '' },
      sources: [],
      fallbackChannels: [],
      leagueLogo: '',
      poster: '',
      venue: '',
      note: '',
    };
  }

  const dateStr = new Date(match.timestamp).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = new Date(match.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const boxscore = stats?.boxscore;
  const teamStats = boxscore?.teams || [];
  const commentary = stats?.commentary || [];

  return (
    <div className="space-y-4">
      <Link
        href={`/?tab=${backTab}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {match.status === 'live' && match.homeScore !== undefined ? (
        <LiveScoreboard matchId={matchId} initial={{
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          currentMinute: match.currentMinute,
          currentMinuteNumber: match.currentMinuteNumber,
          homeName: match.homeTeam?.name,
          awayName: match.awayTeam?.name,
          homeBadge: match.homeTeam?.badge,
          awayBadge: match.awayTeam?.badge,
          tournament: match.tournament,
          leagueLogo: match.leagueLogo,
          venue: match.venue,
          dateStr,
          timeStr,
        }} />
      ) : (
        <MatchCountdown timestamp={match.timestamp} status={match.status} />
      )}

      {match.status === 'live' && match.homeScore !== undefined && match.currentMinuteNumber >= 90 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-center">
          <p className="text-sm font-medium text-amber-400">Finished — watch other matches</p>
        </div>
      )}

      {match.status === 'live' && match.homeScore !== undefined && match.currentMinuteNumber === 45 && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5 text-center">
          <p className="text-sm font-medium text-blue-400">Halftime — stream will begin in a bit</p>
        </div>
      )}

      {streamUrl && !errorMsg ? (
        <StreamPlayer streamUrl={streamUrl} channels={channels} matchTitle={match.title} matchStatus={match.status} />
      ) : channels.length > 0 ? (
        <StreamPlayer streamUrl={streamUrl} channels={channels} matchTitle={match.title} matchStatus={match.status} />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-zinc-900/50">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-400">Stream unavailable</p>
            {errorMsg && <p className="mt-1 text-xs text-zinc-600">{errorMsg}</p>}
            <p className="mt-2 text-xs text-zinc-600">Try another match or check back later.</p>
          </div>
        </div>
      )}

      <MatchStatsSection teamStats={teamStats} commentary={commentary} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
    </div>
  );
}
