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
    // We fall back to the provided Address SID for Cairns Sharehouse if the env var isn't loaded
    const addressSid = process.env.TWILIO_ADDRESS_SID || 'ADbfb1c3d93e10935ea7b44d8f0f478c57';

    // Australian Mobile Numbers also require a Regulatory Bundle SID
    const bundleSid = process.env.TWILIO_BUNDLE_SID || 'BUbcfa74bfd77c8581383c68efea2566e6';

    const number = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber: availableNumbers[0].phoneNumber,
        addressSid: addressSid,
        bundleSid: bundleSid,
    });

    return number.phoneNumber;
}
