import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileBase64, fileType } = body;

    if (!fileBase64) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.warn("NVIDIA_API_KEY is not set.");
      return NextResponse.json({ error: 'NVIDIA_API_KEY is not configured. Please add it to your .env file to enable AI Bill Extraction.' }, { status: 400 });
    }

    const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    
    // Construct multimodal content array if it's an image, or just text if we assume the model handles text
    // Note: If Kimi-k2.6 does not support vision in this exact format, we might need to adjust.
    // Assuming standard OpenAI-compatible vision payload.
    const content = [
      { 
        type: "text", 
        text: `You are an expert data extraction AI. Extract the exact details from the provided sales or purchase bill.
Pay close attention to all fields including tax amounts, grand totals, agent names, dates, and invoice numbers.
Do NOT hardcode any names; fetch the actual Supplier/Vendor name from the document.

CRITICAL INSTRUCTIONS FOR TABLE EXTRACTION:
1. Tables are dense and easily misread. You MUST trace each row horizontally from left to right.
2. For EACH row in the table, you MUST first transcribe the row in your reasoning block before creating JSON.
   Example transcription format: "Row 1: 1 | AGARO OTG | 85166000 | 2 PCS | 4452.00 | 4452.00 | 3772.88 | PCS | 7545.76"
3. Identify the columns in your transcribed row. The "Base Rate" is usually the 7th or 2nd-to-last numeric column (e.g. 3772.88). DO NOT use the "Rate Incl Tax" column (e.g. 4452.00).
4. Pay STRICT attention to row alignment! Some items have a base rate of 0.01. Do NOT hallucinate values from other rows. Match the exact rate to the exact item.
5. For the product "sku", do NOT extract the HSN/SAC code (like 85166000). Look for a separate SKU or Item Code. If none exists, leave it empty.
6. If the bill shows CGST (e.g. 9%) and SGST (e.g. 9%) at the bottom, the "tax_percentage" for the items is the sum (e.g. 18).
7. VERY IMPORTANT: Product names and model numbers often span MULTIPLE LINES within the same cell. You MUST combine all lines of text for a single item into the \`name\` field. Do not stop at the first line! For example, if line 1 says 'HITACHI 1.5 TON' and line 2 says 'G318PCC2SS INDOOR', the extracted name MUST be 'HITACHI 1.5 TON G318PCC2SS INDOOR'.

First, provide a brief step-by-step reasoning (Chain-of-Thought) identifying the columns and your logic.
Then, output the final JSON wrapped in \`\`\`json ... \`\`\`.

IMPORTANT: DO NOT USE COMMAS IN NUMBERS IN THE JSON. E.g., output 7545.76 instead of 7,545.76.
IMPORTANT: DO NOT USE MATH EXPRESSIONS IN JSON. Output final evaluated numbers only. E.g. output 10983.06 instead of 5491.53 + 5491.53.

Use EXACTLY this JSON structure:
{
  "supplier_name": "string (Fetch exact supplier/vendor name)",
  "invoice_number": "string",
  "invoice_date": "string (The date written on the invoice)",
  "bill_type": "string (e.g., 'Tax Invoice', 'Retail Invoice', 'Delivery Note')",
  "agent_name": "string (If present, e.g., Agent Name: SOUVIK GHOSH)",
  "total_tax_amount": number (Total tax on the entire bill),
  "cgst_amount": number (Total CGST on the entire bill),
  "sgst_amount": number (Total SGST on the entire bill),
  "grand_total": number (Final invoice amount including tax),
  "products": [
    {
      "name": "string (Full item name exactly as printed)",
      "sku": "string (Item code, SKU, or Serial Number found near the item)",
      "description": "string (Combine any extra technical specs found)",
      "price": number (Base rate per item BEFORE TAX. MUST BE EXACT. If it is 0.01, extract 0.01.),
      "quantity": number,
      "tax_percentage": number (Total tax percentage, e.g. 18 if CGST is 9% and SGST is 9%),
      "tax_amount": number (Calculate: price * quantity * (tax_percentage/100)),
      "hsn_code": "string",
      "brand": "string (Extract the brand/manufacturer name e.g., 'LG', 'Samsung', 'Mitsubishi Heavy', 'Daikin', 'Sony', 'Godrej', etc)",
      "category": "string (Precise classification e.g., 'Home Appliances', 'Electronics')",
      "subcategory": "string (Precise type e.g., 'Refrigerators', 'Kitchen Appliances', 'Air Conditioners', 'Televisions')",
      "variant": "string (Precise variant e.g., 'Kettle', 'OTG / Oven', 'Split AC', 'Single Door')"
    }
  ]
}

OUTPUT YOUR REASONING FIRST, THEN OUTPUT THE JSON WRAPPED IN \`\`\`json \`\`\`.`
      }
    ];

    if (fileType === 'application/pdf') {
      try {
        const buffer = Buffer.from(fileBase64, 'base64');
        const text = await new Promise<string>((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          pdfParser.parseBuffer(buffer);
        });
        if (text.trim().length < 20) {
          return NextResponse.json({ error: 'This PDF appears to be a scanned image with no readable text. Please upload a screenshot or image (PNG/JPG) of the bill instead.' }, { status: 400 });
        }
        
        content.push({
          type: "text",
          text: `Here is the extracted raw text from the PDF bill:\n\n${text.substring(0, 15000)}`
        });
      } catch (err) {
        console.error("PDF Parsing Error detail:", err);
        return NextResponse.json({ error: `Failed to read the PDF document. Detail: ${err.message || err}` }, { status: 400 });
      }
    } else if (fileType.startsWith('image/')) {
      content.push({
        type: "image_url",
        // @ts-ignore
        image_url: { url: `data:${fileType};base64,${fileBase64}` }
      });
    } else {
      // If it's a PDF or CSV, for a simple prompt we might just pass the base64 or ask the user to provide an image.
      // We will add the base64 as text for now, though vision models usually prefer images.
      content.push({
        type: "text",
        text: `File attached as base64 (${fileType}): ${fileBase64.substring(0, 1000)}...` // Truncated to avoid huge text if not image
      });
    }

    const payload = {
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [{ role: "user", content: content }],
      max_tokens: 4096,
      temperature: 0.1,
      top_p: 1.0,
      stream: false
    };

    const response = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`NVIDIA API Error: ${response.status}`, errText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || '{}';
    
    // Try to parse the JSON output
    let parsedResult = {};
    try {
      let cleanJson = resultText;
      // If the AI wrapped it in markdown code blocks, extract just that part
      const markdownMatch = resultText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        cleanJson = markdownMatch[1];
      } else {
        // Fallback: match from first { to last }
        const braceMatch = resultText.match(/\{[\s\S]*\}/);
        if (braceMatch) cleanJson = braceMatch[0];
      }
      
      // Remove commas from numbers that the AI might have incorrectly included (e.g., 7,545.76 -> 7545.76)
      cleanJson = cleanJson.replace(/(\d),(\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1$2');
      
      // Fix LLM hallucinating math expressions like "5491.53 + 5491.53"
      cleanJson = cleanJson.replace(/:\s*([\d.]+)\s*\+\s*([\d.]+)/g, (match, p1, p2) => ': ' + (parseFloat(p1) + parseFloat(p2)));
      
      parsedResult = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Failed to parse JSON from AI response:", resultText);
      throw new Error("Failed to parse extraction results");
    }

    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract bill details' },
      { status: 500 }
    );
  }
}
