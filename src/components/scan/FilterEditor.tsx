'use client';

import { FilterCriteria, DEFAULT_FILTERS } from '@/lib/types';
import { useState } from 'react';

interface FilterEditorProps {
  filters: FilterCriteria;
  onChange: (filters: FilterCriteria) => void;
  compact?: boolean;
}

export default function FilterEditor({ filters, onChange, compact = false }: FilterEditorProps) {
  const [showScoring, setShowScoring] = useState(!!filters.scoring_enabled);

  const update = (key: string, value: unknown) => {
    onChange({ ...filters, [key]: value });
  };

  const updateWeight = (key: string, value: number) => {
    onChange({
      ...filters,
      scoring_weights: { ...filters.scoring_weights, [key]: value },
    });
  };

  const updateContactType = (key: string, value: boolean) => {
    onChange({
      ...filters,
      contact_info_types: { ...filters.contact_info_types, [key]: value },
    });
  };

  const parseKeywords = (value: string): string[] => {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const resetDefaults = () => {
    onChange({ ...DEFAULT_FILTERS });
    setShowScoring(!!DEFAULT_FILTERS.scoring_enabled);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Filter Criteria
        </h3>
        <button
          onClick={resetDefaults}
          className="text-xs text-primary hover:text-primary-dark transition"
        >
          Reset to defaults
        </button>
      </div>

      {/* Follower Range */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Min Followers</label>
          <input
            type="number"
            placeholder="e.g. 1000"
            value={filters.min_followers ?? ''}
            onChange={(e) => update('min_followers', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Max Followers</label>
          <input
            type="number"
            placeholder="e.g. 100000"
            value={filters.max_followers ?? ''}
            onChange={(e) => update('max_followers', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Engagement Range */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Min Engagement Rate (%)</label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 2.0"
            value={filters.min_engagement_rate ?? ''}
            onChange={(e) => update('min_engagement_rate', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Max Engagement Rate (%)</label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 15.0"
            value={filters.max_engagement_rate ?? ''}
            onChange={(e) => update('max_engagement_rate', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Avg Likes / Comments */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Min Avg Likes (last X posts)</label>
          <input
            type="number"
            placeholder="e.g. 100"
            value={filters.avg_likes_last_x ?? ''}
            onChange={(e) => update('avg_likes_last_x', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Min Avg Comments (last X posts)</label>
          <input
            type="number"
            placeholder="e.g. 10"
            value={filters.avg_comments_last_x ?? ''}
            onChange={(e) => update('avg_comments_last_x', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Posts to analyze + Freshness */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Posts to Analyze (X)
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={filters.last_x_posts_to_analyze ?? 12}
            onChange={(e) => update('last_x_posts_to_analyze', Number(e.target.value) || 12)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Last Post Within (days)
          </label>
          <input
            type="number"
            placeholder="e.g. 30"
            value={filters.last_post_within_days ?? ''}
            onChange={(e) => update('last_post_within_days', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Bio Keywords */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Bio Keywords Include (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. photographer, creator, artist"
            value={(filters.bio_keywords_include || []).join(', ')}
            onChange={(e) => update('bio_keywords_include', parseKeywords(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Bio Keywords Exclude (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. spam, bot, fake"
            value={(filters.bio_keywords_exclude || []).join(', ')}
            onChange={(e) => update('bio_keywords_exclude', parseKeywords(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Location Keywords (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. NYC, New York, LA"
            value={(filters.location_keywords || []).join(', ')}
            onChange={(e) => update('location_keywords', parseKeywords(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.contact_info_required}
            onChange={(e) => update('contact_info_required', e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <span className="text-sm font-medium">Require Contact Info</span>
        </label>

        {filters.contact_info_required && (
          <div className="ml-6 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.contact_info_types?.email !== false}
                onChange={(e) => updateContactType('email', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <span className="text-sm">Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.contact_info_types?.website !== false}
                onChange={(e) => updateContactType('website', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <span className="text-sm">Website</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.contact_info_types?.phone !== false}
                onChange={(e) => updateContactType('phone', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <span className="text-sm">Phone / WhatsApp</span>
            </label>
          </div>
        )}
      </div>

      {/* Scoring */}
      <div className="space-y-3 pt-2 border-t border-border">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.scoring_enabled}
            onChange={(e) => {
              update('scoring_enabled', e.target.checked);
              setShowScoring(e.target.checked);
            }}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <span className="text-sm font-medium">Enable Scoring (0-100)</span>
        </label>

        {showScoring && (
          <div className="ml-2 space-y-3 p-4 bg-secondary rounded-lg">
            <p className="text-xs text-muted mb-2">Score weights (total should sum to 100):</p>
            {[
              { key: 'followers', label: 'Followers' },
              { key: 'engagement', label: 'Engagement' },
              { key: 'contact_info', label: 'Contact Info' },
              { key: 'freshness', label: 'Freshness' },
              { key: 'keyword_match', label: 'Keyword Match' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs w-24 text-muted">{label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={
                    (filters.scoring_weights as Record<string, number>)?.[key] ??
                    (DEFAULT_FILTERS.scoring_weights as Record<string, number>)?.[key] ??
                    20
                  }
                  onChange={(e) => updateWeight(key, Number(e.target.value))}
                  className="flex-1 h-1.5 accent-primary"
                />
                <span className="text-xs w-8 text-right font-mono">
                  {(filters.scoring_weights as Record<string, number>)?.[key] ??
                    (DEFAULT_FILTERS.scoring_weights as Record<string, number>)?.[key] ??
                    20}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
