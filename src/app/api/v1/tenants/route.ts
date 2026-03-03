import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { stripe } from '../../../../lib/stripe';
import { createSubaccount, provisionPhoneNumber } from '../../../../lib/twilio';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { business_name, admin_email, area_code } = body;

        if (!business_name || !admin_email || !area_code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Stripe Customer (Stubbed out for now)
        // const stripeCustomer = await stripe.customers.create({
        //     email: admin_email,
        //     name: business_name,
        // });
        const dummyStripeCustomerId = `cus_dummy_${Date.now()}`;

        // 2. Provision Twilio Subaccount & Number
        const twilioSub = await createSubaccount(business_name);
        const phoneNumber = await provisionPhoneNumber(twilioSub.sid, area_code);

        // 3. Save to Database
        const tenant = await prisma.tenant.create({
            data: {
                business_name,
                admin_email,
                stripe_customer_id: dummyStripeCustomerId,
                twilio_sub_sid: twilioSub.sid,
                twilio_phone_number: phoneNumber,
            },
        });

        return NextResponse.json({ tenant }, { status: 201 });
    } catch (error: any) {
        console.error('Onboarding Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
