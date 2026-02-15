'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Scan, ScanItem } from '@/lib/types';
import ResultsTable from '@/components/results/ResultsTable';
import ExportDialog from '@/components/results/ExportDialog';
import ReportSummary from '@/components/results/ReportSummary';
import { useToast } from '@/components/ui/Toast';

function ResultsContent() {
  const searchParams = useSearchParams();
  const initialScanId = searchParams.get('scan') || '';
  const { toast } = useToast();

  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState(initialScanId);
  const [scan, setScan] = useState<Scan | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Fetch scans list
  useEffect(() => {
    fetch('/api/scans')
      .then((r) => r.json())
      .then((data) => {
        const scansList = Array.isArray(data) ? data : [];
        setScans(scansList);
        // Auto-select first completed scan if none selected
        if (!selectedScanId && scansList.length > 0) {
          const firstCompleted = scansList.find((s: Scan) => s.status === 'completed');
          if (firstCompleted) setSelectedScanId(firstCompleted.id);
          else setSelectedScanId(scansList[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch selected scan items
  const fetchScanData = useCallback(async () => {
    if (!selectedScanId) return;
    try {
      const res = await fetch(`/api/scans/${selectedScanId}`);
      const data = await res.json();
      setScan(data.scan);
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch scan data:', err);
    }
  }, [selectedScanId]);

  useEffect(() => {
    fetchScanData();
  }, [fetchScanData]);

  const handleUpdateItem = async (id: string, data: Partial<ScanItem>) => {
    try {
      const res = await fetch(`/api/scan-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...data } : item))
        );
      }
    } catch (err) {
      toast('error', 'Failed to update item');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-sm text-muted mt-1">View and manage scan results</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-muted/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-muted mb-2">No scan results yet</p>
          <Link href="/scan" className="text-sm text-primary hover:text-primary-dark">
            Run your first scan →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-sm text-muted mt-1">View and manage scan results</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Scan selector */}
          <select
            value={selectedScanId}
            onChange={(e) => setSelectedScanId(e.target.value)}
            className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {scans.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>

          {/* Report button */}
          {scan && (
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Report
            </button>
          )}

          {/* Export button */}
          {selectedScanId && (
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Scan summary bar */}
      {scan && (
        <div className="flex flex-wrap gap-4 p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Client:</span>
            <span className="text-sm font-medium">{scan.client?.name || 'None'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Scanned:</span>
            <span className="text-sm font-medium">{scan.total_scanned}/{scan.total_input}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Matched:</span>
            <span className="text-sm font-medium text-success">{scan.total_matched}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Errors:</span>
            <span className="text-sm font-medium text-danger">{scan.total_errors}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              scan.status === 'completed' ? 'bg-success/10 text-success' :
              scan.status === 'running' ? 'bg-primary/10 text-primary' :
              'bg-gray-100 text-gray-600'
            }`}>
              {scan.status}
            </span>
          </div>
        </div>
      )}

      {/* Results table */}
      <ResultsTable items={items} onUpdateItem={handleUpdateItem} />

      {/* Modals */}
      {showExport && (
        <ExportDialog
          scanId={selectedScanId}
          onClose={() => setShowExport(false)}
        />
      )}
      {showReport && scan && (
        <ReportSummary
          scan={scan}
          items={items}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
