'use client';

import { Scan, ScanItem, FilterCriteria } from '@/lib/types';

interface ReportSummaryProps {
  scan: Scan;
  items: ScanItem[];
  onClose: () => void;
}

export default function ReportSummary({ scan, items, onClose }: ReportSummaryProps) {
  const completedItems = items.filter((i) => i.status === 'completed');
  const matchedItems = completedItems.filter((i) => i.matched);
  const topLeads = [...completedItems].sort((a, b) => b.score - a.score).slice(0, 10);

  const filters = scan.filters as FilterCriteria;

  const filterSummary: string[] = [];
  if (filters.min_followers) filterSummary.push(`Min followers: ${filters.min_followers.toLocaleString()}`);
  if (filters.max_followers) filterSummary.push(`Max followers: ${filters.max_followers.toLocaleString()}`);
  if (filters.min_engagement_rate) filterSummary.push(`Min engagement: ${filters.min_engagement_rate}%`);
  if (filters.max_engagement_rate) filterSummary.push(`Max engagement: ${filters.max_engagement_rate}%`);
  if (filters.contact_info_required) filterSummary.push('Contact info required');
  if (filters.bio_keywords_include?.length) filterSummary.push(`Include keywords: ${filters.bio_keywords_include.join(', ')}`);
  if (filters.bio_keywords_exclude?.length) filterSummary.push(`Exclude keywords: ${filters.bio_keywords_exclude.join(', ')}`);
  if (filters.last_post_within_days) filterSummary.push(`Last post within ${filters.last_post_within_days} days`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">Scan Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted">Scan Name</p>
                <p className="font-medium">{scan.name}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted">Date</p>
                <p className="font-medium">
                  {scan.started_at
                    ? new Date(scan.started_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted">Client</p>
                <p className="font-medium">{scan.client?.name || 'No client'}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted">Status</p>
                <p className="font-medium capitalize">{scan.status}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Results</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{scan.total_input}</p>
                <p className="text-xs text-muted">Input</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{scan.total_scanned}</p>
                <p className="text-xs text-muted">Scanned</p>
              </div>
              <div className="bg-success/10 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-success">{scan.total_matched}</p>
                <p className="text-xs text-muted">Matched</p>
              </div>
              <div className="bg-danger/10 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-danger">{scan.total_errors}</p>
                <p className="text-xs text-muted">Errors</p>
              </div>
            </div>
            {scan.total_scanned > 0 && (
              <p className="text-xs text-muted mt-2">
                Match rate: {Math.round((matchedItems.length / completedItems.length) * 100)}%
              </p>
            )}
          </div>

          {/* Filters used */}
          {filterSummary.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Filters Used</h3>
              <ul className="space-y-1">
                {filterSummary.map((f, i) => (
                  <li key={i} className="text-sm text-muted flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top 10 Leads */}
          {topLeads.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Top {Math.min(10, topLeads.length)} Leads by Score
              </h3>
              <div className="space-y-2">
                {topLeads.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">@{item.username}</p>
                      <p className="text-xs text-muted">
                        {(item.scraped_data?.follower_count || 0).toLocaleString()} followers
                        &middot; {item.scraped_data?.engagement_rate || 0}% engagement
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        item.score >= 70
                          ? 'bg-success/10 text-success'
                          : item.score >= 40
                          ? 'bg-warning/10 text-warning'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
