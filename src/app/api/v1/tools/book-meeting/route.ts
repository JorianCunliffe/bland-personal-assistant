import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createEvent } from '@/lib/calendar';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { chosen_datetime, meeting_type, caller_name, tenant_id } = body;

        if (!tenant_id || !chosen_datetime || !meeting_type || !caller_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const startTime = new Date(chosen_datetime);
        // Default to a 30 minute meeting
        const endTime = new Date(startTime.getTime() + 30 * 60000);

        // Insert into the user's gcal
        const gcalResponse = await createEvent(tenant_id, startTime, endTime, caller_name, meeting_type);

        // In a real flow, the call_record_id might be provided by the Bland webhook payload
        await prisma.booking.create({
            data: {
                tenant_id,
                call_record_id: 'pending-until-webhook', // This would link to the call record
                google_event_id: gcalResponse.eventId!,
                meet_link: gcalResponse.meetLink,
                meeting_type,
                start_time: startTime
            }
        });

        return NextResponse.json({ success: true, google_event_id: gcalResponse.eventId });
    } catch (error: any) {
        console.error('Error booking meeting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
