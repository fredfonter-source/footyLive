import { Match, Channel } from '../types';

export interface StreamProvider {
  id: string;
  name: string;
  referer?: string; // ✅ Add this - each provider can specify its referer
  fetchMatches(): Promise<Match[]>;
  resolveStreams(
    matchTitle: string,
    homeTeam: string,
    awayTeam: string,
    matchId: string,
    preFetchedMatch?: Match | null
  ): Promise<Channel[]>;
}
