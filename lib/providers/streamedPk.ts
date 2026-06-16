import { Match, Channel } from '../types';
import { StreamProvider } from './types';
import { fetchWithTimeout } from './baseProvider';
import { teamsMatch } from '../utils/matching';
import { getCacheManager } from '../cache/cacheManager';
import logger from '../logger';

const STREAMED_API = 'https://streamed.pk/api/matches/football';
const STREAMED_STREAM = 'https://streamed.pk/api/stream';
const TIMEOUT_MS = 4000;
const SHORT_TIMEOUT = 2500;

interface StreamedRawMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  teams?: {
    home?: { name: string };
    away?: { name: string };
  };
  sources?: { source: string; id: string }[];
}

export class StreamedPkProvider implements StreamProvider {
  id = 'streamed';
  name = 'Streamed.pk';
  referer = 'https://streamed.pk/'; // ✅ Add referer for this provider

  private async fetchRawMatches(): Promise<StreamedRawMatch[]> {
    const cache = getCacheManager();
    return cache.swr('streamed_raw', async () => {
      try {
        const data = await fetchWithTimeout(STREAMED_API, TIMEOUT_MS);
        return Array.isArray(data) ? data : [];
      } catch (err) {
        logger.error('Streamed.pk API request failed', err);
        return [];
      }
    }, 30);
  }

  async fetchMatches(): Promise<Match[]> {
    return [];
  }

  // ✅ NEW: Extract direct .m3u8 URL from embed page
  private async extractStreamFromEmbed(embedUrl: string): Promise<string | null> {
    try {
      const response = await fetchWithTimeout(embedUrl, SHORT_TIMEOUT, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://streamed.pk/'
        }
      });

      // fetchWithTimeout might return parsed JSON or text
      const html = typeof response === 'string' ? response : JSON.stringify(response);

      // Try multiple regex patterns to find the .m3u8 URL
      const patterns = [
        /file:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
        /source:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
        /src:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
        /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
        /url:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          logger.info('Extracted .m3u8 from embed', { embedUrl, streamUrl: match[1].substring(0, 50) });
          return match[1];
        }
      }

      logger.warn('Could not extract .m3u8 from embed page', { embedUrl });
      return null;
    } catch (err) {
      logger.error('Failed to fetch embed page', err, { embedUrl });
      return null;
    }
  }

  private async resolveStreamedStream(source: string, id: string): Promise<{ url: string; quality: string }[]> {
    try {
      const url = `${STREAMED_STREAM}/${source}/${id}`;
      const data = await fetchWithTimeout(url, SHORT_TIMEOUT);
      
      if (Array.isArray(data) && data.length > 0) {
        const results = [];
        
        for (const s of data) {
          let streamUrl = s.url || '';
          
          // ✅ If we have an embedUrl, extract the real .m3u8 from it
          if (s.embedUrl && !s.url) {
            const extractedUrl = await this.extractStreamFromEmbed(s.embedUrl);
            if (extractedUrl) {
              streamUrl = extractedUrl;
            } else {
              // Fallback: return embedUrl but it won't work in external players
              streamUrl = s.embedUrl;
              logger.warn('Using embedUrl as fallback (may not work)', { embedUrl: s.embedUrl });
            }
          }
          
          if (streamUrl) {
            results.push({
              url: streamUrl,
              quality: s.hd ? 'HD' : 'SD',
            });
          }
        }
        
        return results;
      }
      
      // Handle single object response
      if (data?.url || data?.embedUrl || data?.streamUrl || data?.iframe) {
        let streamUrl = data.url || data.streamUrl || '';
        
        if (data.embedUrl && !data.url) {
          const extractedUrl = await this.extractStreamFromEmbed(data.embedUrl);
          if (extractedUrl) {
            streamUrl = extractedUrl;
          } else {
            streamUrl = data.embedUrl;
          }
        }
        
        if (streamUrl) {
          return [{
            url: streamUrl,
            quality: 'HD',
          }];
        }
      }
      
      return [];
    } catch (err) {
      logger.error('Streamed.pk stream resolution failed', err, { source, id });
      return [];
    }
  }

  async resolveStreams(
    matchTitle: string,
    homeTeam: string,
    awayTeam: string,
    matchId: string,
    preFetchedMatch?: Match | null
  ): Promise<Channel[]> {
    try {
      const matches = await this.fetchRawMatches();
      const channels: Channel[] = [];
      const streamTasks: Promise<{ urls: { url: string; quality: string }[]; source: any }>[] = [];
      
      for (const m of matches) {
        if (teamsMatch(matchTitle, m.title)) {
          const sources = m.sources || [];
          for (const src of sources) {
            streamTasks.push(
              this.resolveStreamedStream(src.source, src.id)
                .then(urls => ({ urls, source: src }))
                .catch(() => ({ urls: [], source: src }))
            );
          }
        }
      }
      
      const streamResults = await Promise.allSettled(streamTasks);
      let serverIndex = 1;
      
      for (const r of streamResults) {
        if (r.status === 'fulfilled') {
          for (const su of r.value.urls) {
            if (su.url) {
              channels.push({
                name: `Server ${serverIndex++}`,
                url: su.url,
                provider: this.id,
                quality: su.quality || 'HD',
                referer: this.referer // ✅ Pass referer to channel
              });
            }
          }
        }
      }
      
      return channels;
    } catch (err) {
      logger.error('Streamed.pk streams resolution failed', err, { matchTitle });
      return [];
    }
  }
}
