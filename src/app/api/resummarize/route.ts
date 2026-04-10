import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { validateApiKey, blobPath, generateId } from '@/lib/utils';
import { summarizeText } from '@/lib/summarize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extractedText, prompt } = body;
    const apiKey = request.headers.get('x-api-key') || '';
    const baseUrl = request.headers.get('x-endpoint') || 'https://api.openai.com';

    const isLocal = baseUrl !== 'https://api.openai.com';
    if (!validateApiKey(apiKey, isLocal)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key.' },
        { status: 400 }
      );
    }

    if (!extractedText || !extractedText.trim()) {
      return NextResponse.json(
        { error: 'No extracted text provided.' },
        { status: 400 }
      );
    }

    const id = generateId();
    const summary = await summarizeText(extractedText, apiKey, prompt || undefined, baseUrl);

    const goldBlob = await put(
      blobPath('gold', `${id}-resummarized.txt`),
      Buffer.from(summary, 'utf-8'),
      { access: 'public', addRandomSuffix: false }
    );

    return NextResponse.json({ summary, gold: goldBlob.url });
  } catch (error: any) {
    console.error('Re-summarize error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
