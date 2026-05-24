import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, customerName, message, customerId } = body;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const language = body.language || 'en-IN';
    // Use 'alice' for best multi-lingual support on all account types
    const voice = language === 'bn-IN' ? 'man' : 'alice';

    const client = twilio(accountSid, authToken);

    const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });

    // Senior Dev Refined: Professional Brand Opener
    const greeting = language === 'bn-IN' 
      ? `নমস্কার, হুগলি ইলেকট্রনিক্স থেকে বলছি।` 
      : (language === 'hi-IN' 
        ? `नमस्ते, हुगली इलेक्ट्रॉनिक्स से बोल रहा हूँ।` 
        : `Hello, thank you for calling Hooghly Electronics.`);

    const safeContent = escapeXml(greeting); // Removed redundant 'message' to stop double greeting
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    appUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    
    const callbackUrl = `${appUrl}/api/voice/handle-response?lang=${language}&cid=${customerId}`;
    const hints = "washing machine, warranty, repair, service, help";
    const safeCallback = callbackUrl.replaceAll('&', '&amp;');

    // ChatGPT-Voice Style Config: Barge-In & High-Fidelity
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Pause length="1"/>
        <Gather 
          input="speech" 
          action="${safeCallback}" 
          speechTimeout="auto" 
          language="${language}"
          hints="${hints}"
          enhanced="true"
          bargeIn="true"
        >
          <Say language="${language}" voice="${voice}">
            ${safeContent}
          </Say>
        </Gather>
        <Say language="${language}" voice="${voice}">I am still here. Please go ahead.</Say>
        <Redirect>${safeCallback}</Redirect>
      </Response>
    `;

    const call = await client.calls.create({
      twiml: twiml,
      to: to,
      from: fromNumber,
    });

    console.log(`[Twilio] Call initiated: ${call.sid}`);

    return NextResponse.json({ 
      success: true, 
      callSid: call.sid,
      status: call.status 
    });
  } catch (error: any) {
    console.error('[Twilio API Error]:', error);
    const errorMessage = error.message || 'Unknown Twilio error';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      code: error.code
    }, { status: 500 });
  }
}
