# Blobby — Evaluation Test Cases

**Date:** April 24, 2026  
**Environment:** blobby-roan.vercel.app  
**Prompt version:** Updated (structured prompt with role, format, and failure handling)

---

## Test Cases

### Test 1 — PDF Input ✅
**Input:** Printed Reddit webpage saved as PDF (text-heavy, casual content)  
**Result:** Blobby successfully processed the file and returned a structured summary of the Reddit page content.  
**Notes:** Clean PDF with readable text performed as expected. Output followed the structured format with clearly defined sections.

---

### Test 2 — JPG Image Input ✅
**Input:** JPG image — a family tree diagram showing the evolution of AI over time  
**Result:** Blobby accepted the file and returned a summary.  
**Notes:** The visual/diagram nature of the content is an interesting edge case; the model attempted to summarize the structure of the image.

---

### Test 3 — JPEG Image Input ❌ (Failure Case 1)
**Input:** Same or similar image content uploaded as a JPEG file  
**Result:** Application rejected the file. Error involved a JSON parsing issue.  
**Notes:** Blobby accepts JPG but not JPEG despite both being the same format. This is a file extension validation bug — the backend likely checks extension strings without normalizing them. This is a known limitation.

---

### Test 4 — M4A Audio Input ❌ (Failure Case 2)
**Input:** M4A audio file containing drum sounds with no speech or words  
**Result:** File did not process successfully.  
**Notes:** Two likely causes: (1) M4A may not be in the accepted file type list, or (2) the audio processing pipeline depends on detecting spoken words — a wordless audio file would return nothing for transcription to summarize. Either way, the app did not handle this gracefully with a clear error message.

---

### Test 5 — Empty / No Content Input ✅ (Expected Failure)
**Input:** Submitted with no file or text  
**Result:** App returned a message prompting the user to upload a file.  
**Notes:** Basic input validation is working. The app correctly blocks empty submissions rather than crashing or returning an empty summary.

---

### Test 6 — Pasted Text Input ✅
**Input:** Pasted email/article about university news (moderate length, formal writing)  
**Result:** Blobby returned a summary of the article content.  
**Notes:** Text input worked cleanly. Pasted content is the most reliable input type — no file parsing required means fewer failure points.

---

## Summary Table

| # | Input Type | Status | Notes |
|---|---|---|---|
| 1 | PDF (Reddit page) | ✅ Pass | Clean structured output |
| 2 | JPG (AI family tree diagram) | ✅ Pass | Diagram content handled |
| 3 | JPEG (same type, different extension) | ❌ Fail | Extension validation bug — JSON error |
| 4 | M4A audio (drum sounds, no words) | ❌ Fail | No speech to transcribe; no graceful error |
| 5 | Empty submission | ✅ Expected fail | Correct validation message shown |
| 6 | Pasted text (university news article) | ✅ Pass | Most reliable input type |

---

## Key Findings

- **JPG vs JPEG bug** is the most actionable finding — a one-line fix in file type validation would resolve it
- **Audio without speech** is an edge case the app doesn't handle gracefully; a future fix would detect silent/wordless audio and return a helpful message
- **Text and PDF inputs** are the most reliable paths through the app
- **Empty input validation** works correctly
