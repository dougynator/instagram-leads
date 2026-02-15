// ==================== In-Memory Store (Fallback when Supabase not configured) ====================
// This allows the app to work end-to-end without a database connection

import { v4 as uuidv4 } from 'uuid';
import { Client, Scan, ScanItem, DashboardStats } from './types';

class InMemoryStore {
  private clients: Map<string, Client> = new Map();
  private scans: Map<string, Scan> = new Map();
  private scanItems: Map<string, ScanItem> = new Map();

  // ===== Clients =====
  getClients(): Client[] {
    return Array.from(this.clients.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getClient(id: string): Client | null {
    return this.clients.get(id) || null;
  }

  createClient(data: Partial<Client>): Client {
    const client: Client = {
      id: uuidv4(),
      name: data.name || 'Unnamed Client',
      notes: data.notes || '',
      default_filters: data.default_filters || {},
      created_at: new Date().toISOString(),
    };
    this.clients.set(client.id, client);
    return client;
  }

  updateClient(id: string, data: Partial<Client>): Client | null {
    const existing = this.clients.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    this.clients.set(id, updated);
    return updated;
  }

  deleteClient(id: string): boolean {
    return this.clients.delete(id);
  }

  // ===== Scans =====
  getScans(): Scan[] {
    const scans = Array.from(this.scans.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return scans.map((s) => ({
      ...s,
      client: s.client_id ? this.clients.get(s.client_id) : undefined,
    }));
  }

  getScan(id: string): Scan | null {
    const scan = this.scans.get(id);
    if (!scan) return null;
    return {
      ...scan,
      client: scan.client_id ? this.clients.get(scan.client_id) : undefined,
    };
  }

  createScan(data: Partial<Scan>): Scan {
    const scan: Scan = {
      id: uuidv4(),
      client_id: data.client_id || null,
      name: data.name || 'Untitled Scan',
      filters: data.filters || {},
      total_input: data.total_input || 0,
      total_scanned: 0,
      total_matched: 0,
      total_errors: 0,
      started_at: new Date().toISOString(),
      finished_at: null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.scans.set(scan.id, scan);
    return scan;
  }

  updateScan(id: string, data: Partial<Scan>): Scan | null {
    const existing = this.scans.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    this.scans.set(id, updated);
    return updated;
  }

  // ===== Scan Items =====
  getScanItems(scanId: string): ScanItem[] {
    return Array.from(this.scanItems.values())
      .filter((i) => i.scan_id === scanId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  getScanItem(id: string): ScanItem | null {
    return this.scanItems.get(id) || null;
  }

  createScanItem(data: Partial<ScanItem>): ScanItem {
    const item: ScanItem = {
      id: uuidv4(),
      scan_id: data.scan_id || '',
      username: data.username || '',
      profile_url: data.profile_url || '',
      scraped_data: data.scraped_data || {},
      score: data.score || 0,
      matched: data.matched || false,
      match_reasons: data.match_reasons || [],
      tags: data.tags || [],
      notes: data.notes || '',
      status: data.status || 'pending',
      error_message: data.error_message || null,
      created_at: new Date().toISOString(),
    };
    this.scanItems.set(item.id, item);
    return item;
  }

  updateScanItem(id: string, data: Partial<ScanItem>): ScanItem | null {
    const existing = this.scanItems.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    this.scanItems.set(id, updated);
    return updated;
  }

  createManyScanItems(items: Partial<ScanItem>[]): ScanItem[] {
    return items.map((data) => this.createScanItem(data));
  }

  // ===== Stats =====
  getDashboardStats(): DashboardStats {
    const allScans = Array.from(this.scans.values());
    const allItems = Array.from(this.scanItems.values());

    const lastScan = allScans
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(b.finished_at || b.started_at).getTime() - new Date(a.finished_at || a.started_at).getTime())[0];

    return {
      total_clients: this.clients.size,
      total_scans: this.scans.size,
      last_scan_date: lastScan?.finished_at || lastScan?.started_at || null,
      total_leads_matched: allItems.filter((i) => i.matched).length,
    };
  }
}

// Singleton instance
const store = new InMemoryStore();
export default store;
