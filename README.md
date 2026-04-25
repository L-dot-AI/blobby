# Blobby 🫧

An AI-powered summarization tool that accepts PDFs, images, audio, and pasted text and returns structured summaries via a hosted LLM.

**Live site:** https://blobby-roan.vercel.app  
**Stack:** Next.js, TypeScript, Vercel

---

## What it does

Blobby takes varied content formats and returns a clean, structured summary. Supported inputs:
- PDF files
- Images with text
- Audio recordings
- Pasted text

---

## Architecture

Blobby uses a Bronze/Silver/Gold tiered architecture:
- **Bronze** — input parsing and format detection
- **Silver** — LLM summarization via `lib/summarize.ts`
- **Gold** — output rendering and display

This keeps input handling, processing, and output rendering isolated so each can change independently.

---

## Prompt Engineering (Assignment 6 Update)

The core change in this iteration was rewriting the summarization prompt in `lib/summarize.ts`.

**Before:** A generic single-line instruction with no specified output format or failure handling. The model frequently produced inconsistent structure and would hallucinate content on low-quality inputs.

**After:** A structured prompt that assigns the model a clear role, specifies output format with section headers, and instructs the model to flag low-confidence or ambiguous inputs rather than guessing.

**Result:** More consistent output structure across input types; improved honesty on edge cases where the original prompt would fabricate summaries.

---

## Evaluation

Five test cases were run across all supported input types. Results and failure cases are documented in `/docs/evaluation`.

Key findings:
- Clean PDFs and pasted text: high accuracy, consistent structure
- Low-quality images: prone to hallucination before prompt fix; improved after
- Audio: functional but sensitive to recording quality
- Failure cases: blank image input, invalid API key — neither handled gracefully (known limitation)

---

## What's not implemented

- **Video summarization** — future iteration; transcription pipeline partially supported via audio handling
- **Local LLM support** — rejected due to quality and accessibility tradeoffs
- **Graceful error UI** — edge case failures surface as raw errors rather than user-friendly messages

---

## Deployment

Deployed on Vercel. Push to `main` triggers automatic redeployment.

```bash
npm install
npm run dev
```
