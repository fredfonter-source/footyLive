import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import logger from '@/lib/logger';

const SECRET_KEY = process.env.STREAM_SECRET || 'my-super-secret-key-786769-w01verine';
const VPS_PROXY = process.env.VPS_PROXY_URL || 'https://cdn.dhammatayartaw.com';
const PROXY_SECRET_TOKEN = process.env.PROXY_SECRET_TOKEN || 'my_super_secret_token_123';

// ✅ Complete list of all your providers and their referers
const PROVIDER_CONFIG = {
  'streamed.pk': {
    referer: 'https://streamed.pk/',
    domains: ['streamed.pk', 'embed.streamed.pk']
  },
  'watchfooty': {
    referer: 'https://watchfooty.st/',
    domains: ['watchfooty.st', 'embed.watchfooty.st']
  },
  'cdnlive': {
    referer: 'https://cdnlive.xyz/',
    domains: ['cdnlive.xyz', 'embed.cdnlive.xyz']
  },
  // Add more providers as needed
};

function getProviderConfig(url: string): { referer: string; name: string } {
  for (const [name, config] of Object.entries(PROVIDER_CONFIG)) {
    if (config.domains.some(domain => url.includes(domain))) {
      return { referer: config.referer, name };
    }
  }
  // Default fallback
  return { referer: 'https://streamed.pk/', name: 'unknown' };
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

    // ✅ Get the correct referer for this specific provider
    const providerConfig = getProviderConfig(decoded);
    
    const proxyUrl = `${VPS_PROXY}/proxy?url=${encodeURIComponent(decoded)}&referer=${encodeURIComponent(providerConfig.referer)}&token=${PROXY_SECRET_TOKEN}`;

    logger.info('Generated proxy URL', {
      provider: providerConfig.name,
      referer: providerConfig.referer,
      original: decoded.substring(0, 50) + '...'
    });

    return NextResponse.json({ 
      success: true,
      url: proxyUrl,
      originalUrl: decoded,
      provider: providerConfig.name
    });

  } catch (err: any) {
    logger.error('Failed decoding redirect URL', err, { u });
    return NextResponse.json({ error: 'Invalid encoding' }, { status: 400 });
  }
}
