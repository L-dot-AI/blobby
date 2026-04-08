import { list, put } from '@vercel/blob';

async function main() {
  console.log('🔄 Starting ETL reprocessing...\n');

  // List all bronze files
  const bronzeFiles = await list({ prefix: 'bronze/' });
  console.log(`Found ${bronzeFiles.blobs.length} bronze file(s)\n`);

  // List existing silver and gold files
  const silverFiles = await list({ prefix: 'silver/' });
  const goldFiles = await list({ prefix: 'gold/' });

  const silverIds = new Set(silverFiles.blobs.map(b => extractId(b.pathname)));
  const goldIds = new Set(goldFiles.blobs.map(b => extractId(b.pathname)));

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
      // Fetch the raw file
      const response = await fetch(blob.url);
      const buffer = Buffer.from(await response.arrayBuffer());

      // For the GitHub Actions ETL, we only handle text files
      // (Image/audio require the OpenAI key which is optional)
      const isText = blob.pathname.endsWith('.txt');
      const isPdf = blob.pathname.endsWith('.pdf');

      let extractedText = '';

      if (isText) {
        extractedText = buffer.toString('utf-8');
      } else if (isPdf) {
        const pdfParse = (await import('pdf-parse')).default;
        const result = await pdfParse(buffer);
        extractedText = result.text;
      } else if (process.env.OPENAI_API_KEY) {
        console.log(`  ⚠️  Skipping non-text file (requires OpenAI API for extraction)`);
        continue;
      } else {
        console.log(`  ⚠️  Skipping — no OpenAI key for media extraction`);
        continue;
      }

      // Store silver
      if (!silverIds.has(id)) {
        await put(`silver/${id}-extracted.txt`, Buffer.from(extractedText), {
          access: 'public',
          addRandomSuffix: false,
        });
        console.log(`  ✅ Silver created`);
      }

      // Summarize and store gold
      if (!goldIds.has(id) && process.env.OPENAI_API_KEY) {
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Summarize concisely. Highlight key points.' },
              { role: 'user', content: extractedText },
            ],
            max_tokens: 1024,
          }),
        });

        const summaryData = await summaryResponse.json();
        const summary = summaryData.choices[0].message.content;

        await put(`gold/${id}-summary.txt`, Buffer.from(summary), {
          access: 'public',
          addRandomSuffix: false,
        });
        console.log(`  ✅ Gold created`);
      }

      processed++;
    } catch (err) {
      console.error(`  ❌ Error processing ${blob.pathname}:`, err.message);
    }
  }

  console.log(`\n✅ Done. Processed: ${processed}, Skipped: ${skipped}`);
}

function extractId(pathname) {
  // Extract the ID portion from paths like "bronze/1234-abc-file.pdf"
  const filename = pathname.split('/').pop() || '';
  const match = filename.match(/^(\d+-[a-z0-9]+)/);
  return match ? match[1] : filename;
}

main().catch(console.error);
