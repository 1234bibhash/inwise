/**
 * Hooghly AI Voice Service (Client-Safe)
 * Fixed: Removed undefined 'hints' reference
 */

import { createClient } from '@/lib/supabase/client';

export interface CallLog {
  id: string;
  type: 'inbound' | 'outbound';
  phoneNumber: string;
  customerName: string;
  status: 'completed' | 'failed' | 'in-progress' | 'triggered';
  transcription?: string;
  summary?: string;
  timestamp: string;
}

export async function triggerManualAICall(phoneNumber: string, customerName: string, contextMessage?: string, language: string = 'en-IN') {
  try {
    const supabase = createClient();
    
    const { data: customer } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('phone', phoneNumber)
      .single();

    const customerId = customer?.id || 'new-prospect';
    const displayName = customer?.full_name || customerName;

    const message = contextMessage || (language === 'hi-IN' ? `नमस्ते, हुगली इलेक्ट्रॉनिक्स से बोल रहा हूँ।` : 
                   language === 'bn-IN' ? `নমস্কার, হুগলি ইলেকট্রনিক্স থেকে বলছি।` :
                   `Hello, thank you for calling Hooghly Electronics.`);
  
    const response = await fetch('/api/voice/trigger-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phoneNumber,
        customerName: displayName,
        customerId: customerId,
        message: message,
        language: language
      })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    
    const log: CallLog = {
      id: data.callSid,
      type: 'outbound',
      phoneNumber,
      customerName: displayName,
      status: 'completed',
      timestamp: new Date().toISOString(),
      summary: 'Dynamic AI Session'
    };
    saveCallLog(log);
    return log;

  } catch (error: any) {
    console.error('Trigger failed:', error);
    throw error;
  }
}

function saveCallLog(log: CallLog) {
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem('hooghly_call_logs');
    const logs = existing ? JSON.parse(existing) : [];
    logs.unshift(log);
    localStorage.setItem('hooghly_call_logs', JSON.stringify(logs.slice(0, 50)));
  }
}

export function getCallLogs(): CallLog[] {
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem('hooghly_call_logs');
    return existing ? JSON.parse(existing) : [];
  }
  return [];
}

// Satisfy import in invoiceService.ts
export async function triggerInvoiceReminder(invoiceId: string) {
  console.log(`[Reminder] Triggering voice reminder for invoice ${invoiceId}`);
}
