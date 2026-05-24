import { NextResponse } from 'next/server';
import { processVoiceInteraction } from '@/lib/services/voiceService.server';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('lang') || 'en-IN';
    const cid = searchParams.get('cid') || 'Anonymous';

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    appUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    
    const callbackUrl = `${appUrl}/api/voice/handle-response?lang=${language}&cid=${cid}`;
    const safeCallback = callbackUrl.replaceAll('&', '&amp;');

    const esc = (s: string) => {
      if (!s) return "";
      return s.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
              .replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','\'':'&apos;','"':'&quot;'}[c] || c));
    };

    const formData = await req.formData();
    const speechResult = formData.get('SpeechResult') as string;
    const voice = language === 'bn-IN' ? 'man' : 'alice';

    if (!speechResult || speechResult.trim().length < 2) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Gather input="speech" action="${safeCallback}" speechTimeout="auto" language="${language}" bargeIn="true" />
          <Say language="${language}" voice="${voice}">I am listening.</Say>
          <Redirect>${safeCallback}</Redirect>
        </Response>`;
      return new Response(xml, { headers: { 'Content-Type': 'text/xml' } });
    }

    const aiResponse = await processVoiceInteraction(speechResult, cid, language);
    const safeResponse = esc(aiResponse);

    const sayTag = safeResponse.trim().length > 0 
      ? `<Say language="${language}" voice="${voice}">${safeResponse}</Say>`
      : "";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Gather input="speech" action="${safeCallback}" speechTimeout="auto" language="${language}" bargeIn="true">
          ${sayTag}
        </Gather>
        <Redirect>${safeCallback}</Redirect>
      </Response>`;

    return new Response(xml, { headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Please try again.</Say></Response>`, { headers: { 'Content-Type': 'text/xml' } });
  }
}
