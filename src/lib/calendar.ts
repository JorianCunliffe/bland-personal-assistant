import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize the Google OAuth2 client
export function getGoogleAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`
    );
}

// Get an authenticated Google Calendar client for a specific tenant
export async function getCalendarClient(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
        where: { tenant_id: tenantId },
        select: { google_refresh_token: true }
    });

    if (!tenant || !tenant.google_refresh_token) {
        throw new Error('Tenant calendar not connected');
    }

    const oauth2Client = getGoogleAuthClient();
    oauth2Client.setCredentials({
        refresh_token: tenant.google_refresh_token
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Fetch availability (free/busy)
export async function getAvailability(tenantId: string, timeMin: string, timeMax: string) {
    const tenant = await prisma.tenant.findUnique({
        where: { tenant_id: tenantId },
        select: { google_calendar_id: true, timezone: true }
    });

    if (!tenant || !tenant.google_calendar_id) {
        throw new Error('Tenant calendar not configured');
    }

    const calendar = await getCalendarClient(tenantId);
    const calendarId = tenant.google_calendar_id;

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: new Date(timeMin).toISOString(),
            timeMax: new Date(timeMax).toISOString(),
            timeZone: tenant.timezone || 'UTC',
            items: [{ id: calendarId }]
        }
    });

    const busySlots = response.data.calendars?.[calendarId]?.busy || [];

    // Return the busy slots. The AI (or calling logic) will need to invert this 
    // to find free slots during business hours.
    return busySlots;
}

// Create an event on the calendar
export async function createEvent(
    tenantId: string,
    startTime: Date,
    endTime: Date,
    callerName: string,
    meetingType: 'video' | 'office'
) {
    const tenant = await prisma.tenant.findUnique({
        where: { tenant_id: tenantId },
        select: { google_calendar_id: true, timezone: true }
    });

    if (!tenant || !tenant.google_calendar_id) {
        throw new Error('Tenant calendar not configured');
    }

    const calendar = await getCalendarClient(tenantId);

    const event: any = {
        summary: `Meeting with ${callerName} (via Voice AI)`,
        description: `Automated booking scheduled by Bland AI receptionist.`,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: tenant.timezone || 'UTC',
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: tenant.timezone || 'UTC',
        },
    };

    let conferenceDataVersion = 0;

    if (meetingType === 'video') {
        event.conferenceData = {
            createRequest: {
                requestId: `bland_${Date.now()}`,
                conferenceSolutionKey: {
                    type: 'hangoutsMeet'
                }
            }
        };
        conferenceDataVersion = 1;
    }

    const response = await calendar.events.insert({
        calendarId: tenant.google_calendar_id,
        conferenceDataVersion,
        requestBody: event,
    });

    return {
        eventId: response.data.id,
        meetLink: response.data.hangoutLink || null,
    };
}
