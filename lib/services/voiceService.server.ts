/**
 * Hooghly AI Voice Service (Server-Only)
 * Senior Dev Refinement: Professional & Dynamic Identity
 */

import { chatWithAI, CORE_VOICE_PROMPT } from './aiService';
import { createServiceCall } from './serviceCallService';
import { createClient } from '@/lib/supabase/server';

export async function processVoiceInteraction(transcription: string, customerId: string = 'Anonymous', language: string = 'en-IN') {
  if (!transcription || transcription.trim().length < 2) {
    return "Hooghly Electronics. I am listening.";
  }

  return Promise.race([
    (async () => {
      try {
        const supabase = await createClient();
        
        // Fetch context without hardcoding informal names
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, created_at')
          .eq('customer_id', customerId)
          .limit(1);

        const purchaseHistory = invoices && invoices.length > 0 
          ? `Last Purchase: ${invoices[0].total_amount} INR on ${invoices[0].created_at}`
          : "No previous purchase history.";

        const dynamicContext = `
          ${CORE_VOICE_PROMPT}
          LIVE DATA: ${purchaseHistory}
        `;

        const response = await chatWithAI([
          { role: 'system', content: dynamicContext },
          { role: 'user', content: transcription }
        ]);
        
        // Clean Action Tags
        if (response.includes('ACTION')) {
          createServiceCall(customerId, 'repair', 'product', undefined, 'AI Voice Request').catch(() => {});
          return response.replace(/\[ACTION:.*\]/, '').trim();
        }
        
        return response;

      } catch (error) {
        return "Hooghly Electronics. How can I help you today?";
      }
    })(),
    new Promise<string>((resolve) => 
      setTimeout(() => resolve("One moment while I access your records."), 2500)
    )
  ]);
}
