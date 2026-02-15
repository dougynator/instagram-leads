'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client, FilterCriteria, DEFAULT_FILTERS } from '@/lib/types';
import FilterEditor from '@/components/scan/FilterEditor';
import ScanProgress from '@/components/scan/ScanProgress';
import { useToast } from '@/components/ui/Toast';

type Step = 'setup' | 'running';

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('setup');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [scanName, setScanName] = useState('');
  const [filters, setFilters] = useState<FilterCriteria>({ ...DEFAULT_FILTERS });
  const [scanId, setScanId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(() => {});
  }, []);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const client = clients.find((c) => c.id === clientId);
      if (client?.default_filters && Object.keys(client.default_filters).length > 0) {
        setFilters({ ...DEFAULT_FILTERS, ...client.default_filters });
        toast('info', `Loaded ${client.name}'s default filters`);
      }
    } else {
      setFilters({ ...DEFAULT_FILTERS });
    }
  };

  const hasSearchTerms =
    (filters.search_hashtags?.length ?? 0) > 0 ||
    (filters.search_keywords?.length ?? 0) > 0;

  const handleStartScan = async () => {
    if (!hasSearchTerms) {
      toast('error', 'Enter at least one hashtag or keyword to search for leads');
      return;
    }

    setIsCreating(true);
    try {
      const name = scanName.trim() || `Scan ${new Date().toLocaleString()}`;
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId || null,
          name,
          filters,
        }),
      });

      if (!res.ok) throw new Error('Failed to create scan');

      const scan = await res.json();
      setScanId(scan.id);
      setStep('running');
      toast('success', 'Scan started — discovering leads on Instagram...');
    } catch (err) {
      toast('error', 'Failed to start scan');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (step === 'running' && scanId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discovering Leads</h1>
          <p className="text-sm text-muted mt-1">Searching Instagram and analyzing profiles...</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 max-w-lg mx-auto">
          <ScanProgress
            scanId={scanId}
            onComplete={() => router.push(`/results?scan=${scanId}`)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find Leads</h1>
        <p className="text-sm text-muted mt-1">
          Enter hashtags and keywords to discover Instagram accounts, then filter them to find your ideal leads
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Search + Details */}
        <div className="space-y-6">
          {/* Scan Name + Client */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Scan Details</h2>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Scan Name <span className="text-muted/60">(optional)</span>
              </label>
              <input
                type="text"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                placeholder={`Scan ${new Date().toLocaleDateString()}`}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Client <span className="text-muted/60">(optional)</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No client (generic batch)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Criteria */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Search Criteria
            </h2>
            <p className="text-xs text-muted -mt-2">
              Tell us where to look. The tool searches Instagram using these terms to discover accounts.
            </p>

            <SearchInput
              label="Hashtags"
              placeholder="e.g. fitness, photography, foodie"
              helpText="Hashtags to search (without #). We find accounts that post with these tags."
              value={filters.search_hashtags || []}
              onChange={(v) => setFilters({ ...filters, search_hashtags: v })}
            />

            <SearchInput
              label="Keywords"
              placeholder="e.g. personal trainer, photographer Amsterdam"
              helpText="Keywords to search for. We find accounts whose name or bio matches."
              value={filters.search_keywords || []}
              onChange={(v) => setFilters({ ...filters, search_keywords: v })}
            />

            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Max accounts to discover
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={filters.max_accounts || 25}
                  onChange={(e) => setFilters({ ...filters, max_accounts: Number(e.target.value) })}
                  className="flex-1 h-1.5 accent-primary"
                />
                <span className="text-sm font-mono font-medium w-10 text-right">
                  {filters.max_accounts || 25}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                How many accounts to find and analyze. More = longer scan time.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Filters */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <FilterEditor filters={filters} onChange={setFilters} />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartScan}
            disabled={isCreating || !hasSearchTerms}
            className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Leads
                {hasSearchTerms ? ` (up to ${filters.max_accounts || 25} accounts)` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable search input with local state + commit on blur
function SearchInput({
  label,
  placeholder,
  helpText,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  helpText: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState(value.join(', '));

  useEffect(() => {
    setText(value.join(', '));
  }, [value]);

  const commit = () => {
    const parsed = text
      .split(',')
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean);
    onChange(parsed);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
      <p className="text-xs text-muted mt-1">{helpText}</p>
    </div>
  );
}
