import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Bland sends the `to` and `from` numbers in the payload
        // when hitting an inbound webhook
        const { to, from } = body;

        if (!to || !from) {
            return NextResponse.json({ error: "Missing 'to' or 'from' number" }, { status: 400 });
        }

        console.log(`[Webhook: bland-inbound] Call received from ${from} to ${to}`);

        // 1. Lookup the Tenant by the 'to' number (the Twilio number they called)
        // We check both twilio_phone_number and a hypothetical existing_phone_number if we stored it
        const tenant = await prisma.tenant.findFirst({
            where: {
                OR: [
                    { twilio_phone_number: to },
                    // If you ever add an 'existing_phone_number' column to schema, add it here:
                    // { existing_phone_number: to } 
                ]
            }
        });

        if (!tenant) {
            console.warn(`[Webhook: bland-inbound] No tenant found for destination number: ${to}`);
            // Return empty dynamic data to fall back to a default state, or return an error
            return NextResponse.json({
                business_name: "Unknown Business",
                caller_name: "Caller",
                bland_vector_id: null,
            });
        }

        // 2. Lookup the Caller (Contact) by the 'from' number and tenant_id
        const contact = await prisma.contact.findUnique({
            where: {
                tenant_id_phone_number: {
                    tenant_id: tenant.tenant_id,
                    phone_number: from,
                }
            }
        });

        let callerName = "there";
        let callerNotes = "";

        if (contact && contact.name) {
            callerName = contact.name;
        }

        if (contact && contact.notes) {
            callerNotes = contact.notes;
        }

        // 3. Return the dynamic data back to Bland AI
        // These variables will be injected into the Pathway nodes
        const dynamicData: Record<string, any> = {
            // --- Tenant / Business context ---
            tenant_id: tenant.tenant_id,
            business_name: tenant.business_name,
            prompt: tenant.prompt || "You are a professional AI receptionist. Be helpful, friendly, and concise.",
            bland_vector_id: tenant.bland_vector_id || null,
            working_hours: tenant.working_hours || null,
            transfer_number: tenant.transfer_number || null,
            calendar_link: tenant.calendar_link || null,
            custom_settings: tenant.custom_settings || {},

            // --- Caller context ---
            caller_name: callerName,
            caller_notes: callerNotes,
        };

        // Parse working_hours if it's a JSON string so Bland gets a proper object
        if (dynamicData.working_hours) {
            try {
                dynamicData.working_hours = JSON.parse(dynamicData.working_hours);
            } catch {
                // If it's not valid JSON, leave it as-is
            }
        }

        console.log(`[Webhook: bland-inbound] Returning dynamic data for tenant "${tenant.business_name}" and caller "${callerName}"`);

        // Bland expects us to return the variables we want to inject
        return NextResponse.json(dynamicData);

    } catch (error: any) {
        console.error("[Webhook: bland-inbound] Error processing request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
