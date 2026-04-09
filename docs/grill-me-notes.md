# Grill-Me Session Notes — Blobby

## What is Blobby?

Blobby is a media-to-summary pipeline. Users upload PDFs, images, audio files, or paste raw text. Blobby extracts the text content, stores it in staged layers (raw → cleaned → summarized), and returns an AI-generated summary. It uses a BYOK (Bring Your Own Key) architecture so users provide their own OpenAI API key.

---

## Grill-Me Questions & Responses

### Q: Why BYOK instead of embedding your own API key?

**A:** BYOK keeps the app free to host and avoids rate-limit or billing issues on my end. It also means the app works without me managing secrets for every user. The user controls their own usage and costs.

### Q: How do you handle multiple file types without overcomplicating the ETL?

**A:** Each file type gets a single extraction function:
- **PDF** → `pdf-parse` (text extraction)
- **Image** → OpenAI Vision API (OCR via the user's own key)
- **Audio** → OpenAI Whisper API (transcription via the user's own key)
- **Pasted text** → passthrough, no transformation needed

All four paths output plain text. After extraction, the pipeline is identical regardless of source type.

### Q: What happens if the user uploads something huge?

**A:** This is a POC. I set reasonable file size limits (e.g., 10MB) and handle one file at a time. Batch processing is out of scope.

### Q: Why Vercel Blob instead of GCP or S3?

**A:** Simplicity. Vercel Blob integrates natively with Vercel deployments — no extra credentials, no cross-platform auth. For a POC, it's the right level of infrastructure.

### Q: What's your storage strategy?

**A:** Three-tier (bronze/silver/gold):
- **Bronze:** raw uploaded file stored as-is
- **Silver:** extracted plain text from the file
- **Gold:** AI-generated summary

Each tier is a prefix in Vercel Blob storage.

### Q: What if the LLM produces a bad summary?

**A:** The user can re-summarize with a different prompt or adjust the summary length. The extracted text (silver layer) is always preserved, so the LLM step is repeatable without re-uploading.

### Q: Is GitHub Actions necessary here?

**A:** Yes — the assignment requires a repeatable ETL step. I use a GitHub Actions workflow that can be triggered manually to reprocess files in blob storage. The app also supports on-demand processing through the UI for immediate feedback.

### Q: What's out of scope?

**A:**
- Video files
- Batch/bulk uploads
- User accounts or authentication
- Multi-language support
- Real-time collaboration
- Production-scale storage optimization

---

## What Changed After the Grilling

1. **Narrowed file support** — originally considered video, dropped it to keep extraction simple
2. **Added re-summarize capability** — grilling revealed that a one-shot summary with no recourse is a bad UX
3. **Clarified BYOK rationale** — made the architecture decision intentional rather than just convenient
4. **Defined explicit out-of-scope list** — prevents scope creep during build
5. **Confirmed GitHub Actions role** — ETL runs both on-demand (UI) and as a repeatable workflow (Actions)
