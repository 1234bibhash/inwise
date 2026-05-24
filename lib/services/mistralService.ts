/**
 * Hooghly AI Mistral Service
 * Senior Dev Overhaul: Deterministic Voice Responses & Leak Protection
 */

export interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const EXPERT_AGENT_PROMPT = `
You are a voice assistant for Hooghly Electronics.

STRICT RULES:
- Answer the user's question directly.
- NEVER give generic replies like "How can I help you?".
- NEVER say internal thoughts like "train करना पड़ेगा" or mention "AI", "model", or "training".
- NEVER stay silent.
- Keep answers short (1–2 sentences max).

COMPANY INFO:
Hooghly Electronics is a home appliance store in West Bengal. We sell products like washing machines, ACs, and refrigerators, and provide expert service support.

BEHAVIOR:
- If user asks "What is Hooghly Electronics?" -> explain clearly.
- If unclear -> ask a short clarifying question.
- Respond in the same language as the user (Hindi/English/Bengali mix).

IMPORTANT:
Speed is critical. Respond instantly. No filler words.
`;

export async function chatWithMistral(messages: MistralMessage[], model = 'mistral-tiny') {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY is not set');

  const lastMessage = messages[messages.length - 1]?.content?.trim() || "";

  // 1. DETERMINISTIC FAST-PATH: Instant response for core questions
  if (lastMessage.toLowerCase().includes("hooghly electronics")) {
    return "Hooghly Electronics is a premier home appliance store in West Bengal. We sell and service washing machines, ACs, and more.";
  }

  // 2. INPUT FALLBACK: Short-circuit silence
  if (lastMessage.length < 2) {
    return "I'm sorry, I didn't hear you. Could you repeat that?";
  }

  // 3. HARD LATENCY CONTROL: 2.5s Abort
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2, // Cold and fast
        max_tokens: 80,   // Ultra-concise
      }),
    });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Mistral API Error: ${response.statusText}`);

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // 4. SAFETY FILTER: Stop internal leaks
    if (aiResponse.includes("train") || aiResponse.includes("AI") || aiResponse.includes("model")) {
      return "Hooghly Electronics is your home appliance partner. How can I help with your purchase or service?";
    }

    return aiResponse;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return "One moment, I am checking my records.";
    }
    return "I am here, please tell me more.";
  }
}
