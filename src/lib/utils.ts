export type SupportedFileType = 'pdf' | 'image' | 'audio' | 'text';

const MIME_MAP: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/webp': 'image',
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/x-m4a': 'audio',
  'audio/mp4': 'audio',
  'text/plain': 'text',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function detectFileType(mimeType: string): SupportedFileType | null {
  return MIME_MAP[mimeType] ?? null;
}

export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

export function validateApiKey(key: string, isLocalEndpoint: boolean = false): boolean {
  if (isLocalEndpoint) return true;
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed.startsWith('sk-') && trimmed.length > 20;
}

export function buildSummaryPrompt(text: string, customPrompt?: string): string {
  const defaultPrompt =
    'Summarize the following text concisely. Highlight key points and main ideas.';
  const prompt = customPrompt?.trim() || defaultPrompt;
  return `${prompt}\n\n---\n\n${text}`;
}

export function blobPath(tier: 'bronze' | 'silver' | 'gold', filename: string): string {
  return `${tier}/${filename}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
