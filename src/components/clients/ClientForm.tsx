'use client';

import { useState } from 'react';
import { Client, FilterCriteria, DEFAULT_FILTERS } from '@/lib/types';
import FilterEditor from '@/components/scan/FilterEditor';

interface ClientFormProps {
  client?: Client | null;
  onSave: (data: Partial<Client>) => void;
  onCancel: () => void;
}

export default function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [name, setName] = useState(client?.name || '');
  const [notes, setNotes] = useState(client?.notes || '');
  const [filters, setFilters] = useState<FilterCriteria>(
    client?.default_filters || { ...DEFAULT_FILTERS }
  );
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      notes,
      default_filters: filters,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Client Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Corp"
          required
          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this client..."
          rows={2}
          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-primary hover:text-primary-dark transition flex items-center gap-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showFilters ? 'Hide' : 'Set'} Default Filters
        </button>
        {showFilters && (
          <div className="mt-3 p-4 bg-secondary rounded-lg">
            <FilterEditor filters={filters} onChange={setFilters} compact />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
        >
          {client ? 'Update Client' : 'Create Client'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-border text-muted rounded-lg text-sm font-medium hover:bg-secondary transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
