import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { stripe } from '../../../../../lib/stripe';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const bland_call_id = body.call_id;
        const transcript = body.transcripts?.map((t: any) => `${t.user}: ${t.text}`).join('\n') || '';
        const audio_url = body.recording_url;
        const call_length_minutes = body.call_length;
        const caller_number = body.to || body.from;

        // We need tenant_id, you typically pass this in metadata to Bland
        const tenant_id = body.metadata?.tenant_id;
        if (!tenant_id) return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });

        const tenant = await prisma.tenant.findUnique({ where: { tenant_id } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        // Store the call record
        const callRecord = await prisma.callRecord.create({
            data: {
                tenant_id,
                bland_call_id,
                caller_number,
                transcript,
                audio_url,
                status: body.variables?.booked ? 'booked' : 'faq_only', // Simplification based on generic variables
            }
        });

        // Report usage to Stripe (Metered Billing)
        // 1 AI minute = 1 usage event in Stripe. Assuming you've created a meter in Stripe:
        await stripe.billing.meterEvents.create({
            event_name: 'call_minutes', // Needs to match your Stripe configuration
            payload: {
                value: call_length_minutes.toString(),
                stripe_customer_id: tenant.stripe_customer_id,
            },
        });

        return NextResponse.json({ success: true, callRecord });
    } catch (error: any) {
        console.error('Post call webhook error', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
