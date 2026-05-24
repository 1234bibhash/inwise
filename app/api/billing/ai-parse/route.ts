import { NextResponse } from 'next/server'

interface ExtractedInvoiceData {
  product: string | null
  customer: string | null
  payment_mode: 'cash' | 'upi' | 'card' | 'emi' | 'finance' | null
  service_requirement: string | null
  installation_required: boolean
  delivery_required: boolean
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const lowercasePrompt = prompt.toLowerCase()
    const apiKey = process.env.GROQ_API_KEY || process.env.MISTRAL_API_KEY
    
    // Attempt LLM parsing first if keys are configured
    if (apiKey) {
      const providerUrl = process.env.GROQ_API_KEY 
        ? 'https://api.groq.com/openai/v1/chat/completions' 
        : 'https://api.mistral.ai/v1/chat/completions'
      const model = process.env.GROQ_API_KEY ? 'llama3-70b-8192' : 'mistral-tiny'

      const systemPrompt = `
You are the InWise AI Billing Assistant.
Extract billing metadata from user's natural language statements.
Respond ONLY with a valid, parsable JSON object, and no markdown formatting or backticks.

JSON format:
{
  "product": "Samsung 55 inch TV" (detected brand, appliance, size/specs),
  "customer": "Bibhash" (detected client name),
  "payment_mode": "cash" | "upi" | "card" | "emi" | "finance" | null (payment mode),
  "service_requirement": "AC Installation" | "TV Mounting" | null (service or installation category),
  "installation_required": true | false,
  "delivery_required": true | false
}
`
      try {
        const response = await fetch(providerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 150,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          let content = data.choices[0].message.content.trim()
          // Clean possible markdown code fences
          if (content.startsWith('```')) {
            content = content.replace(/^```json\s*/, '').replace(/```$/, '').trim()
          }
          const parsed = JSON.parse(content) as ExtractedInvoiceData
          return NextResponse.json(parsed)
        }
      } catch (err) {
        console.warn('LLM parsing failed, utilizing local regex parser fallback', err)
      }
    }

    // Local Regex / Keyword Extractor Fallback
    const localResult: ExtractedInvoiceData = {
      product: null,
      customer: null,
      payment_mode: null,
      service_requirement: null,
      installation_required: false,
      delivery_required: false
    }

    // Extract Product (Brand + Appliance lookup)
    const brands = ['samsung', 'lg', 'voltas', 'haier', 'whirlpool', 'sony', 'panasonic']
    const appliances = ['tv', 'television', 'fridge', 'refrigerator', 'ac', 'air conditioner', 'washing machine']
    
    let matchedBrand = brands.find(b => lowercasePrompt.includes(b)) || ''
    let matchedAppliance = appliances.find(a => lowercasePrompt.includes(a)) || ''
    
    // Capitalize matched terms
    matchedBrand = matchedBrand ? matchedBrand.charAt(0).toUpperCase() + matchedBrand.slice(1) : ''
    matchedAppliance = matchedAppliance ? matchedAppliance.charAt(0).toUpperCase() + matchedAppliance.slice(1) : ''

    if (matchedBrand || matchedAppliance) {
      // Find other descriptors like size e.g. "55 inch", "1.5 ton"
      const sizeMatch = prompt.match(/\b\d+(\.\d+)?\s*(inch|ton|liter|l|tonnes)\b/i)
      const sizeStr = sizeMatch ? sizeMatch[0] : ''
      localResult.product = `${matchedBrand} ${sizeStr} ${matchedAppliance}`.replace(/\s+/g, ' ').trim()
    }

    // Extract Customer (Look for "for [Name]")
    const forMatch = prompt.match(/for\s+([A-Za-z]+)/i)
    if (forMatch && forMatch[1]) {
      localResult.customer = forMatch[1].charAt(0).toUpperCase() + forMatch[1].slice(1)
    }

    // Extract Payment Mode
    if (lowercasePrompt.includes('cash')) localResult.payment_mode = 'cash'
    else if (lowercasePrompt.includes('upi')) localResult.payment_mode = 'upi'
    else if (lowercasePrompt.includes('card')) localResult.payment_mode = 'card'
    else if (lowercasePrompt.includes('emi')) localResult.payment_mode = 'emi'
    else if (lowercasePrompt.includes('finance') || lowercasePrompt.includes('bajaj') || lowercasePrompt.includes('hdfc')) {
      localResult.payment_mode = 'finance'
    }

    // Extract Service Toggles
    if (lowercasePrompt.includes('installation') || lowercasePrompt.includes('install') || lowercasePrompt.includes('mounting') || lowercasePrompt.includes('mount')) {
      localResult.installation_required = true
      if (lowercasePrompt.includes('ac')) {
        localResult.service_requirement = 'AC Installation'
      } else if (lowercasePrompt.includes('tv')) {
        localResult.service_requirement = 'TV Mounting'
      } else {
        localResult.service_requirement = 'Standard Setup'
      }
    }
    
    if (lowercasePrompt.includes('delivery') || lowercasePrompt.includes('deliver') || lowercasePrompt.includes('tomorrow')) {
      localResult.delivery_required = true
    }

    return NextResponse.json(localResult)
  } catch (error) {
    console.error('AI Billing Parse error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
