import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { chosen_datetime, meeting_type, caller_name, tenant_id } = body;

        // Use lib/calendar.ts here to actually insert into the user's gcal
        const google_event_id = `evt_${Date.now()}`;
        const meet_link = meeting_type === 'video' ? `https://meet.google.com/xyz-123` : null;

        // In a real flow, the call_record_id might be provided by the Bland webhook payload
        const booking = await prisma.booking.create({
            data: {
                tenant_id,
                call_record_id: 'pending-until-webhook', // This would link to the call record
                google_event_id,
                meet_link,
                meeting_type,
                start_time: new Date(chosen_datetime)
            }
        });

        return NextResponse.json({ success: true, booking });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
