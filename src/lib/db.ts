// ==================== Data Access Layer ====================
// Switches between Supabase and in-memory store based on config

import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import store from './store';
import { Client, Scan, ScanItem, DashboardStats } from './types';

const useSupabase = () => isSupabaseConfigured();
const db = () => getSupabaseAdmin();

// ==================== Clients ====================

export async function getClients(): Promise<Client[]> {
  if (!useSupabase()) return store.getClients();
  const { data, error } = await db()
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getClient(id: string): Promise<Client | null> {
  if (!useSupabase()) return store.getClient(id);
  const { data, error } = await db()
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createClient(input: Partial<Client>): Promise<Client> {
  if (!useSupabase()) return store.createClient(input);
  const { data, error } = await db()
    .from('clients')
    .insert({
      name: input.name,
      notes: input.notes || '',
      default_filters: input.default_filters || {},
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(id: string, input: Partial<Client>): Promise<Client | null> {
  if (!useSupabase()) return store.updateClient(id, input);
  const { data, error } = await db()
    .from('clients')
    .update({
      name: input.name,
      notes: input.notes,
      default_filters: input.default_filters,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClient(id: string): Promise<boolean> {
  if (!useSupabase()) return store.deleteClient(id);
  const { error } = await db().from('clients').delete().eq('id', id);
  return !error;
}

// ==================== Scans ====================

export async function getScans(): Promise<Scan[]> {
  if (!useSupabase()) return store.getScans();
  const { data, error } = await db()
    .from('scans')
    .select('*, client:clients(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getScan(id: string): Promise<Scan | null> {
  if (!useSupabase()) return store.getScan(id);
  const { data, error } = await db()
    .from('scans')
    .select('*, client:clients(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createScan(input: Partial<Scan>): Promise<Scan> {
  if (!useSupabase()) return store.createScan(input);
  const { data, error } = await db()
    .from('scans')
    .insert({
      client_id: input.client_id || null,
      name: input.name || 'Untitled Scan',
      filters: input.filters || {},
      total_input: input.total_input || 0,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateScan(id: string, input: Partial<Scan>): Promise<Scan | null> {
  if (!useSupabase()) return store.updateScan(id, input);
  const updateData: Record<string, unknown> = {};
  if (input.total_scanned !== undefined) updateData.total_scanned = input.total_scanned;
  if (input.total_matched !== undefined) updateData.total_matched = input.total_matched;
  if (input.total_errors !== undefined) updateData.total_errors = input.total_errors;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.finished_at !== undefined) updateData.finished_at = input.finished_at;
  if (input.name !== undefined) updateData.name = input.name;
  if (input.filters !== undefined) updateData.filters = input.filters;

  const { data, error } = await db()
    .from('scans')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== Scan Items ====================

export async function getScanItems(scanId: string): Promise<ScanItem[]> {
  if (!useSupabase()) return store.getScanItems(scanId);
  const { data, error } = await db()
    .from('scan_items')
    .select('*')
    .eq('scan_id', scanId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createScanItems(items: Partial<ScanItem>[]): Promise<ScanItem[]> {
  if (!useSupabase()) return store.createManyScanItems(items);
  // Batch insert in chunks of 100
  const allItems: ScanItem[] = [];
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100).map((item) => ({
      scan_id: item.scan_id,
      username: item.username,
      profile_url: item.profile_url || `https://instagram.com/${item.username}`,
      status: 'pending' as const,
    }));
    const { data, error } = await db()
      .from('scan_items')
      .insert(chunk)
      .select();
    if (error) throw error;
    allItems.push(...(data || []));
  }
  return allItems;
}

export async function updateScanItem(
  id: string,
  input: Partial<ScanItem>
): Promise<ScanItem | null> {
  if (!useSupabase()) return store.updateScanItem(id, input);
  const updateData: Record<string, unknown> = {};
  if (input.scraped_data !== undefined) updateData.scraped_data = input.scraped_data;
  if (input.score !== undefined) updateData.score = input.score;
  if (input.matched !== undefined) updateData.matched = input.matched;
  if (input.match_reasons !== undefined) updateData.match_reasons = input.match_reasons;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.error_message !== undefined) updateData.error_message = input.error_message;

  const { data, error } = await db()
    .from('scan_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== Dashboard Stats ====================

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!useSupabase()) return store.getDashboardStats();

  const [clientsRes, scansRes, matchedRes, lastScanRes] = await Promise.all([
    db().from('clients').select('id', { count: 'exact', head: true }),
    db().from('scans').select('id', { count: 'exact', head: true }),
    db().from('scan_items').select('id', { count: 'exact', head: true }).eq('matched', true),
    db()
      .from('scans')
      .select('finished_at, started_at')
      .eq('status', 'completed')
      .order('finished_at', { ascending: false })
      .limit(1),
  ]);

  const lastScan = lastScanRes.data?.[0];

  return {
    total_clients: clientsRes.count || 0,
    total_scans: scansRes.count || 0,
    last_scan_date: lastScan?.finished_at || lastScan?.started_at || null,
    total_leads_matched: matchedRes.count || 0,
  };
}
