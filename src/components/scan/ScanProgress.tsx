'use client';

import { useEffect, useState, useCallback } from 'react';
import { Scan, ScanItem } from '@/lib/types';

interface ScanProgressProps {
  scanId: string;
  onComplete: () => void;
}

export default function ScanProgress({ scanId, onComplete }: ScanProgressProps) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/scans/${scanId}`);
      const data = await res.json();
      setScan(data.scan);
      setItems(data.items || []);

      if (['completed', 'cancelled', 'failed'].includes(data.scan?.status)) {
        setIsRunning(false);
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    }
  }, [scanId]);

  // Start execution
  useEffect(() => {
    const startScan = async () => {
      setIsRunning(true);
      try {
        await fetch(`/api/scans/${scanId}/execute`, { method: 'POST' });
      } catch (err) {
        console.error('Scan execution error:', err);
      }
    };
    startScan();
  }, [scanId]);

  // Poll for updates
  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 2000);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await fetch(`/api/scans/${scanId}/cancel`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  if (!scan) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const total = scan.total_input || 0;
  const scanned = scan.total_scanned || 0;
  const matched = scan.total_matched || 0;
  const errors = scan.total_errors || 0;
  const isDiscovering = scan.status === 'running' && total === 0;
  const progress = total > 0 ? Math.round((scanned / total) * 100) : 0;
  const isComplete = ['completed', 'cancelled', 'failed'].includes(scan.status);

  // Show the most recently processed items
  const processedItems = items
    .filter((i) => i.status !== 'pending')
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="text-center">
        {!isComplete && isDiscovering ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full mb-4">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-sm font-medium">Searching Instagram for leads...</span>
          </div>
        ) : !isComplete ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium">Analyzing {total} discovered accounts...</span>
          </div>
        ) : scan.status === 'completed' ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Scan Complete</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-full mb-4">
            <span className="text-sm font-medium">Scan {scan.status}</span>
          </div>
        )}

        {isDiscovering ? (
          <>
            <div className="w-12 h-12 mx-auto border-3 border-accent/30 border-t-accent rounded-full animate-spin mb-2" />
            <p className="text-sm text-muted">Discovering accounts...</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold">{progress}%</h2>
            <p className="text-sm text-muted mt-1">
              {scanned} of {total} profiles analyzed
            </p>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete
              ? scan.status === 'completed'
                ? 'bg-success'
                : 'bg-warning'
              : 'bg-primary'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-success">{matched}</p>
          <p className="text-xs text-muted">Matched</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{scanned - matched - errors}</p>
          <p className="text-xs text-muted">Not Matched</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-danger">{errors}</p>
          <p className="text-xs text-muted">Errors</p>
        </div>
      </div>

      {/* Recent activity */}
      {processedItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide">Recent Activity</h3>
          {processedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-2 bg-card border border-border rounded-lg text-sm"
            >
              <div className="flex items-center gap-2">
                {item.status === 'completed' ? (
                  item.matched ? (
                    <span className="w-2 h-2 rounded-full bg-success" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-muted" />
                  )
                ) : item.status === 'processing' ? (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-danger" />
                )}
                <span className="font-medium">@{item.username}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                {item.status === 'completed' && (
                  <>
                    <span>{item.scraped_data?.follower_count?.toLocaleString()} followers</span>
                    <span>Score: {item.score}</span>
                  </>
                )}
                {item.status === 'error' && (
                  <span className="text-danger">{item.error_message || 'Error'}</span>
                )}
                {item.status === 'processing' && (
                  <span className="text-primary">Processing...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!isComplete && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1 py-2.5 border border-danger text-danger rounded-lg text-sm font-medium hover:bg-danger/5 transition disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Scan'}
          </button>
        )}
        {isComplete && (
          <button
            onClick={onComplete}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
          >
            View Results
          </button>
        )}
      </div>
    </div>
  );
}
