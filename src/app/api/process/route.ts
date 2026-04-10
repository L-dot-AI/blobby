import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { detectFileType, validateFileSize, validateApiKey, blobPath, generateId } from '@/lib/utils';
import { extractText } from '@/lib/extract';
import { summarizeText } from '@/lib/summarize';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('text') as string | null;
    const apiKey = request.headers.get('x-api-key') || '';
    const baseUrl = request.headers.get('x-endpoint') || 'https://api.openai.com';
    const customPrompt = formData.get('prompt') as string | null;

    // Validate API key
    const isLocal = baseUrl !== 'https://api.openai.com';
    if (!validateApiKey(apiKey, isLocal)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Key must start with sk- and be at least 20 characters.' },
        { status: 400 }
      );
    }

    const id = generateId();
    let fileType: 'pdf' | 'image' | 'audio' | 'text';
    let fileBuffer: Buffer;
    let fileName: string;

    if (pastedText && pastedText.trim()) {
      // Handle pasted text
      fileType = 'text';
      fileBuffer = Buffer.from(pastedText, 'utf-8');
      fileName = `${id}-pasted.txt`;
    } else if (file) {
      // Handle file upload
      const detected = detectFileType(file.type);
      if (!detected) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }
      if (!validateFileSize(file.size)) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB.' },
          { status: 400 }
        );
      }
      fileType = detected;
      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileName = `${id}-${file.name}`;
    } else {
      return NextResponse.json(
        { error: 'No file or text provided.' },
        { status: 400 }
      );
    }

    // Bronze: store raw file
    const bronzeBlob = await put(blobPath('bronze', fileName), fileBuffer, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Silver: extract text
    const extractedText = await extractText(fileType, fileBuffer, apiKey, baseUrl);
    const silverBlob = await put(
      blobPath('silver', `${id}-extracted.txt`),
      Buffer.from(extractedText, 'utf-8'),
      { access: 'public', addRandomSuffix: false }
    );

    // Gold: summarize
    const summary = await summarizeText(extractedText, apiKey, customPrompt || undefined, baseUrl);
    const goldBlob = await put(
      blobPath('gold', `${id}-summary.txt`),
      Buffer.from(summary, 'utf-8'),
      { access: 'public', addRandomSuffix: false }
    );

    return NextResponse.json({
      id,
      fileName,
      fileType,
      bronze: bronzeBlob.url,
      silver: silverBlob.url,
      gold: goldBlob.url,
      extractedText,
      summary,
    });
  } catch (error: any) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
