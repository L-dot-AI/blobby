import { list, put } from '@vercel/blob';

async function main() {
  console.log('🔄 Starting ETL reprocessing...\n');

  const bronzeFiles = await list({ prefix: 'bronze/' });
  console.log(`Found ${bronzeFiles.blobs.length} bronze file(s)\n`);

  const silverFiles = await list({ prefix: 'silver/' });
  const goldFiles = await list({ prefix: 'gold/' });

  const silverIds = new Set(silverFiles.blobs.map((b) => extractId(b.pathname)));
  const goldIds = new Set(goldFiles.blobs.map((b) => extractId(b.pathname)));

  let processed = 0;
  let skipped = 0;

  for (const blob of bronzeFiles.blobs) {
    const id = extractId(blob.pathname);

    if (silverIds.has(id) && goldIds.has(id)) {
      console.log(`⏭️  Skipping ${blob.pathname} — already processed`);
      skipped++;
      continue;
    }

    console.log(`📄 Processing ${blob.pathname}...`);

    try {
      const response = await fetch(blob.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch bronze blob: ${response.status} ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());

      const kind = detectKindFromPathname(blob.pathname);
      const extractedText = await extractForKind(kind, buffer);

      if (!silverIds.has(id)) {
        await put(`silver/${id}-extracted.txt`, Buffer.from(extractedText, 'utf-8'), {
          access: 'public',
          addRandomSuffix: false,
        });
        console.log(`  ✅ Silver created`);
      }

      if (!goldIds.has(id) && process.env.OPENAI_API_KEY) {
        const summary = await summarize(extractedText, process.env.OPENAI_API_KEY);
        await put(`gold/${id}-summary.txt`, Buffer.from(summary, 'utf-8'), {
          access: 'public',
          addRandomSuffix: false,
        });
        console.log(`  ✅ Gold created`);
      }

      processed++;
    } catch (err) {
      console.error(`  ❌ Error processing ${blob.pathname}:`, err?.message || err);
    }
  }

  console.log(`\n✅ Done. Processed: ${processed}, Skipped: ${skipped}`);
}

function detectKindFromPathname(pathname) {
  const lower = pathname.toLowerCase();
  if (lower.endsWith('.txt')) return 'text';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp'))
    return 'image';
  if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a')) return 'audio';
  return 'unknown';
}

async function extractForKind(kind, buffer) {
  if (kind === 'text') return buffer.toString('utf-8');

  if (kind === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY for media extraction');
  }

  if (kind === 'image') return extractFromImage(buffer, process.env.OPENAI_API_KEY);
  if (kind === 'audio') return extractFromAudio(buffer, process.env.OPENAI_API_KEY);

  throw new Error(`Unsupported blob type for extraction: ${kind}`);
}

async function extractFromImage(buffer, apiKey) {
  const base64 = buffer.toString('base64');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(`OpenAI vision extraction error: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function extractFromAudio(buffer, apiKey) {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/mpeg' });
  formData.append('file', blob, 'audio.mp3');
  formData.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(`OpenAI whisper extraction error: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.text;
}

async function summarize(text, apiKey) {
  const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Summarize concisely. Highlight key points.' },
        { role: 'user', content: text },
      ],
      max_tokens: 1024,
    }),
  });

  if (!summaryResponse.ok) {
    const err = await safeJson(summaryResponse);
    throw new Error(`OpenAI summarization error: ${err?.error?.message || summaryResponse.statusText}`);
  }

  const summaryData = await summaryResponse.json();
  return summaryData.choices[0].message.content;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractId(pathname) {
  const filename = pathname.split('/').pop() || '';
  const match = filename.match(/^(\d+-[a-z0-9]+)/);
  return match ? match[1] : filename;
}

main().catch(console.error);

