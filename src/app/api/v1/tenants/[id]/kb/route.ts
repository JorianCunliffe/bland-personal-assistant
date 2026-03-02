import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BLAND_API_KEY = process.env.BLAND_API_KEY || 'dummy';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { raw_text } = body;

        const tenant = await prisma.tenant.findUnique({ where: { tenant_id: id } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        let vectorId = tenant.bland_vector_id;

        if (!vectorId) {
            // Create new vector DB
            const res = await fetch('https://api.bland.ai/v1/vectors', {
                method: 'POST',
                headers: {
                    'Authorization': BLAND_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: `${tenant.business_name} KB`,
                    description: 'Company information',
                    text: raw_text
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create vector db');

            vectorId = data.vector_id;

            await prisma.tenant.update({
                where: { tenant_id: id },
                data: { bland_vector_id: vectorId }
            });
        } else {
            // Update existing vector DB
            const res = await fetch(`https://api.bland.ai/v1/vectors/${vectorId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': BLAND_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: raw_text })
            });
            if (!res.ok) throw new Error('Failed to update vector db');
        }

        return NextResponse.json({ success: true, vector_id: vectorId });
    } catch (error: any) {
        console.error('KB Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
