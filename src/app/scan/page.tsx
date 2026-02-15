'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client, FilterCriteria, DEFAULT_FILTERS } from '@/lib/types';
import FilterEditor from '@/components/scan/FilterEditor';
import ScanProgress from '@/components/scan/ScanProgress';
import { useToast } from '@/components/ui/Toast';

type Step = 'setup' | 'running';

function parseUsernames(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((u) => u.trim().replace(/^@/, '').toLowerCase())
    .filter((u) => u.length > 0);
}

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('setup');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [scanName, setScanName] = useState('');
  const [usernameText, setUsernameText] = useState('');
  const [filters, setFilters] = useState<FilterCriteria>({ ...DEFAULT_FILTERS });
  const [scanId, setScanId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const usernames = parseUsernames(usernameText);

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

  const handleStartScan = async () => {
    if (usernames.length === 0) {
      toast('error', 'Enter at least one Instagram username');
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
          usernames,
        }),
      });

      if (!res.ok) throw new Error('Failed to create scan');

      const scan = await res.json();
      setScanId(scan.id);
      setStep('running');
      toast('success', `Scan started with ${usernames.length} usernames`);
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
          <h1 className="text-2xl font-bold text-foreground">Scan Running</h1>
          <p className="text-sm text-muted mt-1">Processing Instagram profiles...</p>
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
        <h1 className="text-2xl font-bold text-foreground">New Scan</h1>
        <p className="text-sm text-muted mt-1">Enter Instagram usernames, set optional filters, and run a scan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Setup */}
        <div className="space-y-6">
          {/* Scan Name + Client */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Scan Details</h2>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Scan Name <span className="text-muted/60">(optional)</span></label>
              <input
                type="text"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                placeholder={`Scan ${new Date().toLocaleDateString()}`}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Client <span className="text-muted/60">(optional)</span></label>
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

          {/* Username Input */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Instagram Usernames</h2>
            <textarea
              value={usernameText}
              onChange={(e) => setUsernameText(e.target.value)}
              placeholder={"Enter usernames, one per line or comma-separated:\n\nnike\nadidas\ngymshark\nlululemon"}
              rows={8}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono resize-y"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted">
                One username per line, or comma-separated. The @ is optional.
              </p>
              {usernames.length > 0 && (
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  {usernames.length} username{usernames.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Filters */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <FilterEditor filters={filters} onChange={setFilters} />
          </div>

          {/* Start Scan Button */}
          <button
            onClick={handleStartScan}
            disabled={isCreating || usernames.length === 0}
            className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating scan...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Scan{usernames.length > 0 ? ` (${usernames.length} usernames)` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
