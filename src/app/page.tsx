'use client';

import { useState, useRef, DragEvent } from 'react';

interface ProcessResult {
  id: string;
  fileName: string;
  fileType: string;
  bronze: string;
  silver: string;
  gold: string;
  extractedText: string;
  summary: string;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState('');
  const [dragover, setDragover] = useState(false);
  const [resummarizing, setResummarizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragover(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async () => {
    setError('');
    setResult(null);

    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key.');
      return;
    }

    if (!file && !pastedText.trim()) {
      setError('Please upload a file or paste some text.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', pastedText);
      }
      if (customPrompt.trim()) {
        formData.append('prompt', customPrompt);
      }

      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Processing failed.');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResummarize = async () => {
    if (!result?.extractedText) return;
    setResummarizing(true);
    setError('');

    try {
      const response = await fetch('/api/resummarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          extractedText: result.extractedText,
          prompt: customPrompt || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Re-summarization failed.');
      } else {
        setResult({ ...result, summary: data.summary, gold: data.gold });
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setResummarizing(false);
    }
  };

  return (
    <main className="container">
      <h1>🫧 Blobby</h1>
      <p className="subtitle">Media → Text → Summary. Bring your own key.</p>

      {/* API Key */}
      <div className="card">
        <h2>1. Enter your OpenAI API key</h2>
        <label htmlFor="apiKey">API Key (stored in browser only)</label>
        <input
          id="apiKey"
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      {/* Upload */}
      <div className="card">
        <h2>2. Upload a file or paste text</h2>

        <div
          className={`drop-zone ${dragover ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <p>Drop a file here or click to browse</p>
          <small>PDF, Image (PNG/JPG), Audio (MP3/WAV/M4A) — max 10MB</small>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        {file && <p className="file-selected">Selected: {file.name}</p>}

        <div className="or-divider">— or —</div>

        <label htmlFor="pasteText">Paste text</label>
        <textarea
          id="pasteText"
          placeholder="Paste your text here..."
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />
      </div>

      {/* Custom prompt */}
      <div className="card">
        <h2>3. Custom summary prompt (optional)</h2>
        <label htmlFor="prompt">Summarization instruction</label>
        <input
          id="prompt"
          type="text"
          placeholder="e.g. Summarize in 3 bullet points"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button className="btn" onClick={handleSubmit} disabled={loading}>
        {loading && <span className="spinner" />}
        {loading ? 'Processing...' : 'Process & Summarize'}
      </button>

      {error && <p className="error">{error}</p>}

      {/* Result */}
      {result && (
        <div className="result">
          <h2>✅ Done!</h2>

          <div className="result-section">
            <h3>Summary</h3>
            <pre>{result.summary}</pre>
          </div>

          <div className="result-section">
            <h3>Extracted Text</h3>
            <pre>{result.extractedText}</pre>
          </div>

          <div className="blob-links">
            <a href={result.bronze} target="_blank" rel="noopener noreferrer">📦 Bronze (raw)</a>
            <a href={result.silver} target="_blank" rel="noopener noreferrer">🪙 Silver (text)</a>
            <a href={result.gold} target="_blank" rel="noopener noreferrer">🏆 Gold (summary)</a>
          </div>

          {/* Re-summarize */}
          <button
            className="btn"
            onClick={handleResummarize}
            disabled={resummarizing}
            style={{ marginTop: '1rem' }}
          >
            {resummarizing && <span className="spinner" />}
            {resummarizing ? 'Re-summarizing...' : '🔄 Re-summarize with new prompt'}
          </button>
        </div>
      )}
    </main>
  );
}
