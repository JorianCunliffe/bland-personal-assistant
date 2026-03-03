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
    // Search for US mobile numbers instead of local numbers with a specific area code
    const mobileNumbers = await twilioClient.availablePhoneNumbers('US').mobile.list({
        limit: 1,
    });

    if (mobileNumbers.length === 0) {
        throw new Error('No mobile numbers available');
    }

    const number = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber: mobileNumbers[0].phoneNumber,
    });

    return number.phoneNumber;
}
