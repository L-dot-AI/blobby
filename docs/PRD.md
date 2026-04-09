# Blobby — PRD (Bronze → Silver → Gold)

## Problem Statement

Students (and anyone doing research or note-taking) often have information in multiple raw formats (PDFs, screenshots/photos, and audio recordings). They want a simple, single-purpose tool that turns those inputs into usable text and then a concise summary, without building accounts, managing databases, or running their own servers.

## Solution

Blobby is a small web app deployed on Vercel that lets a user upload a supported file (PDF, image, or audio) or paste text, provide their own OpenAI-compatible API key (and optional OpenAI-compatible base URL), and run a pipeline:

1) ingest input  
2) extract text (ETL)  
3) store each tier in Vercel Blob (Bronze/Silver/Gold)  
4) summarize extracted text with an LLM  
5) display results and links in the UI

## User Stories

1. As a user, I want to upload a PDF, so that I can extract its text and get a summary.
2. As a user, I want to upload an image (PNG/JPG/JPEG/WebP), so that I can OCR the visible text and get a summary.
3. As a user, I want to upload an audio file (MP3/WAV/M4A), so that I can transcribe it and get a summary.
4. As a user, I want to paste plain text instead of uploading a file, so that I can summarize content quickly.
5. As a user, I want to provide my own API key, so that I can run the pipeline without the app storing a shared key.
6. As a user, I want to optionally set a custom OpenAI-compatible endpoint URL, so that I can use a local or alternative provider that supports the OpenAI API shape.
7. As a user, I want the app to reject unsupported file types, so that I know immediately what inputs are allowed.
8. As a user, I want the app to reject files that are too large, so that I don’t wait for an upload that will fail.
9. As a user, I want Bronze storage to preserve the original input bytes, so that the pipeline is auditable end-to-end.
10. As a user, I want Silver storage to contain the extracted text, so that I can read/copy the “source” used for summarization.
11. As a user, I want Gold storage to contain the summary, so that I can retrieve the final output later.
12. As a user, I want to see a stable identifier for a run, so that I can reference a single processing job.
13. As a user, I want to re-summarize using a different prompt, so that I can adjust the summary style without re-uploading.
14. As a user, I want errors to be shown as clear messages, so that I can fix issues like a missing key or unsupported file type.
15. As a user, I want the app to keep the workflow focused and simple, so that I can understand the pipeline and its tiers.

## Implementation Decisions

- Deployment: Vercel, using Next.js App Router.
- Pipeline shape (on-demand): ingestion → ETL extraction → tiered storage → LLM summarization → storage → UI.
- Pipeline shape (batch): GitHub Actions workflow runs ETL reprocessing over existing Bronze items to backfill missing Silver/Gold outputs.
- Storage: Vercel Blob with three prefixes for tiers:
  - `bronze/` raw input bytes
  - `silver/` extracted text (`.txt`)
  - `gold/` summary text (`.txt`)
- ETL extraction method by file type:
  - PDF: local PDF text extraction library.
  - Image: OCR via OpenAI-compatible vision-capable chat completion.
  - Audio: transcription via Whisper-compatible endpoint.
  - Text: passthrough (no extraction step).
- LLM summarization: OpenAI-compatible chat completions with a default summarization instruction plus optional user custom prompt.
- BYOK: the user provides an API key per session; the server uses it only to fulfill that request.
- Language scope: English-only output expectations for now (no explicit multi-language UX, evaluation, or guarantees).
- Data access: for the assignment’s storage requirement, tier outputs are stored in Vercel Blob and surfaced to the user as links for inspection.

## Testing Decisions

- A good test verifies external behavior (inputs/outputs, validation rules, and contracts) rather than internal implementation details.
- Unit tests (Vitest):
  - file-type detection and validation rules
  - prompt-building behavior (default vs custom prompt)
  - API request/response validation behavior (missing file/text, invalid key)
- E2E tests (Playwright):
  - uploading a supported file and receiving summary + extracted text
  - pasting text and receiving summary + extracted text
  - error states for missing key or unsupported types
- Tests must map directly to supported features and the bronze/silver/gold tier outputs.

## Out of Scope

- User accounts, authentication, and permissions.
- Databases and durable user profiles.
- Vector databases, embeddings, semantic search, RAG.
- Video support.
- Bulk/batch multi-file uploads and queueing.
- Multi-language UX and translation.

## Further Notes

- “ETL” is implemented on-demand per user submission to keep the system simple while still matching the required pipeline stages.
- A GitHub Actions “ETL Reprocess” workflow exists for batch backfills: it scans Bronze, checks for missing Silver/Gold for each item, then generates the missing tiers.
- If strict privacy is required in the future, Blob access and link-sharing behavior should be revisited; the assignment version prioritizes clarity and inspectability of stored tiers.
