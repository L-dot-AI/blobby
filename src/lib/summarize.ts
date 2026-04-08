import { buildSummaryPrompt } from './utils';

export async function summarizeText(
  text: string,
  apiKey: string,
  customPrompt?: string
): Promise<string> {
  const prompt = buildSummaryPrompt(text, customPrompt);

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
          role: 'system',
          content: 'You are a helpful assistant that summarizes content clearly and concisely.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Summarization error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
