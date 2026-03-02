import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'dummy';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'dummy';

export const twilioClient = twilio(accountSid, authToken);

export async function createSubaccount(businessName: string) {
    return await twilioClient.api.v2010.accounts.create({
        friendlyName: businessName,
    });
}

export async function provisionPhoneNumber(subaccountSid: string, areaCode: string) {
    const localNumbers = await twilioClient.availablePhoneNumbers('US').local.list({
        areaCode: parseInt(areaCode),
        limit: 1,
    });

    if (localNumbers.length === 0) {
        throw new Error('No numbers available for this area code');
    }

    const number = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber: localNumbers[0].phoneNumber,
    });

    return number.phoneNumber;
}
