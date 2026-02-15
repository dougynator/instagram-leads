'use client';

import { FilterCriteria, DEFAULT_FILTERS } from '@/lib/types';
import { useState, useEffect } from 'react';

interface FilterEditorProps {
  filters: FilterCriteria;
  onChange: (filters: FilterCriteria) => void;
  compact?: boolean;
}

// Keyword input that keeps a local text state and only parses on blur
function KeywordInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (keywords: string[]) => void;
}) {
  const [text, setText] = useState(value.join(', '));

  // Sync from parent only when the array reference changes (e.g. reset)
  useEffect(() => {
    setText(value.join(', '));
  }, [value]);

  const commitKeywords = () => {
    const keywords = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onChange(keywords);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">
        {label} <span className="text-muted/60">(optional)</span>
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitKeywords}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitKeywords();
          }
        }}
        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>
  );
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

  const resetDefaults = () => {
    onChange({ ...DEFAULT_FILTERS });
    setShowScoring(!!DEFAULT_FILTERS.scoring_enabled);
  };

  const opt = <span className="text-muted/60">(optional)</span>;

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

      <p className="text-xs text-muted -mt-3">All filters are optional. Leave empty to skip.</p>

      {/* Follower Range */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Min Followers {opt}</label>
          <input
            type="number"
            placeholder="e.g. 1000"
            value={filters.min_followers ?? ''}
            onChange={(e) => update('min_followers', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Max Followers {opt}</label>
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
          <label className="block text-xs font-medium text-muted mb-1">Min Engagement Rate (%) {opt}</label>
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
          <label className="block text-xs font-medium text-muted mb-1">Max Engagement Rate (%) {opt}</label>
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
          <label className="block text-xs font-medium text-muted mb-1">Min Avg Likes {opt}</label>
          <input
            type="number"
            placeholder="e.g. 100"
            value={filters.avg_likes_last_x ?? ''}
            onChange={(e) => update('avg_likes_last_x', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Min Avg Comments {opt}</label>
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
            Posts to Analyze {opt}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            placeholder="12"
            value={filters.last_x_posts_to_analyze ?? ''}
            onChange={(e) => update('last_x_posts_to_analyze', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            Last Post Within (days) {opt}
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

      {/* Bio Keywords - using local-state inputs that parse on blur */}
      <div className="space-y-3">
        <KeywordInput
          label="Bio Keywords Include"
          placeholder="e.g. photographer, creator, artist"
          value={filters.bio_keywords_include || []}
          onChange={(kw) => update('bio_keywords_include', kw)}
        />
        <KeywordInput
          label="Bio Keywords Exclude"
          placeholder="e.g. spam, bot, fake"
          value={filters.bio_keywords_exclude || []}
          onChange={(kw) => update('bio_keywords_exclude', kw)}
        />
        <KeywordInput
          label="Location Keywords"
          placeholder="e.g. NYC, New York, LA"
          value={filters.location_keywords || []}
          onChange={(kw) => update('location_keywords', kw)}
        />
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
          <span className="text-sm font-medium">Require Contact Info {opt}</span>
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
          <span className="text-sm font-medium">Enable Scoring (0-100) {opt}</span>
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
