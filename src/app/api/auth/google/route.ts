import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !redirectUri) {
        return NextResponse.json({ error: 'Missing OAuth configuration' }, { status: 500 });
    }

    // Scopes required for reading free/busy and writing events
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ].join(' ');

    // Pass tenantId in state so we know who to attach the token to in the callback
    const state = encodeURIComponent(JSON.stringify({ tenantId }));

    // Google OAuth 2.0 authorization URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
        scopes
    )}&access_type=offline&prompt=consent&state=${state}`;

    return NextResponse.redirect(authUrl);
}
