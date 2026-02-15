'use client';

import { useState } from 'react';
import { ALL_EXPORT_COLUMNS, DEFAULT_EXPORT_COLUMNS } from '@/lib/types';

interface ExportDialogProps {
  scanId: string;
  onClose: () => void;
}

export default function ExportDialog({ scanId, onClose }: ExportDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([...DEFAULT_EXPORT_COLUMNS]);
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const toggleColumn = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_id: scanId,
          columns: selectedColumns,
          matched_only: matchedOnly,
        }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Export CSV</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={matchedOnly}
              onChange={(e) => setMatchedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm font-medium">Matched leads only</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide">
                Columns ({selectedColumns.length})
              </h3>
              <button
                onClick={() =>
                  setSelectedColumns(
                    selectedColumns.length === ALL_EXPORT_COLUMNS.length
                      ? [...DEFAULT_EXPORT_COLUMNS]
                      : [...ALL_EXPORT_COLUMNS]
                  )
                }
                className="text-xs text-primary hover:text-primary-dark"
              >
                {selectedColumns.length === ALL_EXPORT_COLUMNS.length ? 'Select default' : 'Select all'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
              {ALL_EXPORT_COLUMNS.map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-secondary"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-xs">{col}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
