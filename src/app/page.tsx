'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardStats, Scan } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, scansRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/scans'),
        ]);
        const statsData = await statsRes.json();
        const scansData = await scansRes.json();
        setStats(statsData);
        setRecentScans(Array.isArray(scansData) ? scansData.slice(0, 5) : []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Overview of your lead scanning activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Clients"
          value={stats?.total_clients ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          label="Total Scans"
          value={stats?.total_scans ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          color="text-accent"
          bgColor="bg-accent/10"
        />
        <StatCard
          label="Last Scan"
          value={
            stats?.last_scan_date
              ? new Date(stats.last_scan_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Never'
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <StatCard
          label="Leads Matched"
          value={stats?.total_leads_matched ?? 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="text-success"
          bgColor="bg-success/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/scan"
          className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Start New Scan</h3>
            <p className="text-sm text-muted">Upload CSV and scan Instagram leads</p>
          </div>
        </Link>
        <Link
          href="/clients"
          className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Manage Clients</h3>
            <p className="text-sm text-muted">Add clients with default filter presets</p>
          </div>
        </Link>
      </div>

      {/* Recent Scans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Scans</h2>
          <Link href="/results" className="text-sm text-primary hover:text-primary-dark transition">
            View all →
          </Link>
        </div>
        {recentScans.length > 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Client</th>
                  <th className="text-center px-4 py-3 font-medium text-muted">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Scanned</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Matched</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/results?scan=${scan.id}`} className="hover:text-primary">
                        {scan.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {scan.client?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={scan.status} />
                    </td>
                    <td className="px-4 py-3 text-right">{scan.total_scanned}/{scan.total_input}</td>
                    <td className="px-4 py-3 text-right font-medium text-success">{scan.total_matched}</td>
                    <td className="px-4 py-3 text-right text-muted">
                      {new Date(scan.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-muted/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-muted mb-2">No scans yet</p>
            <Link href="/scan" className="text-sm text-primary hover:text-primary-dark">
              Start your first scan →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${bgColor} ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    running: 'bg-primary/10 text-primary',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-warning/10 text-warning',
    failed: 'bg-danger/10 text-danger',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
