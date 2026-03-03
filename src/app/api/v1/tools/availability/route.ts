import { NextResponse } from 'next/server';
import { getAvailability } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get('tenant_id');
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    if (!tenant_id || !timeMin || !timeMax) {
        return NextResponse.json({ error: 'tenant_id, timeMin, and timeMax are required' }, { status: 400 });
    }

    try {
        const busySlots = await getAvailability(tenant_id, timeMin, timeMax);
        return NextResponse.json({ busy_slots: busySlots });
    } catch (error: any) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
