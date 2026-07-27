import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, text } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key is missing in .env.local' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a grocery receipt and food parser. Extract all edible grocery items from this receipt image or text list.
    Rules:
    1. Exclude non-food items (soap, tax, paper towels, totals).
    2. Estimate a realistic shelf life in days (1 to 14 days).
    3. Output strictly valid JSON array without any markdown wrappers or text before/after.

    Format:
    [{"name": "Item Name", "shelfLifeDays": 5, "category": "Grocery"}]`;

    let responseText = '';

    if (image) {
      // Extract clean Base64 data and mime type
      const mimeType = image.match(/data:(.*?);base64,/)?.[1] || 'image/jpeg';
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ]);
      responseText = result.response.text();
    } else if (text) {
      const result = await model.generateContent([prompt, `Input text: ${text}`]);
      responseText = result.response.text();
    }

    // Sanitize JSON response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const items = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ items });
    }

    return NextResponse.json({ error: 'Could not extract items from image' }, { status: 400 });
  } catch (error: any) {
    console.error('Analyze Error:', error);
    return NextResponse.json({ error: error.message || 'Server error processing receipt' }, { status: 500 });
  }
}