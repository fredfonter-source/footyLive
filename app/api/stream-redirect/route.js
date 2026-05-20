import { NextResponse } from 'next/server';

export async function GET(request) {
  const u = request.nextUrl.searchParams.get('u');
  if (!u) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const decoded = Buffer.from(u, 'base64').toString('utf-8');
    if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }
    return NextResponse.redirect(decoded, 302);
  } catch {
    return NextResponse.json({ error: 'Invalid encoding' }, { status: 400 });
  }
}
