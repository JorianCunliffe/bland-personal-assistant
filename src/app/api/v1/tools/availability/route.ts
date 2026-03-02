import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Extract dynamic data from Bland caller to identify tenant and fetch real availability via Google Calendar API
    // Returning mock slots as a placeholder to meet the sub-second requirements out-of-the-box
    return NextResponse.json({
        available_slots: [
            { start_time: new Date(Date.now() + 86400000 * 1).toISOString() }, // tomorrow
            { start_time: new Date(Date.now() + 86400000 * 2).toISOString() }  // day after
        ]
    });
}
