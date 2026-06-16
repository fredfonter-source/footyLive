import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import logger from '@/lib/logger';

const SECRET_KEY = process.env.STREAM_SECRET || 'my-super-secret-key-786769-w01verine';

// VPS Proxy Configuration
const VPS_PROXY = process.env.VPS_PROXY_URL || 'https://cdn.dhammatayartaw.com'; // Change this!
const PROXY_SECRET_TOKEN = process.env.PROXY_SECRET_TOKEN || 'my_super_secret_token_123'; // Must match server.js

// Map providers to their referer URLs
const REFERER_MAP: Record<string, string> = {
  'streamed.pk': 'https://streamed.pk/',
  'watchfooty': 'https://watchfooty.st/',
  'cdnlive': 'https://cdnlive.xyz/',
  'default': 'https://streamed.pk/'
};

function detectProvider(url: string): string {
  for (const [key, referer] of Object.entries(REFERER_MAP)) {
    if (url.includes(key)) {
      return referer;
    }
  }
  return REFERER_MAP['default'];
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const u = searchParams.get('u');
  const expires = searchParams.get('expires');
  const sig = searchParams.get('sig');

  if (!u || !expires || !sig) {
    logger.warn('Unauthorized access attempt: Missing credentials', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      url: request.url
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const expiresTimestamp = parseInt(expires, 10);
  if (isNaN(expiresTimestamp) || expiresTimestamp < Date.now()) {
    logger.warn('Forbidden access attempt: Stream link expired', {
      u,
      expires,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    return NextResponse.json({ error: 'Stream link has expired' }, { status: 403 });
  }

  const expectedSig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${u}:${expires}`)
    .digest('hex');

  if (sig !== expectedSig) {
    logger.warn('Forbidden access attempt: Signature mismatch', {
      u,
      expires,
      sig,
      expectedSig,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  try {
    const decoded = Buffer.from(u, 'base64url').toString('utf-8');
    if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
      logger.warn('Invalid redirect URL decoded', { decoded });
      return NextResponse.json({ error: 'Invalid URL scheme' }, { status: 400 });
    }

    // ✅ NEW: Instead of redirecting, return the VPS proxy URL
    const referer = detectProvider(decoded);
    
    const proxyUrl = `${VPS_PROXY}/proxy?url=${encodeURIComponent(decoded)}&referer=${encodeURIComponent(referer)}&token=${PROXY_SECRET_TOKEN}`;

    logger.info('Generated proxy URL', {
      original: decoded.substring(0, 50) + '...',
      proxy: proxyUrl.substring(0, 50) + '...',
      provider: referer
    });

    return NextResponse.json({ 
      success: true,
      url: proxyUrl,  // This is the proxied URL for external players
      originalUrl: decoded // Keep this for web player fallback if needed
    });

  } catch (err: any) {
    logger.error('Failed decoding redirect URL', err, { u });
    return NextResponse.json({ error: 'Invalid encoding' }, { status: 400 });
  }
}
