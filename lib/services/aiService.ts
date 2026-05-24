/**
 * Hooghly AI Brain (Hybrid Failover)
 * Senior Dev Implementation: Local Knowledge + Cloud Power
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 1. LOCAL KNOWLEDGE BASE (Works even if API fails)
const LOCAL_KNOWLEDGE: Record<string, string> = {
  "warranty": "Hooghly Electronics provides a 2-year comprehensive warranty on all primary home appliances.",
  "hooghly electronics": "We are the leading home appliance retailer in West Bengal, providing sales and expert service for ACs, washing machines, and more.",
  "book service": "I can help with that. Please tell me your product name and the issue you are facing.",
  "hello": "Hello! Welcome to Hooghly Electronics. How can I help you today?",
  "namaste": "Namaste! Hooghly Electronics mein aapka swagat hai. Main aapki kya madad kar sakta hoon?"
};

export const CORE_VOICE_PROMPT = `
You are the Hooghly Electronics AI Operations Voice. 
STRICT: Keep responses to 1-2 sentences. Support Hinglish/Bengali mix.
`;

export async function chatWithAI(messages: AIMessage[]) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";

  // 2. FAST-PATH: Instant Local Match (Zero Latency)
  for (const [key, value] of Object.entries(LOCAL_KNOWLEDGE)) {
    if (lastMessage.includes(key)) {
      console.log(`[AI] Local Match Found for: ${key}`);
      return value;
    }
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.MISTRAL_API_KEY; 
  const providerUrl = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.mistral.ai/v1/chat/completions';
  const model = process.env.GROQ_API_KEY ? 'llama3-70b-8192' : 'mistral-tiny';

  // 3. OFFLINE MODE: If no keys, use local brain only
  if (!apiKey) {
    return "Hooghly Electronics. How can I help you with your appliance today?";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: CORE_VOICE_PROMPT }, ...messages],
        temperature: 0.1,
        max_tokens: 80,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("API Down");

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Filter leaks
    if (content.toLowerCase().includes("hey") || content.toLowerCase().includes("bibhash")) {
       return "Hooghly Electronics. How can I help you today?";
    }

    return content;

  } catch (error: any) {
    clearTimeout(timeoutId);
    // 4. FINAL FALLBACK: Never let the call crash
    return "Hooghly Electronics. Please tell me your requirement, I am here to help.";
  }
}
