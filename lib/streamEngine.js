const WATCHFOOTY_API = process.env.NEXT_PUBLIC_API_BASE || 'https://api.watchfooty.st';
const STREAMED_API = 'https://streamed.pk/api/matches/football';
const STREAMED_STREAM = 'https://streamed.pk/api/stream';
const CDN_LIVE_API = 'https://api.cdnlivetv.tv/api/v1/events/sports/?user=cdnlivetv&plan=free';
const TIMEOUT_MS = 4000;
const SHORT_TIMEOUT = 2500;

const COMMON_WORDS = new Set(['fc', 'cf', 'ac', 'sc', 'afc', 'ssc', 'ud', 'cd',
  'de', 'del', 'da', 'do', 'dos', 'das', 'e', 'o', 'a', 'as', 'os',
  'the', 'and', 'vs', 'v', 'x', 'club', 'team', 'real', 'united',
  'city', 'young', 'boys', 'old']);

// Simple in-flight request cache to prevent duplicate concurrent API calls
const inflightCache = new Map();
async function dedupedFetch(key, fetcher, ttlMs = 60000) {
  const cached = inflightCache.get(key);
  if (cached && Date.now() - cached.ts < ttlMs) return cached.data;
  if (cached && cached.promise) return cached.promise;
  const promise = fetcher().then(data => {
    inflightCache.set(key, { data, ts: Date.now(), promise: null });
    return data;
  }).catch(err => {
    inflightCache.delete(key);
    throw err;
  });
  inflightCache.set(key, { data: null, ts: 0, promise });
  return promise;
}

function getStreamRedirectUrl(originalUrl) {
  const encoded = Buffer.from(originalUrl).toString('base64');
  return `/api/stream-redirect?u=${encoded}`;
}

const LEAGUE_TIERS = [
  // Tier 0: World Events
  'world cup', 'fifa',
  // Tier 1: Continental Championships
  'uefa champions league', 'uefa europa league', 'uefa euro', 'uefa nations',
  'european championship', 'euro', 'champions league',
  'copa libertadores', 'copa sudamericana', 'conmebol',
  'copa america', 'africa cup of nations', 'caf', 'asian cup', 'afc',
  'concacaf gold cup',
  // Tier 2: Top Domestic Leagues
  'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1',
  'primeira liga', 'eredivisie', 'belgian pro league',
  'brasileiro', 'liga mx', 'mls', 'argentinian', 'colombian',
  'scottish premiership', 'swiss super league',
  // Tier 3: Other Recognized Leagues
  'superettan', 'allsvenskan', 'eliteserien', 'obos-ligaen', 'veikkausliiga',
  'premium liiga', 'virsliga', 'niké liga', 'austrian bundesliga',
  // Tier 4: Lower Tiers
  'serie b', 'liga profesional', 'primera division', 'segunda division',
  // Default
];

