import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

// Encode credentials for Basic Auth
const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

async function sendSms(toPhoneNumber, message) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', TWILIO_PHONE_NUMBER);
  formData.append('To', toPhoneNumber);
  formData.append('Body', message);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twilio error: ${error.message}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number, message } = await req.json();

    if (!phone_number || !message) {
      return Response.json({ error: 'Missing phone number or message' }, { status: 400 });
    }

    // Validate phone number format (E.164)
    if (!/^\+[1-9]\d{1,14}$/.test(phone_number)) {
      return Response.json({ error: 'Invalid phone number format. Use E.164 format (e.g., +12025551234)' }, { status: 400 });
    }

    const result = await sendSms(phone_number, message);

    return Response.json({
      success: true,
      messageSid: result.sid,
      message: 'SMS sent successfully'
    });
  } catch (error) {
    console.error('SMS sending failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});