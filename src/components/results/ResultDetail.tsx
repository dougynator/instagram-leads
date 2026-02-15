'use client';

import { useState } from 'react';
import { ScanItem } from '@/lib/types';

interface ResultDetailProps {
  item: ScanItem;
  onClose: () => void;
  onUpdate: (data: Partial<ScanItem>) => void;
}

export default function ResultDetail({ item, onClose, onUpdate }: ResultDetailProps) {
  const [notes, setNotes] = useState(item.notes || '');
  const [customTag, setCustomTag] = useState('');
  const data = item.scraped_data || {};

  const handleSaveNotes = () => {
    onUpdate({ notes });
  };

  const handleAddTag = () => {
    if (customTag.trim()) {
      const newTags = [...(item.tags || []), customTag.trim()];
      onUpdate({ tags: newTags });
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = (item.tags || []).filter((t) => t !== tag);
    onUpdate({ tags: newTags });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-card shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold">@{item.username}</h2>
            {data.display_name && (
              <p className="text-sm text-muted">{data.display_name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score + Match */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                item.score >= 70
                  ? 'bg-success/10 text-success'
                  : item.score >= 40
                  ? 'bg-warning/10 text-warning'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {item.score}
            </div>
            <div>
              <p className="font-medium">
                {item.matched ? (
                  <span className="text-success">Matched</span>
                ) : (
                  <span className="text-muted">Not Matched</span>
                )}
              </p>
              <a
                href={`https://instagram.com/${item.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View on Instagram →
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{(data.follower_count || 0).toLocaleString()}</p>
              <p className="text-xs text-muted">Followers</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{data.engagement_rate || 0}%</p>
              <p className="text-xs text-muted">Engagement</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{(data.post_count || 0).toLocaleString()}</p>
              <p className="text-xs text-muted">Posts</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{(data.avg_likes || 0).toLocaleString()}</p>
              <p className="text-xs text-muted">Avg Likes</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{(data.avg_comments || 0).toLocaleString()}</p>
              <p className="text-xs text-muted">Avg Comments</p>
            </div>
          </div>

          {/* Bio */}
          {data.bio && (
            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Bio</h3>
              <p className="text-sm bg-secondary rounded-lg p-3 whitespace-pre-line">{data.bio}</p>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Contact Info</h3>
            <div className="space-y-2">
              {data.detected_email && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Email</span>
                  <span>{data.detected_email}</span>
                </div>
              )}
              {data.detected_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Phone</span>
                  <span>{data.detected_phone}</span>
                </div>
              )}
              {data.detected_website && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">Website</span>
                  <a
                    href={data.detected_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {data.detected_website}
                  </a>
                </div>
              )}
              {data.detected_whatsapp && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">WhatsApp</span>
                  <span>Detected in bio</span>
                </div>
              )}
              {!data.detected_email && !data.detected_phone && !data.detected_website && !data.detected_whatsapp && (
                <p className="text-sm text-muted">No contact info detected</p>
              )}
            </div>
          </div>

          {data.external_link && (
            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">External Link</h3>
              <a
                href={data.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {data.external_link}
              </a>
            </div>
          )}

          {/* Match Reasons */}
          {item.match_reasons && item.match_reasons.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Match Reasons</h3>
              <div className="space-y-1.5">
                {item.match_reasons.map((reason, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-sm p-2 rounded-lg ${
                      reason.passed ? 'bg-success/5' : 'bg-danger/5'
                    }`}
                  >
                    <span className={reason.passed ? 'text-success' : 'text-danger'}>
                      {reason.passed ? '✓' : '✗'}
                    </span>
                    <span>{reason.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {(item.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-danger"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-1.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={3}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <button
              onClick={handleSaveNotes}
              className="mt-2 px-4 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
