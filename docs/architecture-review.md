# Architecture Review — Blobby

## Before (Initial Version)

### Issues Identified

1. **Monolithic API route** — All logic (validation, extraction, storage, summarization) lived in a single `route.ts` file. Hard to test, hard to maintain.

2. **No separation of concerns** — File type detection, validation, prompt building, and blob path generation were inline in the route handler.

3. **No error granularity** — All errors returned generic 500s with raw error messages. No distinction between user errors (bad key, wrong file type) and server errors.

4. **Extraction tightly coupled** — The extraction logic had direct OpenAI fetch calls mixed with PDF parsing, making it impossible to unit test without mocking everything.

5. **No re-summarization** — Once a summary was generated, the user had no way to try again with different instructions.

### Initial Structure

```
src/
  app/
    page.tsx          (UI + all logic)
    api/
      process/
        route.ts      (everything in one file)
```

## After (Refactored Version)

### Changes Made

1. **Extracted utility modules** — `utils.ts` handles file detection, validation, prompt building, and path generation. Each function is pure and independently testable.

2. **Separated extraction layer** — `extract.ts` routes to the correct extractor by file type. Each extractor is its own function. Easy to add new file types later.

3. **Separated summarization** — `summarize.ts` is a standalone module. Can be called from the API route or from the GitHub Actions ETL script.

4. **Added re-summarize endpoint** — `/api/resummarize` allows users to retry with different prompts without re-uploading.

5. **Proper error handling** — API routes return specific HTTP status codes (400 for validation, 500 for server errors) with clear messages.

6. **Tests match module boundaries** — Unit tests cover `utils.ts` functions directly. E2E tests cover the full user flow.

### Refactored Structure

```
src/
  lib/
    utils.ts          (file detection, validation, prompt building, paths)
    extract.ts        (text extraction routing and per-type extractors)
    summarize.ts      (OpenAI summarization, isolated and reusable)
  app/
    layout.tsx
    globals.css
    page.tsx          (UI only — state management and display)
    api/
      process/
        route.ts      (orchestration — calls lib modules)
      resummarize/
        route.ts      (re-summarization endpoint)
scripts/
  etl-reprocess.mjs   (GitHub Actions ETL — reuses same logic)
__tests__/
  utils.test.ts       (unit tests for core logic)
e2e/
  blobby.spec.ts      (Playwright E2E tests)
docs/
  grill-me-notes.md
  prd-issue.md
  github-issues.md
  architecture-review.md
```

### Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Testability | Untestable monolith | Pure functions with unit tests |
| Separation | All in one file | Lib modules + thin route handlers |
| Error handling | Generic 500s | Specific status codes + messages |
| Reusability | None | ETL script reuses same modules |
| Extensibility | Hard to add file types | Add a function to `extract.ts` |