const LEAGUE_COUNTRIES = {
  // Specific country leagues FIRST (before generic patterns)
  'ethiopian premier': 'Ethiopia', 'ethiopian league': 'Ethiopia',
  'ugandan premier': 'Uganda', 'ugandan league': 'Uganda',
  'kenyan premier': 'Kenya', 'kenyan league': 'Kenya',
  'tanzanian premier': 'Tanzania', 'tanzanian league': 'Tanzania',
  'nigerian league': 'Nigeria', 'nigerian premier': 'Nigeria',
  'ghana premier': 'Ghana', 'ghanaian premier': 'Ghana',
  'south african premier': 'South Africa', 'south african': 'South Africa',
  'cosmopolitan': 'South Africa',
  'zambian super': 'Zambia', 'zimbabwean premier': 'Zimbabwe',
  'cameroonian premier': 'Cameroon', 'ivorian ligue': 'Ivory Coast',
  'senegalese ligue': 'Senegal', 'egyptian premier': 'Egypt',
  'moroccan botola': 'Morocco', 'tunisian ligue': 'Tunisia',
  'algerian ligue': 'Algeria', 'libyan premier': 'Libya',
  'sudanese premier': 'Sudan', 'congo premier': 'Congo',
  'angolan girabola': 'Angola', 'mozambican mocambola': 'Mozambique',
  'belarusian premier': 'Belarus', 'belarusian cup': 'Belarus',
  'armenian first': 'Armenia', 'iraqi league': 'Iraq',
  'yemeni league': 'Yemen', 'georgian': 'Georgia',
  'erovnuli liga': 'Georgia',
  // European leagues
  'english premier league': 'England', 'english league': 'England',
  'english fa cup': 'England', 'english league cup': 'England',
  'french coupe': 'France', 'french ligue': 'France', 'ligue 2': 'France',
  'coupe de tunisie': 'Tunisia',
  'italian serie': 'Italy', 'italian coppa': 'Italy',
  'spanish copa': 'Spain', 'spanish la': 'Spain',
  'german bundesliga': 'Germany', 'austrian bundesliga': 'Austria',
  'regionalliga': 'Germany',
  'belgian pro': 'Belgium', 'belgian cup': 'Belgium',
  'dutch knvb': 'Netherlands', 'dutch eredivisie': 'Netherlands',
  'norwegian eliteserien': 'Norway', 'norwegian cup': 'Norway',
  'norsk tipping': 'Norway', 'nm kvinner': 'Norway',
  'swedish allsvenskan': 'Sweden', 'swedish cup': 'Sweden',
  'damallsvenskan': 'Sweden',
  'danish superliga': 'Denmark', 'danish cup': 'Denmark',
  'finnish veikkausliiga': 'Finland', 'finnish cup': 'Finland',
  'estonian premium': 'Estonia', 'estonian cup': 'Estonia',
  'latvian virslunga': 'Latvia', 'latvian cup': 'Latvia', 'virsliga': 'Latvia',
  'lithuanian cup': 'Lithuania', 'lithuanian first': 'Lithuania',
  'montenegrin first': 'Montenegro', 'montenegrin cup': 'Montenegro',
  'serbian superliga': 'Serbia', 'serbian cup': 'Serbia',
  'croatian hnl': 'Croatia', 'croatian cup': 'Croatia',
  'slovenian prva': 'Slovenia', 'slovenian cup': 'Slovenia',
  'polish ekstraklasa': 'Poland', 'polish cup': 'Poland',
  'czech cup': 'Czech Republic', 'czech league': 'Czech Republic', 'mol cup': 'Czech Republic',
  'hungarian cup': 'Hungary', 'hungarian league': 'Hungary',
  'romanian liga': 'Romania', 'romanian cup': 'Romania',
  'bulgarian cup': 'Bulgaria', 'bulgarian league': 'Bulgaria',
  'greek super league': 'Greece', 'greek cup': 'Greece',
  'turkish super lig': 'Turkey', 'turkish cup': 'Turkey',
  'saudi pro league': 'Saudi Arabia', 'saudi king cup': 'Saudi Arabia',
  'emirates league': 'UAE', 'qatari league': 'Qatar',
  'israeli premier': 'Israel', 'israeli cup': 'Israel', 'liga leumit': 'Israel',
  'cypriot league': 'Cyprus', 'cypriot cup': 'Cyprus',
  'irish premier': 'Ireland', 'irish cup': 'Ireland',
  'welsh premier': 'Wales', 'welsh cup': 'Wales',
  'scottish premiership': 'Scotland', 'scottish championship': 'Scotland',
  'swiss super league': 'Switzerland', 'swiss cup': 'Switzerland',
  'portuguese primeira': 'Portugal', 'primeira liga': 'Portugal',
  'niké liga': 'Slovakia',
  'parva liga': 'Bulgaria', 'ekstraklasa': 'Poland', 'ligat ha\'al': 'Israel',
  'liga i': 'Romania', 'superliga': 'Serbia',
  'liga argentina': 'Argentina', 'copa argentina': 'Argentina',
  'torneo de reservas': 'Argentina',
  'copa colombia': 'Colombia', 'colombian primera': 'Colombia', 'colombian women': 'Colombia',
  'copa ecuador': 'Ecuador', 'ligapro ecuador': 'Ecuador',
  'copa do nordeste': 'Brazil',
  'copa verde': 'Brazil', 'copa espirito santo': 'Brazil',
  'copa fgf': 'Brazil', 'copa liberta': 'South America',
  'conmebol libertadores': 'South America',
  'copa sudamericana': 'South America', 'conmebol sudamericana': 'South America',
  'brasileiro': 'Brazil', 'carioca': 'Brazil', 'catarinense': 'Brazil',
  'cearense': 'Brazil', 'liga revelacao': 'Portugal',
  'liga futve': 'Venezuela', 'divisional c': 'Chile',
  'division intermedia': 'Paraguay', 'lpr pro': 'Mexico',
  'liga nacional': 'Guatemala',
  'uefa europa league': 'Europe', 'uefa champions league': 'Europe', 'uefa nations league': 'Europe',
  'champions league': 'Europe', 'europa league': 'Europe',
  'world cup': 'World', 'fifa world cup': 'World',
  'copa america': 'South America', 'africa cup of nations': 'Africa',
  'caf': 'Africa', 'asian cup': 'Asia', 'afc': 'Asia',
  'concacaf': 'North America', 'us open cup': 'USA',
  'usl': 'USA',
  'indian super league': 'India', 'i-league': 'India',
  'chinese super league': 'China', 'j-league': 'Japan',
  'k-league': 'South Korea', 'a-league': 'Australia',
  'ofc pro league': 'Oceania', 'caribbean': 'Caribbean',
  'asean club': 'Asia', 'concacaf w': 'North America',
  'club friendlies': 'International', 'women league': 'Women',
  // Generic league names (checked LAST)
  'premier league': 'England', 'la liga': 'Spain', 'serie a': 'Italy',
  'bundesliga': 'Germany', 'ligue 1': 'France',
  'eredivisie': 'Netherlands', 'liga mx': 'Mexico',
  'mls': 'USA', 'superettan': 'Sweden', 'allsvenskan': 'Sweden',
  'eliteserien': 'Norway', 'obos-ligaen': 'Norway', 'veikkausliiga': 'Finland',
  'premium liiga': 'Estonia', 'austrian bundesliga': 'Austria',
  'liga profesional reserva': 'Argentina', 'reserve': '', 'u20': '', 'u17': '',
  'under-20': '', 'under-17': '', 'women': 'Women',
  'premier league summer': 'International',
};

