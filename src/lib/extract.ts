import { SupportedFileType } from './utils';

export async function extractText(
  fileType: SupportedFileType,
  fileBuffer: Buffer,
  apiKey?: string
): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return extractFromPdf(fileBuffer);
    case 'image':
      if (!apiKey) throw new Error('API key required for image extraction');
      return extractFromImage(fileBuffer, apiKey);
    case 'audio':
      if (!apiKey) throw new Error('API key required for audio extraction');
      return extractFromAudio(fileBuffer, apiKey);
    case 'text':
      return fileBuffer.toString('utf-8');
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractFromImage(buffer: Buffer, apiKey: string): Promise<string> {
  const base64 = buffer.toString('base64');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all visible text from this image. Return only the extracted text, nothing else.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Vision API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function extractFromAudio(buffer: Buffer, apiKey: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/mp3' });
  formData.append('file', blob, 'audio.mp3');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Whisper API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}
