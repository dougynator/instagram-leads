'use client';

import { useState, useRef } from 'react';
import { parseCSVContent, ParsedCSV, extractUsernames } from '@/lib/csv';

interface CsvUploadProps {
  onUsernamesReady: (usernames: string[], totalInFile: number) => void;
}

export default function CsvUpload({ onUsernamesReady }: CsvUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<number>(0);
  const [batchSize, setBatchSize] = useState<number>(10);
  const [fileName, setFileName] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const data = parseCSVContent(content);
      setParsed(data);
      // Auto-detect username column
      const usernameIdx = data.headers.findIndex(
        (h) =>
          h.toLowerCase().includes('username') ||
          h.toLowerCase().includes('handle') ||
          h.toLowerCase().includes('instagram') ||
          h.toLowerCase().includes('ig') ||
          h.toLowerCase().includes('user')
      );
      setSelectedColumn(usernameIdx >= 0 ? usernameIdx : 0);
      setBatchSize(Math.min(data.rowCount, 25));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (!parsed) return;
    const usernames = extractUsernames(parsed.rows, selectedColumn);
    const batch = usernames.slice(0, batchSize);
    onUsernamesReady(batch, usernames.length);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-primary bg-primary/5'
            : fileName
            ? 'border-success bg-success/5'
            : 'border-border hover:border-primary/50 hover:bg-secondary'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName ? (
          <div>
            <svg className="w-8 h-8 mx-auto text-success mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-success">{fileName}</p>
            <p className="text-xs text-muted mt-1">
              {parsed?.rowCount} rows found &middot; Click to change file
            </p>
          </div>
        ) : (
          <div>
            <svg className="w-8 h-8 mx-auto text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium">Drop your CSV file here</p>
            <p className="text-xs text-muted mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {/* Column mapping + batch size */}
      {parsed && parsed.headers.length > 0 && (
        <div className="space-y-4 p-4 bg-secondary rounded-lg">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Username Column
            </label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {parsed.headers.map((h, i) => (
                <option key={i} value={i}>
                  {h || `Column ${i + 1}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">
              Preview: {parsed.rows.slice(0, 3).map((r) => r[selectedColumn]).join(', ')}
              {parsed.rowCount > 3 && '...'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Batch Size (how many to scan now)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={Math.min(parsed.rowCount, 200)}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="flex-1 h-1.5 accent-primary"
              />
              <input
                type="number"
                min={1}
                max={parsed.rowCount}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.min(Number(e.target.value) || 1, parsed.rowCount))}
                className="w-20 px-2 py-1.5 bg-white border border-border rounded-lg text-sm text-center"
              />
              <span className="text-xs text-muted">/ {parsed.rowCount}</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
          >
            Confirm Selection ({batchSize} usernames)
          </button>
        </div>
      )}
    </div>
  );
}