function getLeaguePriority(leagueName) {
  const lower = leagueName.toLowerCase();
  
  for (let tier = 0; tier < LEAGUE_TIERS.length; tier++) {
    for (const keyword of LEAGUE_TIERS[tier]) {
      if (lower.includes(keyword)) {
        return tier;
      }
    }
  }
  return LEAGUE_TIERS.length;
}

function getCountryForLeague(leagueName) {
  const lower = leagueName.toLowerCase();
  
  // Check for reserved/youth leagues first
  if (lower.includes('reserve') || lower.includes('res.') || lower.includes(' u') || lower.includes('u-')) {
    return '';
  }
  if (lower.includes('women') || lower.includes('w ')) {
    return 'Women';
  }
  
  // Check specific leagues
  for (const [key, country] of Object.entries(LEAGUE_COUNTRIES)) {
    if (lower.includes(key)) {
      return country;
    }
  }
  
  // Default: Try to extract country from league name
  return '';
}

function sortMatches(matches) {
  return matches.sort((a, b) => {
    // Live matches first
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    
    // Sort by league priority
    const aPriority = getLeaguePriority(a.tournament);
    const bPriority = getLeaguePriority(b.tournament);
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Then by timestamp
    return a.timestamp - b.timestamp;
  });
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 30 },
      headers: { 'Accept': 'application/json' }
    });
    if (res.status === 429) {
      console.warn(`Rate limited by ${url.split('/')[2]}, returning empty`);
      return [];
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- WatchFooty Provider ---
// Single fetch point for /matches/football — all consumers reuse the same call
let wfMatchesCache = null;
let wfMatchFetchInFlight = null;

async function fetchWatchFootyMatches() {
  if (wfMatchFetchInFlight) return wfMatchFetchInFlight;
  wfMatchFetchInFlight = (async () => {
    try {
      const data = await fetchWithTimeout(`${WATCHFOOTY_API}/api/v1/matches/football`, TIMEOUT_MS);
      wfMatchesCache = Array.isArray(data) ? data : [];
      return wfMatchesCache;
    } catch (err) {
      console.error('WatchFooty API failed:', err.message);
      wfMatchesCache = [];
      return wfMatchesCache;
    } finally {
      wfMatchFetchInFlight = null;
    }
  })();
  return wfMatchFetchInFlight;
}

export async function getMatches() {
  const data = await fetchWatchFootyMatches();
  const matches = data.map(normalizeWatchFootyMatch);
  return sortMatches(matches);
}

export async function getLiveMatches() {
  const data = await fetchWatchFootyMatches();
  const matches = data
    .filter(m => m.status === 'in' || m.status === 'live' || (m.currentMinuteNumber > 0 && m.currentMinuteNumber <= 120))
    .map(normalizeWatchFootyMatch);
  return sortMatches(matches);
}

function normalizeWatchFootyMatch(match) {
  const streams = match.streams || [];
  const homeLogo = match.teams?.home?.logoUrl ? `${WATCHFOOTY_API}${match.teams.home.logoUrl}` : '';
  const awayLogo = match.teams?.away?.logoUrl ? `${WATCHFOOTY_API}${match.teams.away.logoUrl}` : '';
  const leagueLogo = match.leagueLogo ? `${WATCHFOOTY_API}${match.leagueLogo}` : '';
  const poster = match.poster ? `${WATCHFOOTY_API}${match.poster}` : '';
  
  const isExplicitlyLive = match.status === 'in' || match.status === 'live';
  const hasLiveScores = (match.scores?.home >= 0 || match.scores?.away >= 0) && 
                         match.currentMinuteNumber > 0 && match.currentMinuteNumber < 90;

  let status;
  if (match.status === 'post' || match.status === 'postponed' || match.status === 'cancelled') {
    status = 'upcoming';
  } else if (isExplicitlyLive) {
    status = 'live';
  } else if (match.status === 'pre' && hasLiveScores) {
    status = 'live';
  } else {
    status = 'upcoming';
  }

  const country = getCountryForLeague(match.league || '');

  return {
    id: match.matchId || '',
    title: match.title || '',
    sport: 'football',
    status,
    timestamp: match.timestamp ? new Date(match.timestamp).getTime() : Date.now(),
    tournament: match.league || '',
    country: country,
    priority: getLeaguePriority(match.league || ''),
    homeTeam: { name: match.teams?.home?.name || 'Home', badge: homeLogo },
    awayTeam: { name: match.teams?.away?.name || 'Away', badge: awayLogo },
    leagueLogo: leagueLogo,
    poster: poster,
    venue: match.venue || '',
    note: match.note || '',
    sources: streams.map((s, idx) => ({ 
      source: `wf-${s.source || 'stream'}-${idx + 1}`,
      id: s.id,
      url: s.url,
      label: `Server ${idx + 1}` 
    })),
    fallbackChannels: streams.map((s, idx) => ({
      name: `Server ${idx + 1} (WatchFooty)`,
      url: s.url,
    })),
    currentMinute: match.currentMinute || '',
    currentMinuteNumber: match.currentMinuteNumber || 0,
    homeScore: Math.max(0, match.scores?.home ?? match.homeScore ?? 0),
    awayScore: Math.max(0, match.scores?.away ?? match.awayScore ?? 0),
  };
}

export async function getLeagues() {
  try {
    const data = await fetchWithTimeout(`${WATCHFOOTY_API}/api/v1/top-leagues/football`, TIMEOUT_MS);
    return Array.isArray(data) ? data.filter(l => typeof l === 'string').sort() : [];
  } catch (err) {
    console.error('WatchFooty Leagues API failed:', err.message);
    return [];
  }
}

export async function getMatchDetails(matchId) {
  try {
    const data = await fetchWithTimeout(`${WATCHFOOTY_API}/api/v1/match/${matchId}`, TIMEOUT_MS);
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    const match = Array.isArray(data) ? data[0] : data;
    return normalizeWatchFootyMatch(match);
  } catch (err) {
    console.error('WatchFooty Match Details API failed:', err.message);
    return null;
  }
}

export async function getMatchStats(matchId) {
  try {
    const data = await fetchWithTimeout(`${WATCHFOOTY_API}/api/v1/match/${matchId}/stats`, SHORT_TIMEOUT);
    if (!data || !data.statistics) return null;
    return {
      venue: data.venue || '',
      leagueLogo: data.leagueLogo ? `${WATCHFOOTY_API}${data.leagueLogo}` : '',
      poster: data.poster ? `${WATCHFOOTY_API}${data.poster}` : '',
      boxscore: data.statistics?.boxscore || null,
      rosters: data.statistics?.rosters || null,
      commentary: data.statistics?.commentary || null,
    };
  } catch (err) {
    return null;
  }
}

export async function getTopTeams() {
  try {
    const data = await fetchWithTimeout(`${WATCHFOOTY_API}/api/v1/top-teams/football`, TIMEOUT_MS);
    return Array.isArray(data) ? data.filter(t => typeof t === 'string') : [];
  } catch (err) {
    console.error('WatchFooty Top Teams API failed:', err.message);
    return [];
  }
}

// --- CDNLiveTV Provider ---
async function fetchCdnliveMatches() {
  return dedupedFetch('cdnlive', async () => {
    try {
      const data = await fetchWithTimeout(CDN_LIVE_API, TIMEOUT_MS);
      const sportsData = data?.['cdn-live-tv'] || {};
      const matches = [];
      const soccerEvents = sportsData['Soccer'] || sportsData['Football'] || [];
      if (Array.isArray(soccerEvents)) {
        for (const event of soccerEvents) {
          const status = event.status === 'live' ? 'live' : 'upcoming';
          matches.push({
            id: event.gameID || '',
            title: `${event.homeTeam || ''} vs ${event.awayTeam || ''}`,
            homeTeam: event.homeTeam || '',
            awayTeam: event.awayTeam || '',
            tournament: event.tournament || '',
            country: event.country || '',
            status: status,
            timestamp: event.start ? new Date(event.start).getTime() : Date.now(),
            channels: (event.channels || []).map((ch, idx) => ({
              name: ch.channel_name || `Stream ${idx + 1}`,
              url: ch.url || '',
              quality: 'HD',
            })),
          });
        }
      }
      return matches;
    } catch (err) {
      console.error('CDNLiveTV API failed:', err.message);
      return [];
    }
  }, 30000);
}

// --- Streamed.pk Provider ---
async function fetchStreamedMatches() {
  return dedupedFetch('streamed', async () => {
    try {
      const data = await fetchWithTimeout(STREAMED_API, TIMEOUT_MS);
      if (!Array.isArray(data)) return [];
      return data.map(m => ({
        id: m.id || '',
        title: m.title || '',
        homeTeam: m.teams?.home?.name || '',
        awayTeam: m.teams?.away?.name || '',
        tournament: m.category || '',
        timestamp: m.date || Date.now(),
        sources: (m.sources || []).map(s => ({
          source: s.source,
          id: s.id,
        })),
      }));
    } catch (err) {
      console.error('Streamed.pk API failed:', err.message);
      return [];
    }
  }, 30000);
}

async function resolveStreamedStream(source, id) {
  try {
    const url = `${STREAMED_STREAM}/${source}/${id}`;
    const data = await fetchWithTimeout(url, SHORT_TIMEOUT);
    if (Array.isArray(data) && data.length > 0) {
      return data.map(s => ({
        url: s.embedUrl || s.url || '',
        quality: s.hd ? 'HD' : 'SD',
      }));
    }
    if (data?.url || data?.embedUrl || data?.streamUrl || data?.iframe) {
      return [{
        url: data.url || data.embedUrl || data.streamUrl || data.iframe,
        quality: 'HD',
      }];
    }
    return [];
  } catch (err) {
    return [];
  }
}

// --- Aggregated Stream Resolution ---
export async function resolveAllStreams(matchTitle, matchId, homeTeam, awayTeam, preFetchedMatch = null) {
  const allServers = [];
  let serverIndex = 1;

  // Run all providers in parallel so one slow API doesn't block the rest
  const [wfSources, cdnMatches, streamedMatches] = await Promise.allSettled([
    // 1. WatchFooty streams (use pre-fetched match to avoid extra API call)
    (async () => {
      const sources = preFetchedMatch?.sources ? [...preFetchedMatch.sources] : [];
      if (sources.length === 0) {
        const wfMatch = await getMatchDetails(matchId);
        if (wfMatch?.sources) sources.push(...wfMatch.sources);
      }
      return sources;
    })(),
    // 2. CDNLiveTV match list
    fetchCdnliveMatches(),
    // 3. Streamed.pk match list
    fetchStreamedMatches(),
  ]);

  // Merge WatchFooty sources
  if (wfSources.status === 'fulfilled' && wfSources.value.length > 0) {
    for (const s of wfSources.value) {
      allServers.push({
        name: `Server ${serverIndex++}`,
        url: s.url,
        provider: 'watchfooty',
        quality: s.quality || 'HD',
      });
    }
  }

  // Merge CDNLiveTV
  if (cdnMatches.status === 'fulfilled') {
    for (const m of cdnMatches.value) {
      if (teamsMatch(matchTitle, m.title)) {
        for (const ch of m.channels) {
          if (ch.url) {
            allServers.push({
              name: `Server ${serverIndex++}`,
              url: ch.url,
              provider: 'cdnlive',
              quality: ch.quality || 'HD',
            });
          }
        }
      }
    }
  }

  // Merge Streamed.pk (resolve individual streams in parallel)
  if (streamedMatches.status === 'fulfilled') {
    const streamTasks = [];
    for (const m of streamedMatches.value) {
      if (teamsMatch(matchTitle, m.title)) {
        for (const src of (m.sources || [])) {
          streamTasks.push(
            resolveStreamedStream(src.source, src.id).then(urls => ({ urls, source: src })).catch(() => ({ urls: [], source: src }))
          );
        }
      }
    }
    const streamResults = await Promise.allSettled(streamTasks);
    for (const r of streamResults) {
      if (r.status === 'fulfilled') {
        for (const su of r.value.urls) {
          if (su.url) {
            allServers.push({
              name: `Server ${serverIndex++}`,
              url: su.url,
              provider: 'streamed',
              quality: su.quality || 'HD',
            });
          }
        }
      }
    }
  }

  if (allServers.length === 0) {
    throw new Error('No streams available from any provider');
  }

  // Sort by quality: HD first, then SD
  const qualityOrder = { 'FHD': 0, 'HD': 0, '1080p': 0, '720p': 1, 'SD': 2 };
  allServers.sort((a, b) => (qualityOrder[a.quality] || 2) - (qualityOrder[b.quality] || 2));

  // Wrap server URLs through redirect proxy to hide actual URLs
  const proxiedChannels = allServers.map(ch => ({
    ...ch,
    proxiedUrl: getStreamRedirectUrl(ch.url),
  }));

  return {
    url: allServers[0].url,
    proxiedUrl: getStreamRedirectUrl(allServers[0].url),
    channels: proxiedChannels,
    serverCount: allServers.length,
  };
}

function normalizeTeamName(name) {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  // Remove common suffixes/prefixes
  let cleaned = lower
    .replace(/\b(fc|cf|sc|ac|afc|ssc|ud|cd|ec|rc|assoc|atletico|atlético)\b/g, '')
    .replace(/\b(team|club|real|sport|sporting|racing|race|union|united|city)\b/g, '')
    .replace(/['´`]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

function extractTeamNames(title) {
  const parts = title.split(/\s+vs\s+|\s+-\s+|\s+x\s+/i);
  if (parts.length >= 2) {
    return { home: parts[0].trim(), away: parts[1].trim() };
  }
  // Fallback: split roughly in half
  const words = title.trim().split(/\s+/);
  if (words.length >= 4) {
    const mid = Math.floor(words.length / 2);
    return { home: words.slice(0, mid).join(' '), away: words.slice(mid).join(' ') };
  }
  return { home: title.trim(), away: '' };
}

function getSignificantWords(name) {
  const words = name.toLowerCase().split(/\s+/);
  const sig = [];
  for (const w of words) {
    const clean = w.replace(/[^a-z0-9]/g, '');
    if (clean.length > 2 && !COMMON_WORDS.has(clean)) {
      sig.push(clean);
    }
  }
  return sig;
}

function teamSimilarity(teamA, teamB) {
  const aNorm = normalizeTeamName(teamA);
  const bNorm = normalizeTeamName(teamB);
  
  if (!aNorm || !bNorm) return 0;

  // Exact match after normalization
  if (aNorm === bNorm) return 2.0;
  
  // One contains the other
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return 1.5;

  // Check if either name is a short form of the other
  // e.g. "Milan" in "AC Milan" → aClean presence
  const aClean = teamA.toLowerCase().replace(/[^a-z0-9]/g, '');
  const bClean = teamB.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (aClean.includes(bClean) || bClean.includes(aClean)) return 1.5;

  // Compare significant words
  const aSig = getSignificantWords(teamA);
  const bSig = getSignificantWords(teamB);

  if (aSig.length === 0 || bSig.length === 0) return 0;

  let overlap = 0;
  for (const w of aSig) {
    if (bSig.includes(w)) overlap++;
  }

  // At least 2 significant words match → strong signal
  if (overlap >= 2) return 1.5;
  // 1 significant word matches and it's distinctive (not "city", "united")
  if (overlap === 1 && aSig[0].length > 4) return 1.0;
  
  return 0;
}

function teamsMatch(title1, title2) {
  if (!title1 || !title2) return false;
  
  const t1 = extractTeamNames(title1);
  const t2 = extractTeamNames(title2);

  if (!t1.home && !t1.away) return false;
  if (!t2.home && !t2.away) return false;

  // Score: best home vs candidate {home, away} + best away vs candidate {home, away}
  let bestScore = 0;

  // Home team matching
  let homeScore = 0;
  if (t1.home) {
    homeScore = Math.max(
      teamSimilarity(t1.home, t2.home),
      teamSimilarity(t1.home, t2.away)
    );
  }

  // Away team matching
  let awayScore = 0;
  if (t1.away) {
    awayScore = Math.max(
      teamSimilarity(t1.away, t2.home),
      teamSimilarity(t1.away, t2.away)
    );
  }

  bestScore = homeScore + awayScore;

  // Need at least one strong team match (>= 1.5) or two decent matches (>= 1.0 each)
  return bestScore >= 2.0 && homeScore >= 0.5 && awayScore >= 0.5;
}
