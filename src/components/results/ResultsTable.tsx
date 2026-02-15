'use client';

import { useState, useMemo } from 'react';
import { ScanItem } from '@/lib/types';
import ResultDetail from './ResultDetail';

interface ResultsTableProps {
  items: ScanItem[];
  onUpdateItem: (id: string, data: Partial<ScanItem>) => void;
}

type SortField = 'username' | 'follower_count' | 'engagement_rate' | 'score' | 'matched';
type SortDir = 'asc' | 'desc';

const TAG_PRESETS = ['hot', 'maybe', 'skip'];
const TAG_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  maybe: 'bg-yellow-100 text-yellow-700',
  skip: 'bg-gray-100 text-gray-600',
};

export default function ResultsTable({ items, onUpdateItem }: ResultsTableProps) {
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedItem, setSelectedItem] = useState<ScanItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    let result = items.filter((i) => i.status === 'completed');

    if (matchedOnly) {
      result = result.filter((i) => i.matched);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.username.toLowerCase().includes(q) ||
          (i.scraped_data?.bio || '').toLowerCase().includes(q) ||
          (i.scraped_data?.display_name || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'username':
          aVal = a.username;
          bVal = b.username;
          break;
        case 'follower_count':
          aVal = a.scraped_data?.follower_count || 0;
          bVal = b.scraped_data?.follower_count || 0;
          break;
        case 'engagement_rate':
          aVal = a.scraped_data?.engagement_rate || 0;
          bVal = b.scraped_data?.engagement_rate || 0;
          break;
        case 'score':
          aVal = a.score;
          bVal = b.score;
          break;
        case 'matched':
          aVal = a.matched ? 1 : 0;
          bVal = b.matched ? 1 : 0;
          break;
      }

      if (typeof aVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [items, matchedOnly, sortField, sortDir, searchQuery]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-xs">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const handleTagToggle = (item: ScanItem, tag: string) => {
    const currentTags = item.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    onUpdateItem(item.id, { tags: newTags });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="Search by username, bio, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer bg-white border border-border rounded-lg px-3 py-2">
          <input
            type="checkbox"
            checked={matchedOnly}
            onChange={(e) => setMatchedOnly(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
          />
          <span className="text-sm">Matched only</span>
        </label>
        <span className="text-sm text-muted">
          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted">
                  <button onClick={() => toggleSort('username')} className="flex items-center hover:text-foreground">
                    Username <SortIcon field="username" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted">
                  <button onClick={() => toggleSort('follower_count')} className="flex items-center justify-end hover:text-foreground">
                    Followers <SortIcon field="follower_count" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted">
                  <button onClick={() => toggleSort('engagement_rate')} className="flex items-center justify-end hover:text-foreground">
                    Engagement <SortIcon field="engagement_rate" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted">
                  <button onClick={() => toggleSort('score')} className="flex items-center justify-end hover:text-foreground">
                    Score <SortIcon field="score" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted">
                  <button onClick={() => toggleSort('matched')} className="flex items-center justify-center hover:text-foreground">
                    Match <SortIcon field="matched" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Tags</th>
                <th className="text-left px-4 py-3 font-medium text-muted w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">@{item.username}</p>
                      <p className="text-xs text-muted truncate max-w-48">
                        {item.scraped_data?.display_name || ''}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {(item.scraped_data?.follower_count || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {item.scraped_data?.engagement_rate || 0}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                        item.score >= 70
                          ? 'bg-success/10 text-success'
                          : item.score >= 40
                          ? 'bg-warning/10 text-warning'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.matched ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-medium">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {item.scraped_data?.detected_email && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">@</span>
                      )}
                      {item.scraped_data?.detected_phone && (
                        <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Ph</span>
                      )}
                      {item.scraped_data?.detected_website && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Web</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {TAG_PRESETS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(item, tag)}
                          className={`text-xs px-2 py-0.5 rounded-full transition ${
                            (item.tags || []).includes(tag)
                              ? TAG_COLORS[tag] || 'bg-primary/10 text-primary'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedItem && (
        <ResultDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={(data) => {
            onUpdateItem(selectedItem.id, data);
            setSelectedItem({ ...selectedItem, ...data });
          }}
        />
      )}
    </div>
  );
}
