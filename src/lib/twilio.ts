import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACdummy';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'dummy';

export const twilioClient = twilio(accountSid, authToken);

export async function createSubaccount(businessName: string) {
    return await twilioClient.api.v2010.accounts.create({
        friendlyName: businessName,
    });
}

export async function provisionPhoneNumber(subaccountSid: string) {
    // Search for available Australian (AU) Mobile Numbers (04xx)
    const availableNumbers = await twilioClient.availablePhoneNumbers('AU').mobile.list({
        limit: 1,
    });

    if (availableNumbers.length === 0) {
        throw new Error('No mobile numbers available');
    }

    // Australian numbers require an Address Sid (A Twilio Address matching the business location)
    const addressSid = process.env.TWILIO_ADDRESS_SID;
    if (!addressSid) {
        throw new Error("TWILIO_ADDRESS_SID environment variable is missing. It is required for AU numbers.");
    }

    const number = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber: availableNumbers[0].phoneNumber,
        addressSid: addressSid,
    });

    return number.phoneNumber;
}
