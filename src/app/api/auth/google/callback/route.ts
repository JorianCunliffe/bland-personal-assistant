import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateString = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        console.error('OAuth Error:', error);
        return NextResponse.redirect(new URL('/?error=oauth_declined', request.url));
    }

    if (!code || !stateString) {
        return NextResponse.json({ error: 'Missing code or state parameters' }, { status: 400 });
    }

    let state;
    try {
        state = JSON.parse(decodeURIComponent(stateString));
    } catch (e) {
        return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const tenantId = state.tenantId;
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    try {
        // Exchange the authorization code for an access token and refresh token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Failed to exchange token:', tokenData);
            return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
        }

        const { refresh_token } = tokenData;

        // A refresh token is only guaranteed on the first authorization (if prompt=consent was used).
        if (!refresh_token) {
            console.warn(`No refresh token received for tenant ${tenantId}. They may have already authorized the app. Revoke access and try again.`);
            // We could optionally still use the ID to figure out *which* calendar, but we need the refresh token.
            return NextResponse.redirect(new URL('/?error=no_refresh_token', request.url));
        }

        // Now, let's figure out their primary calendar ID (usually their email)
        // We can use the access_token to call the Calendar API to list their calendars
        const calendarListResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const calendarListData = await calendarListResponse.json();

        if (!calendarListResponse.ok) {
            console.error('Failed to fetch calendar list:', calendarListData);
            return NextResponse.json({ error: 'Failed to fetch Google Calendars' }, { status: 500 });
        }

        // Find the primary calendar
        const primaryCalendar = calendarListData.items.find((cal: any) => cal.primary === true);
        const googleCalendarId = primaryCalendar ? primaryCalendar.id : 'primary';

        // Save tokens and ID to the database
        await prisma.tenant.update({
            where: {
                tenant_id: tenantId,
            },
            data: {
                google_refresh_token: refresh_token,
                google_calendar_id: googleCalendarId,
            },
        });

        // Successfully connected, redirect back to the app (e.g. settings or dashboard)
        return NextResponse.redirect(new URL('/?success=calendar_connected', request.url));

    } catch (err) {
        console.error('Error during Google authentication callback:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
