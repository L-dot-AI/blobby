import { buildSummaryPrompt } from './utils';
export async function summarizeText(
  text: string,
  apiKey: string,
  customPrompt?: string,
  baseUrl: string = 'https://api.openai.com'
): Promise<string> {
  const prompt = buildSummaryPrompt(text, customPrompt);
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
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
          content: `You are a summarization assistant. Read the provided content and return the following:\n\n**Summary**\nA clear, concise summary of the main content in 3-5 sentences.\n\n**Key Points**\n3-5 bullet points of the most important information.\n\n**Interesting Finds**\nAny additional information from the content worth noting — tools, resources, tips, tangents, or ideas mentioned that could be useful, even if they aren't the main topic. If nothing stands out, leave this section empty.\n\n**Limitations**\nIf the content is unclear, low quality, or ambiguous, say so here instead of guessing. Do not fabricate information.`,
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