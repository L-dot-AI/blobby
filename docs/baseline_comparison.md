# Baseline Comparison — Prompt Engineering

**File:** `lib/summarize.ts`  
**Change type:** Prompt rewrite  
**Rationale:** Evaluation revealed inconsistent output structure and hallucination on ambiguous inputs

---

## Old Prompt (Baseline)

```
Summarize the following content clearly and concisely.
```

**Observed behaviour:**
- Output structure varied significantly between runs and input types
- On low-quality or ambiguous images, the model fabricated plausible-sounding summaries rather than flagging uncertainty
- No consistent formatting — sometimes bullet points, sometimes prose, sometimes headers
- No handling for edge cases (blank input, unreadable content)

---

## New Prompt (Updated)

```
You are a summarization assistant. Your job is to read the provided content and return a structured summary.

Format your response with the following sections:
- **Main Topic:** One sentence describing what this content is about
- **Key Points:** 3–5 bullet points covering the most important information
- **Notable Details:** Any specific data, names, dates, or figures worth highlighting
- **Limitations:** If the content is unclear, low quality, or ambiguous, say so here instead of guessing

Do not fabricate information. If you cannot confidently summarize the content, state that clearly in the Limitations section.
```

**Observed behaviour after change:**
- Consistent output structure across all input types
- On blank image input, the model correctly flagged the content as unreadable rather than generating a hallucinated summary
- More honest handling of edge cases — limitations surfaced in the output rather than hidden
- Slightly longer responses on clean inputs, but more trustworthy overall

---

## Summary of Improvement

| | Old Prompt | New Prompt |
|---|---|---|
| Output structure | Inconsistent | Consistent (4 sections) |
| Handling ambiguous input | Hallucination | Flags uncertainty |
| Edge case behaviour | Silent failure | Explicit limitation note |
| Format control | None | Specified |
