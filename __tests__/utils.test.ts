import { describe, it, expect } from 'vitest';
import {
  detectFileType,
  validateFileSize,
  validateApiKey,
  buildSummaryPrompt,
  blobPath,
  MAX_FILE_SIZE,
} from '../src/lib/utils';

describe('detectFileType', () => {
  it('detects PDF', () => {
    expect(detectFileType('application/pdf')).toBe('pdf');
  });

  it('detects PNG image', () => {
    expect(detectFileType('image/png')).toBe('image');
  });

  it('detects JPEG image', () => {
    expect(detectFileType('image/jpeg')).toBe('image');
  });

  it('detects MP3 audio', () => {
    expect(detectFileType('audio/mpeg')).toBe('audio');
  });

  it('detects WAV audio', () => {
    expect(detectFileType('audio/wav')).toBe('audio');
  });

  it('detects plain text', () => {
    expect(detectFileType('text/plain')).toBe('text');
  });

  it('returns null for unsupported types', () => {
    expect(detectFileType('video/mp4')).toBeNull();
    expect(detectFileType('application/zip')).toBeNull();
    expect(detectFileType('')).toBeNull();
  });
});

describe('validateFileSize', () => {
  it('accepts files under 10MB', () => {
    expect(validateFileSize(1024)).toBe(true);
    expect(validateFileSize(5 * 1024 * 1024)).toBe(true);
  });

  it('accepts files exactly at 10MB', () => {
    expect(validateFileSize(MAX_FILE_SIZE)).toBe(true);
  });

  it('rejects files over 10MB', () => {
    expect(validateFileSize(MAX_FILE_SIZE + 1)).toBe(false);
  });

  it('rejects zero-size files', () => {
    expect(validateFileSize(0)).toBe(false);
  });

  it('rejects negative sizes', () => {
    expect(validateFileSize(-100)).toBe(false);
  });
});

describe('validateApiKey', () => {
  it('accepts valid sk- keys', () => {
    expect(validateApiKey('sk-abc123456789012345678')).toBe(true);
  });

  it('rejects keys not starting with sk-', () => {
    expect(validateApiKey('pk-abc123456789012345678')).toBe(false);
  });

  it('rejects short keys', () => {
    expect(validateApiKey('sk-short')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(validateApiKey('')).toBe(false);
  });

  it('handles whitespace', () => {
    expect(validateApiKey('  sk-abc123456789012345678  ')).toBe(true);
  });

  it('skips validation for local endpoints', () => {
    expect(validateApiKey('', true)).toBe(true);
    expect(validateApiKey('any-key', true)).toBe(true);
  });

  it('still validates for non-local endpoints', () => {
    expect(validateApiKey('bad-key', false)).toBe(false);
  });
});

describe('buildSummaryPrompt', () => {
  it('uses default prompt when none provided', () => {
    const result = buildSummaryPrompt('Hello world');
    expect(result).toContain('Summarize the following text');
    expect(result).toContain('Hello world');
  });

  it('uses custom prompt when provided', () => {
    const result = buildSummaryPrompt('Hello world', 'Give me 3 bullet points');
    expect(result).toContain('3 bullet points');
    expect(result).toContain('Hello world');
    expect(result).not.toContain('Summarize the following text');
  });

  it('falls back to default for empty custom prompt', () => {
    const result = buildSummaryPrompt('Hello world', '  ');
    expect(result).toContain('Summarize the following text');
  });
});

describe('blobPath', () => {
  it('creates bronze paths', () => {
    expect(blobPath('bronze', 'test.pdf')).toBe('bronze/test.pdf');
  });

  it('creates silver paths', () => {
    expect(blobPath('silver', 'test.txt')).toBe('silver/test.txt');
  });

  it('creates gold paths', () => {
    expect(blobPath('gold', 'test.txt')).toBe('gold/test.txt');
  });
});
