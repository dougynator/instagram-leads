-- IG Lead Scanner - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  default_filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Scan',
  filters JSONB DEFAULT '{}',
  total_input INT DEFAULT 0,
  total_scanned INT DEFAULT 0,
  total_matched INT DEFAULT 0,
  total_errors INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'cancelled', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scan items table
CREATE TABLE IF NOT EXISTS scan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  profile_url TEXT,
  scraped_data JSONB DEFAULT '{}',
  score INT DEFAULT 0,
  matched BOOLEAN DEFAULT false,
  match_reasons JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- App settings (key/value for future use)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scans_client_id ON scans(client_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scan_items_scan_id ON scan_items(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_items_status ON scan_items(status);
CREATE INDEX IF NOT EXISTS idx_scan_items_matched ON scan_items(matched);
CREATE INDEX IF NOT EXISTS idx_scan_items_score ON scan_items(score DESC);

-- Enable RLS (but allow all for MVP since no auth)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for MVP (single user, no auth)
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scans" ON scans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scan_items" ON scan_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
