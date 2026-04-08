# 🫧 Blobby

**Media → Text → Summary.** Upload PDFs, images, audio files, or paste text — Blobby extracts the content and generates AI-powered summaries using your own OpenAI API key.

## Live Demo

🔗 [Deployed on Vercel](https://blobby.vercel.app) *(update this URL after deployment)*

## What It Does

Blobby is a proof-of-concept end-to-end AI pipeline that:

1. **Ingests** media files (PDF, PNG/JPG, MP3/WAV/M4A) or pasted text
2. **Extracts** text using pdf-parse, OpenAI Vision (OCR), or OpenAI Whisper (transcription)
3. **Stores** data in three tiers (Bronze → Silver → Gold) in Vercel Blob
4. **Summarizes** extracted text using OpenAI Chat Completions
5. **Displays** results in a clean web UI with re-summarization support

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Input  │────▶│   Bronze     │────▶│   Silver     │────▶│    Gold      │
│  (Upload/    │     │  (Raw file   │     │ (Extracted   │     │  (Summary    │
│   Paste)     │     │   in Blob)   │     │  text in     │     │   in Blob)   │
└─────────────┘     └──────────────┘     │  Blob)       │     └──────┬───────┘
                                          └──────────────┘            │
                                                                      ▼
                                                              ┌──────────────┐
                                                              │   UI Result  │
                                                              │   Display    │
                                                              └──────────────┘
```

### Storage Tiers

| Tier | Prefix | Contents |
|------|--------|----------|
| Bronze | `bronze/` | Raw uploaded files as-is |
| Silver | `silver/` | Extracted plain text |
| Gold | `gold/` | AI-generated summaries |

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Deployment:** Vercel
- **Storage:** Vercel Blob
- **AI:** OpenAI API (GPT-4o-mini, Vision, Whisper) — BYOK
- **Testing:** Vitest (unit) + Playwright (E2E)
- **ETL:** API routes (on-demand) + GitHub Actions (batch reprocessing)

## Getting Started

### Prerequisites

- Node.js 20+
- A Vercel account with Blob storage enabled
- An OpenAI API key (users provide their own in the UI)

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/blobby.git
cd blobby
npm install
cp .env.example .env.local
```

Add your Vercel Blob token to `.env.local`:

```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests (requires dev server running)
npx playwright test
```

### Deploy

```bash
vercel
```

Or connect the GitHub repo to Vercel for auto-deploys.

## Supported File Types

| Type | Formats | Extraction Method |
|------|---------|-------------------|
| PDF | .pdf | pdf-parse |
| Image | .png, .jpg, .jpeg, .webp | OpenAI Vision API (OCR) |
| Audio | .mp3, .wav, .m4a | OpenAI Whisper API |
| Text | Pasted text | Passthrough |

## Out of Scope

- Video files
- Batch/bulk uploads
- User accounts or authentication
- Multi-language support
- Production-scale optimization

## Workflow Skills Used

This project was built using [Matt Pocock's workflow skills](https://github.com/mattpocock/skills):

1. **grill-me** — Pressure-tested the project idea (see `docs/grill-me-notes.md`)
2. **write-a-prd** — Created the PRD as a GitHub Issue
3. **prd-to-issues** — Broke the PRD into actionable GitHub Issues
4. **tdd** — Wrote unit tests for core logic before/during implementation
5. **improve-codebase-architecture** — Reviewed and improved code structure (see `docs/architecture-review.md`)

## GitHub Actions ETL

A manually-triggered workflow reprocesses files in Vercel Blob:

1. Lists all bronze files
2. Identifies files missing silver or gold entries
3. Runs extraction and summarization
4. Logs results

Trigger via GitHub → Actions → ETL Reprocess → Run workflow.

## License

MIT
